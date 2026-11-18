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

// POST new comment under a task (requires ADMIN or MEMBER role)
commentRouter.post('/tasks/:taskId/comments', requireRole(['ADMIN', 'MEMBER']), (req: Request, res: Response, next: NextFunction) => {
  try {
    const taskId = String(req.params.taskId);
    const validated = CreateCommentSchema.parse(req.body);
    const userId = req.userId || 'user-admin-default';

    const comment = CommentService.createComment(taskId, userId, validated.content);
    res.status(201).json(comment);
  } catch (err) {
    next(err);
  }
});

// PUT update an existing comment
commentRouter.put('/comments/:id', requireRole(['ADMIN', 'MEMBER']), (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = String(req.params.id);
    const validated = UpdateCommentSchema.parse(req.body);
    const userId = req.userId || 'user-admin-default';

    const updated = CommentService.updateComment(id, userId, req.userRole, validated.content);
    res.json(updated);
  } catch (err) {
    next(err);
  }
});

// DELETE remove a comment
commentRouter.delete('/comments/:id', (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = String(req.params.id);
    const userId = req.userId || 'user-admin-default';

    CommentService.deleteComment(id, userId, req.userRole);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

