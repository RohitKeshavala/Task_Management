import { getDatabase } from '../db/database.js';
import { Task, CreateTaskSchema, UpdateTaskSchema, AppError } from '../types/index.js';
import { ProjectService } from './projectService.js';
import { TagService } from './tagService.js';
import { DependencyService } from './dependencyService.js';
import { randomUUID } from 'crypto';

export class TaskService {
  static getAll(filters?: { projectId?: string; status?: string; priority?: string; tagId?: string }): Task[] {
    const db = getDatabase();
    let query = 'SELECT * FROM tasks WHERE 1=1';
    const params: unknown[] = [];

    if (filters?.projectId) {
      query += ' AND projectId = ?';
      params.push(filters.projectId);
    }
    if (filters?.status) {
      query += ' AND status = ?';
      params.push(filters.status);
    }
    if (filters?.priority) {
      query += ' AND priority = ?';
      params.push(filters.priority);
    }
    if (filters?.tagId) {
      const trimmed = filters.tagId.trim();
      query += ` AND id IN (
        SELECT tt.taskId 
        FROM task_tags tt 
        JOIN tags t ON tt.tagId = t.id 
        WHERE tt.tagId = ? OR LOWER(t.name) = LOWER(?)
      )`;
      params.push(trimmed, trimmed);
    }

    query += ' ORDER BY createdAt DESC';
    const tasks = db.prepare(query).all(...params) as Task[];

    if (tasks.length > 0) {
      const taskIds = tasks.map(t => t.id);
      const tagsByTaskId = TagService.getTagsForTasks(taskIds);
      const dependsOnMap = DependencyService.getBatchDependsOnTaskIds(taskIds);

      for (const task of tasks) {
        task.tags = tagsByTaskId.get(task.id) || [];
        task.dependsOnTaskIds = dependsOnMap.get(task.id) || [];
      }
    }

    return tasks;
  }

  static getById(id: string): Task | null {
    const db = getDatabase();
    const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(id) as Task | undefined;
    if (!task) return null;

    task.tags = TagService.getTagsForTask(id);
    task.dependsOnTaskIds = DependencyService.getDependsOnTaskIds(id);
    return task;
  }

  static create(input: unknown): Task {
    const validated = CreateTaskSchema.parse(input);
    const project = ProjectService.getById(validated.projectId);
    if (!project) {
      throw new Error(`Project with ID ${validated.projectId} not found`);
    }

    const db = getDatabase();

    // Pre-validate that all tagIds exist
    if (validated.tagIds && validated.tagIds.length > 0) {
      for (const tagId of validated.tagIds) {
        const tag = db.prepare('SELECT id FROM tags WHERE id = ?').get(tagId);
        if (!tag) {
          throw new Error(`Tag with ID ${tagId} not found`);
        }
      }
    }

    // Pre-validate that all dependsOnTaskIds exist
    if (validated.dependsOnTaskIds && validated.dependsOnTaskIds.length > 0) {
      for (const depId of validated.dependsOnTaskIds) {
        const depTask = db.prepare('SELECT id, status FROM tasks WHERE id = ?').get(depId) as Task | undefined;
        if (!depTask) {
          throw new Error(`Task with ID ${depId} not found`);
        }
        if (validated.status !== 'TODO' && depTask.status !== 'DONE') {
          throw new Error(`Cannot create task with status ${validated.status}: prerequisite task ${depId} is not DONE`);
        }
      }
    }

    // Validate dueDate: cannot be strictly before today for new tasks
    if (validated.dueDate) {
      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
      let dueDateTime: number;
      if (/^\d{4}-\d{2}-\d{2}$/.test(validated.dueDate.trim())) {
        const [y, m, d] = validated.dueDate.trim().split('-').map(Number);
        dueDateTime = new Date(y, m - 1, d).getTime();
      } else {
        const parsed = new Date(validated.dueDate);
        if (!isNaN(parsed.getTime())) {
          dueDateTime = new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate()).getTime();
        } else {
          dueDateTime = NaN;
        }
      }

      if (!isNaN(dueDateTime) && dueDateTime < todayStart) {
        throw new AppError('Due date cannot be in the past for a new task', 400);
      }
    }

