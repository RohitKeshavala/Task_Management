import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';

export function errorHandler(
  err: unknown,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  if (err instanceof ZodError) {
    res.status(400).json({
      error: 'Validation Error',
      details: err.errors.map(e => ({
        path: e.path.join('.'),
        message: e.message,
      })),
    });
    return;
  }

  if (err instanceof Error) {
    const customStatus = (err as any).statusCode || (err as any).status;
    if (typeof customStatus === 'number') {
      const extra = (err as any).extra || {};
      const cyclePath = (err as any).cyclePath;
      const blockingTasks = (err as any).blockingTasks;
      res.status(customStatus).json({
        error: extra.error || err.message,
        message: err.message,
        ...(cyclePath ? { cyclePath } : {}),
        ...(blockingTasks ? { blockingTasks } : {}),
        ...extra,
      });
      return;
    }

    if (err.message.includes('UNIQUE constraint failed')) {
      res.status(409).json({ error: 'Conflict: resource already exists', message: err.message });
      return;
    }

    if (err.message.includes('not found')) {
      res.status(404).json({ error: err.message });
      return;
    }

    res.status(500).json({
      error: 'Internal Server Error',
      message: err.message,
    });
    return;
  }

  res.status(500).json({ error: 'Unknown server error' });
}
