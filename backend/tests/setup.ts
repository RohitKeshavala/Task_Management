import { beforeEach, afterAll } from 'vitest';
import { initDatabase, closeDatabase, getDatabase } from '../src/db/database.js';

export function setupTestDatabase() {
  beforeEach(() => {
    closeDatabase();
    const db = initDatabase(':memory:');
    
    // Seed initial project for test isolation
    const now = new Date().toISOString();
    db.prepare(`
      INSERT INTO projects (id, name, description, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?)
    `).run('test-proj-1', 'Test Project 1', 'Test Project Description', now, now);
  });

  afterAll(() => {
    closeDatabase();
  });
}

