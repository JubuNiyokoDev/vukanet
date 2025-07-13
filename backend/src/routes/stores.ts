import { Router } from 'express';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';
import { authenticate, authorize, AuthRequest } from '@/middleware/auth';

const router = Router();
const prisma = new PrismaClient();

const storeSchema = z.object({
  name: z.string().min(1),
  address: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional(),
  description: z.string().optional()
});

// Get all stores (Admin only)
router.get('/', authenticate, authorize(['ADMIN']), async (req: AuthRequest, res, next) => {
  try {
    const { search, isActive } = req.query;

    const where: any = {};

    if (search) {
      where.OR = [
        { name: { contains: search as string, mode: 'insensitive' } },
        { address: { contains: search as string, mode: 'insensitive' } }
      ];
    }

    if (isActive !== undefined) {
      where.isActive = isActive === 'true';
    }

    const stores = await prisma.store.findMany({
      where,
      include: {
        _count: {
          select: {
            users: { where: { isActive: true } },
            products: { where: { isActive: true } },
            sales: true
          }
        }
      },
      orderBy: { name: 'asc' }
    });

    return res.json({ stores });
  } catch (error) {
    return next(error);
  }
});

// Get store by ID
router.get('/:id', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const { id } = req.params;

    // Check store access
    if (req.user?.role !== 'ADMIN' && req.user?.storeId !== id) {
      return res.status(403).json({
        error: req.t('auth.unauthorized')
      });
    }

    const store = await prisma.store.findUnique({
      where: { id },
      include: {
        users: {
          where: { isActive: true },
          select: {
            id: true,
            name: true,
            email: true,
            role: true
          }
        },
        _count: {
          select: {
            products: { where: { isActive: true } },
            sales: true
          }
        }
      }
    });

    if (!store) {
      return res.status(404).json({
        error: req.t('store.notFound')
      });
    }

    return res.json({ store });
  } catch (error) {
    return next(error);
  }
});

// Create store (Admin only)
router.post('/', authenticate, authorize(['ADMIN']), async (req: AuthRequest, res, next) => {
  try {
    const data = storeSchema.parse(req.body);

    const store = await prisma.store.create({
      data
    });

    return res.status(201).json({
      message: req.t('store.created'),
      store
    });
  } catch (error) {
    return next(error);
  }
});

// Update store
router.put('/:id', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const { id } = req.params;
    const updateData = storeSchema.partial().parse(req.body);

    // Check store access
    if (req.user?.role !== 'ADMIN' && req.user?.storeId !== id) {
      return res.status(403).json({
        error: req.t('auth.unauthorized')
      });
    }

    const store = await prisma.store.update({
      where: { id },
      data: updateData
    });

    return res.json({
      message: req.t('store.updated'),
      store
    });
  } catch (error) {
    return next(error);
  }
});

// Delete store (Admin only)
router.delete('/:id', authenticate, authorize(['ADMIN']), async (req: AuthRequest, res, next) => {
  try {
    const { id } = req.params;

    // Check if store has active users or products
    const storeData = await prisma.store.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            users: { where: { isActive: true } },
            products: { where: { isActive: true } }
          }
        }
      }
    });

    if (!storeData) {
      return res.status(404).json({
        error: req.t('store.notFound')
      });
    }

    if (storeData._count.users > 0 || storeData._count.products > 0) {
      return res.status(400).json({
        error: 'Cannot delete store with active users or products'
      });
    }

    await prisma.store.update({
      where: { id },
      data: { isActive: false }
    });

    return res.json({
      message: req.t('store.deleted')
    });
  } catch (error) {
    return next(error);
  }
});

// Get store statistics
router.get('/:id/stats', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const { id } = req.params;
    const { period = 'month' } = req.query;

    // Check store access
    if (req.user?.role !== 'ADMIN' && req.user?.storeId !== id) {
      return res.status(403).json({
        error: req.t('auth.unauthorized')
      });
    }

    let startDate: Date;
    const endDate = new Date();

    switch (period) {
      case 'today':
        startDate = new Date();
        startDate.setHours(0, 0, 0, 0);
        break;
      case 'week':
        startDate = new Date();
        startDate.setDate(startDate.getDate() - 7);
        break;
      case 'month':
        startDate = new Date();
        startDate.setMonth(startDate.getMonth() - 1);
        break;
      default:
        startDate = new Date();
        startDate.setMonth(startDate.getMonth() - 1);
    }

    const [salesStats, productStats, debtStats] = await Promise.all([
      // Sales statistics
      prisma.sale.aggregate({
        where: {
          storeId: id,
          createdAt: { gte: startDate, lte: endDate }
        },
        _sum: { totalAmount: true },
        _count: { id: true }
      }),

      // Product statistics
      prisma.product.aggregate({
        where: {
          storeId: id,
          isActive: true
        },
        _sum: { currentStock: true },
        _count: { id: true }
      }),

      // Debt statistics
      prisma.debt.aggregate({
        where: {
          storeId: id,
          status: { in: ['PENDING', 'PARTIAL'] }
        },
        _sum: { remainingAmount: true },
        _count: { id: true }
      })
    ]);

    return res.json({
      stats: {
        sales: {
          total: salesStats._sum.totalAmount || 0,
          count: salesStats._count || 0
        },
        products: {
          totalStock: productStats._sum.currentStock || 0,
          count: productStats._count || 0
        },
        debts: {
          totalAmount: debtStats._sum.remainingAmount || 0,
          count: debtStats._count || 0
        },
        period
      }
    });
  } catch (error) {
    return next(error);
  }
});

export { router as storeRoutes };
