import { Router } from 'express';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';
import { authenticate, checkStoreAccess, AuthRequest } from '@/middleware/auth';

const router = Router();
const prisma = new PrismaClient();

const stockMovementSchema = z.object({
  productId: z.string().uuid(),
  type: z.enum(['IN', 'OUT', 'ADJUSTMENT', 'TRANSFER']),
  quantity: z.number().int(),
  unitPrice: z.number().positive().optional(),
  reason: z.string().optional(),
  reference: z.string().optional(),
  storeId: z.string().uuid()
});

// Get stock movements for a store
router.get('/store/:storeId', authenticate, checkStoreAccess, async (req: AuthRequest, res, next) => {
  try {
    const { storeId } = req.params;
    const { productId, type, startDate, endDate, limit = '50' } = req.query;

    const where: any = { storeId };

    if (productId) {
      where.productId = productId;
    }

    if (type) {
      where.type = type;
    }

    if (startDate && endDate) {
      where.createdAt = {
        gte: new Date(startDate as string),
        lte: new Date(endDate as string)
      };
    }

    const movements = await prisma.stockMovement.findMany({
      where,
      include: {
        product: {
          select: { name: true, category: true }
        },
        user: {
          select: { name: true }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: parseInt(limit as string)
    });

    return res.json({ movements });
  } catch (error) {
    return next(error);
  }
});

// Get stock movement by ID
router.get('/:id', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const { id } = req.params;

    const movement = await prisma.stockMovement.findUnique({
      where: { id },
      include: {
        product: true,
        user: {
          select: { id: true, name: true, email: true }
        },
        store: {
          select: { id: true, name: true }
        }
      }
    });

    if (!movement) {
      return res.status(404).json({
        error: req.t('stock.notFound')
      });
    }

    // Check store access
    if (req.user?.role !== 'ADMIN' && req.user?.storeId !== movement.storeId) {
      return res.status(403).json({
        error: req.t('auth.unauthorized')
      });
    }

    return res.json({ movement });
  } catch (error) {
    return next(error);
  }
});

// Create stock movement
router.post('/', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const data = stockMovementSchema.parse(req.body);

    // Check store access
    if (req.user?.role !== 'ADMIN' && req.user?.storeId !== data.storeId) {
      return res.status(403).json({
        error: req.t('auth.unauthorized')
      });
    }

    // Get product details
    const product = await prisma.product.findUnique({
      where: { id: data.productId }
    });

    if (!product) {
      return res.status(404).json({
        error: req.t('product.notFound')
      });
    }

    // Validate stock for OUT movements
    if (data.type === 'OUT' && product.currentStock < Math.abs(data.quantity)) {
      return res.status(400).json({
        error: req.t('sale.insufficientStock')
      });
    }

    // Calculate stock change
    let stockChange = 0;
    switch (data.type) {
      case 'IN':
        stockChange = Math.abs(data.quantity);
        break;
      case 'OUT':
        stockChange = -Math.abs(data.quantity);
        break;
      case 'ADJUSTMENT':
        stockChange = data.quantity; // Can be positive or negative
        break;
      case 'TRANSFER':
        stockChange = -Math.abs(data.quantity); // Outgoing transfer
        break;
    }

    // Calculate total value
    const unitPrice = data.unitPrice || product.unitSalePrice;
    const totalValue = unitPrice * Math.abs(data.quantity);

    // Create movement and update stock in transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create stock movement
      const movement = await tx.stockMovement.create({
        data: {
          ...data,
          quantity: Math.abs(data.quantity),
          unitPrice,
          totalValue,
          userId: req.user!.id
        }
      });

      // Update product stock
      const newStock = Math.max(0, product.currentStock + stockChange);
      await tx.product.update({
        where: { id: data.productId },
        data: { currentStock: newStock }
      });

      return movement;
    });

    return res.status(201).json({
      message: req.t('stock.created'),
      movement: result
    });
  } catch (error) {
    return next(error);
  }
});

// Get stock movements by product
router.get('/product/:productId', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const { productId } = req.params;
    const { limit = '20' } = req.query;

    // Get product to check store access
    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: { storeId: true }
    });

    if (!product) {
      return res.status(404).json({
        error: req.t('product.notFound')
      });
    }

    // Check store access
    if (req.user?.role !== 'ADMIN' && req.user?.storeId !== product.storeId) {
      return res.status(403).json({
        error: req.t('auth.unauthorized')
      });
    }

    const movements = await prisma.stockMovement.findMany({
      where: { productId },
      include: {
        user: {
          select: { name: true }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: parseInt(limit as string)
    });

    return res.json({ movements });
  } catch (error) {
    return next(error);
  }
});

