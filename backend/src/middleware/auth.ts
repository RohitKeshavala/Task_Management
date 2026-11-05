import { Request, Response, NextFunction } from 'express';
import { UserRole, VALID_USER_ROLES, ForbiddenError } from '../types/index.js';
import { verifyToken } from '../services/authService.js';

declare global {
  namespace Express {
    interface Request {
      userRole: UserRole;
      userId?: string;
    }
  }
}

/**
 * Middleware to extract, normalize, and validate authentication.
 * Checks Authorization: Bearer <token> first, then falls back to `x-user-role`.
 * Defaults to `MEMBER` when omitted or empty to maintain backward compatibility.
 * Rejects unsupported roles with HTTP 400 Bad Request.
 */
export function authMiddleware(req: Request, res: Response, next: NextFunction): void {
  // 1. Check Authorization Bearer token
  const authHeader = req.header('authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7).trim();
    const payload = verifyToken(token);
    if (payload) {
      req.userId = payload.sub;
      req.userRole = payload.role;
      next();
      return;
    }
  }

  // 2. Fall back to x-user-role header
  const rawRole = req.header('x-user-role');

  if (rawRole === undefined || rawRole === null || rawRole.trim() === '') {
    req.userRole = 'MEMBER';
    next();
    return;
  }

  const normalized = rawRole.trim().toUpperCase() as UserRole;

  if (!VALID_USER_ROLES.includes(normalized)) {
    res.status(400).json({
      error: 'Invalid role',
      message: `Invalid role: ${rawRole.trim()}. Allowed roles: ${VALID_USER_ROLES.join(', ')}`,
    });
    return;
  }

  req.userRole = normalized;
  next();
}

/**
 * Route guard helper requiring that the caller's role is within `allowedRoles`.
 * Dispatches a ForbiddenError (HTTP 403) when unauthorized.
 */
export function requireRole(allowedRoles: readonly UserRole[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (allowedRoles.includes(req.userRole)) {
      next();
      return;
    }

    next(
      new ForbiddenError(
        `Role ${req.userRole} is not authorized to perform this action`,
        req.userRole
      )
    );
  };
}

