import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { setupTestDatabase } from './setup.js';

describe('Task Comments API Integration Tests', () => {
  setupTestDatabase();
  const app = createApp();

  let taskId: string;

  beforeEach(async () => {
    const taskRes = await request(app).post('/api/tasks').send({
      projectId: 'test-proj-1',
      title: 'Task for Comments Testing',
    });
    taskId = taskRes.body.id;
  });

  it('GET /api/tasks/:taskId/comments should initially return an empty list', async () => {
    const res = await request(app).get(`/api/tasks/${taskId}/comments`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBe(0);
  });

  it('POST /api/tasks/:taskId/comments should create a new comment as MEMBER', async () => {
    const res = await request(app)
      .post(`/api/tasks/${taskId}/comments`)
      .set('x-user-role', 'MEMBER')
      .send({
        content: 'This is the first discussion comment on the task.',
      });

    expect(res.status).toBe(201);
    expect(res.body.id).toBeDefined();
    expect(res.body.content).toBe('This is the first discussion comment on the task.');
    expect(res.body.taskId).toBe(taskId);
    expect(res.body.author).toBeDefined();
  });

  it('POST /api/tasks/:taskId/comments should block VIEWER role with 403', async () => {
    const res = await request(app)
      .post(`/api/tasks/${taskId}/comments`)
      .set('x-user-role', 'VIEWER')
      .send({
        content: 'Viewer trying to comment',
      });

    expect(res.status).toBe(403);
  });

  it('GET /api/tasks/:taskId/comments should return the posted comment', async () => {
    await request(app)
      .post(`/api/tasks/${taskId}/comments`)
      .set('x-user-role', 'MEMBER')
      .send({
        content: 'Testing get comment after post.',
      });

    const res = await request(app).get(`/api/tasks/${taskId}/comments`);
    expect(res.status).toBe(200);
    expect(res.body.length).toBe(1);
    expect(res.body[0].content).toBe('Testing get comment after post.');
  });

  it('GET /api/tasks should include commentCount for the task', async () => {
    await request(app)
      .post(`/api/tasks/${taskId}/comments`)
      .set('x-user-role', 'MEMBER')
      .send({
        content: 'A sample comment to verify count.',
      });

    const res = await request(app).get('/api/tasks?projectId=test-proj-1');
    expect(res.status).toBe(200);
    const foundTask = res.body.find((t: any) => t.id === taskId);
    expect(foundTask).toBeDefined();
    expect(foundTask.commentCount).toBe(1);
  });

  it('PUT /api/comments/:id should allow updating comment content', async () => {
    const postRes = await request(app)
      .post(`/api/tasks/${taskId}/comments`)
      .set('x-user-role', 'MEMBER')
      .send({
        content: 'Original comment.',
      });

    const commentId = postRes.body.id;

    const updateRes = await request(app)
      .put(`/api/comments/${commentId}`)
      .set('x-user-role', 'ADMIN')
      .send({
        content: 'Updated comment content by admin.',
      });

    expect(updateRes.status).toBe(200);
    expect(updateRes.body.content).toBe('Updated comment content by admin.');
  });

  it('DELETE /api/comments/:id should delete a comment', async () => {
    const postRes = await request(app)
      .post(`/api/tasks/${taskId}/comments`)
      .set('x-user-role', 'MEMBER')
      .send({
        content: 'Comment to be deleted.',
      });

    const commentId = postRes.body.id;

    const deleteRes = await request(app)
      .delete(`/api/comments/${commentId}`)
      .set('x-user-role', 'ADMIN');

    expect(deleteRes.status).toBe(204);

    const afterList = await request(app).get(`/api/tasks/${taskId}/comments`);
    expect(afterList.body.length).toBe(0);
  });
});
