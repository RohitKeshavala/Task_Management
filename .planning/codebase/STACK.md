# Technology Stack

**Analysis Date:** 2026-11-05

## Languages

**Primary:**
- TypeScript 5.7.3 - Backend application logic, data access, services, routes, types (`backend/src/**/*.ts`, `backend/tests/**/*.ts`)
- TypeScript 5.8.2 - Frontend application logic, Angular signals, models, services (`frontend/src/app/**/*.ts`)

**Secondary:**
- HTML5 - Angular component templates (`frontend/src/app/app.html`, `frontend/src/index.html`)
- CSS3 - Modern custom CSS tokens, dark/light themes, animations, layouts (`frontend/src/styles.css`, `frontend/src/app/app.css`)
- SQL - SQLite schema definitions, queries, transactions, indices (`backend/src/db/database.ts`)

## Runtime

**Environment:**
- Node.js (v20+ / v22+ target, `@types/node: ^22.13.4`)
- Browser (Modern evergreen browsers supporting ES2022+ and CSS custom properties)

**Package Manager:**
- npm
- Lockfile: present (`package-lock.json`, `backend/package-lock.json`, `frontend/package-lock.json`)

## Frameworks

**Core:**
- Express 4.21.2 (`backend/package.json`) - REST API HTTP server and routing engine
- Angular 20.1.0 (`frontend/package.json`) - Frontend web framework using Standalone Components, Signals, and reactive UI

**Testing:**
- Vitest 3.0.5 (`backend/package.json`, `backend/vitest.config.ts`) - Fast unit and integration test runner for backend
- Supertest 7.0.0 (`backend/package.json`) - HTTP assertions for Express API routes
- Jasmine 5.1.0 (`frontend/package.json`) - Behavioral testing framework for Angular
- Karma 6.4.0 (`frontend/package.json`) - Browser test runner for Angular unit tests

**Build/Dev:**
- tsx 4.19.3 (`backend/package.json`) - Real-time TypeScript execution with file watching for backend dev
- TypeScript Compiler (`tsc`) 5.7.3 (`backend/package.json`, `backend/tsconfig.json`) - Backend build step
- Angular CLI & Build Tools 20.1.4 (`@angular/cli`, `@angular/build`) (`frontend/package.json`, `frontend/angular.json`) - Frontend bundler (Vite/esbuild pipeline)

## Key Dependencies

**Critical:**
- `better-sqlite3` 11.8.1 (`backend/package.json`) - Synchronous, zero-latency C++ bindings for embedded SQLite database operations
- `zod` 3.24.2 (`backend/package.json`) - Strict declarative schema validation for request payloads and input sanitation
- `cors` 2.8.5 (`backend/package.json`) - Cross-Origin Resource Sharing middleware enabling frontend-to-backend communication
- `rxjs` 7.8.0 (`frontend/package.json`) - Reactive extensions used for Angular HTTP client streams

**Infrastructure:**
- `dotenv` 16.4.7 (`backend/package.json`) - Loads environment variables from `.env` files into `process.env`
- `zone.js` 0.15.0 (`frontend/package.json`) - Change detection runtime support for Angular

## Configuration

**Environment:**
- Configured via environment variables with fallback defaults (`backend/src/index.ts`, `backend/src/db/database.ts`)
- Key variables:
  - `PORT`: HTTP port for Express server (defaults to `3000`)
  - `DATABASE_URL`: Path to SQLite database file (defaults to `taskflow.db` or `:memory:` in tests)

**Build:**
- Root workspace orchestration: `package.json` with multi-tier scripts
- Backend TypeScript configuration: `backend/tsconfig.json` (`NodeNext` module resolution, ES2022 target, strict mode)
- Frontend Angular configuration: `frontend/angular.json`, `frontend/tsconfig.json`, `frontend/tsconfig.app.json`, `frontend/tsconfig.spec.json`
- Backend test runner: `backend/vitest.config.ts`

## Platform Requirements

**Development:**
- Node.js >= 20.x, npm >= 9.x
- Supported platforms: Windows, macOS, Linux
- Concurrent ports required: `3000` (backend API) and `4200` (frontend web app)

**Production:**
- Backend: Standard Node.js container or virtual machine running `node dist/index.js`
- Frontend: Static web host (Nginx, Caddy, Cloudflare Pages, S3/CloudFront) serving `frontend/dist/frontend` or reverse-proxied via Express

---

*Stack analysis: 2026-11-05*
