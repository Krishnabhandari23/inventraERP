import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from './auth';

export const tenantIsolation = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  if (!req.tenantId && req.user) {
    req.tenantId = req.user.tenantId;
  }
  next();
};
