import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';

let dbInstance: Database.Database | null = null;

export function initDatabase(dbPath?: string): Database.Database {
  if (dbInstance) {
    return dbInstance;
  }

  const filePath = dbPath || process.env.DATABASE_URL || path.resolve(process.cwd(), 'taskflow.db');
  
  // Ensure directory exists if not :memory:
  if (filePath !== ':memory:') {
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  const db = new Database(filePath);
  db.pragma('foreign_keys = ON');

  // Create tables
  db.exec(`
    CREATE TABLE IF NOT EXISTS projects (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS tasks (
      id TEXT PRIMARY KEY,
      projectId TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      priority TEXT NOT NULL CHECK(priority IN ('LOW', 'MEDIUM', 'HIGH')),
      status TEXT NOT NULL CHECK(status IN ('TODO', 'IN_PROGRESS', 'DONE')),
      dueDate TEXT,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL,
      FOREIGN KEY (projectId) REFERENCES projects(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS tags (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL UNIQUE COLLATE NOCASE,
      color TEXT NOT NULL,
      createdAt TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS task_tags (
      taskId TEXT NOT NULL,
      tagId TEXT NOT NULL,
      PRIMARY KEY (taskId, tagId),
      FOREIGN KEY (taskId) REFERENCES tasks(id) ON DELETE CASCADE,
      FOREIGN KEY (tagId) REFERENCES tags(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS task_dependencies (
      taskId TEXT NOT NULL,
      dependsOnTaskId TEXT NOT NULL,
      PRIMARY KEY (taskId, dependsOnTaskId),
      FOREIGN KEY (taskId) REFERENCES tasks(id) ON DELETE CASCADE,
      FOREIGN KEY (dependsOnTaskId) REFERENCES tasks(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT NOT NULL UNIQUE COLLATE NOCASE,
      email TEXT NOT NULL UNIQUE COLLATE NOCASE,
      passwordHash TEXT NOT NULL,
      salt TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('ADMIN', 'MEMBER', 'VIEWER')) DEFAULT 'MEMBER',
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS task_comments (
      id TEXT PRIMARY KEY,
      taskId TEXT NOT NULL,
      userId TEXT NOT NULL,
      content TEXT NOT NULL,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL,
      FOREIGN KEY (taskId) REFERENCES tasks(id) ON DELETE CASCADE,
      FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE UNIQUE INDEX IF NOT EXISTS idx_tags_name_unique ON tags(name COLLATE NOCASE);
    CREATE UNIQUE INDEX IF NOT EXISTS idx_users_username_unique ON users(username COLLATE NOCASE);
    CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email_unique ON users(email COLLATE NOCASE);
    CREATE INDEX IF NOT EXISTS idx_task_tags_taskId ON task_tags(taskId);
    CREATE INDEX IF NOT EXISTS idx_task_tags_tagId ON task_tags(tagId);
    CREATE INDEX IF NOT EXISTS idx_task_dependencies_taskId ON task_dependencies(taskId);
    CREATE INDEX IF NOT EXISTS idx_task_dependencies_dependsOnTaskId ON task_dependencies(dependsOnTaskId);
    CREATE INDEX IF NOT EXISTS idx_task_comments_taskId ON task_comments(taskId);
    CREATE INDEX IF NOT EXISTS idx_task_comments_userId ON task_comments(userId);
  `);

  // Seed sample data if empty
  const projectCount = db.prepare('SELECT COUNT(*) as count FROM projects').get() as { count: number };
  if (projectCount.count === 0 && filePath !== ':memory:') {
    seedInitialData(db);
  }

  // Seed default admin user if not exists
  const adminUser = db.prepare('SELECT id FROM users WHERE email = ? COLLATE NOCASE').get('admin@taskflow.dev');
  if (!adminUser) {
    const salt = 'taskflow_seed_admin_salt_2026';
    const hash = crypto.scryptSync('Admin123!', salt, 64).toString('hex');
    const now = new Date().toISOString();
    db.prepare(`
      INSERT INTO users (id, username, email, passwordHash, salt, role, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run('user-admin-default', 'admin', 'admin@taskflow.dev', hash, salt, 'ADMIN', now, now);
  }

  // Seed default sample comments if comments table is empty
  const commentCount = db.prepare('SELECT COUNT(*) as count FROM task_comments').get() as { count: number };
  if (commentCount.count === 0 && filePath !== ':memory:') {
    const demoTask = db.prepare('SELECT id FROM tasks WHERE id = ?').get('task-demo-1');
    if (demoTask) {
      const now = new Date().toISOString();
      db.prepare(`
        INSERT INTO task_comments (id, taskId, userId, content, createdAt, updatedAt)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run('comment-demo-1', 'task-demo-1', 'user-admin-default', 'Reviewing requirements and automated test pipelines.', now, now);
    }
  }

  dbInstance = db;
  return dbInstance;
}

export function getDatabase(): Database.Database {
  if (!dbInstance) {
    return initDatabase();
  }
  return dbInstance;
}

export function closeDatabase(): void {
  if (dbInstance) {
    dbInstance.close();
    dbInstance = null;
  }
}

function seedInitialData(db: Database.Database): void {
  const insertProject = db.prepare(`
    INSERT INTO projects (id, name, description, createdAt, updatedAt)
    VALUES (?, ?, ?, ?, ?)
  `);

  const insertTask = db.prepare(`
    INSERT INTO tasks (id, projectId, title, description, priority, status, dueDate, createdAt, updatedAt)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const now = new Date().toISOString();
  
  const sampleProjectId = 'proj-demo-1';
  insertProject.run(
    sampleProjectId,
    'TaskFlow Core Launch',
    'Demonstration project for Antigravity /boost mastery and testing.',
    now,
    now
  );

  insertTask.run(
    'task-demo-1',
    sampleProjectId,
    'Explore /boost Action Capabilities',
    'Read BOOST_GUIDE.md and run mission 1 using /boost command.',
    'HIGH',
    'IN_PROGRESS',
    new Date(Date.now() + 86400000).toISOString(),
    now,
    now
  );

  insertTask.run(
    'task-demo-2',
    sampleProjectId,
    'Implement Tags & Labels Mission',
    'Run /boost prompt to add tags migration, endpoints, and UI filtering.',
    'MEDIUM',
    'TODO',
    new Date(Date.now() + 172800000).toISOString(),
    now,
    now
  );

  insertTask.run(
    'task-demo-3',
    sampleProjectId,
    'Setup Node.js & Angular Baseline',
    'Initial project setup with full CRUD and Vitest integration tests.',
    'HIGH',
    'DONE',
    now,
    now,
    now
  );

  const insertTag = db.prepare(`
    INSERT INTO tags (id, name, color, createdAt)
    VALUES (?, ?, ?, ?)
  `);

  const insertTaskTag = db.prepare(`
    INSERT INTO task_tags (taskId, tagId)
    VALUES (?, ?)
  `);

  insertTag.run('tag-demo-1', 'Feature', '#3b82f6', now);
  insertTag.run('tag-demo-2', 'Urgent', '#ef4444', now);
  insertTag.run('tag-demo-3', 'Documentation', '#10b981', now);

  insertTaskTag.run('task-demo-1', 'tag-demo-1');
  insertTaskTag.run('task-demo-1', 'tag-demo-3');
  insertTaskTag.run('task-demo-2', 'tag-demo-1');
  insertTaskTag.run('task-demo-2', 'tag-demo-2');
  insertTaskTag.run('task-demo-3', 'tag-demo-3');
}

