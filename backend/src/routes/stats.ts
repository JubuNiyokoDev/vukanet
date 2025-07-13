import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, checkStoreAccess, AuthRequest } from '@/middleware/auth';

const router = Router();
const prisma = new PrismaClient();

// Get dashboard statistics
router.get('/dashboard/:storeId', authenticate, checkStoreAccess, async (req: AuthRequest, res, next) => {
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
      case 'year':
        startDate = new Date();
        startDate.setFullYear(startDate.getFullYear() - 1);
        break;
      default:
        startDate = new Date();
        startDate.setHours(0, 0, 0, 0);
    }

    const [salesStats, stockStats, debtStats, productStats] = await Promise.all([
      // Sales statistics
      prisma.sale.aggregate({
        where: {
          storeId,
          createdAt: { gte: startDate, lte: endDate }
        },
        _sum: { totalAmount: true },
        _count: { id: true }
      }),

      // Stock statistics
      prisma.product.aggregate({
        where: {
          storeId,
          isActive: true
        },
        _sum: { currentStock: true },
        _count: { id: true }
      }),

      // Debt statistics
      prisma.debt.aggregate({
        where: {
          storeId,
          status: { in: ['PENDING', 'PARTIAL'] }
        },
        _sum: { remainingAmount: true },
        _count: { id: true }
      }),

      // Low stock products
      prisma.product.count({
        where: {
          storeId,
          isActive: true,
          currentStock: {
            lte: prisma.product.fields.minStockAlert
          }
        }
      })
    ]);

    // Calculate stock value
    const products = await prisma.product.findMany({
      where: { storeId, isActive: true },
      select: {
        currentStock: true,
        packagePurchasePrice: true,
        unitsPerPackage: true
      }
    });

    const stockValue = products.reduce((total, product) => {
      return total + (product.currentStock * product.packagePurchasePrice / product.unitsPerPackage);
    }, 0);

    res.json({
      stats: {
        sales: {
          total: salesStats._sum.totalAmount || 0,
          count: salesStats._count || 0
        },
        stock: {
          totalUnits: stockStats._sum.currentStock || 0,
          totalValue: stockValue,
          productCount: stockStats._count || 0,
          lowStockCount: productStats
        },
        debts: {
          total: debtStats._sum.remainingAmount || 0,
          count: debtStats._count || 0
        },
        period
      }
    });
  } catch (error) {
    next(error);
  }
});

