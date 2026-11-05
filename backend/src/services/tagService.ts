import { getDatabase } from '../db/database.js';
import { Tag, CreateTagSchema } from '../types/index.js';
import { randomUUID } from 'crypto';

export class TagService {
  static getAll(): Tag[] {
    const db = getDatabase();
    return db.prepare('SELECT * FROM tags ORDER BY name ASC').all() as Tag[];
  }

  static getById(id: string): Tag | null {
    const db = getDatabase();
    const tag = db.prepare('SELECT * FROM tags WHERE id = ?').get(id) as Tag | undefined;
    return tag || null;
  }

  static create(input: unknown): Tag {
    const validated = CreateTagSchema.parse(input);
    const db = getDatabase();

    // Check for duplicate tag name (case-insensitive)
    const existing = db.prepare('SELECT id FROM tags WHERE LOWER(name) = LOWER(?)').get(validated.name);
    if (existing) {
      const err = new Error(`Tag with name "${validated.name}" already exists`);
      (err as any).statusCode = 409;
      throw err;
    }

    const now = new Date().toISOString();
    const id = `tag-${randomUUID().slice(0, 8)}`;

    const tag: Tag = {
      id,
      name: validated.name,
      color: validated.color,
      createdAt: now,
    };

    db.prepare(`
      INSERT INTO tags (id, name, color, createdAt)
      VALUES (?, ?, ?, ?)
    `).run(tag.id, tag.name, tag.color, tag.createdAt);

    return tag;
  }

  static delete(id: string): boolean {
    const db = getDatabase();
    const result = db.prepare('DELETE FROM tags WHERE id = ?').run(id);
    return result.changes > 0;
  }

  static addTagToTask(taskId: string, tagId: string): Tag {
    const db = getDatabase();
    const task = db.prepare('SELECT id FROM tasks WHERE id = ?').get(taskId);
    if (!task) {
      throw new Error(`Task with ID ${taskId} not found`);
    }

    const tag = db.prepare('SELECT * FROM tags WHERE id = ?').get(tagId) as Tag | undefined;
    if (!tag) {
      throw new Error(`Tag with ID ${tagId} not found`);
    }

    db.prepare(`
      INSERT OR IGNORE INTO task_tags (taskId, tagId)
      VALUES (?, ?)
    `).run(taskId, tagId);

    return tag;
  }

  static removeTagFromTask(taskId: string, tagId: string): boolean {
    const db = getDatabase();
    const task = db.prepare('SELECT id FROM tasks WHERE id = ?').get(taskId);
    if (!task) {
      throw new Error(`Task with ID ${taskId} not found`);
    }

    const result = db.prepare('DELETE FROM task_tags WHERE taskId = ? AND tagId = ?').run(taskId, tagId);
    return result.changes > 0;
  }

  static getTagsForTask(taskId: string): Tag[] {
    const db = getDatabase();
    return db.prepare(`
      SELECT t.id, t.name, t.color, t.createdAt
      FROM tags t
      JOIN task_tags tt ON t.id = tt.tagId
      WHERE tt.taskId = ?
      ORDER BY t.name ASC
    `).all(taskId) as Tag[];
  }

  static getTagsForTasks(taskIds: string[]): Map<string, Tag[]> {
    const map = new Map<string, Tag[]>();
    if (taskIds.length === 0) return map;

    const db = getDatabase();
    const CHUNK_SIZE = 500;
    for (let i = 0; i < taskIds.length; i += CHUNK_SIZE) {
      const chunk = taskIds.slice(i, i + CHUNK_SIZE);
      const placeholders = chunk.map(() => '?').join(',');
      const rows = db.prepare(`
        SELECT tt.taskId, t.id, t.name, t.color, t.createdAt
        FROM task_tags tt
        JOIN tags t ON tt.tagId = t.id
        WHERE tt.taskId IN (${placeholders})
        ORDER BY t.name ASC
      `).all(...chunk) as (Tag & { taskId: string })[];

      for (const row of rows) {
        const { taskId, ...tag } = row;
        if (!map.has(taskId)) {
          map.set(taskId, []);
        }
        map.get(taskId)!.push(tag);
      }
    }

    return map;
  }
}

