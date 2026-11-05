import { Router, Request, Response, NextFunction } from 'express';
import { TaskService } from '../services/taskService.js';
import { TagService } from '../services/tagService.js';
import { DependencyService } from '../services/dependencyService.js';
import { AssociateTagSchema, AddDependencySchema } from '../types/index.js';
import { requireRole } from '../middleware/auth.js';

export const taskRouter = Router();

// GET all tasks (optional filter by projectId, status, priority, tagId/tag)
taskRouter.get('/', (req: Request, res: Response, next: NextFunction) => {
  try {
    const { projectId, status, priority, tagId, tag } = req.query;
    const rawTag = typeof tagId === 'string' ? tagId : typeof tag === 'string' ? tag : undefined;
    const resolvedTagId = rawTag && rawTag.trim() ? rawTag.trim() : undefined;

    const tasks = TaskService.getAll({
      projectId: typeof projectId === 'string' ? projectId : undefined,
      status: typeof status === 'string' ? status : undefined,
      priority: typeof priority === 'string' ? priority : undefined,
      tagId: resolvedTagId,
    });
    res.json(tasks);
  } catch (err) {
    next(err);
  }
});

// GET single task by ID
taskRouter.get('/:id', (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = String(req.params.id);
    const task = TaskService.getById(id);
    if (!task) {
      res.status(404).json({ error: `Task with ID ${id} not found` });
      return;
    }
    res.json(task);
  } catch (err) {
    next(err);
  }
});

// POST create task
taskRouter.post('/', requireRole(['ADMIN', 'MEMBER']), (req: Request, res: Response, next: NextFunction) => {
  try {
    const created = TaskService.create(req.body);
    res.status(201).json(created);
  } catch (err) {
    next(err);
  }
});

// PUT update task
taskRouter.put('/:id', requireRole(['ADMIN', 'MEMBER']), (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = String(req.params.id);
    const updated = TaskService.update(id, req.body);
    if (!updated) {
      res.status(404).json({ error: `Task with ID ${id} not found` });
      return;
    }
    res.json(updated);
  } catch (err) {
    next(err);
  }
});

// DELETE task
taskRouter.delete('/:id', requireRole(['ADMIN', 'MEMBER']), (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = String(req.params.id);
    const deleted = TaskService.delete(id);
    if (!deleted) {
      res.status(404).json({ error: `Task with ID ${id} not found` });
      return;
    }
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

// GET tags for a task
taskRouter.get('/:id/tags', (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = String(req.params.id);
    const task = TaskService.getById(id);
    if (!task) {
      res.status(404).json({ error: `Task with ID ${id} not found` });
      return;
    }
    res.json(task.tags || []);
  } catch (err) {
    next(err);
  }
});

// POST associate tag with task
taskRouter.post('/:id/tags', requireRole(['ADMIN', 'MEMBER']), (req: Request, res: Response, next: NextFunction) => {
  try {
    const taskId = String(req.params.id);
    const validated = AssociateTagSchema.parse(req.body);
    const tagId = (validated.tagId || validated.id)!;

    const tag = TagService.addTagToTask(taskId, tagId);
    res.status(201).json({
      taskId,
      tagId: tag.id,
      id: tag.id,
      name: tag.name,
      color: tag.color,
      createdAt: tag.createdAt,
    });
  } catch (err) {
    next(err);
  }
});

// DELETE remove tag from task
taskRouter.delete('/:id/tags/:tagId', requireRole(['ADMIN', 'MEMBER']), (req: Request, res: Response, next: NextFunction) => {
  try {
    const taskId = String(req.params.id);
    const tagId = String(req.params.tagId);
    const deleted = TagService.removeTagFromTask(taskId, tagId);
    if (!deleted) {
      res.status(404).json({ error: `Tag association for task ${taskId} and tag ${tagId} not found` });
      return;
    }
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

// GET all dependencies (prerequisite tasks) for a task
taskRouter.get('/:id/dependencies', (req: Request, res: Response, next: NextFunction) => {
  try {
    const taskId = String(req.params.id);
    const dependencies = DependencyService.getDependencies(taskId);
    res.json(dependencies);
  } catch (err) {
    next(err);
  }
});

// POST add dependency: task :id depends on dependsOnTaskId
taskRouter.post('/:id/dependencies', requireRole(['ADMIN', 'MEMBER']), (req: Request, res: Response, next: NextFunction) => {
  try {
    const taskId = String(req.params.id);
    const validated = AddDependencySchema.parse(req.body);
    const dependsOnTaskId = (validated.dependsOnTaskId || validated.id)!;

    const result = DependencyService.addDependency(taskId, dependsOnTaskId);
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
});

// DELETE remove dependency: task :id no longer depends on dependsOnTaskId
taskRouter.delete('/:id/dependencies/:dependsOnTaskId', requireRole(['ADMIN', 'MEMBER']), (req: Request, res: Response, next: NextFunction) => {
  try {
    const taskId = String(req.params.id);
    const dependsOnTaskId = String(req.params.dependsOnTaskId);
    const deleted = DependencyService.removeDependency(taskId, dependsOnTaskId);
    if (!deleted) {
      res.status(404).json({ error: `Dependency between task ${taskId} and ${dependsOnTaskId} not found` });
      return;
    }
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

// GET all unfinished prerequisite tasks (blockers)
// Returns 200 with Task[] where status != 'DONE'
taskRouter.get('/:id/blockers', (req: Request, res: Response, next: NextFunction) => {
  try {
    const taskId = String(req.params.id);
    const blockers = DependencyService.getBlockers(taskId);
    res.json(blockers);
  } catch (err) {
    next(err);
  }
});
