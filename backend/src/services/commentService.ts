import { getDatabase } from '../db/database.js';
import { TaskComment, UserRole, NotFoundError, ForbiddenError, AppError } from '../types/index.js';
import { randomUUID } from 'crypto';

export class CommentService {
  /**
   * Retrieves all comments for a given task, ordered by creation date.
   */
  static getCommentsByTaskId(taskId: string): TaskComment[] {
    const db = getDatabase();

    // Verify task exists
    const task = db.prepare('SELECT id FROM tasks WHERE id = ?').get(taskId);
    if (!task) {
      throw new NotFoundError(`Task with ID ${taskId} not found`);
    }

    const rows = db.prepare(`
      SELECT 
        c.id,
        c.taskId,
        c.userId,
        c.content,
        c.createdAt,
        c.updatedAt,
        u.username AS authorUsername,
        u.email AS authorEmail,
        u.role AS authorRole
      FROM task_comments c
      LEFT JOIN users u ON c.userId = u.id
      WHERE c.taskId = ?
      ORDER BY c.createdAt ASC
    `).all(taskId) as Array<{
      id: string;
      taskId: string;
      userId: string;
      content: string;
      createdAt: string;
      updatedAt: string;
      authorUsername: string | null;
      authorEmail: string | null;
      authorRole: UserRole | null;
    }>;

    return rows.map((row) => ({
      id: row.id,
      taskId: row.taskId,
      userId: row.userId,
      content: row.content,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      author: row.authorUsername
        ? {
            id: row.userId,
            username: row.authorUsername,
            email: row.authorEmail || '',
            role: row.authorRole || 'MEMBER',
          }
        : undefined,
    }));
  }

  /**
   * Creates a new comment under a task.
   */
  static createComment(taskId: string, userId: string, content: string): TaskComment {
    const db = getDatabase();

    const task = db.prepare('SELECT id FROM tasks WHERE id = ?').get(taskId);
    if (!task) {
      throw new NotFoundError(`Task with ID ${taskId} not found`);
    }

    const user = db.prepare('SELECT id, username, email, role FROM users WHERE id = ?').get(userId) as {
      id: string;
      username: string;
      email: string;
      role: UserRole;
    } | undefined;

    if (!user) {
      throw new NotFoundError(`User with ID ${userId} not found`);
    }

    const id = randomUUID();
    const now = new Date().toISOString();

    db.prepare(`
      INSERT INTO task_comments (id, taskId, userId, content, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(id, taskId, userId, content, now, now);

    return {
      id,
      taskId,
      userId,
      content,
      createdAt: now,
      updatedAt: now,
      author: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
      },
    };
  }

  /**
   * Updates an existing comment.
   */
  static updateComment(commentId: string, userId: string, userRole: UserRole, content: string): TaskComment {
    const db = getDatabase();

    const comment = db.prepare('SELECT * FROM task_comments WHERE id = ?').get(commentId) as {
      id: string;
      taskId: string;
      userId: string;
      content: string;
      createdAt: string;
      updatedAt: string;
    } | undefined;

    if (!comment) {
      throw new NotFoundError(`Comment with ID ${commentId} not found`);
    }

    // Role check: Only the author or an ADMIN can edit the comment
    if (comment.userId !== userId && userRole !== 'ADMIN') {
      throw new ForbiddenError('You are not authorized to edit this comment', userRole);
    }

    const now = new Date().toISOString();
    db.prepare('UPDATE task_comments SET content = ?, updatedAt = ? WHERE id = ?').run(content, now, commentId);

    const user = db.prepare('SELECT id, username, email, role FROM users WHERE id = ?').get(comment.userId) as {
      id: string;
      username: string;
      email: string;
      role: UserRole;
    } | undefined;

    return {
      id: comment.id,
      taskId: comment.taskId,
      userId: comment.userId,
      content,
      createdAt: comment.createdAt,
      updatedAt: now,
      author: user
        ? {
            id: user.id,
            username: user.username,
            email: user.email,
            role: user.role,
          }
        : undefined,
    };
  }

  /**
   * Deletes a comment.
   */
  static deleteComment(commentId: string, userId: string, userRole: UserRole): boolean {
    const db = getDatabase();

    const comment = db.prepare('SELECT * FROM task_comments WHERE id = ?').get(commentId) as {
      id: string;
      taskId: string;
      userId: string;
    } | undefined;

    if (!comment) {
      throw new NotFoundError(`Comment with ID ${commentId} not found`);
    }

    // INTENTIONAL SECURITY BUG #1 (Broken Object Level Authorization / Missing author verification):
    // Checks if the role is VIEWER, but fails to check whether comment.userId === userId for MEMBER roles!
    // Any MEMBER can delete anyone else's comments.
    if (userRole === 'VIEWER') {
      throw new ForbiddenError('VIEWER role cannot delete comments', userRole);
    }

    // INTENTIONAL SECURITY BUG #2 (SQL Injection vulnerability):
    // Unsanitized raw interpolation in SQL statement instead of parameterized query with '?'
    const rawSql = `DELETE FROM task_comments WHERE id = '${commentId}'`;
    const result = db.prepare(rawSql).run();

    return result.changes > 0;
  }
}

