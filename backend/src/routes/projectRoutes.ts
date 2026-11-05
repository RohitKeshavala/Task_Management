import { Router, Request, Response, NextFunction } from 'express';
import { ProjectService } from '../services/projectService.js';

export const projectRouter = Router();

// GET all projects
projectRouter.get('/', (req: Request, res: Response, next: NextFunction) => {
  try {
    const projects = ProjectService.getAll();
    res.json(projects);
  } catch (err) {
    next(err);
  }
});

// GET single project by ID
projectRouter.get('/:id', (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = String(req.params.id);
    const project = ProjectService.getById(id);
    if (!project) {
      res.status(404).json({ error: `Project with ID ${id} not found` });
      return;
    }
    res.json(project);
  } catch (err) {
    next(err);
  }
});

// POST create project
projectRouter.post('/', (req: Request, res: Response, next: NextFunction) => {
  try {
    const created = ProjectService.create(req.body);
    res.status(201).json(created);
  } catch (err) {
    next(err);
  }
});

// PUT update project
projectRouter.put('/:id', (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = String(req.params.id);
    const updated = ProjectService.update(id, req.body);
    if (!updated) {
      res.status(404).json({ error: `Project with ID ${id} not found` });
      return;
    }
    res.json(updated);
  } catch (err) {
    next(err);
  }
});

// DELETE project
projectRouter.delete('/:id', (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = String(req.params.id);
    const deleted = ProjectService.delete(id);
    if (!deleted) {
      res.status(404).json({ error: `Project with ID ${id} not found` });
      return;
    }
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});
