import { Router } from 'express';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';
import { authenticate, AuthRequest } from '@/middleware/auth';

const router = Router();
const prisma = new PrismaClient();

const syncItemSchema = z.object({
  action: z.enum(['CREATE', 'UPDATE', 'DELETE']),
  tableName: z.string(),
  recordId: z.string(),
  data: z.record(z.any()),
  timestamp: z.string().datetime()
});

const syncRequestSchema = z.object({
  items: z.array(syncItemSchema),
  lastSyncTimestamp: z.string().datetime().optional()
});

// Push local changes to server
router.post('/push', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const { items } = syncRequestSchema.parse(req.body);
    const userId = req.user!.id;
    const storeId = req.user!.storeId;

    const results = [];

    for (const item of items) {
      try {
        // Validate store access for the data
        if (item.data.storeId && item.data.storeId !== storeId && req.user?.role !== 'ADMIN') {
          results.push({
            recordId: item.recordId,
            status: 'error',
            error: 'Unauthorized store access'
          });
          continue;
        }

        let result;
        switch (item.tableName) {
          case 'products':
            result = await handleProductSync(item, userId, storeId);
            break;
          case 'sales':
            result = await handleSaleSync(item, userId, storeId);
            break;
          case 'stock_movements':
            result = await handleStockMovementSync(item, userId, storeId);
            break;
          case 'debts':
            result = await handleDebtSync(item, userId, storeId);
            break;
          default:
            result = {
              recordId: item.recordId,
              status: 'error',
              error: `Unsupported table: ${item.tableName}`
            };
        }

        results.push(result);
      } catch (error) {
        results.push({
          recordId: item.recordId,
          status: 'error',
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    res.json({
      message: 'Sync push completed',
      results,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
});

// Pull server changes to local
router.post('/pull', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const { lastSyncTimestamp } = z.object({
      lastSyncTimestamp: z.string().datetime().optional()
    }).parse(req.body);

    const userId = req.user!.id;
    const storeId = req.user!.storeId;
    const since = lastSyncTimestamp ? new Date(lastSyncTimestamp) : new Date(0);

    const changes: {
      action: 'CREATE' | 'UPDATE' | 'DELETE';
      tableName: string;
      recordId: string;
      data: any;
      timestamp: string;
    }[] = [];


    // Get updated products
    const products = await prisma.product.findMany({
      where: {
        storeId: req.user?.role === 'ADMIN' ? undefined : storeId,
        updatedAt: { gt: since }
      }
    });

    products.forEach(product => {
      changes.push({
        action: 'UPDATE',
        tableName: 'products',
        recordId: product.id,
        data: product,
        timestamp: product.updatedAt.toISOString()
      });
    });

    // Get updated sales
    const sales = await prisma.sale.findMany({
      where: {
        storeId: req.user?.role === 'ADMIN' ? undefined : storeId,
        updatedAt: { gt: since }
      },
      include: {
        product: { select: { name: true } },
        seller: { select: { name: true } }
      }
    });

    sales.forEach(sale => {
      changes.push({
        action: 'UPDATE',
        tableName: 'sales',
        recordId: sale.id,
        data: {
          ...sale,
          productName: sale.product.name,
          sellerName: sale.seller.name
        },
        timestamp: sale.updatedAt.toISOString()
      });
    });

    // Get updated debts
    const debts = await prisma.debt.findMany({
      where: {
        storeId: req.user?.role === 'ADMIN' ? undefined : storeId,
        updatedAt: { gt: since }
      }
    });

    debts.forEach(debt => {
      changes.push({
        action: 'UPDATE',
        tableName: 'debts',
        recordId: debt.id,
        data: debt,
        timestamp: debt.updatedAt.toISOString()
      });
    });

    res.json({
      changes,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
});

// Get sync status
router.get('/status', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const userId = req.user!.id;

    const pendingSync = await prisma.syncQueue.count({
      where: {
        userId,
        status: 'PENDING'
      }
    });

    const failedSync = await prisma.syncQueue.count({
      where: {
        userId,
        status: 'FAILED'
      }
    });

    const lastSync = await prisma.syncQueue.findFirst({
      where: {
        userId,
        status: 'COMPLETED'
      },
      orderBy: { updatedAt: 'desc' }
    });

    res.json({
      status: {
        pendingItems: pendingSync,
        failedItems: failedSync,
        lastSyncTime: lastSync?.updatedAt?.toISOString() || null,
        isOnline: true // This would be determined by actual connectivity
      }
    });
  } catch (error) {
    next(error);
  }
});

// Retry failed sync items
router.post('/retry', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const userId = req.user!.id;

    const failedItems = await prisma.syncQueue.findMany({
      where: {
        userId,
        status: 'FAILED',
        attempts: { lt: 3 }
      }
    });

    const retryResults = [];

    for (const item of failedItems) {
      try {
        // Reset status and increment attempts
        await prisma.syncQueue.update({
          where: { id: item.id },
          data: {
            status: 'PENDING',
            attempts: { increment: 1 },
            error: null
          }
        });

        retryResults.push({
          id: item.id,
          status: 'queued'
        });
      } catch (error) {
        retryResults.push({
          id: item.id,
          status: 'error',
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    res.json({
      message: 'Retry initiated',
      results: retryResults
    });
  } catch (error) {
    next(error);
  }
});

// Helper functions for handling different entity types
async function handleProductSync(item: any, userId: string, storeId?: string) {
  const { action, recordId, data } = item;

  switch (action) {
    case 'CREATE':
      const product = await prisma.product.create({
        data: {
          ...data,
          id: recordId,
          storeId: data.storeId || storeId
        }
      });
      return { recordId, status: 'success', data: product };

    case 'UPDATE':
      const updatedProduct = await prisma.product.update({
        where: { id: recordId },
        data
      });
      return { recordId, status: 'success', data: updatedProduct };

    case 'DELETE':
      await prisma.product.update({
        where: { id: recordId },
        data: { isActive: false }
      });
      return { recordId, status: 'success' };

    default:
      throw new Error(`Unsupported action: ${action}`);
  }
}

async function handleSaleSync(item: any, userId: string, storeId?: string) {
  const { action, recordId, data } = item;

  switch (action) {
    case 'CREATE':
      const sale = await prisma.sale.create({
        data: {
          ...data,
          id: recordId,
          sellerId: data.sellerId || userId,
          storeId: data.storeId || storeId
        }
      });
      return { recordId, status: 'success', data: sale };

    case 'UPDATE':
      const updatedSale = await prisma.sale.update({
        where: { id: recordId },
        data
      });
      return { recordId, status: 'success', data: updatedSale };

    default:
      throw new Error(`Unsupported action: ${action} for sales`);
  }
}

async function handleStockMovementSync(item: any, userId: string, storeId?: string) {
  const { action, recordId, data } = item;

  if (action === 'CREATE') {
    const movement = await prisma.stockMovement.create({
      data: {
        ...data,
        id: recordId,
        userId: data.userId || userId,
        storeId: data.storeId || storeId
      }
    });
    return { recordId, status: 'success', data: movement };
  }

  throw new Error(`Unsupported action: ${action} for stock movements`);
}

async function handleDebtSync(item: any, userId: string, storeId?: string) {
  const { action, recordId, data } = item;

  switch (action) {
    case 'CREATE':
      const debt = await prisma.debt.create({
        data: {
          ...data,
          id: recordId,
          storeId: data.storeId || storeId
        }
      });
      return { recordId, status: 'success', data: debt };

    case 'UPDATE':
      const updatedDebt = await prisma.debt.update({
        where: { id: recordId },
        data
      });
      return { recordId, status: 'success', data: updatedDebt };

    default:
      throw new Error(`Unsupported action: ${action} for debts`);
  }
}

export { router as syncRoutes };