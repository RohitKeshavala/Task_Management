import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { initDatabase, closeDatabase } from '../src/db/database.js';

describe('Authentication & Admin User Management API', () => {
  let app: ReturnType<typeof createApp>;

  beforeEach(() => {
    initDatabase(':memory:');
    app = createApp();
  });

  afterEach(() => {
    closeDatabase();
  });

  describe('POST /api/auth/register', () => {
    it('should register a new user with default MEMBER role and return token', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'johndoe',
          email: 'john@example.com',
          password: 'Password123!',
        });

      expect(res.status).toBe(201);
      expect(res.body.user).toBeDefined();
      expect(res.body.user.username).toBe('johndoe');
      expect(res.body.user.email).toBe('john@example.com');
      expect(res.body.user.role).toBe('MEMBER');
      expect(res.body.user.passwordHash).toBeUndefined();
      expect(res.body.user.salt).toBeUndefined();
      expect(res.body.token).toBeDefined();
    });

    it('should reject registration if email or username already exists (409 Conflict)', async () => {
      await request(app)
        .post('/api/auth/register')
        .send({
          username: 'alice',
          email: 'alice@example.com',
          password: 'Password123!',
        });

      const resDuplicateEmail = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'alice2',
          email: 'alice@example.com',
          password: 'Password123!',
        });
      expect(resDuplicateEmail.status).toBe(409);

      const resDuplicateUsername = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'alice',
          email: 'alice2@example.com',
          password: 'Password123!',
        });
      expect(resDuplicateUsername.status).toBe(409);
    });

    it('should reject registration with invalid input (400 Validation Error)', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'ab', // too short (<3)
          email: 'not-an-email',
          password: '123', // too short (<6)
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Validation Error');
    });
  });

  describe('POST /api/auth/login', () => {
    it('should login seeded default admin user successfully', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'admin@taskflow.dev',
          password: 'Admin123!',
        });

      expect(res.status).toBe(200);
      expect(res.body.user.email).toBe('admin@taskflow.dev');
      expect(res.body.user.role).toBe('ADMIN');
      expect(res.body.token).toBeDefined();
    });

    it('should login newly registered user successfully', async () => {
      await request(app)
        .post('/api/auth/register')
        .send({
          username: 'bobsmith',
          email: 'bob@example.com',
          password: 'SecretPassword99!',
        });

      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'bob@example.com',
          password: 'SecretPassword99!',
        });

      expect(res.status).toBe(200);
      expect(res.body.user.username).toBe('bobsmith');
      expect(res.body.user.role).toBe('MEMBER');
      expect(res.body.token).toBeDefined();
    });

    it('should reject login with incorrect password (401 Unauthorized)', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'admin@taskflow.dev',
          password: 'WrongPassword!',
        });

      expect(res.status).toBe(401);
      expect(res.body.message).toContain('Invalid email or password');
    });

    it('should reject login with non-existent email (401 Unauthorized)', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nobody@example.com',
          password: 'SomePassword123!',
        });

      expect(res.status).toBe(401);
      expect(res.body.message).toContain('Invalid email or password');
    });
  });

  describe('GET /api/auth/me', () => {
    it('should return current user when Authorization Bearer token is provided', async () => {
      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'admin@taskflow.dev',
          password: 'Admin123!',
        });

      const token = loginRes.body.token;

      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.email).toBe('admin@taskflow.dev');
      expect(res.body.role).toBe('ADMIN');
    });

    it('should reject request without Bearer token (401 Unauthorized)', async () => {
      const res = await request(app).get('/api/auth/me');
      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/users & PUT /api/users/:id/role', () => {
    it('should allow ADMIN to retrieve all registered users', async () => {
      const res = await request(app)
        .get('/api/users')
        .set('x-user-role', 'ADMIN');

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThanOrEqual(1);
      expect(res.body[0].email).toBe('admin@taskflow.dev');
    });

    it('should block non-ADMIN users from retrieving user list (403 Forbidden)', async () => {
      const resMember = await request(app)
        .get('/api/users')
        .set('x-user-role', 'MEMBER');
      expect(resMember.status).toBe(403);

      const resViewer = await request(app)
        .get('/api/users')
        .set('x-user-role', 'VIEWER');
      expect(resViewer.status).toBe(403);
    });

    it('should allow ADMIN to change a user role', async () => {
      const registerRes = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'charlie',
          email: 'charlie@example.com',
          password: 'Password123!',
        });

      const userId = registerRes.body.user.id;

      const updateRes = await request(app)
        .put(`/api/users/${userId}/role`)
        .set('x-user-role', 'ADMIN')
        .send({ role: 'VIEWER' });

      expect(updateRes.status).toBe(200);
      expect(updateRes.body.role).toBe('VIEWER');

      // Promote to ADMIN
      const promoteRes = await request(app)
        .put(`/api/users/${userId}/role`)
        .set('x-user-role', 'ADMIN')
        .send({ role: 'ADMIN' });

      expect(promoteRes.status).toBe(200);
      expect(promoteRes.body.role).toBe('ADMIN');
    });

    it('should block non-ADMIN from changing user roles (403 Forbidden)', async () => {
      const registerRes = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'dave',
          email: 'dave@example.com',
          password: 'Password123!',
        });

      const userId = registerRes.body.user.id;

      const res = await request(app)
        .put(`/api/users/${userId}/role`)
        .set('x-user-role', 'MEMBER')
        .send({ role: 'ADMIN' });

      expect(res.status).toBe(403);
    });

    it('should safeguard against demoting the sole remaining ADMIN (400 Bad Request)', async () => {
      // Find the admin user id
      const listRes = await request(app)
        .get('/api/users')
        .set('x-user-role', 'ADMIN');

      const adminUser = listRes.body.find((u: any) => u.email === 'admin@taskflow.dev');
      expect(adminUser).toBeDefined();

      const demoteRes = await request(app)
        .put(`/api/users/${adminUser.id}/role`)
        .set('x-user-role', 'ADMIN')
        .send({ role: 'MEMBER' });

      expect(demoteRes.status).toBe(400);
      expect(demoteRes.body.message).toContain('Cannot demote the sole remaining administrator');
    });
  });
});

