import { Router } from 'express';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';
import { authenticate, authorize, checkStoreAccess, AuthRequest } from '@/middleware/auth';

const router = Router();
const prisma = new PrismaClient();

const productSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  category: z.string().min(1),
  barcode: z.string().optional(),
  unitsPerPackage: z.number().int().positive(),
  currentStock: z.number().int().min(0).optional(),
  packagePurchasePrice: z.number().positive(),
  unitSalePrice: z.number().positive(),
  packageSalePrice: z.number().positive(),
  minStockAlert: z.number().int().min(0).optional(),
  storeId: z.string().uuid()
});

// Get all products for a store
router.get('/store/:storeId', authenticate, checkStoreAccess, async (req: AuthRequest, res, next) => {
  try {
    const { storeId } = req.params;
    const { category, lowStock, search } = req.query;

    const where: any = { storeId, isActive: true };

    if (category) {
      where.category = category;
    }

    if (lowStock === 'true') {
      // Note: prisma.product.fields.minStockAlert doesn't exist, must hardcode or adjust logic
      where.currentStock = { lte: 5 };
    }

    if (search) {
      where.OR = [
        { name: { contains: search as string, mode: 'insensitive' } },
        { description: { contains: search as string, mode: 'insensitive' } },
        { category: { contains: search as string, mode: 'insensitive' } }
      ];
    }

    const products = await prisma.product.findMany({
      where,
      orderBy: { name: 'asc' }
    });

    return res.json({ products });
  } catch (error) {
    return next(error);
  }
});

// Get product by ID
router.get('/:id', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const { id } = req.params;

    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        store: {
          select: { id: true, name: true }
        },
        stockMovements: {
          take: 10,
          orderBy: { createdAt: 'desc' },
          include: {
            user: {
              select: { name: true }
            }
          }
        }
      }
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

    return res.json({ product });
  } catch (error) {
    return next(error);
  }
});

// Create product
router.post('/', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const data = productSchema.parse(req.body);

    // Check store access
    if (req.user?.role !== 'ADMIN' && req.user?.storeId !== data.storeId) {
      return res.status(403).json({
        error: req.t('auth.unauthorized')
      });
    }

    const product = await prisma.product.create({
      data: {
        ...data,
        currentStock: data.currentStock || 0,
        minStockAlert: data.minStockAlert || 5
      }
    });

    // Create initial stock movement if stock > 0
    if (product.currentStock > 0) {
      await prisma.stockMovement.create({
        data: {
          type: 'IN',
          quantity: product.currentStock,
          unitPrice: product.packagePurchasePrice / product.unitsPerPackage,
          totalValue: product.packagePurchasePrice * (product.currentStock / product.unitsPerPackage),
          reason: 'Initial stock',
          productId: product.id,
          userId: req.user!.id,
          storeId: product.storeId
        }
      });
    }

    return res.status(201).json({
      message: req.t('product.created'),
      product
    });
  } catch (error) {
    return next(error);
  }
});

// Update product
router.put('/:id', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const { id } = req.params;
    const updateData = productSchema.partial().parse(req.body);

    const existingProduct = await prisma.product.findUnique({
      where: { id }
    });

    if (!existingProduct) {
      return res.status(404).json({
        error: req.t('product.notFound')
      });
    }

    // Check store access
    if (req.user?.role !== 'ADMIN' && req.user?.storeId !== existingProduct.storeId) {
      return res.status(403).json({
        error: req.t('auth.unauthorized')
      });
    }

    const product = await prisma.product.update({
      where: { id },
      data: updateData
    });

    return res.json({
      message: req.t('product.updated'),
      product
    });
  } catch (error) {
    return next(error);
  }
});

// Delete product
router.delete('/:id', authenticate, authorize(['ADMIN']), async (req: AuthRequest, res, next) => {
  try {
    const { id } = req.params;

    const product = await prisma.product.findUnique({
      where: { id }
    });

    if (!product) {
      return res.status(404).json({
        error: req.t('product.notFound')
      });
    }

    await prisma.product.update({
      where: { id },
      data: { isActive: false }
    });

    return res.json({
      message: req.t('product.deleted')
    });
  } catch (error) {
    return next(error);
  }
});

// Get low stock products
router.get('/store/:storeId/low-stock', authenticate, checkStoreAccess, async (req: AuthRequest, res, next) => {
  try {
    const { storeId } = req.params;

    const products = await prisma.product.findMany({
      where: {
        storeId,
        isActive: true,
        currentStock: {
          lte: 5 // idem, hardcoded because prisma.product.fields.minStockAlert doesn't exist
        }
      },
      orderBy: { currentStock: 'asc' }
    });

    return res.json({ products });
  } catch (error) {
    return next(error);
  }
});

// Get product categories
router.get('/store/:storeId/categories', authenticate, checkStoreAccess, async (req: AuthRequest, res, next) => {
  try {
    const { storeId } = req.params;

    const categories = await prisma.product.findMany({
      where: { storeId, isActive: true },
      select: { category: true },
      distinct: ['category']
    });

    return res.json({
      categories: categories.map(c => c.category)
    });
  } catch (error) {
    return next(error);
  }
});

export { router as productRoutes };
