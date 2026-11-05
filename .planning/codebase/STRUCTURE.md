# Codebase Structure

**Analysis Date:** 2026-11-05

## Directory Layout

```
Task_Management/
├── .agents/                    # GSD & Antigravity autonomous agent rules, skills, and tools
│   ├── gsd-core/              # Core GSD engine, workflows, scripts, and references
│   ├── rules/                 # Agent operating rules (e.g., AGENTS.md)
│   └── skills/                # Domain-specific agent skills (e.g., frontend-ui-architect, gsd)
├── .planning/                  # Spec-driven planning state and codebase maps
│   └── codebase/              # Codebase analysis maps (STACK.md, ARCHITECTURE.md, etc.)
├── backend/                    # Node.js + Express + TypeScript + SQLite REST API
│   ├── src/                   # Backend application source code
│   │   ├── db/                # SQLite database connection, migrations, seed data
│   │   ├── middleware/        # Express middleware (error handling, validation)
│   │   ├── routes/            # REST API endpoint route handlers
│   │   ├── services/          # Business logic, DAG analysis, and domain operations
│   │   ├── types/             # TypeScript interfaces, Zod schemas, error classes
│   │   ├── app.ts             # Express app setup and middleware registration
│   │   └── index.ts           # Backend entry point and HTTP server listener
│   ├── tests/                 # Vitest automated test suites
│   ├── package.json           # Backend dependencies and scripts
│   ├── tsconfig.json          # Backend TypeScript compiler configuration
│   └── vitest.config.ts       # Backend Vitest runner configuration
├── frontend/                   # Angular 20 Standalone Single-Page Application
│   ├── src/                   # Frontend application source code
│   │   ├── app/               # Main application component, models, services
│   │   │   ├── models/        # TypeScript models and DTO interfaces
│   │   │   ├── services/      # Angular HTTP client service for backend communication
│   │   │   ├── app.ts         # Main Angular component logic
│   │   │   ├── app.html       # Main Angular component template
│   │   │   ├── app.css        # Main Angular component stylesheet
│   │   │   └── app.config.ts  # Angular application configuration
│   │   ├── index.html         # Application HTML root
│   │   ├── main.ts            # Frontend bootstrap entry point
│   │   └── styles.css         # Global CSS design tokens and theme styling
│   ├── angular.json           # Angular CLI workspace configuration
│   ├── package.json           # Frontend dependencies and scripts
│   └── tsconfig.json          # Frontend TypeScript configuration
├── BOOST_GUIDE.md             # Hands-on guide for Antigravity /boost action
├── GSD_GUIDE.md               # Guide for Get Shit Done (GSD) spec-driven development
├── README.md                  # Project overview and quick start instructions
└── package.json               # Monorepo root orchestration scripts
```

## Directory Purposes

**`backend/src/routes/`:**
- Purpose: HTTP routing layer for REST endpoints
- Contains: Express route controllers
- Key files: `backend/src/routes/taskRoutes.ts`, `backend/src/routes/projectRoutes.ts`, `backend/src/routes/tagRoutes.ts`

**`backend/src/services/`:**
- Purpose: Core domain business logic, data mutation, validation, and graph operations
- Contains: Domain service classes
- Key files: `backend/src/services/taskService.ts`, `backend/src/services/dependencyService.ts`, `backend/src/services/projectService.ts`, `backend/src/services/tagService.ts`

**`backend/src/db/`:**
- Purpose: Database connection initialization, schema creation, and seeding
- Contains: `better-sqlite3` instance setup and SQL execution
- Key files: `backend/src/db/database.ts`

**`backend/src/types/`:**
- Purpose: Data models, Zod validation schemas, and custom error types
- Contains: Domain interfaces, enum definitions, error classes
- Key files: `backend/src/types/index.ts`, `backend/src/types/errors.ts`

**`backend/tests/`:**
- Purpose: Automated integration test coverage
- Contains: Vitest specs and in-memory test database harness
- Key files: `backend/tests/setup.ts`, `backend/tests/api.test.ts`, `backend/tests/dependencies.test.ts`, `backend/tests/tags.test.ts`

