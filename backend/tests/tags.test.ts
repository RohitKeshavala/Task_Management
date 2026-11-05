import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { setupTestDatabase } from './setup.js';

describe('Tags & Labels API Integration Tests', () => {
  setupTestDatabase();
  const app = createApp();

  describe('Tag Management Endpoints', () => {
    it('GET /api/tags should return an empty list initially', async () => {
      const res = await request(app).get('/api/tags');
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBe(0);
    });

    it('POST /api/tags should create a new tag with custom color', async () => {
      const res = await request(app).post('/api/tags').send({
        name: 'Bug',
        color: '#ef4444',
      });
      expect(res.status).toBe(201);
      expect(res.body.id).toMatch(/^tag-/);
      expect(res.body.name).toBe('Bug');
      expect(res.body.color).toBe('#ef4444');
      expect(res.body.createdAt).toBeDefined();
    });

    it('POST /api/tags should create a tag with default color if color is omitted', async () => {
      const res = await request(app).post('/api/tags').send({
        name: 'Enhancement',
      });
      expect(res.status).toBe(201);
      expect(res.body.name).toBe('Enhancement');
      expect(res.body.color).toBe('#6366f1');
    });

    it('POST /api/tags should return 400 when name is missing or empty', async () => {
      const resMissing = await request(app).post('/api/tags').send({ color: '#10b981' });
      expect(resMissing.status).toBe(400);

      const resEmpty = await request(app).post('/api/tags').send({ name: '   ', color: '#10b981' });
      expect(resEmpty.status).toBe(400);
    });

    it('POST /api/tags should reject duplicate tag names with 409 Conflict', async () => {
      const first = await request(app).post('/api/tags').send({ name: 'DuplicateTest', color: '#3b82f6' });
      expect(first.status).toBe(201);

      const second = await request(app).post('/api/tags').send({ name: 'duplicatetest', color: '#ef4444' });
      expect(second.status).toBe(409);
    });

    it('POST /api/tags should return 400 when color format is not a valid hex string', async () => {
      const res = await request(app).post('/api/tags').send({ name: 'Bad Color', color: 'invalid-color' });
      expect(res.status).toBe(400);
    });

    it('GET /api/tags should return all created tags', async () => {
      await request(app).post('/api/tags').send({ name: 'Feature', color: '#3b82f6' });
      await request(app).post('/api/tags').send({ name: 'Docs', color: '#10b981' });

      const res = await request(app).get('/api/tags');
      expect(res.status).toBe(200);
      expect(res.body.length).toBe(2);
      const names = res.body.map((t: any) => t.name);
      expect(names).toContain('Feature');
      expect(names).toContain('Docs');
    });

    it('GET /api/tags/:id should return single tag and 404 for unknown ID', async () => {
      const created = await request(app).post('/api/tags').send({ name: 'Test Tag', color: '#8b5cf6' });
      const tagId = created.body.id;

      const getRes = await request(app).get(`/api/tags/${tagId}`);
      expect(getRes.status).toBe(200);
      expect(getRes.body.id).toBe(tagId);
      expect(getRes.body.name).toBe('Test Tag');

      const notFoundRes = await request(app).get('/api/tags/non-existent-tag');
      expect(notFoundRes.status).toBe(404);
    });

    it('DELETE /api/tags/:id should delete tag and cascade associations from tasks', async () => {
      const tagRes = await request(app).post('/api/tags').send({ name: 'Temporary', color: '#999999' });
      const tagId = tagRes.body.id;

      const taskRes = await request(app).post('/api/tasks').send({
        projectId: 'test-proj-1',
        title: 'Task With Temporary Tag',
        tagIds: [tagId],
      });
      const taskId = taskRes.body.id;
      expect(taskRes.body.tags.length).toBe(1);

      const delRes = await request(app).delete(`/api/tags/${tagId}`);
      expect(delRes.status).toBe(204);

      const checkRes = await request(app).get(`/api/tags/${tagId}`);
      expect(checkRes.status).toBe(404);

      // Verify task still exists but association is gone
      const taskCheck = await request(app).get(`/api/tasks/${taskId}`);
      expect(taskCheck.status).toBe(200);
      expect(taskCheck.body.tags.length).toBe(0);

      // Verify filtering by deleted tagId returns 0 tasks
      const filterRes = await request(app).get(`/api/tasks?tagId=${tagId}`);
      expect(filterRes.body.length).toBe(0);

      const delAgain = await request(app).delete(`/api/tags/${tagId}`);
      expect(delAgain.status).toBe(404);
    });
  });

  describe('Task-Tag Association Endpoints', () => {
    let taskId: string;
    let tagId1: string;
    let tagId2: string;

    beforeEach(async () => {
      // Create a task under seed project test-proj-1
      const taskRes = await request(app).post('/api/tasks').send({
        projectId: 'test-proj-1',
        title: 'Task for Tag Association',
        priority: 'MEDIUM',
        status: 'TODO',
      });
      taskId = taskRes.body.id;

      // Create two tags
      const t1 = await request(app).post('/api/tags').send({ name: 'Frontend', color: '#3b82f6' });
      const t2 = await request(app).post('/api/tags').send({ name: 'High-Priority', color: '#ef4444' });
      tagId1 = t1.body.id;
      tagId2 = t2.body.id;
    });

    it('POST /api/tasks/:id/tags should associate tag with task', async () => {
      const res = await request(app).post(`/api/tasks/${taskId}/tags`).send({ tagId: tagId1 });
      expect(res.status).toBe(201);
      expect(res.body.taskId).toBe(taskId);
      expect(res.body.tagId).toBe(tagId1);
      expect(res.body.name).toBe('Frontend');
      expect(res.body.color).toBe('#3b82f6');

      // Verify task now returns with tags array
      const taskRes = await request(app).get(`/api/tasks/${taskId}`);
      expect(taskRes.status).toBe(200);
      expect(taskRes.body.tags).toBeDefined();
      expect(taskRes.body.tags.length).toBe(1);
      expect(taskRes.body.tags[0].id).toBe(tagId1);
    });

    it('POST /api/tasks/:id/tags should accept "id" field in body as well', async () => {
      const res = await request(app).post(`/api/tasks/${taskId}/tags`).send({ id: tagId2 });
      expect(res.status).toBe(201);
      expect(res.body.tagId).toBe(tagId2);
    });

    it('POST /api/tasks/:id/tags should return 400 when tagId is missing', async () => {
      const res = await request(app).post(`/api/tasks/${taskId}/tags`).send({});
      expect(res.status).toBe(400);
    });

    it('POST /api/tasks/:id/tags should return 400 when tagId is empty or whitespace', async () => {
      const res = await request(app).post(`/api/tasks/${taskId}/tags`).send({ tagId: '   ' });
      expect(res.status).toBe(400);
    });

    it('POST /api/tasks/:id/tags should return 404 for non-existent task', async () => {
      const res = await request(app).post('/api/tasks/non-existent-task/tags').send({ tagId: tagId1 });
      expect(res.status).toBe(404);
    });

    it('POST /api/tasks/:id/tags should return 404 for non-existent tag', async () => {
      const res = await request(app).post(`/api/tasks/${taskId}/tags`).send({ tagId: 'tag-unknown' });
      expect(res.status).toBe(404);
    });

    it('POST /api/tasks/:id/tags should be idempotent on duplicate association', async () => {
      const first = await request(app).post(`/api/tasks/${taskId}/tags`).send({ tagId: tagId1 });
      expect(first.status).toBe(201);

      const second = await request(app).post(`/api/tasks/${taskId}/tags`).send({ tagId: tagId1 });
      expect(second.status).toBe(201);

      // Verify no duplicates
      const taskRes = await request(app).get(`/api/tasks/${taskId}`);
      expect(taskRes.body.tags.filter((t: any) => t.id === tagId1).length).toBe(1);
    });

    it('DELETE /api/tasks/:id/tags/:tagId should remove tag from task', async () => {
      await request(app).post(`/api/tasks/${taskId}/tags`).send({ tagId: tagId1 });
      await request(app).post(`/api/tasks/${taskId}/tags`).send({ tagId: tagId2 });

      // Remove tagId1
      const delRes = await request(app).delete(`/api/tasks/${taskId}/tags/${tagId1}`);
      expect(delRes.status).toBe(204);

      // Verify only tagId2 remains
      const taskRes = await request(app).get(`/api/tasks/${taskId}`);
      expect(taskRes.body.tags.length).toBe(1);
      expect(taskRes.body.tags[0].id).toBe(tagId2);
    });

    it('DELETE /api/tasks/:id/tags/:tagId should return 404 if association does not exist', async () => {
      const res = await request(app).delete(`/api/tasks/${taskId}/tags/${tagId1}`);
      expect(res.status).toBe(404);
    });

    it('DELETE /api/tasks/:id/tags/:tagId should return 404 if task does not exist', async () => {
      const res = await request(app).delete(`/api/tasks/task-unknown/tags/${tagId1}`);
      expect(res.status).toBe(404);
    });

    it('DELETE /api/tasks/:id should cascade delete task_tags associations', async () => {
      await request(app).post(`/api/tasks/${taskId}/tags`).send({ tagId: tagId1 });
      const delTaskRes = await request(app).delete(`/api/tasks/${taskId}`);
      expect(delTaskRes.status).toBe(204);

      // Filtering by tagId1 should no longer include deleted task
      const filterRes = await request(app).get(`/api/tasks?tagId=${tagId1}`);
      expect(filterRes.body.find((t: any) => t.id === taskId)).toBeUndefined();
    });

    it('GET /api/tasks/:id/tags should return all tags associated with task', async () => {
      await request(app).post(`/api/tasks/${taskId}/tags`).send({ tagId: tagId1 });
      await request(app).post(`/api/tasks/${taskId}/tags`).send({ tagId: tagId2 });

      const res = await request(app).get(`/api/tasks/${taskId}/tags`);
      expect(res.status).toBe(200);
      expect(res.body.length).toBe(2);
      const tagIds = res.body.map((t: any) => t.id);
      expect(tagIds).toContain(tagId1);
      expect(tagIds).toContain(tagId2);
    });

    it('should associate tags at creation time via tagIds array in POST /api/tasks', async () => {
      const res = await request(app).post('/api/tasks').send({
        projectId: 'test-proj-1',
        title: 'Task Created with Initial Tags',
        priority: 'HIGH',
        tagIds: [tagId1, tagId2],
      });
      expect(res.status).toBe(201);
      expect(res.body.tags).toBeDefined();
      expect(res.body.tags.length).toBe(2);
      const ids = res.body.tags.map((t: any) => t.id);
      expect(ids).toContain(tagId1);
      expect(ids).toContain(tagId2);
    });

    it('POST /api/tasks with non-existent tagId should fail atomically without creating orphaned task', async () => {
      const res = await request(app).post('/api/tasks').send({
        projectId: 'test-proj-1',
        title: 'Atomic Rollback Check',
        tagIds: ['non-existent-tag-id'],
      });
      expect(res.status).toBe(404);

      const list = await request(app).get('/api/tasks?projectId=test-proj-1');
      const found = list.body.find((t: any) => t.title === 'Atomic Rollback Check');
      expect(found).toBeUndefined();
    });
  });

  describe('Task Tag Filtering (GET /api/tasks?tagId=:tagId)', () => {
    it('should filter tasks by tagId correctly', async () => {
      // Create two tags: backendTag and frontendTag
      const tBackend = await request(app).post('/api/tags').send({ name: 'Backend', color: '#10b981' });
      const tFrontend = await request(app).post('/api/tags').send({ name: 'Frontend', color: '#3b82f6' });
      const backendTagId = tBackend.body.id;
      const frontendTagId = tFrontend.body.id;

      // Create 3 tasks:
      // Task 1: tagged with Backend
      const task1 = await request(app).post('/api/tasks').send({
        projectId: 'test-proj-1',
        title: 'Backend API Design',
        status: 'TODO',
      });
      await request(app).post(`/api/tasks/${task1.body.id}/tags`).send({ tagId: backendTagId });

      // Task 2: tagged with Frontend
      const task2 = await request(app).post('/api/tasks').send({
        projectId: 'test-proj-1',
        title: 'Frontend UI Components',
        status: 'IN_PROGRESS',
      });
      await request(app).post(`/api/tasks/${task2.body.id}/tags`).send({ tagId: frontendTagId });

      // Task 3: tagged with BOTH Backend and Frontend
      const task3 = await request(app).post('/api/tasks').send({
        projectId: 'test-proj-1',
        title: 'Full Stack Integration',
        status: 'DONE',
      });
      await request(app).post(`/api/tasks/${task3.body.id}/tags`).send({ tagId: backendTagId });
      await request(app).post(`/api/tasks/${task3.body.id}/tags`).send({ tagId: frontendTagId });

      // Task 4: Untagged
      await request(app).post('/api/tasks').send({
        projectId: 'test-proj-1',
        title: 'Unrelated Chore',
        status: 'TODO',
      });

      // Filter by backendTagId
      const resBackend = await request(app).get(`/api/tasks?tagId=${backendTagId}`);
      expect(resBackend.status).toBe(200);
      expect(resBackend.body.length).toBe(2);
      const backendTaskIds = resBackend.body.map((t: any) => t.id);
      expect(backendTaskIds).toContain(task1.body.id);
      expect(backendTaskIds).toContain(task3.body.id);
      expect(backendTaskIds).not.toContain(task2.body.id);

      // Filter by frontendTagId
      const resFrontend = await request(app).get(`/api/tasks?tagId=${frontendTagId}`);
      expect(resFrontend.status).toBe(200);
      expect(resFrontend.body.length).toBe(2);
      const frontendTaskIds = resFrontend.body.map((t: any) => t.id);
      expect(frontendTaskIds).toContain(task2.body.id);
      expect(frontendTaskIds).toContain(task3.body.id);
      expect(frontendTaskIds).not.toContain(task1.body.id);

      // Filter by non-existent tagId returns empty array
      const resEmpty = await request(app).get('/api/tasks?tagId=tag-non-existent');
      expect(resEmpty.status).toBe(200);
      expect(resEmpty.body.length).toBe(0);

      // Combined filter: tagId AND status
      const resCombined = await request(app).get(`/api/tasks?tagId=${backendTagId}&status=DONE`);
      expect(resCombined.status).toBe(200);
      expect(resCombined.body.length).toBe(1);
      expect(resCombined.body[0].id).toBe(task3.body.id);

      // Filter by tag name using ?tag=
      const resByName = await request(app).get('/api/tasks?tag=Backend');
      expect(resByName.status).toBe(200);
      expect(resByName.body.length).toBe(2);
      const byNameIds = resByName.body.map((t: any) => t.id);
      expect(byNameIds).toContain(task1.body.id);
      expect(byNameIds).toContain(task3.body.id);
    });
  });
});