    const now = new Date().toISOString();
    const id = `task-${randomUUID().slice(0, 8)}`;

    const task: Task = {
      id,
      projectId: validated.projectId,
      title: validated.title,
      description: validated.description,
      priority: validated.priority,
      status: validated.status,
      dueDate: validated.dueDate ?? null,
      createdAt: now,
      updatedAt: now,
      dependsOnTaskIds: validated.dependsOnTaskIds || [],
    };

    const createTx = db.transaction(() => {
      db.prepare(`
        INSERT INTO tasks (id, projectId, title, description, priority, status, dueDate, createdAt, updatedAt)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        task.id,
        task.projectId,
        task.title,
        task.description,
        task.priority,
        task.status,
        task.dueDate,
        task.createdAt,
        task.updatedAt
      );

      if (validated.tagIds && validated.tagIds.length > 0) {
        const insertTaskTag = db.prepare(`
          INSERT OR IGNORE INTO task_tags (taskId, tagId)
          VALUES (?, ?)
        `);
        for (const tagId of validated.tagIds) {
          insertTaskTag.run(task.id, tagId);
        }
      }

      if (validated.dependsOnTaskIds && validated.dependsOnTaskIds.length > 0) {
        const insertDep = db.prepare(`
          INSERT OR IGNORE INTO task_dependencies (taskId, dependsOnTaskId)
          VALUES (?, ?)
        `);
        for (const depId of validated.dependsOnTaskIds) {
          insertDep.run(task.id, depId);
        }
      }
    });

    createTx();

    task.tags = TagService.getTagsForTask(task.id);
    task.dependsOnTaskIds = DependencyService.getDependsOnTaskIds(task.id);
    return task;
  }

  static update(id: string, input: unknown): Task | null {
    const existing = this.getById(id);
    if (!existing) return null;

    const validated = UpdateTaskSchema.parse(input);

    // Status Guard: Check if status is transitioning to IN_PROGRESS or DONE
    if (validated.status && validated.status !== existing.status) {
      DependencyService.validateStatusTransition(id, validated.status);
    }

    const db = getDatabase();
    const now = new Date().toISOString();

    const updated: Task = {
      ...existing,
      title: validated.title ?? existing.title,
      description: validated.description ?? existing.description,
      priority: validated.priority ?? existing.priority,
      status: validated.status ?? existing.status,
      dueDate: validated.dueDate !== undefined ? validated.dueDate : existing.dueDate,
      updatedAt: now,
      tags: existing.tags || [],
      dependsOnTaskIds: existing.dependsOnTaskIds || [],
    };

    const updateTx = db.transaction(() => {
      db.prepare(`
        UPDATE tasks
        SET title = ?, description = ?, priority = ?, status = ?, dueDate = ?, updatedAt = ?
        WHERE id = ?
      `).run(
        updated.title,
        updated.description,
        updated.priority,
        updated.status,
        updated.dueDate,
        updated.updatedAt,
        id
      );

      if (validated.tagIds !== undefined) {
        for (const tagId of validated.tagIds) {
          const tag = db.prepare('SELECT id FROM tags WHERE id = ?').get(tagId);
          if (!tag) {
            throw new Error(`Tag with ID ${tagId} not found`);
          }
        }
        db.prepare('DELETE FROM task_tags WHERE taskId = ?').run(id);
        const insertTag = db.prepare('INSERT OR IGNORE INTO task_tags (taskId, tagId) VALUES (?, ?)');
        for (const tagId of validated.tagIds) {
          insertTag.run(id, tagId);
        }
      }

      if (validated.dependsOnTaskIds !== undefined) {
        // Validate dependencies
        db.prepare('DELETE FROM task_dependencies WHERE taskId = ?').run(id);
        for (const depId of validated.dependsOnTaskIds) {
          DependencyService.addDependency(id, depId);
        }
      }
    });

    updateTx();

    updated.tags = TagService.getTagsForTask(id);
    updated.dependsOnTaskIds = DependencyService.getDependsOnTaskIds(id);

    return updated;
  }

  static delete(id: string): boolean {
    const db = getDatabase();
    const result = db.prepare('DELETE FROM tasks WHERE id = ?').run(id);
    return result.changes > 0;
  }
}
