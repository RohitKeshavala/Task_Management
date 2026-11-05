import { Router, Request, Response, NextFunction } from 'express';
import { TagService } from '../services/tagService.js';
import { requireRole } from '../middleware/auth.js';

export const tagRouter = Router();

// GET all tags
tagRouter.get('/', (req: Request, res: Response, next: NextFunction) => {
  try {
    const tags = TagService.getAll();
    res.json(tags);
  } catch (err) {
    next(err);
  }
});

// GET single tag by ID
tagRouter.get('/:id', (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = String(req.params.id);
    const tag = TagService.getById(id);
    if (!tag) {
      res.status(404).json({ error: `Tag with ID ${id} not found` });
      return;
    }
    res.json(tag);
  } catch (err) {
    next(err);
  }
});

// POST create tag
tagRouter.post('/', requireRole(['ADMIN', 'MEMBER']), (req: Request, res: Response, next: NextFunction) => {
  try {
    const created = TagService.create(req.body);
    res.status(201).json(created);
  } catch (err) {
    next(err);
  }
});

// DELETE tag
tagRouter.delete('/:id', requireRole(['ADMIN', 'MEMBER']), (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = String(req.params.id);
    const deleted = TagService.delete(id);
    if (!deleted) {
      res.status(404).json({ error: `Tag with ID ${id} not found` });
      return;
    }
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

