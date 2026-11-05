import { Router, Request, Response, NextFunction } from 'express';
import { RegisterSchema, LoginSchema, AppError } from '../types/index.js';
import { AuthService } from '../services/authService.js';

export const authRouter = Router();

authRouter.post('/register', (req: Request, res: Response, next: NextFunction) => {
  try {
    const validated = RegisterSchema.parse(req.body);
    const result = AuthService.register(validated);
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
});

authRouter.post('/login', (req: Request, res: Response, next: NextFunction) => {
  try {
    const validated = LoginSchema.parse(req.body);
    const result = AuthService.login(validated);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

authRouter.get('/me', (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.userId) {
      throw new AppError('Authentication token required', 401);
    }
    const user = AuthService.getUserById(req.userId);
    if (!user) {
      throw new AppError('User not found', 404);
    }
    res.json(user);
  } catch (error) {
    next(error);
  }
});
