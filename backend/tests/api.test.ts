import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { setupTestDatabase } from './setup.js';

describe('TaskFlow API Integration Tests', () => {
  setupTestDatabase();
  const app = createApp();

  describe('GET /api/health', () => {
    it('should return 200 and ok status', async () => {
      const res = await request(app).get('/api/health');
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('ok');
      expect(res.body.service).toBe('taskflow-backend');
    });
  });

  describe('Projects API', () => {
    it('should list projects', async () => {
      const res = await request(app).get('/api/projects');
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThanOrEqual(1);
      expect(res.body[0].id).toBe('test-proj-1');
    });

    it('should create a new project', async () => {
      const newProj = {
        name: 'Brand New Project',
        description: 'For testing project creation',
      };
      const res = await request(app).post('/api/projects').send(newProj);
      expect(res.status).toBe(201);
      expect(res.body.name).toBe(newProj.name);
      expect(res.body.id).toBeDefined();
    });

    it('should return 400 when creating project without name', async () => {
      const res = await request(app).post('/api/projects').send({ description: 'No name' });
      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Validation Error');
    });

    it('should get single project by ID', async () => {
      const res = await request(app).get('/api/projects/test-proj-1');
      expect(res.status).toBe(200);
      expect(res.body.name).toBe('Test Project 1');
    });

    it('should return 404 for non-existent project', async () => {
      const res = await request(app).get('/api/projects/proj-does-not-exist');
      expect(res.status).toBe(404);
    });

    it('should delete project and cascade', async () => {
      const res = await request(app).delete('/api/projects/test-proj-1');
      expect(res.status).toBe(204);

      const check = await request(app).get('/api/projects/test-proj-1');
      expect(check.status).toBe(404);
    });
  });

  describe('Tasks API', () => {
    it('should create a task under existing project', async () => {
      const taskData = {
        projectId: 'test-proj-1',
        title: 'Integration Test Task',
        description: 'Testing task creation',
        priority: 'HIGH',
        status: 'TODO',
      };
      const res = await request(app).post('/api/tasks').send(taskData);
      expect(res.status).toBe(201);
      expect(res.body.title).toBe(taskData.title);
      expect(res.body.priority).toBe('HIGH');
      expect(res.body.status).toBe('TODO');
    });

    it('should return 404 when creating task under non-existent project', async () => {
      const taskData = {
        projectId: 'proj-non-existent',
        title: 'Orphan Task',
      };
      const res = await request(app).post('/api/tasks').send(taskData);
      expect(res.status).toBe(404);
    });

    it('should update task status', async () => {
      // First create a task
      const createRes = await request(app).post('/api/tasks').send({
        projectId: 'test-proj-1',
        title: 'Status Update Task',
        priority: 'MEDIUM',
      });
      const taskId = createRes.body.id;

      // Update status to IN_PROGRESS
      const updateRes = await request(app).put(`/api/tasks/${taskId}`).send({
        status: 'IN_PROGRESS',
      });
      expect(updateRes.status).toBe(200);
      expect(updateRes.body.status).toBe('IN_PROGRESS');
    });

    it('should filter tasks by projectId and status', async () => {
      await request(app).post('/api/tasks').send({
        projectId: 'test-proj-1',
        title: 'Task A',
        status: 'TODO',
      });
      await request(app).post('/api/tasks').send({
        projectId: 'test-proj-1',
        title: 'Task B',
        status: 'DONE',
      });

      const resTodo = await request(app).get('/api/tasks?status=TODO');
      expect(resTodo.status).toBe(200);
      expect(resTodo.body.every((t: any) => t.status === 'TODO')).toBe(true);

      const resDone = await request(app).get('/api/tasks?status=DONE');
      expect(resDone.status).toBe(200);
      expect(resDone.body.every((t: any) => t.status === 'DONE')).toBe(true);
    });

    describe('Due Date Validation for New Tasks', () => {
      it('should allow creating a task with today as dueDate', async () => {
        const today = new Date();
        const y = today.getFullYear();
        const m = String(today.getMonth() + 1).padStart(2, '0');
        const d = String(today.getDate()).padStart(2, '0');
        const todayStr = `${y}-${m}-${d}`;

        const res = await request(app).post('/api/tasks').send({
          projectId: 'test-proj-1',
          title: 'Today Task',
          dueDate: todayStr,
        });

        expect(res.status).toBe(201);
        expect(res.body.dueDate).toBe(todayStr);
      });

      it('should allow creating a task with future dueDate', async () => {
        const future = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
        const y = future.getFullYear();
        const m = String(future.getMonth() + 1).padStart(2, '0');
        const d = String(future.getDate()).padStart(2, '0');
        const futureStr = `${y}-${m}-${d}`;

        const res = await request(app).post('/api/tasks').send({
          projectId: 'test-proj-1',
          title: 'Future Task',
          dueDate: futureStr,
        });

        expect(res.status).toBe(201);
        expect(res.body.dueDate).toBe(futureStr);
      });

      it('should reject creating a task with past dueDate with 400 Bad Request', async () => {
        const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
        const y = yesterday.getFullYear();
        const m = String(yesterday.getMonth() + 1).padStart(2, '0');
        const d = String(yesterday.getDate()).padStart(2, '0');
        const yesterdayStr = `${y}-${m}-${d}`;

        const res = await request(app).post('/api/tasks').send({
          projectId: 'test-proj-1',
          title: 'Past Task',
          dueDate: yesterdayStr,
        });

        expect(res.status).toBe(400);
        expect(res.body.error).toContain('Due date cannot be in the past');
      });
    });
  });
});

