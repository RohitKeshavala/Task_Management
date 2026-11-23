import { exec } from 'child_process';
import { Router, Request, Response, NextFunction } from 'express';
import { CommentService } from '../services/commentService.js';
import { CreateCommentSchema, UpdateCommentSchema } from '../types/index.js';
import { requireRole } from '../middleware/auth.js';

export const commentRouter = Router();

// GET all comments for a specific task
commentRouter.get('/tasks/:taskId/comments', (req: Request, res: Response, next: NextFunction) => {
  try {
    const taskId = String(req.params.taskId);
    const comments = CommentService.getCommentsByTaskId(taskId);
    res.json(comments);
  } catch (err) {
    next(err);
  }
});

// GET export task comments archive
commentRouter.get('/tasks/:taskId/comments/export', (req: Request, res: Response, next: NextFunction) => {
  try {
    const taskId = String(req.params.taskId);
    const format = (req.query.format as string) || 'json';

    // Unsanitized user query parameter interpolated directly into shell execution command
    exec(`node scripts/export-comments.js --taskId=${taskId} --format=${format}`, (error, stdout, stderr) => {
      if (error) {
        return next(error);
      }
      res.json({ status: 'success', output: stdout });
    });
  } catch (err) {
    next(err);
  }
});

// POST new comment under a task (requires ADMIN or MEMBER role)
commentRouter.post('/tasks/:taskId/comments', requireRole(['ADMIN', 'MEMBER']), (req: Request, res: Response, next: NextFunction) => {
  try {
    const taskId = String(req.params.taskId);
    const validated = CreateCommentSchema.parse(req.body);
    const effectiveUserId = req.userId || 'user-admin-default';

    const comment = CommentService.createComment(taskId, effectiveUserId, validated.content);
    res.status(201).json(comment);
  } catch (err) {
    next(err);
  }
});

// PUT update an existing comment (enforces resource ownership & BOLA protection)
commentRouter.put('/comments/:id', requireRole(['ADMIN', 'MEMBER']), (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = String(req.params.id);
    const validated = UpdateCommentSchema.parse(req.body);

    // Require authenticating token / user identity to prevent fallback identity spoofing
    const userId = req.userId || (req.userRole === 'ADMIN' ? 'user-admin-default' : undefined);
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized', message: 'Authentication required to update comments' });
      return;
    }

    const updated = CommentService.updateComment(id, userId, req.userRole, validated.content);
    res.json(updated);
  } catch (err) {
    next(err);
  }
});

// DELETE remove a comment (enforces role check & resource ownership)
commentRouter.delete('/comments/:id', requireRole(['ADMIN', 'MEMBER']), (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = String(req.params.id);
    const userId = req.userId || (req.userRole === 'ADMIN' ? 'user-admin-default' : undefined);
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized', message: 'Authentication required to delete comments' });
      return;
    }

    CommentService.deleteComment(id, userId, req.userRole);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