// Get sales trends
router.get('/sales-trends/:storeId', authenticate, checkStoreAccess, async (req: AuthRequest, res, next) => {
  try {
    const { storeId } = req.params;
    const { period = 'week', groupBy = 'day' } = req.query;

    let startDate: Date;
    const endDate = new Date();

    switch (period) {
      case 'week':
        startDate = new Date();
        startDate.setDate(startDate.getDate() - 7);
        break;
      case 'month':
        startDate = new Date();
        startDate.setMonth(startDate.getMonth() - 1);
        break;
      case 'year':
        startDate = new Date();
        startDate.setFullYear(startDate.getFullYear() - 1);
        break;
      default:
        startDate = new Date();
        startDate.setDate(startDate.getDate() - 7);
    }

    // Get sales data grouped by time period
    const sales = await prisma.sale.findMany({
      where: {
        storeId,
        createdAt: { gte: startDate, lte: endDate }
      },
      select: {
        totalAmount: true,
        createdAt: true
      },
      orderBy: { createdAt: 'asc' }
    });

    // Group sales by period
    const groupedSales = sales.reduce((acc, sale) => {
      let key: string;
      const date = new Date(sale.createdAt);

      switch (groupBy) {
        case 'hour':
          key = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}-${date.getHours()}`;
          break;
        case 'day':
          key = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
          break;
        case 'week':
          const weekStart = new Date(date);
          weekStart.setDate(date.getDate() - date.getDay());
          key = `${weekStart.getFullYear()}-${weekStart.getMonth()}-${weekStart.getDate()}`;
          break;
        case 'month':
          key = `${date.getFullYear()}-${date.getMonth()}`;
          break;
        default:
          key = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
      }

      if (!acc[key]) {
        acc[key] = { total: 0, count: 0, date: key };
      }
      acc[key].total += sale.totalAmount;
      acc[key].count += 1;

      return acc;
    }, {} as Record<string, { total: number; count: number; date: string }>);

    const trends = Object.values(groupedSales);

    res.json({ trends, period, groupBy });
  } catch (error) {
    next(error);
  }
});

// Get top selling products
router.get('/top-products/:storeId', authenticate, checkStoreAccess, async (req: AuthRequest, res, next) => {
  try {
    const { storeId } = req.params;
    const { period = 'month', limit = '10' } = req.query;

    let startDate: Date;
    const endDate = new Date();

    switch (period) {
      case 'week':
        startDate = new Date();
        startDate.setDate(startDate.getDate() - 7);
        break;
      case 'month':
        startDate = new Date();
        startDate.setMonth(startDate.getMonth() - 1);
        break;
      case 'year':
        startDate = new Date();
        startDate.setFullYear(startDate.getFullYear() - 1);
        break;
      default:
        startDate = new Date();
        startDate.setMonth(startDate.getMonth() - 1);
    }

    const topProducts = await prisma.sale.groupBy({
      by: ['productId'],
      where: {
        storeId,
        createdAt: { gte: startDate, lte: endDate }
      },
      _sum: {
        quantity: true,
        totalAmount: true
      },
      _count: {
        id: true
      },
      orderBy: {
        _sum: {
          quantity: 'desc'
        }
      },
      take: parseInt(limit as string)
    });

    // Get product details
    const productIds = topProducts.map(tp => tp.productId);
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
      select: {
        id: true,
        name: true,
        category: true,
        unitSalePrice: true
      }
    });

    const topProductsWithDetails = topProducts.map(tp => {
      const product = products.find(p => p.id === tp.productId);
      return {
        productId: tp.productId,
        productName: product?.name || 'Unknown',
        category: product?.category || 'Unknown',
        unitPrice: product?.unitSalePrice || 0,
        quantitySold: tp._sum.quantity || 0,
        totalRevenue: tp._sum.totalAmount || 0,
        salesCount: tp._count.id
      };
    });

    res.json({ topProducts: topProductsWithDetails, period });
  } catch (error) {
    next(error);
  }
});

// Get seller performance
router.get('/seller-performance/:storeId', authenticate, checkStoreAccess, async (req: AuthRequest, res, next) => {
  try {
    const { storeId } = req.params;
    const { period = 'month' } = req.query;

    let startDate: Date;
    const endDate = new Date();

    switch (period) {
      case 'week':
        startDate = new Date();
        startDate.setDate(startDate.getDate() - 7);
        break;
      case 'month':
        startDate = new Date();
        startDate.setMonth(startDate.getMonth() - 1);
        break;
      case 'year':
        startDate = new Date();
        startDate.setFullYear(startDate.getFullYear() - 1);
        break;
      default:
        startDate = new Date();
        startDate.setMonth(startDate.getMonth() - 1);
    }

    const sellerStats = await prisma.sale.groupBy({
      by: ['sellerId'],
      where: {
        storeId,
        createdAt: { gte: startDate, lte: endDate }
      },
      _sum: {
        totalAmount: true,
        quantity: true
      },
      _count: {
        id: true
      },
      orderBy: {
        _sum: {
          totalAmount: 'desc'
        }
      }
    });

    // Get seller details
    const sellerIds = sellerStats.map(ss => ss.sellerId);
    const sellers = await prisma.user.findMany({
      where: { id: { in: sellerIds } },
      select: {
        id: true,
        name: true,
        email: true
      }
    });

    const sellerPerformance = sellerStats.map(ss => {
      const seller = sellers.find(s => s.id === ss.sellerId);
      return {
        sellerId: ss.sellerId,
        sellerName: seller?.name || 'Unknown',
        sellerEmail: seller?.email || 'Unknown',
        totalSales: ss._sum.totalAmount || 0,
        totalQuantity: ss._sum.quantity || 0,
        salesCount: ss._count.id,
        averageSale: (ss._sum.totalAmount || 0) / (ss._count.id || 1)
      };
    });

    res.json({ sellerPerformance, period });
  } catch (error) {
    next(error);
  }
});

// Get financial overview
router.get('/financial/:storeId', authenticate, checkStoreAccess, async (req: AuthRequest, res, next) => {
  try {
    const { storeId } = req.params;
    const { period = 'month' } = req.query;

    let startDate: Date;
    const endDate = new Date();

    switch (period) {
      case 'week':
        startDate = new Date();
        startDate.setDate(startDate.getDate() - 7);
        break;
      case 'month':
        startDate = new Date();
        startDate.setMonth(startDate.getMonth() - 1);
        break;
      case 'year':
        startDate = new Date();
        startDate.setFullYear(startDate.getFullYear() - 1);
        break;
      default:
        startDate = new Date();
        startDate.setMonth(startDate.getMonth() - 1);
    }

    const [revenue, stockValue, debts, expenses] = await Promise.all([
      // Total revenue
      prisma.sale.aggregate({
        where: {
          storeId,
          createdAt: { gte: startDate, lte: endDate }
        },
        _sum: { totalAmount: true }
      }),

      // Current stock value
      prisma.product.findMany({
        where: { storeId, isActive: true },
        select: {
          currentStock: true,
          packagePurchasePrice: true,
          unitsPerPackage: true
        }
      }),

      // Outstanding debts
      prisma.debt.aggregate({
        where: {
          storeId,
          status: { in: ['PENDING', 'PARTIAL'] }
        },
        _sum: { remainingAmount: true }
      }),

      // Stock purchases (as expenses)
      prisma.stockMovement.aggregate({
        where: {
          storeId,
          type: 'IN',
          createdAt: { gte: startDate, lte: endDate }
        },
        _sum: { totalValue: true }
      })
    ]);

    const currentStockValue = stockValue.reduce((total, product) => {
      return total + (product.currentStock * product.packagePurchasePrice / product.unitsPerPackage);
    }, 0);

    const totalRevenue = revenue._sum.totalAmount || 0;
    const totalExpenses = expenses._sum.totalValue || 0;
    const outstandingDebts = debts._sum.remainingAmount || 0;
    const netProfit = totalRevenue - totalExpenses;

    res.json({
      financial: {
        revenue: totalRevenue,
        expenses: totalExpenses,
        netProfit,
        stockValue: currentStockValue,
        outstandingDebts,
        profitMargin: totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0,
        period
      }
    });
  } catch (error) {
    next(error);
  }
});

export { router as statsRoutes };