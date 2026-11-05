# Testing Patterns

**Analysis Date:** 2026-11-05

## Test Framework

**Runner:**
- Vitest 3.0.5 (`backend/package.json`)
- Config: `backend/vitest.config.ts`

**Assertion Library:**
- Vitest built-in assertions (`expect`, `describe`, `it`, `beforeEach`, `afterAll`)
- Supertest 7.0.0 for HTTP assertions (`request(app)`)

**Run Commands:**
```bash
npm run test:backend               # Run all backend tests across the repository
npm --prefix backend test          # Run Vitest directly in backend directory
npx vitest run                     # Single execution mode
npx vitest                         # Watch mode for backend tests
```

## Test File Organization

**Location:**
- Separate dedicated test directory: `backend/tests/`

**Naming:**
- Suffix pattern: `*.test.ts` (e.g., `api.test.ts`, `dependencies.test.ts`, `tags.test.ts`)
- Harness / setup file: `setup.ts`

**Structure:**
```
backend/tests/
├── setup.ts              # In-memory database fixture and seed harness
├── api.test.ts           # REST API CRUD integration tests (Projects, Tasks, Health)
├── dependencies.test.ts  # DAG dependency, cycle detection, blockers, status guard tests
└── tags.test.ts          # Tag CRUD, duplicate handling, association, filtering tests
```

## Test Structure

**Suite Organization:**
```typescript
import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { setupTestDatabase } from './setup.js';

describe('TaskFlow API Integration Tests', () => {
  setupTestDatabase();
  const app = createApp();

  describe('Projects API', () => {
    it('should list projects', async () => {
      const res = await request(app).get('/api/projects');
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body[0].id).toBe('test-proj-1');
    });
  });
});
```

**Patterns:**
- **Setup Pattern:** `setupTestDatabase()` hook registered at the top of each test suite. In `beforeEach`, it closes any open connection and initializes a fresh `:memory:` SQLite instance, then inserts seed data (`test-proj-1`).
- **Teardown Pattern:** `afterAll` hook in `backend/tests/setup.ts` explicitly calls `closeDatabase()` to prevent open handles.
- **Assertion Pattern:** Explicit HTTP status validation (`expect(res.status).toBe(200)`), shape validation (`expect(res.body.id).toBeDefined()`), and error payload verification (`expect(res.body.error).toContain('Circular dependency')`).

## Mocking

**Framework:**
- Native in-memory SQLite via `better-sqlite3(':memory:')`
- Vitest mock utilities available if needed, but integration tests intentionally run against authentic in-memory SQLite for maximum fidelity.

**What to Mock:**
- External third-party networks, slow remote services, or wall-clock timers.

**What NOT to Mock:**
- Database queries, transactions, foreign keys, and SQL schema constraints — these are tested directly using fast in-memory SQLite tables.

## Fixtures and Factories

**Test Data:**
```typescript
// From backend/tests/setup.ts
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
```

**Location:**
- Shared test harness located in `backend/tests/setup.ts`.

## Coverage

**Requirements:**
- High test coverage across core REST endpoints and validation guards.
- All 53 backend tests must pass without failure prior to merging or shipping.

**View Coverage:**
```bash
npx --prefix backend vitest run --coverage
```

## Test Types

**Unit Tests:**
- Graph algorithms in `DependencyService` (BFS cycle detection `findPath`, blocker computation `getBlockers`).
- Date parsing and validation in `TaskService`.

**Integration Tests:**
- End-to-end HTTP request/response validation using `supertest` in `backend/tests/api.test.ts`, `backend/tests/dependencies.test.ts`, and `backend/tests/tags.test.ts`.
- Multi-step transactional workflows (creating task -> adding dependencies -> attempting cycle -> verifying status guard blocking -> resolving prerequisite -> verifying unblocked transition).

**E2E Tests:**
- Frontend unit/integration via Jasmine/Karma configured in `frontend/angular.json`.

## Common Patterns

**Async Testing:**
```typescript
it('should create a task with tags and dependencies', async () => {
  const res = await request(app)
    .post('/api/tasks')
    .send({
      projectId: 'test-proj-1',
      title: 'Integrated Task',
      tagIds: ['tag-1'],
      dependsOnTaskIds: ['task-1']
    });
  expect(res.status).toBe(201);
  expect(res.body.title).toBe('Integrated Task');
});
```

**Error Testing:**
```typescript
it('should detect direct self-dependency cycle', async () => {
  const res = await request(app)
    .post(`/api/tasks/${taskId}/dependencies`)
    .send({ dependsOnTaskId: taskId });
  expect(res.status).toBe(400);
  expect(res.body.error).toContain('Circular dependency detected');
});
```

---

*Testing analysis: 2026-11-05*
