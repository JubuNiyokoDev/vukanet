import { Router } from 'express';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';
import { authenticate, authorize, AuthRequest } from '@/middleware/auth';

const router = Router();
const prisma = new PrismaClient();

const userSchema = z.object({
  email: z.string().email(),
  name: z.string().min(2),
  role: z.enum(['ADMIN', 'SELLER']),
  storeId: z.string().uuid().optional(),
  language: z.enum(['fr', 'en', 'rn', 'sw']).optional()
});

// Get all users (Admin only)
router.get('/', authenticate, authorize(['ADMIN']), async (req: AuthRequest, res, next) => {
  try {
    const { storeId, role } = req.query;

    const where: any = { isActive: true };

    if (storeId) {
      where.storeId = storeId;
    }

    if (role) {
      where.role = role;
    }

    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        storeId: true,
        language: true,
        isActive: true,
        store: {
          select: { id: true, name: true }
        },
        createdAt: true
      },
      orderBy: { name: 'asc' }
    });

    return res.json({ users });
  } catch (error) {
    return next(error);
  }
});

// Get user by ID
router.get('/:id', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const { id } = req.params;

    // Check if user can access this user data
    if (req.user?.role !== 'ADMIN' && req.user?.id !== id) {
      return res.status(403).json({
        error: req.t('auth.unauthorized')
      });
    }

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        storeId: true,
        language: true,
        isActive: true,
        store: {
          select: { id: true, name: true }
        },
        createdAt: true
      }
    });

    if (!user) {
      return res.status(404).json({
        error: req.t('auth.userNotFound')
      });
    }

    return res.json({ user });
  } catch (error) {
    return next(error);
  }
});

// Create user (Admin only)
router.post('/', authenticate, authorize(['ADMIN']), async (req: AuthRequest, res, next) => {
  try {
    const data = userSchema.parse(req.body);

    const existingUser = await prisma.user.findUnique({
      where: { email: data.email }
    });

    if (existingUser) {
      return res.status(409).json({
        error: req.t('auth.emailExists')
      });
    }

    // Generate temporary password
    const tempPassword = Math.random().toString(36).slice(-8);
    const bcrypt = require('bcryptjs');
    const hashedPassword = await bcrypt.hash(tempPassword, 12);

    const user = await prisma.user.create({
      data: {
        ...data,
        password: hashedPassword,
        language: data.language || 'fr'
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        storeId: true,
        language: true,
        store: {
          select: { id: true, name: true }
        }
      }
    });

    return res.status(201).json({
      message: 'User created successfully',
      user,
      tempPassword // In production, send this via email
    });
  } catch (error) {
    return next(error);
  }
});

// Update user
router.put('/:id', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const { id } = req.params;
    const parsedData = userSchema.partial().parse(req.body);

    // Typage précis pour updateData
    type UpdateData = Partial<{
      name: string;
      language: 'fr' | 'en' | 'rn' | 'sw';
      email: string;
      role: 'ADMIN' | 'SELLER';
      storeId?: string;
    }>;

    let updateData: UpdateData = parsedData;

    // Check permissions
    if (req.user?.role !== 'ADMIN' && req.user?.id !== id) {
      return res.status(403).json({
        error: req.t('auth.unauthorized')
      });
    }

    if (req.user?.role !== 'ADMIN') {
      // Seuls ces champs sont autorisés à être modifiés par un non-admin
      const allowedFields = ['name', 'language'] as const;

      const filteredData: Partial<Pick<UpdateData, 'name' | 'language'>> = {};

      for (const key of allowedFields) {
        if (key in parsedData && parsedData[key] !== undefined) {
          if (key === 'language') {
            // Cast explicite car parsedData[key] est string | undefined mais on sait que c'est bien un des 4 strings
            const lang = parsedData.language;
            if (lang === 'fr' || lang === 'en' || lang === 'rn' || lang === 'sw') {
              filteredData.language = lang;
            }
          } else {
            filteredData[key] = parsedData[key]!;
          }
        }
      }

      updateData = filteredData;
    }

    // Supprimer les clés avec valeur undefined
    updateData = Object.fromEntries(
      Object.entries(updateData).filter(([_, v]) => v !== undefined)
    ) as UpdateData;

    const user = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        storeId: true,
        language: true,
        store: {
          select: { id: true, name: true }
        }
      }
    });

    return res.json({
      message: 'User updated successfully',
      user
    });
  } catch (error) {
    return next(error);
  }
});

// Get users by store
router.get('/store/:storeId', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const { storeId } = req.params;

    // Check store access
    if (req.user?.role !== 'ADMIN' && req.user?.storeId !== storeId) {
      return res.status(403).json({
        error: req.t('auth.unauthorized')
      });
    }

    const users = await prisma.user.findMany({
      where: {
        storeId,
        isActive: true
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        language: true,
        createdAt: true
      },
      orderBy: { name: 'asc' }
    });

    return res.json({ users });
  } catch (error) {
    return next(error);
  }
});

export { router as userRoutes };
