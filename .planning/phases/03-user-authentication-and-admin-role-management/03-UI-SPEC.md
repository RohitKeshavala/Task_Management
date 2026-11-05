---
phase: 3
slug: user-authentication-and-admin-role-management
status: approved
shadcn_initialized: false
preset: not applicable
created: 2026-11-05
---

# Phase 3 — UI Design Contract

> Visual and interaction contract for frontend Phase 3 (User Authentication & Admin Role Management). Governed by `frontend-ui-architect` design tokens and 60-30-10 color balance.

---

## Design System

| Property | Value |
|----------|-------|
| Tool | none (Custom Modern Angular CSS Tokens) |
| Preset | not applicable |
| Component library | Standalone Angular 20 Components |
| Icon library | Unicode & Lucide-style semantic symbols (`👤`, `👑`, `⚡`, `👁️`, `🔒`, `🚪`, `✕`, `🛡️`) |
| Font | Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif |

---

## Spacing Scale

Declared values (multiples of 4/8 following the 8pt spatial grid):

| Token | Value | Usage |
|-------|-------|-------|
| xs | 4px | Icon and badge inline gaps |
| sm | 8px | Button inline padding, micro-badge padding |
| md | 16px | Card padding, form field gaps, table cell padding |
| lg | 24px | Modal body padding, header element separation |
| xl | 32px | Modal max margins, major panel separation |
| 2xl | 48px | Backdrop gutters on mobile |
| 3xl | 64px | Page-level boundaries |

---

## Typography

| Role | Size | Weight | Line Height | Letter Spacing |
|------|------|--------|-------------|----------------|
| Display | 20px (1.25rem) | 700 (bold) | 1.25 | -0.02em |
| Heading | 16px (1rem) | 600 (semi-bold) | 1.35 | -0.01em |
| Body | 14px (0.875rem) | 400 (normal) | 1.5 | normal |
| Label / Badge | 12px (0.75rem) | 600 (semi-bold) | 1.2 | +0.02em |

---

## Color & Hierarchy (60-30-10 Rule)

| Role | Value | Usage |
|------|-------|-------|
| Dominant (60%) | `#0b0f19` / `#0f172a` | Main app canvas, frosted modal backdrop `rgba(11, 15, 25, 0.75)` |
| Secondary (30%) | `#1e293b` (slate) | Modal container, table rows, translucent borders `rgba(255, 255, 255, 0.08)` |
| Accent ADMIN (10%) | `#f59e0b` (amber) | Admin badge, crown icon, shield glow |
| Accent MEMBER (10%) | `#10b981` (emerald) | Member badge, lightning icon |
| Accent VIEWER (10%) | `#0ea5e9` (sky) | Viewer badge, eye icon |
| Accent Primary CTA | `#6366f1` (indigo) | Login/Signup submit, primary buttons, input active ring |
| Destructive | `#ef4444` (crimson) | Logout button hover, error callouts |

---

## Copywriting Contract

| Element | Copy |
|---------|------|
| Auth Modal Title (Login) | `Welcome Back to TaskFlow` |
| Auth Modal Title (Signup)| `Create Your TaskFlow Account` |
| Auth Tab Login | `Log In` |
| Auth Tab Signup | `Sign Up` |
| Demo Hint Box | `Demo Admin: admin@taskflow.dev / Admin123!` |
| Manage Users Button | `🛡️ Manage Users` (visible only for ADMIN) |
| Manage Users Modal Title | `User Role Governance` |
| Manage Users Subtitle | `Assign and modify workspace permission levels across all registered members` |
| Role Dropdown Label | `Role: [ADMIN | MEMBER | VIEWER]` |
| Profile Modal Title | `User Profile` |
| Profile Role Pill | Real assigned role (`👑 ADMIN` / `⚡ MEMBER` / `👁️ VIEWER`) |
| Logout Button | `🚪 Log Out` |
| Toast on Role Change | `User {name} updated to role {ROLE}.` |
| Toast on Demotion Guard | `Cannot remove the last remaining Administrator.` |

---

## UI Components & Interaction States

| Component | Responsibility & Interactions |
|-----------|--------------------------------|
| `AuthModalComponent` (`app-auth-modal`) | Standalone modal with Login / Sign Up tabs, validation errors, and demo credentials filler. Required on launch if user not logged in. |
| `UserManagementComponent` (`app-user-management`) | Standalone modal visible only to `ADMIN` displaying registered users table with dynamic role select dropdown and instant save. |
| `ProfileComponent` (`app-profile`) | Cleaned-up profile modal displaying authentic user email, name, role badge, and `Log Out` button. Role switcher cards completely removed. |
| `Navbar` Header Trigger | Updated with `🛡️ Manage Users` button for Admins and dynamic user info. |

