import { Router, Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import * as jwt from 'jsonwebtoken';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';
import { authenticate, AuthRequest } from '@/middleware/auth';
import crypto from 'crypto';
import dotenv from 'dotenv';

dotenv.config();
const router = Router();
const prisma = new PrismaClient();

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6)
});

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().min(2),
  role: z.enum(['ADMIN', 'SELLER']).optional(),
  storeId: z.string().optional(),
  language: z.enum(['fr', 'en', 'rn', 'sw']).optional()
});

const forgotPasswordSchema = z.object({
  email: z.string().email()
});

const resetPasswordSchema = z.object({
  token: z.string(),
  password: z.string().min(6)
});

// Login
router.post('/login', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = loginSchema.parse(req.body);

    const user = await prisma.user.findUnique({
      where: { email },
      include: { store: true }
    });

    if (!user || !user.isActive) {
      return res.status(401).json({
        error: req.t('auth.invalidCredentials')
      });
    }

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({
        error: req.t('auth.invalidCredentials')
      });
    }

    const secret = process.env.JWT_SECRET;
    if (!secret) return next(new Error('JWT_SECRET is not defined'));

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      secret,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    return res.json({
      message: req.t('auth.loginSuccess'),
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        storeId: user.storeId,
        storeName: user.store?.name,
        language: user.language
      }
    });
  } catch (error) {
    return next(error);
  }
});

// Register
router.post('/register', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = registerSchema.parse(req.body);

    const existingUser = await prisma.user.findUnique({
      where: { email: data.email }
    });

    if (existingUser) {
      return res.status(409).json({
        error: req.t('auth.emailExists')
      });
    }

    const hashedPassword = await bcrypt.hash(data.password, 12);

    const user = await prisma.user.create({
      data: {
        ...data,
        password: hashedPassword,
        role: data.role || 'SELLER',
        language: data.language || 'fr'
      },
      include: { store: true }
    });

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET!,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    return res.status(201).json({
      message: req.t('auth.registerSuccess'),
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        storeId: user.storeId,
        storeName: user.store?.name,
        language: user.language
      }
    });
  } catch (error) {
    return next(error);
  }
});

// Forgot Password
router.post('/forgot-password', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email } = forgotPasswordSchema.parse(req.body);

    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      return res.status(404).json({
        error: req.t('auth.userNotFound')
      });
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour

    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetToken,
        resetTokenExpiry
      }
    });

    return res.json({
      message: 'Reset token generated',
      resetToken // Remove this in production
    });
  } catch (error) {
    return next(error);
  }
});

// Reset Password
router.post('/reset-password', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { token, password } = resetPasswordSchema.parse(req.body);

    const user = await prisma.user.findFirst({
      where: {
        resetToken: token,
        resetTokenExpiry: {
          gt: new Date()
        }
      }
    });

    if (!user) {
      return res.status(400).json({
        error: 'Invalid or expired reset token'
      });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        resetToken: null,
        resetTokenExpiry: null
      }
    });

    return res.json({
      message: 'Password reset successfully'
    });
  } catch (error) {
    return next(error);
  }
});

// Get current user
router.get('/me', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        storeId: true,
        language: true,
        createdAt: true,
        store: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    return res.json({ user });
  } catch (error) {
    return next(error);
  }
});

// Update profile
router.put('/profile', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const updateSchema = z.object({
      name: z.string().min(2).optional(),
      language: z.enum(['fr', 'en', 'rn', 'sw']).optional(),
      currentPassword: z.string().optional(),
      newPassword: z.string().min(6).optional()
    });

    const data = updateSchema.parse(req.body);
    const updateData: any = {};

    if (data.name) updateData.name = data.name;
    if (data.language) updateData.language = data.language;

    if (data.currentPassword && data.newPassword) {
      const user = await prisma.user.findUnique({
        where: { id: req.user!.id }
      });

      const isValidPassword = await bcrypt.compare(data.currentPassword, user!.password);
      if (!isValidPassword) {
        return res.status(400).json({ error: req.t('auth.invalidCredentials') });
      }

      updateData.password = await bcrypt.hash(data.newPassword, 12);
    }

    const user = await prisma.user.update({
      where: { id: req.user!.id },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        storeId: true,
        language: true,
        store: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    return res.json({
      message: 'Profile updated successfully',
      user
    });
  } catch (error) {
    return next(error);
  }
});

export { router as authRoutes };
