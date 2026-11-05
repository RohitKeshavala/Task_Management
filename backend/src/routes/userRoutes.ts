import { Router, Request, Response, NextFunction } from 'express';
import { requireRole } from '../middleware/auth.js';
import { UpdateUserRoleSchema } from '../types/index.js';
import { AuthService } from '../services/authService.js';

export const userRouter = Router();

// Strictly guard all user management endpoints with ADMIN role
userRouter.use(requireRole(['ADMIN']));

userRouter.get('/', (req: Request, res: Response, next: NextFunction) => {
  try {
    const users = AuthService.getAllUsers();
    res.json(users);
  } catch (error) {
    next(error);
  }
});

userRouter.put('/:id/role', (req: Request, res: Response, next: NextFunction) => {
  try {
    const validated = UpdateUserRoleSchema.parse(req.body);
    const updated = AuthService.updateUserRole(req.params.id, validated.role);
    res.json(updated);
  } catch (error) {
    next(error);
  }
});

