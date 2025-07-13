import { Router } from 'express';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';
import { authenticate, checkStoreAccess, AuthRequest } from '@/middleware/auth';

const router = Router();
const prisma = new PrismaClient();

const saleSchema = z.object({
  productId: z.string().uuid(),
  quantity: z.number().int().positive(),
  saleType: z.enum(['UNIT', 'PACKAGE']),
  paymentType: z.enum(['CASH', 'MOBILE_MONEY', 'BANK_TRANSFER', 'CREDIT_CARD']),
  clientName: z.string().optional(),
  clientPhone: z.string().optional(),
  notes: z.string().optional(),
  isDebt: z.boolean().optional(),
  storeId: z.string().uuid()
});

// Get all sales for a store
router.get('/store/:storeId', authenticate, checkStoreAccess, async (req: AuthRequest, res, next) => {
  try {
    const { storeId } = req.params;
    const { startDate, endDate, productId, sellerId, isDebt } = req.query;

    const where: any = { storeId };

    if (startDate && endDate) {
      where.createdAt = {
        gte: new Date(startDate as string),
        lte: new Date(endDate as string)
      };
    }

    if (productId) {
      where.productId = productId;
    }

    if (sellerId) {
      where.sellerId = sellerId;
    }

    if (isDebt !== undefined) {
      where.isDebt = isDebt === 'true';
    }

    const sales = await prisma.sale.findMany({
      where,
      include: {
        product: {
          select: { name: true, category: true }
        },
        seller: {
          select: { name: true }
        },
        debt: {
          select: { id: true, status: true, remainingAmount: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return res.json({ sales });
  } catch (error) {
    return next(error);
  }
});

// Get sale by ID
router.get('/:id', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const { id } = req.params;

    const sale = await prisma.sale.findUnique({
      where: { id },
      include: {
        product: true,
        seller: {
          select: { id: true, name: true, email: true }
        },
        store: {
          select: { id: true, name: true }
        },
        debt: {
          include: {
            payments: {
              orderBy: { createdAt: 'desc' }
            }
          }
        }
      }
    });

    if (!sale) {
      return res.status(404).json({
        error: req.t('sale.notFound')
      });
    }

    // Check store access
    if (req.user?.role !== 'ADMIN' && req.user?.storeId !== sale.storeId) {
      return res.status(403).json({
        error: req.t('auth.unauthorized')
      });
    }

    return res.json({ sale });
  } catch (error) {
    return next(error);
  }
});

// Create sale
router.post('/', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const data = saleSchema.parse(req.body);

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

    // Check stock availability
    const requiredStock = data.saleType === 'PACKAGE'
      ? data.quantity * product.unitsPerPackage
      : data.quantity;

    if (product.currentStock < requiredStock) {
      return res.status(400).json({
        error: req.t('sale.insufficientStock')
      });
    }

    // Calculate prices
    const unitPrice = data.saleType === 'PACKAGE'
      ? product.packageSalePrice
      : product.unitSalePrice;
    const totalAmount = unitPrice * data.quantity;

    // Create sale transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create sale
      const sale = await tx.sale.create({
        data: {
          ...data,
          unitPrice,
          totalAmount,
          sellerId: req.user!.id,
          isDebt: data.isDebt || false
        }
      });

      // Update product stock
      await tx.product.update({
        where: { id: data.productId },
        data: {
          currentStock: {
            decrement: requiredStock
          }
        }
      });

      // Create stock movement
      await tx.stockMovement.create({
        data: {
          type: 'OUT',
          quantity: requiredStock,
          unitPrice: product.unitSalePrice,
          totalValue: totalAmount,
          reason: 'Sale',
          reference: sale.id,
          productId: data.productId,
          userId: req.user!.id,
          storeId: data.storeId
        }
      });

      // Create debt if needed
      if (data.isDebt) {
        await tx.debt.create({
          data: {
            amount: totalAmount,
            remainingAmount: totalAmount,
            clientName: data.clientName || 'Unknown',
            clientPhone: data.clientPhone,
            notes: data.notes,
            saleId: sale.id,
            storeId: data.storeId
          }
        });
      }

      return sale;
    });

    return res.status(201).json({
      message: req.t('sale.created'),
      sale: result
    });
  } catch (error) {
    return next(error);
  }
});

// Update sale
router.put('/:id', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const { id } = req.params;
    const updateSchema = z.object({
      clientName: z.string().optional(),
      clientPhone: z.string().optional(),
      notes: z.string().optional()
    });

    const data = updateSchema.parse(req.body);

    const existingSale = await prisma.sale.findUnique({
      where: { id }
    });

    if (!existingSale) {
      return res.status(404).json({
        error: req.t('sale.notFound')
      });
    }

    // Check store access
    if (req.user?.role !== 'ADMIN' && req.user?.storeId !== existingSale.storeId) {
      return res.status(403).json({
        error: req.t('auth.unauthorized')
      });
    }

    const sale = await prisma.sale.update({
      where: { id },
      data
    });

    return res.json({
      message: req.t('sale.updated'),
      sale
    });
  } catch (error) {
    return next(error);
  }
});

// Get sales statistics
router.get('/store/:storeId/stats', authenticate, checkStoreAccess, async (req: AuthRequest, res, next) => {
  try {
    const { storeId } = req.params;
    const { period = 'today' } = req.query;

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
        startDate.setHours(0, 0, 0, 0);
    }

    const [totalSales, totalAmount, totalDebts, topProducts] = await Promise.all([
      // Total sales count
      prisma.sale.count({
        where: {
          storeId,
          createdAt: { gte: startDate, lte: endDate }
        }
      }),

      // Total sales amount
      prisma.sale.aggregate({
        where: {
          storeId,
          createdAt: { gte: startDate, lte: endDate }
        },
        _sum: { totalAmount: true }
      }),

      // Total debts
      prisma.debt.aggregate({
        where: {
          storeId,
          status: { in: ['PENDING', 'PARTIAL'] }
        },
        _sum: { remainingAmount: true }
      }),

      // Top selling products
      prisma.sale.groupBy({
        by: ['productId'],
        where: {
          storeId,
          createdAt: { gte: startDate, lte: endDate }
        },
        _sum: { quantity: true },
        _count: { id: true },
        orderBy: { _sum: { quantity: 'desc' } },
        take: 5
      })
    ]);

    // Get product names for top products
    const productIds = topProducts.map(p => p.productId);
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true, name: true }
    });

    const topProductsWithNames = topProducts.map(tp => {
      const product = products.find(p => p.id === tp.productId);
      return {
        productId: tp.productId,
        productName: product?.name || 'Unknown',
        quantity: tp._sum.quantity || 0,
        salesCount: tp._count.id
      };
    });

    return res.json({
      stats: {
        totalSales,
        totalAmount: totalAmount._sum.totalAmount || 0,
        totalDebts: totalDebts._sum.remainingAmount || 0,
        topProducts: topProductsWithNames,
        period
      }
    });
  } catch (error) {
    return next(error);
  }
});

export { router as saleRoutes };
