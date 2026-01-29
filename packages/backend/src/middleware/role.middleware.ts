import type { Response, NextFunction } from 'express';
import type { UserRole } from '@prisma/client';
import type { AuthenticatedRequest } from './auth.middleware.js';

export function requireRole(...roles: UserRole[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    if (!roles.includes(req.user.role as UserRole)) {
      res.status(403).json({
        error: 'Access denied',
        message: `Required role: ${roles.join(' or ')}`,
      });
      return;
    }

    next();
  };
}

export function requireAdmin(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  return requireRole('SUPER_ADMIN')(req, res, next);
}

export function requireStationManager(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  return requireRole('SUPER_ADMIN', 'STATION_MANAGER')(req, res, next);
}

export function requireCitizen(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  return requireRole('CITIZEN')(req, res, next);
}
