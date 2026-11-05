import { getDatabase } from '../db/database.js';
import { Project, CreateProjectSchema, UpdateProjectSchema } from '../types/index.js';
import { randomUUID } from 'crypto';

export class ProjectService {
  static getAll(): Project[] {
    const db = getDatabase();
    return db.prepare('SELECT * FROM projects ORDER BY createdAt DESC').all() as Project[];
  }

  static getById(id: string): Project | null {
    const db = getDatabase();
    const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(id) as Project | undefined;
    return project || null;
  }

  static create(input: unknown): Project {
    const validated = CreateProjectSchema.parse(input);
    const db = getDatabase();
    const now = new Date().toISOString();
    const id = `proj-${randomUUID().slice(0, 8)}`;

    const project: Project = {
      id,
      name: validated.name,
      description: validated.description,
      createdAt: now,
      updatedAt: now,
    };

    db.prepare(`
      INSERT INTO projects (id, name, description, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?)
    `).run(project.id, project.name, project.description, project.createdAt, project.updatedAt);

    return project;
  }

  static update(id: string, input: unknown): Project | null {
    const existing = this.getById(id);
    if (!existing) return null;

    const validated = UpdateProjectSchema.parse(input);
    const db = getDatabase();
    const now = new Date().toISOString();

    const updated: Project = {
      ...existing,
      name: validated.name ?? existing.name,
      description: validated.description ?? existing.description,
      updatedAt: now,
    };

    db.prepare(`
      UPDATE projects
      SET name = ?, description = ?, updatedAt = ?
      WHERE id = ?
    `).run(updated.name, updated.description, updated.updatedAt, id);

    return updated;
  }

  static delete(id: string): boolean {
    const db = getDatabase();
    const result = db.prepare('DELETE FROM projects WHERE id = ?').run(id);
    return result.changes > 0;
  }
}