**`frontend/src/app/`:**
- Purpose: Angular user interface components and state
- Contains: Main application component, HTML template, CSS styles, models, and HTTP services
- Key files: `frontend/src/app/app.ts`, `frontend/src/app/app.html`, `frontend/src/app/app.css`, `frontend/src/app/services/taskflow.service.ts`, `frontend/src/app/models/taskflow.model.ts`

## Key File Locations

**Entry Points:**
- `backend/src/index.ts`: Backend server listener bootstrap
- `backend/src/app.ts`: Express application builder
- `frontend/src/main.ts`: Frontend Angular bootstrap
- `frontend/src/index.html`: Web page shell

**Configuration:**
- `package.json`: Root scripts and runner shortcuts
- `backend/package.json`: Backend npm dependencies and dev scripts
- `frontend/package.json`: Frontend npm dependencies and Angular scripts
- `backend/tsconfig.json`: Backend compiler configuration (NodeNext, ES2022)
- `frontend/angular.json`: Angular CLI build and serve targets
- `backend/vitest.config.ts`: Vitest test runner configuration

**Core Logic:**
- `backend/src/services/taskService.ts`: Task CRUD and query orchestration
- `backend/src/services/dependencyService.ts`: Dependency DAG validation and BFS cycle checking
- `backend/src/services/tagService.ts`: Tag management and batch task association
- `frontend/src/app/services/taskflow.service.ts`: Frontend HTTP communication client
- `frontend/src/app/app.ts`: Angular signal-based reactive state and UI controller

**Testing:**
- `backend/tests/setup.ts`: In-memory SQLite fixture and test setup/teardown
- `backend/tests/api.test.ts`: REST endpoint integration tests via supertest
- `backend/tests/dependencies.test.ts`: Prerequisite DAG and cycle prevention tests
- `backend/tests/tags.test.ts`: Tag filtering and association tests

## Naming Conventions

**Files:**
- TypeScript camelCase with type suffix: `projectService.ts`, `taskRoutes.ts`, `taskflow.service.ts`, `taskflow.model.ts`
- Component templates & styles: `app.html`, `app.css`, `styles.css`
- Tests: `[feature].test.ts` for backend, `[feature].spec.ts` for frontend

**Directories:**
- Lowercase kebab-case or single words: `src/`, `db/`, `services/`, `routes/`, `middleware/`, `types/`, `models/`

## Where to Add New Code

**New Feature (e.g., Task Comments or Attachments):**
- Domain types & Zod schemas: `backend/src/types/index.ts`
- Database schema: `backend/src/db/database.ts` (table DDL)
- Service logic: `backend/src/services/[feature]Service.ts`
- REST endpoints: `backend/src/routes/[feature]Routes.ts`
- Register router: `backend/src/app.ts`
- Tests: `backend/tests/[feature].test.ts`
- Frontend model: `frontend/src/app/models/taskflow.model.ts`
- Frontend service methods: `frontend/src/app/services/taskflow.service.ts`
- UI template & signals: `frontend/src/app/app.ts` & `frontend/src/app/app.html`

**New Component/Module:**
- Implementation: `frontend/src/app/components/[component-name]/[component-name].component.ts`
- Template: `frontend/src/app/components/[component-name]/[component-name].component.html`
- Styles: `frontend/src/app/components/[component-name]/[component-name].component.css`

**Utilities:**
- Shared backend helpers: `backend/src/utils/`
- Shared frontend helpers: `frontend/src/app/utils/`

## Special Directories

**`backend/dist/`:**
- Purpose: Compiled JavaScript output from TypeScript compilation (`tsc`)
- Generated: Yes
- Committed: No (in `.gitignore`)

**`frontend/dist/`:**
- Purpose: Production build artifacts from Angular CLI (`ng build`)
- Generated: Yes
- Committed: No (in `.gitignore`)

**`.planning/`:**
- Purpose: Spec-driven planning, architecture maps, and GSD phase state
- Generated: Semi-automated by GSD workflows
- Committed: Yes

---

*Structure analysis: 2026-11-05*