// Get stock summary for a store
router.get('/store/:storeId/summary', authenticate, checkStoreAccess, async (req: AuthRequest, res, next) => {
  try {
    const { storeId } = req.params;
    const { period = 'month' } = req.query;

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

    const [inMovements, outMovements, adjustments, currentStock] = await Promise.all([
      // IN movements
      prisma.stockMovement.aggregate({
        where: {
          storeId,
          type: 'IN',
          createdAt: { gte: startDate, lte: endDate }
        },
        _sum: { quantity: true, totalValue: true },
        _count: { id: true }
      }),

      // OUT movements
      prisma.stockMovement.aggregate({
        where: {
          storeId,
          type: 'OUT',
          createdAt: { gte: startDate, lte: endDate }
        },
        _sum: { quantity: true, totalValue: true },
        _count: { id: true }
      }),

      // ADJUSTMENT movements
      prisma.stockMovement.aggregate({
        where: {
          storeId,
          type: 'ADJUSTMENT',
          createdAt: { gte: startDate, lte: endDate }
        },
        _sum: { quantity: true },
        _count: { id: true }
      }),

      // Current stock value
      prisma.product.aggregate({
        where: {
          storeId,
          isActive: true
        },
        _sum: { currentStock: true }
      })
    ]);

    return res.json({
      summary: {
        inMovements: {
          quantity: inMovements._sum.quantity || 0,
          value: inMovements._sum.totalValue || 0,
          count: inMovements._count || 0
        },
        outMovements: {
          quantity: outMovements._sum.quantity || 0,
          value: outMovements._sum.totalValue || 0,
          count: outMovements._count || 0
        },
        adjustments: {
          quantity: adjustments._sum.quantity || 0,
          count: adjustments._count || 0
        },
        currentStock: {
          totalUnits: currentStock._sum.currentStock || 0
        },
        period
      }
    });
  } catch (error) {
    return next(error);
  }
});

// Bulk stock adjustment
router.post('/bulk-adjustment', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const bulkSchema = z.object({
      storeId: z.string().uuid(),
      adjustments: z.array(z.object({
        productId: z.string().uuid(),
        newStock: z.number().int().min(0),
        reason: z.string().optional()
      }))
    });

    const data = bulkSchema.parse(req.body);

    // Check store access
    if (req.user?.role !== 'ADMIN' && req.user?.storeId !== data.storeId) {
      return res.status(403).json({
        error: req.t('auth.unauthorized')
      });
    }

    // Get all products
    const productIds = data.adjustments.map(adj => adj.productId);
    const products = await prisma.product.findMany({
      where: {
        id: { in: productIds },
        storeId: data.storeId
      }
    });

    if (products.length !== productIds.length) {
      return res.status(400).json({
        error: 'Some products not found or not in the specified store'
      });
    }

    // Process adjustments in transaction
    const movements = await prisma.$transaction(async (tx) => {
      const createdMovements = [];

      for (const adjustment of data.adjustments) {
        const product = products.find(p => p.id === adjustment.productId)!;
        const stockDifference = adjustment.newStock - product.currentStock;

        if (stockDifference !== 0) {
          // Create stock movement
          const movement = await tx.stockMovement.create({
            data: {
              type: 'ADJUSTMENT',
              quantity: Math.abs(stockDifference),
              unitPrice: product.unitSalePrice,
              totalValue: Math.abs(stockDifference) * product.unitSalePrice,
              reason: adjustment.reason || 'Bulk adjustment',
              productId: adjustment.productId,
              userId: req.user!.id,
              storeId: data.storeId
            }
          });

          // Update product stock
          await tx.product.update({
            where: { id: adjustment.productId },
            data: { currentStock: adjustment.newStock }
          });

          createdMovements.push(movement);
        }
      }

      return createdMovements;
    });

    return res.status(201).json({
      message: `${movements.length} stock adjustments processed`,
      movements
    });
  } catch (error) {
    return next(error);
  }
});

export { router as stockRoutes };
