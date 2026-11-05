# TaskFlow: Antigravity `/boost` Learning & Practice Arena

A full-stack task and workflow management application created for testing and mastering Antigravity's autonomous **`/boost`** action.

- **Frontend**: Angular 20 (Standalone Components, Signals, HttpClient, Clean Dark Theme)
- **Backend**: Node.js + Express 5 + TypeScript + SQLite (Better-SQLite3)
- **Testing**: Vitest with in-memory database isolation

---

## Quick Start

### 1. Start the Backend Server (Port 3000)
```bash
npm run dev:backend
```
*Health Check*: [http://localhost:3000/api/health](http://localhost:3000/api/health)

### 2. Start the Angular Frontend (Port 4200)
```bash
npm run dev:frontend
```
Open [http://localhost:4200](http://localhost:4200) in your browser.

### 3. Run Backend Automated Tests
```bash
npm run test:backend
```

---

## Autonomous Workflows: `/boost` & `/gsd`

This repository is equipped with both autonomous workflows:

1. **`/gsd` (Get Shit Done Core)**:
   - Spec-driven development framework with persistent state tracking in `.planning/`.
   - Dedicated subagent orchestration (`gsd-planner`, `gsd-executor`, `gsd-verifier`).
   - Read the complete **[GSD_GUIDE.md](./GSD_GUIDE.md)** for commands like `/gsd auto`, `/gsd quick`, `/gsd onboard`, `/gsd status`.

2. **`/boost` (Deep Engineering Orchestrator)**:
   - Autonomous multi-file feature implementation and bug investigation loops.
   - Read the complete **[BOOST_GUIDE.md](./BOOST_GUIDE.md)** for prompting formulas and ready-to-test missions.


