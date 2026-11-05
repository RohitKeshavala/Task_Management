import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { setupTestDatabase } from './setup.js';

describe('Role-Based Access Control (RBAC) Integration Tests', () => {
  setupTestDatabase();
  const app = createApp();

  describe('Role Header Parsing & Normalization', () => {
    it('should default to MEMBER when x-user-role header is omitted', async () => {
      // MEMBER can create a task, but cannot delete a project
      const taskRes = await request(app)
        .post('/api/tasks')
        .send({ projectId: 'test-proj-1', title: 'Default Member Task' });
      expect(taskRes.status).toBe(201);

      const deleteRes = await request(app).delete('/api/projects/test-proj-1');
      expect(deleteRes.status).toBe(403);
      expect(deleteRes.body.error).toBe('Forbidden');
    });

    it('should default to MEMBER when x-user-role header is empty or whitespace', async () => {
      const res = await request(app)
        .delete('/api/projects/test-proj-1')
        .set('x-user-role', '   ');
      expect(res.status).toBe(403);
      expect(res.body.error).toBe('Forbidden');
    });

    it('should normalize case-insensitive lowercase "admin" to full ADMIN permissions', async () => {
      // Create a temporary project to delete
      const projRes = await request(app)
        .post('/api/projects')
        .set('x-user-role', 'admin')
        .send({ name: 'Admin Normalization Project' });
      expect(projRes.status).toBe(201);

      const deleteRes = await request(app)
        .delete(`/api/projects/${projRes.body.id}`)
        .set('x-user-role', 'admin');
      expect(deleteRes.status).toBe(204);
    });

    it('should normalize case-insensitive "viewer" to VIEWER permissions', async () => {
      const res = await request(app)
        .post('/api/tasks')
        .set('x-user-role', 'viewer')
        .send({ projectId: 'test-proj-1', title: 'Should fail' });
      expect(res.status).toBe(403);
      expect(res.body.error).toBe('Forbidden');
    });

    it('should reject unrecognized role strings with 400 Bad Request', async () => {
      const res = await request(app)
        .get('/api/projects')
        .set('x-user-role', 'SUPERUSER');
      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Invalid role');
      expect(res.body.message).toContain('Allowed roles: ADMIN, MEMBER, VIEWER');
    });
  });

  describe('ADMIN Role Permissions (RBAC-03)', () => {
    it('should allow ADMIN to read, create, update, and delete projects', async () => {
      // GET
      const getRes = await request(app)
        .get('/api/projects')
        .set('x-user-role', 'ADMIN');
      expect(getRes.status).toBe(200);

      // POST
      const createRes = await request(app)
        .post('/api/projects')
        .set('x-user-role', 'ADMIN')
        .send({ name: 'Admin Project', description: 'Testing Admin' });
      expect(createRes.status).toBe(201);
      const projectId = createRes.body.id;

      // PUT
      const updateRes = await request(app)
        .put(`/api/projects/${projectId}`)
        .set('x-user-role', 'ADMIN')
        .send({ name: 'Admin Project Updated' });
      expect(updateRes.status).toBe(200);
      expect(updateRes.body.name).toBe('Admin Project Updated');

      // DELETE
      const deleteRes = await request(app)
        .delete(`/api/projects/${projectId}`)
        .set('x-user-role', 'ADMIN');
      expect(deleteRes.status).toBe(204);
    });

    it('should allow ADMIN to create, update, and delete tasks', async () => {
      // POST task
      const createRes = await request(app)
        .post('/api/tasks')
        .set('x-user-role', 'ADMIN')
        .send({
          projectId: 'test-proj-1',
          title: 'Admin Task',
          priority: 'MEDIUM',
        });
      expect(createRes.status).toBe(201);
      const taskId = createRes.body.id;

      // PUT task
      const updateRes = await request(app)
        .put(`/api/tasks/${taskId}`)
        .set('x-user-role', 'ADMIN')
        .send({ status: 'IN_PROGRESS' });
      expect(updateRes.status).toBe(200);

      // DELETE task
      const deleteRes = await request(app)
        .delete(`/api/tasks/${taskId}`)
        .set('x-user-role', 'ADMIN');
      expect(deleteRes.status).toBe(204);
    });

    it('should allow ADMIN to manage tags', async () => {
      // POST tag
      const createRes = await request(app)
        .post('/api/tags')
        .set('x-user-role', 'ADMIN')
        .send({ name: 'AdminTag', color: '#112233' });
      expect(createRes.status).toBe(201);
      const tagId = createRes.body.id;

      // DELETE tag
      const deleteRes = await request(app)
        .delete(`/api/tags/${tagId}`)
        .set('x-user-role', 'ADMIN');
      expect(deleteRes.status).toBe(204);
    });
  });

  describe('MEMBER Role Permissions (RBAC-04)', () => {
    it('should allow MEMBER to view projects and tasks', async () => {
      const projRes = await request(app)
        .get('/api/projects')
        .set('x-user-role', 'MEMBER');
      expect(projRes.status).toBe(200);

      const taskRes = await request(app)
        .get('/api/tasks')
        .set('x-user-role', 'MEMBER');
      expect(taskRes.status).toBe(200);
    });

    it('should allow MEMBER to create and update projects', async () => {
      const createRes = await request(app)
        .post('/api/projects')
        .set('x-user-role', 'MEMBER')
        .send({ name: 'Member Created Project' });
      expect(createRes.status).toBe(201);
      const projId = createRes.body.id;

      const updateRes = await request(app)
        .put(`/api/projects/${projId}`)
        .set('x-user-role', 'MEMBER')
        .send({ description: 'Member description' });
      expect(updateRes.status).toBe(200);
    });

    it('should block MEMBER from deleting projects with 403 Forbidden', async () => {
      const res = await request(app)
        .delete('/api/projects/test-proj-1')
        .set('x-user-role', 'MEMBER');
      expect(res.status).toBe(403);
      expect(res.body.error).toBe('Forbidden');
      expect(res.body.message).toContain('Role MEMBER is not authorized');
    });

    it('should allow MEMBER to create, update, and delete tasks', async () => {
      // Create task
      const createRes = await request(app)
        .post('/api/tasks')
        .set('x-user-role', 'MEMBER')
        .send({
          projectId: 'test-proj-1',
          title: 'Member Task',
        });
      expect(createRes.status).toBe(201);
      const taskId = createRes.body.id;

      // Update task
      const updateRes = await request(app)
        .put(`/api/tasks/${taskId}`)
        .set('x-user-role', 'MEMBER')
        .send({ status: 'IN_PROGRESS' });
      expect(updateRes.status).toBe(200);

      // Delete task
      const deleteRes = await request(app)
        .delete(`/api/tasks/${taskId}`)
        .set('x-user-role', 'MEMBER');
      expect(deleteRes.status).toBe(204);
    });

    it('should allow MEMBER to create and delete tags', async () => {
      const createRes = await request(app)
        .post('/api/tags')
        .set('x-user-role', 'MEMBER')
        .send({ name: 'MemberTag', color: '#abcdef' });
      expect(createRes.status).toBe(201);
      const tagId = createRes.body.id;

      const deleteRes = await request(app)
        .delete(`/api/tags/${tagId}`)
        .set('x-user-role', 'MEMBER');
      expect(deleteRes.status).toBe(204);
    });
  });

  describe('VIEWER Role Permissions (RBAC-05)', () => {
    it('should allow VIEWER to read all resources', async () => {
      const projectsRes = await request(app)
        .get('/api/projects')
        .set('x-user-role', 'VIEWER');
      expect(projectsRes.status).toBe(200);

      const tasksRes = await request(app)
        .get('/api/tasks')
        .set('x-user-role', 'VIEWER');
      expect(tasksRes.status).toBe(200);

      const tagsRes = await request(app)
        .get('/api/tags')
        .set('x-user-role', 'VIEWER');
      expect(tagsRes.status).toBe(200);
    });

    it('should block VIEWER from mutating projects (POST, PUT, DELETE)', async () => {
      const postRes = await request(app)
        .post('/api/projects')
        .set('x-user-role', 'VIEWER')
        .send({ name: 'Viewer Proj' });
      expect(postRes.status).toBe(403);
      expect(postRes.body.error).toBe('Forbidden');

      const putRes = await request(app)
        .put('/api/projects/test-proj-1')
        .set('x-user-role', 'VIEWER')
        .send({ name: 'Hacked' });
      expect(putRes.status).toBe(403);

      const delRes = await request(app)
        .delete('/api/projects/test-proj-1')
        .set('x-user-role', 'VIEWER');
      expect(delRes.status).toBe(403);
    });

    it('should block VIEWER from mutating tasks (POST, PUT, DELETE)', async () => {
      const postRes = await request(app)
        .post('/api/tasks')
        .set('x-user-role', 'VIEWER')
        .send({ projectId: 'test-proj-1', title: 'Viewer Task' });
      expect(postRes.status).toBe(403);

      const putRes = await request(app)
        .put('/api/tasks/test-task-1')
        .set('x-user-role', 'VIEWER')
        .send({ status: 'DONE' });
      expect(putRes.status).toBe(403);

      const delRes = await request(app)
        .delete('/api/tasks/test-task-1')
        .set('x-user-role', 'VIEWER');
      expect(delRes.status).toBe(403);
    });

    it('should block VIEWER from mutating tags (POST, DELETE)', async () => {
      const postRes = await request(app)
        .post('/api/tags')
        .set('x-user-role', 'VIEWER')
        .send({ name: 'ViewerTag', color: '#ff0000' });
      expect(postRes.status).toBe(403);

      const delRes = await request(app)
        .delete('/api/tags/test-tag-1')
        .set('x-user-role', 'VIEWER');
      expect(delRes.status).toBe(403);
    });
  });
});

