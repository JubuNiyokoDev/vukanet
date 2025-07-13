import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const setupSocketIO = (io: Server) => {
  // Authentication middleware for Socket.IO
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;

      if (!token) {
        return next(new Error('Authentication error'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;

      const user = await prisma.user.findUnique({
        where: { id: decoded.id },
        select: { id: true, email: true, role: true, storeId: true, isActive: true }
      });

      if (!user || !user.isActive) {
        return next(new Error('User not found'));
      }

      socket.data.user = user;
      next();
    } catch (error) {
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', (socket) => {
    const user = socket.data.user;
    console.log(`User ${user.email} connected`);

    // Join store room for real-time updates
    if (user.storeId) {
      socket.join(`store:${user.storeId}`);
    }

    // Join admin room if admin
    if (user.role === 'ADMIN') {
      socket.join('admin');
    }

    // Handle sync requests
    socket.on('sync:request', async (data) => {
      try {
        // Process sync queue for this user
        const pendingSync = await prisma.syncQueue.findMany({
          where: {
            userId: user.id,
            status: 'PENDING'
          },
          orderBy: { createdAt: 'asc' }
        });

        socket.emit('sync:data', { items: pendingSync });
      } catch (error) {
        socket.emit('sync:error', { error: 'Sync failed' });
      }
    });

    // Handle sync completion
    socket.on('sync:complete', async (data) => {
      try {
        const { syncIds } = data;

        await prisma.syncQueue.updateMany({
          where: {
            id: { in: syncIds },
            userId: user.id
          },
          data: { status: 'COMPLETED' }
        });

        socket.emit('sync:success', { message: 'Sync completed' });
      } catch (error) {
        socket.emit('sync:error', { error: 'Sync completion failed' });
      }
    });

    // Handle real-time notifications
    socket.on('notification:subscribe', (storeId) => {
      if (user.role === 'ADMIN' || user.storeId === storeId) {
        socket.join(`notifications:${storeId}`);
      }
    });

    socket.on('disconnect', () => {
      console.log(`User ${user.email} disconnected`);
    });
  });

  return io;
};

// Helper functions to emit real-time updates
export const emitStockAlert = (io: Server, storeId: string, product: any) => {
  io.to(`store:${storeId}`).emit('stock:alert', {
    type: 'LOW_STOCK',
    product,
    timestamp: new Date()
  });
};

export const emitNewSale = (io: Server, storeId: string, sale: any) => {
  io.to(`store:${storeId}`).emit('sale:new', {
    sale,
    timestamp: new Date()
  });
};

export const emitDebtUpdate = (io: Server, storeId: string, debt: any) => {
  io.to(`store:${storeId}`).emit('debt:update', {
    debt,
    timestamp: new Date()
  });
};