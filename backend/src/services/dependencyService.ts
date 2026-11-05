import { getDatabase } from '../db/database.js';
import { Task, CircularDependencyError, StatusGuardError, TaskStatus } from '../types/index.js';
import { TagService } from './tagService.js';

export class DependencyService {
  /**
   * Get all tasks that taskId depends on (prerequisites).
   */
  static getDependencies(taskId: string): Task[] {
    const db = getDatabase();
    // Verify task exists
    const task = db.prepare('SELECT id FROM tasks WHERE id = ?').get(taskId);
    if (!task) {
      throw new Error(`Task with ID ${taskId} not found`);
    }

    const query = `
      SELECT t.* 
      FROM tasks t
      JOIN task_dependencies td ON t.id = td.dependsOnTaskId
      WHERE td.taskId = ?
      ORDER BY t.createdAt DESC
    `;
    const tasks = db.prepare(query).all(taskId) as Task[];

    if (tasks.length > 0) {
      const tagsByTaskId = TagService.getTagsForTasks(tasks.map(t => t.id));
      for (const item of tasks) {
        item.tags = tagsByTaskId.get(item.id) || [];
      }
    }

    return tasks;
  }

  /**
   * Get array of prerequisite task IDs for a single task.
   */
  static getDependsOnTaskIds(taskId: string): string[] {
    const db = getDatabase();
    const rows = db.prepare('SELECT dependsOnTaskId FROM task_dependencies WHERE taskId = ?').all(taskId) as Array<{ dependsOnTaskId: string }>;
    return rows.map(r => r.dependsOnTaskId);
  }

  /**
   * Efficiently batch load prerequisite IDs for multiple tasks.
   */
  static getBatchDependsOnTaskIds(taskIds: string[]): Map<string, string[]> {
    const result = new Map<string, string[]>();
    if (taskIds.length === 0) return result;

    for (const id of taskIds) {
      result.set(id, []);
    }

    const db = getDatabase();
    const placeholders = taskIds.map(() => '?').join(',');
    const rows = db.prepare(`
      SELECT taskId, dependsOnTaskId 
      FROM task_dependencies 
      WHERE taskId IN (${placeholders})
    `).all(...taskIds) as Array<{ taskId: string; dependsOnTaskId: string }>;

    for (const row of rows) {
      const list = result.get(row.taskId);
      if (list) {
        list.push(row.dependsOnTaskId);
      }
    }

    return result;
  }

  /**
   * Return all unfinished prerequisite tasks (blockers) for a given task.
   * An unfinished prerequisite is any dependency where status != 'DONE'.
   */
  static getBlockers(taskId: string): Task[] {
    const db = getDatabase();
    // Verify task exists
    const task = db.prepare('SELECT id FROM tasks WHERE id = ?').get(taskId);
    if (!task) {
      throw new Error(`Task with ID ${taskId} not found`);
    }

    const query = `
      SELECT t.* 
      FROM tasks t
      JOIN task_dependencies td ON t.id = td.dependsOnTaskId
      WHERE td.taskId = ? AND t.status != 'DONE'
      ORDER BY t.createdAt DESC
    `;
    const blockers = db.prepare(query).all(taskId) as Task[];

    if (blockers.length > 0) {
      const tagsByTaskId = TagService.getTagsForTasks(blockers.map(t => t.id));
      for (const b of blockers) {
        b.tags = tagsByTaskId.get(b.id) || [];
      }
    }

    return blockers;
  }

  /**
   * Add a dependency: taskId depends on dependsOnTaskId.
   * Enforces:
   * 1. Existence of both tasks.
   * 2. Cycle prevention: Detects direct and indirect cycles (e.g. A->B->C->A).
   * 3. Status Guard: If taskId is currently IN_PROGRESS or DONE, prerequisite must be DONE.
   */
  static addDependency(taskId: string, dependsOnTaskId: string): { taskId: string; dependsOnTaskId: string } {
    const db = getDatabase();

    // 1. Verify existence of both tasks
    const task = db.prepare('SELECT id, status FROM tasks WHERE id = ?').get(taskId) as { id: string; status: TaskStatus } | undefined;
    if (!task) {
      throw new Error(`Task with ID ${taskId} not found`);
    }

    const prereq = db.prepare('SELECT id, status FROM tasks WHERE id = ?').get(dependsOnTaskId) as { id: string; status: TaskStatus } | undefined;
    if (!prereq) {
      throw new Error(`Task with ID ${dependsOnTaskId} not found`);
    }

    // 2. Direct cycle check (self-dependency)
    if (taskId === dependsOnTaskId) {
      throw new CircularDependencyError([taskId, taskId]);
    }

    // 3. Indirect cycle prevention: check if dependsOnTaskId reaches taskId
    const cyclePath = this.findPath(dependsOnTaskId, taskId);
    if (cyclePath) {
      // Full cycle loop: taskId -> dependsOnTaskId -> ... -> taskId
      throw new CircularDependencyError([taskId, ...cyclePath]);
    }

    // 4. Status Guard: Cannot add an unfinished dependency to a task that is already IN_PROGRESS or DONE
    if (task.status !== 'TODO' && prereq.status !== 'DONE') {
      const fullPrereq = db.prepare('SELECT * FROM tasks WHERE id = ?').get(dependsOnTaskId) as Task;
      throw new StatusGuardError(task.status, [fullPrereq]);
    }

    // 5. Insert dependency (idempotent)
    db.prepare(`
      INSERT OR IGNORE INTO task_dependencies (taskId, dependsOnTaskId)
      VALUES (?, ?)
    `).run(taskId, dependsOnTaskId);

    return { taskId, dependsOnTaskId };
  }

  /**
   * Remove a dependency.
   */
  static removeDependency(taskId: string, dependsOnTaskId: string): boolean {
    const db = getDatabase();
    const result = db.prepare(`
      DELETE FROM task_dependencies 
      WHERE taskId = ? AND dependsOnTaskId = ?
    `).run(taskId, dependsOnTaskId);

    return result.changes > 0;
  }

  /**
   * Validates if a task can transition to a target status.
   * If target status is IN_PROGRESS or DONE, all prerequisites must be in DONE status.
   */
  static validateStatusTransition(taskId: string, targetStatus: TaskStatus): void {
    if (targetStatus === 'TODO') {
      return;
    }

    const blockers = this.getBlockers(taskId);
    if (blockers.length > 0) {
      throw new StatusGuardError(targetStatus, blockers);
    }
  }

  /**
   * Breadth-First Search (BFS) to find path from startTaskId to targetTaskId.
   * Returns string[] of task IDs if path exists, or null otherwise.
   */
  private static findPath(startTaskId: string, targetTaskId: string): string[] | null {
    if (startTaskId === targetTaskId) {
      return [startTaskId];
    }

    const db = getDatabase();
    const stmt = db.prepare('SELECT dependsOnTaskId FROM task_dependencies WHERE taskId = ?');

    const queue: Array<{ current: string; path: string[] }> = [
      { current: startTaskId, path: [startTaskId] }
    ];
    const visited = new Set<string>([startTaskId]);

    while (queue.length > 0) {
      const { current, path } = queue.shift()!;
      const rows = stmt.all(current) as Array<{ dependsOnTaskId: string }>;

      for (const row of rows) {
        const nextId = row.dependsOnTaskId;
        if (nextId === targetTaskId) {
          return [...path, nextId];
        }
        if (!visited.has(nextId)) {
          visited.add(nextId);
          queue.push({ current: nextId, path: [...path, nextId] });
        }
      }
    }

    return null;
  }
}

