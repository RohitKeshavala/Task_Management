import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { setupTestDatabase } from './setup.js';

describe('Task Dependencies Engine & Cycle Prevention Integration Tests', () => {
  setupTestDatabase();
  const app = createApp();

  let taskAId: string;
  let taskBId: string;
  let taskCId: string;
  let taskDId: string;

  beforeEach(async () => {
    // Create base tasks under test-proj-1
    const resA = await request(app).post('/api/tasks').send({
      projectId: 'test-proj-1',
      title: 'Task Alpha (Consumer)',
      priority: 'HIGH',
      status: 'TODO',
    });
    taskAId = resA.body.id;

    const resB = await request(app).post('/api/tasks').send({
      projectId: 'test-proj-1',
      title: 'Task Beta (Prerequisite 1)',
      priority: 'MEDIUM',
      status: 'TODO',
    });
    taskBId = resB.body.id;

    const resC = await request(app).post('/api/tasks').send({
      projectId: 'test-proj-1',
      title: 'Task Gamma (Prerequisite 2)',
      priority: 'LOW',
      status: 'TODO',
    });
    taskCId = resC.body.id;

    const resD = await request(app).post('/api/tasks').send({
      projectId: 'test-proj-1',
      title: 'Task Delta (Root Prerequisite)',
      priority: 'MEDIUM',
      status: 'TODO',
    });
    taskDId = resD.body.id;
  });

  describe('1. Dependency Creation & Retrieval', () => {
    it('should add a valid prerequisite dependency and retrieve it', async () => {
      // Task A depends on Task B
      const addRes = await request(app)
        .post(`/api/tasks/${taskAId}/dependencies`)
        .send({ dependsOnTaskId: taskBId });

      expect(addRes.status).toBe(201);
      expect(addRes.body.taskId).toBe(taskAId);
      expect(addRes.body.dependsOnTaskId).toBe(taskBId);

      // Verify via GET dependencies
      const getRes = await request(app).get(`/api/tasks/${taskAId}/dependencies`);
      expect(getRes.status).toBe(200);
      expect(Array.isArray(getRes.body)).toBe(true);
      expect(getRes.body.length).toBe(1);
      expect(getRes.body[0].id).toBe(taskBId);
      expect(getRes.body[0].title).toBe('Task Beta (Prerequisite 1)');
    });

    it('should return 404 when adding dependency with non-existent task', async () => {
      const res = await request(app)
        .post(`/api/tasks/${taskAId}/dependencies`)
        .send({ dependsOnTaskId: 'task-ghost-404' });

      expect(res.status).toBe(404);
      expect(res.body.error).toContain('not found');
    });

    it('should return 404 when adding dependency to a non-existent task', async () => {
      const res = await request(app)
        .post('/api/tasks/task-ghost-404/dependencies')
        .send({ dependsOnTaskId: taskBId });

      expect(res.status).toBe(404);
      expect(res.body.error).toContain('not found');
    });

    it('should remove a dependency via DELETE endpoint', async () => {
      await request(app)
        .post(`/api/tasks/${taskAId}/dependencies`)
        .send({ dependsOnTaskId: taskBId });

      const delRes = await request(app).delete(`/api/tasks/${taskAId}/dependencies/${taskBId}`);
      expect(delRes.status).toBe(204);

      const checkRes = await request(app).get(`/api/tasks/${taskAId}/dependencies`);
      expect(checkRes.status).toBe(200);
      expect(checkRes.body.length).toBe(0);
    });
  });

  describe('2. Cycle Prevention (DAG Invariant)', () => {
    it('should reject self-dependency (A depends on A) with 400 Bad Request', async () => {
      const res = await request(app)
        .post(`/api/tasks/${taskAId}/dependencies`)
        .send({ dependsOnTaskId: taskAId });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Circular dependency detected');
      expect(res.body.message).toContain('Circular dependency detected');
      expect(res.body.cyclePath).toEqual([taskAId, taskAId]);
    });

    it('should reject direct circular dependency (A depends on B, B depends on A)', async () => {
      // 1. A depends on B
      const res1 = await request(app)
        .post(`/api/tasks/${taskAId}/dependencies`)
        .send({ dependsOnTaskId: taskBId });
      expect(res1.status).toBe(201);

      // 2. B depends on A -> Should be rejected!
      const res2 = await request(app)
        .post(`/api/tasks/${taskBId}/dependencies`)
        .send({ dependsOnTaskId: taskAId });

      expect(res2.status).toBe(400);
      expect(res2.body.error).toBe('Circular dependency detected');
      expect(res2.body.message).toContain(`${taskBId} -> ${taskAId} -> ${taskBId}`);
      expect(res2.body.cyclePath).toEqual([taskBId, taskAId, taskBId]);
    });

    it('should reject indirect 3-step circular dependency (A -> B -> C -> A)', async () => {
      // A depends on B
      await request(app)
        .post(`/api/tasks/${taskAId}/dependencies`)
        .send({ dependsOnTaskId: taskBId });

      // B depends on C
      await request(app)
        .post(`/api/tasks/${taskBId}/dependencies`)
        .send({ dependsOnTaskId: taskCId });

      // C attempts to depend on A -> Cycle A -> B -> C -> A
      const res = await request(app)
        .post(`/api/tasks/${taskCId}/dependencies`)
        .send({ dependsOnTaskId: taskAId });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Circular dependency detected');
      expect(res.body.cyclePath).toEqual([taskCId, taskAId, taskBId, taskCId]);
      expect(res.body.message).toContain(`${taskCId} -> ${taskAId} -> ${taskBId} -> ${taskCId}`);
    });

    it('should reject deep multi-step circular dependency (A -> B -> C -> D -> A)', async () => {
      await request(app).post(`/api/tasks/${taskAId}/dependencies`).send({ dependsOnTaskId: taskBId });
      await request(app).post(`/api/tasks/${taskBId}/dependencies`).send({ dependsOnTaskId: taskCId });
      await request(app).post(`/api/tasks/${taskCId}/dependencies`).send({ dependsOnTaskId: taskDId });

      const res = await request(app).post(`/api/tasks/${taskDId}/dependencies`).send({ dependsOnTaskId: taskAId });
      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Circular dependency detected');
      expect(res.body.cyclePath).toEqual([taskDId, taskAId, taskBId, taskCId, taskDId]);
    });

    it('should allow valid non-circular diamond dependencies (A->B, A->C, B->D, C->D)', async () => {
      // Diamond structure is a valid Directed Acyclic Graph (DAG)
      const res1 = await request(app).post(`/api/tasks/${taskAId}/dependencies`).send({ dependsOnTaskId: taskBId });
      const res2 = await request(app).post(`/api/tasks/${taskAId}/dependencies`).send({ dependsOnTaskId: taskCId });
      const res3 = await request(app).post(`/api/tasks/${taskBId}/dependencies`).send({ dependsOnTaskId: taskDId });
      const res4 = await request(app).post(`/api/tasks/${taskCId}/dependencies`).send({ dependsOnTaskId: taskDId });

      expect(res1.status).toBe(201);
      expect(res2.status).toBe(201);
      expect(res3.status).toBe(201);
      expect(res4.status).toBe(201);
    });
  });

  describe('3. Status Guard: Transition Restrictions', () => {
    it('should reject transitioning to IN_PROGRESS if prerequisite task is in TODO status', async () => {
      // A depends on B (B is TODO)
      await request(app)
        .post(`/api/tasks/${taskAId}/dependencies`)
        .send({ dependsOnTaskId: taskBId });

      // Attempt to transition A to IN_PROGRESS
      const updateRes = await request(app)
        .put(`/api/tasks/${taskAId}`)
        .send({ status: 'IN_PROGRESS' });

      expect(updateRes.status).toBe(400);
      expect(updateRes.body.error).toContain('unfinished prerequisites');
      expect(updateRes.body.blockingTasks).toBeDefined();
      expect(updateRes.body.blockingTasks.length).toBe(1);
      expect(updateRes.body.blockingTasks[0].id).toBe(taskBId);
      expect(updateRes.body.message).toContain('prerequisite task(s) not in DONE status');
    });

    it('should reject transitioning to DONE if prerequisite task is in IN_PROGRESS status', async () => {
      // Put B into IN_PROGRESS (B has no dependencies, so allowed)
      await request(app).put(`/api/tasks/${taskBId}`).send({ status: 'IN_PROGRESS' });

      // A depends on B
      await request(app)
        .post(`/api/tasks/${taskAId}/dependencies`)
        .send({ dependsOnTaskId: taskBId });

      // Attempt to transition A to DONE
      const updateRes = await request(app)
        .put(`/api/tasks/${taskAId}`)
        .send({ status: 'DONE' });

      expect(updateRes.status).toBe(400);
      expect(updateRes.body.blockingTasks[0].id).toBe(taskBId);
    });

    it('should allow transitioning to IN_PROGRESS and DONE once all prerequisite tasks are DONE', async () => {
      // A depends on B
      await request(app)
        .post(`/api/tasks/${taskAId}/dependencies`)
        .send({ dependsOnTaskId: taskBId });

      // Complete prerequisite B
      const completeB = await request(app)
        .put(`/api/tasks/${taskBId}`)
        .send({ status: 'DONE' });
      expect(completeB.status).toBe(200);
      expect(completeB.body.status).toBe('DONE');

      // Now A can transition to IN_PROGRESS
      const progressA = await request(app)
        .put(`/api/tasks/${taskAId}`)
        .send({ status: 'IN_PROGRESS' });
      expect(progressA.status).toBe(200);
      expect(progressA.body.status).toBe('IN_PROGRESS');

      // And A can transition to DONE
      const doneA = await request(app)
        .put(`/api/tasks/${taskAId}`)
        .send({ status: 'DONE' });
      expect(doneA.status).toBe(200);
      expect(doneA.body.status).toBe('DONE');
    });
  });

  describe('4. Blockers API: GET /api/tasks/:id/blockers', () => {
    it('should return 404 for non-existent task', async () => {
      const res = await request(app).get('/api/tasks/non-existent-task/blockers');
      expect(res.status).toBe(404);
      expect(res.body.error).toContain('not found');
    });

    it('should return empty array when task has no dependencies', async () => {
      const res = await request(app).get(`/api/tasks/${taskAId}/blockers`);
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBe(0);
    });

    it('should return unfinished prerequisite tasks', async () => {
      // A depends on B (TODO) and C (TODO)
      await request(app).post(`/api/tasks/${taskAId}/dependencies`).send({ dependsOnTaskId: taskBId });
      await request(app).post(`/api/tasks/${taskAId}/dependencies`).send({ dependsOnTaskId: taskCId });

      // Query blockers
      const blockersRes1 = await request(app).get(`/api/tasks/${taskAId}/blockers`);
      expect(blockersRes1.status).toBe(200);
      expect(blockersRes1.body.length).toBe(2);
      const blockerIds1 = blockersRes1.body.map((t: any) => t.id);
      expect(blockerIds1).toContain(taskBId);
      expect(blockerIds1).toContain(taskCId);

      // Finish task B
      await request(app).put(`/api/tasks/${taskBId}`).send({ status: 'DONE' });

      // Now only C is a blocker
      const blockersRes2 = await request(app).get(`/api/tasks/${taskAId}/blockers`);
      expect(blockersRes2.status).toBe(200);
      expect(blockersRes2.body.length).toBe(1);
      expect(blockersRes2.body[0].id).toBe(taskCId);

      // Finish task C
      await request(app).put(`/api/tasks/${taskCId}`).send({ status: 'DONE' });

      // Blockers list is now empty!
      const blockersRes3 = await request(app).get(`/api/tasks/${taskAId}/blockers`);
      expect(blockersRes3.status).toBe(200);
      expect(blockersRes3.body.length).toBe(0);
    });
  });
});

