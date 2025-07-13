import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
    storeId?: string;
  };
}

export const authenticate = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({
        error: req.t('auth.unauthorized')
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;

    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: { id: true, email: true, role: true, storeId: true, isActive: true }
    });

    if (!user || !user.isActive) {
      return res.status(401).json({
        error: req.t('auth.userNotFound')
      });
    }

    req.user = {
      id: user.id,
      email: user.email,
      role: user.role,
      storeId: user.storeId ?? undefined,
    };

    return next();
  } catch (error) {
    return res.status(401).json({
      error: req.t('auth.tokenExpired')
    });
  }
};

export const authorize = (roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        error: req.t('auth.unauthorized')
      });
    }
    return next();
  };
};

export const checkStoreAccess = (req: AuthRequest, res: Response, next: NextFunction) => {
  const storeId = req.params.storeId || req.body.storeId;

  if (req.user?.role === 'ADMIN') {
    return next();
  }

  if (req.user?.storeId !== storeId) {
    return res.status(403).json({
      error: req.t('auth.unauthorized')
    });
  }

  return next();
};
