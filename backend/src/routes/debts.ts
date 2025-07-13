import { Router } from 'express';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';
import { authenticate, checkStoreAccess, AuthRequest } from '@/middleware/auth';

const router = Router();
const prisma = new PrismaClient();

const debtPaymentSchema = z.object({
  amount: z.number().positive(),
  paymentType: z.enum(['CASH', 'MOBILE_MONEY', 'BANK_TRANSFER', 'CREDIT_CARD']),
  notes: z.string().optional()
});

// Get all debts for a store
router.get('/store/:storeId', authenticate, checkStoreAccess, async (req: AuthRequest, res, next) => {
  try {
    const { storeId } = req.params;
    const { status, clientName, startDate, endDate } = req.query;

    const where: any = { storeId };

    if (status) {
      where.status = status;
    }

    if (clientName) {
      where.clientName = { contains: clientName as string, mode: 'insensitive' };
    }

    if (startDate && endDate) {
      where.createdAt = {
        gte: new Date(startDate as string),
        lte: new Date(endDate as string)
      };
    }

    const debts = await prisma.debt.findMany({
      where,
      include: {
        sale: {
          include: {
            product: {
              select: { name: true }
            },
            seller: {
              select: { name: true }
            }
          }
        },
        payments: {
          orderBy: { createdAt: 'desc' }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return res.json({ debts });
  } catch (error) {
    return next(error);
  }
});

// Get debt by ID
router.get('/:id', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const { id } = req.params;

    const debt = await prisma.debt.findUnique({
      where: { id },
      include: {
        sale: {
          include: {
            product: true,
            seller: {
              select: { id: true, name: true, email: true }
            }
          }
        },
        store: {
          select: { id: true, name: true }
        },
        payments: {
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!debt) {
      return res.status(404).json({
        error: req.t('debt.notFound')
      });
    }

    // Check store access
    if (req.user?.role !== 'ADMIN' && req.user?.storeId !== debt.storeId) {
      return res.status(403).json({
        error: req.t('auth.unauthorized')
      });
    }

    return res.json({ debt });
  } catch (error) {
    return next(error);
  }
});

// Add payment to debt
router.post('/:id/payments', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const { id } = req.params;
    const data = debtPaymentSchema.parse(req.body);

    const debt = await prisma.debt.findUnique({
      where: { id }
    });

    if (!debt) {
      return res.status(404).json({
        error: req.t('debt.notFound')
      });
    }

    // Check store access
    if (req.user?.role !== 'ADMIN' && req.user?.storeId !== debt.storeId) {
      return res.status(403).json({
        error: req.t('auth.unauthorized')
      });
    }

    // Validate payment amount
    if (data.amount > debt.remainingAmount) {
      return res.status(400).json({
        error: 'Payment amount cannot exceed remaining debt'
      });
    }

    // Create payment and update debt in transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create payment
      const payment = await tx.debtPayment.create({
        data: {
          ...data,
          debtId: id
        }
      });

      // Update debt
      const newPaidAmount = debt.paidAmount + data.amount;
      const newRemainingAmount = debt.amount - newPaidAmount;
      const newStatus = newRemainingAmount === 0 ? 'PAID' : 'PARTIAL';

      const updatedDebt = await tx.debt.update({
        where: { id },
        data: {
          paidAmount: newPaidAmount,
          remainingAmount: newRemainingAmount,
          status: newStatus
        }
      });

      return { payment, debt: updatedDebt };
    });

    return res.status(201).json({
      message: req.t('debt.updated'),
      payment: result.payment,
      debt: result.debt
    });
  } catch (error) {
    return next(error);
  }
});

// Update debt
router.put('/:id', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const { id } = req.params;
    const updateSchema = z.object({
      clientName: z.string().optional(),
      clientPhone: z.string().optional(),
      notes: z.string().optional(),
      dueDate: z.string().datetime().optional()
    });

    const data = updateSchema.parse(req.body);

    const existingDebt = await prisma.debt.findUnique({
      where: { id }
    });

    if (!existingDebt) {
      return res.status(404).json({
        error: req.t('debt.notFound')
      });
    }

    // Check store access
    if (req.user?.role !== 'ADMIN' && req.user?.storeId !== existingDebt.storeId) {
      return res.status(403).json({
        error: req.t('auth.unauthorized')
      });
    }

    const updateData: any = { ...data };
    if (data.dueDate) {
      updateData.dueDate = new Date(data.dueDate);
    }

    const debt = await prisma.debt.update({
      where: { id },
      data: updateData
    });

    return res.json({
      message: req.t('debt.updated'),
      debt
    });
  } catch (error) {
    return next(error);
  }
});

// Get debt statistics
router.get('/store/:storeId/stats', authenticate, checkStoreAccess, async (req: AuthRequest, res, next) => {
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

    const [totalDebts, paidDebts, overdueDebts, recentPayments] = await Promise.all([
      // Total debts
      prisma.debt.aggregate({
        where: {
          storeId,
          createdAt: { gte: startDate, lte: endDate }
        },
        _sum: { amount: true, remainingAmount: true },
        _count: { id: true }
      }),

      // Paid debts
      prisma.debt.aggregate({
        where: {
          storeId,
          status: 'PAID',
          createdAt: { gte: startDate, lte: endDate }
        },
        _sum: { amount: true },
        _count: { id: true }
      }),

      // Overdue debts
      prisma.debt.count({
        where: {
          storeId,
          status: { in: ['PENDING', 'PARTIAL'] },
          dueDate: { lt: new Date() }
        }
      }),

      // Recent payments
      prisma.debtPayment.aggregate({
        where: {
          debt: { storeId },
          createdAt: { gte: startDate, lte: endDate }
        },
        _sum: { amount: true },
        _count: { id: true }
      })
    ]);

    return res.json({
      stats: {
        totalDebts: {
          amount: totalDebts._sum.amount || 0,
          remaining: totalDebts._sum.remainingAmount || 0,
          count: totalDebts._count || 0
        },
        paidDebts: {
          amount: paidDebts._sum.amount || 0,
          count: paidDebts._count || 0
        },
        overdueCount: overdueDebts,
        recentPayments: {
          amount: recentPayments._sum.amount || 0,
          count: recentPayments._count || 0
        },
        period
      }
    });
  } catch (error) {
    return next(error);
  }
});

// Get overdue debts
router.get('/store/:storeId/overdue', authenticate, checkStoreAccess, async (req: AuthRequest, res, next) => {
  try {
    const { storeId } = req.params;

    const overdueDebts = await prisma.debt.findMany({
      where: {
        storeId,
        status: { in: ['PENDING', 'PARTIAL'] },
        dueDate: { lt: new Date() }
      },
      include: {
        sale: {
          include: {
            product: {
              select: { name: true }
            }
          }
        }
      },
      orderBy: { dueDate: 'asc' }
    });

    return res.json({ debts: overdueDebts });
  } catch (error) {
    return next(error);
  }
});

export { router as debtRoutes };
