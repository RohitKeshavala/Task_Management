---
phase: 2
slug: frontend-user-profile-role-context
status: approved
shadcn_initialized: false
preset: not applicable
created: 2026-11-05
---

# Phase 2 — UI Design Contract

> Visual and interaction contract for frontend Phase 2 (User Profile & Role Context). Governed by `frontend-ui-architect` design tokens and 60-30-10 color balance.

---

## Design System

| Property | Value |
|----------|-------|
| Tool | none (Custom Modern Angular CSS Tokens) |
| Preset | not applicable |
| Component library | Standalone Angular 20 Component |
| Icon library | Unicode & Lucide-style semantic symbols (`👤`, `👑`, `⚡`, `👁️`, `✕`, `🗑️`) |
| Font | Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif |

---

## Spacing Scale

Declared values (multiples of 4/8 following the 8pt spatial grid):

| Token | Value | Usage |
|-------|-------|-------|
| xs | 4px | Icon and badge inline gaps |
| sm | 8px | Button inline padding, micro-badge padding |
| md | 16px | Card padding, field spacing, role selector gap |
| lg | 24px | Modal body padding, header element separation |
| xl | 32px | Modal max margins, major panel separation |
| 2xl | 48px | Backdrop gutters on mobile |
| 3xl | 64px | Page-level boundaries |

Exceptions: none

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
| Secondary (30%) | `#1e293b` (slate) | Modal card container, translucent borders `rgba(255, 255, 255, 0.08)` |
| Accent ADMIN (10%) | `#f59e0b` (amber) | Admin badge, glow ring, crown icon |
| Accent MEMBER (10%) | `#10b981` (emerald) | Member badge, lightning icon |
| Accent VIEWER (10%) | `#0ea5e9` (sky) | Viewer badge, eye icon |
| Accent Primary CTA | `#6366f1` (indigo) | Close / Done button, active card highlights |
| Destructive | `#ef4444` (crimson) | Disabled delete states and error notices |

Accent reserved for: Active role selector card borders, header role badge pill, and primary action buttons.

---

## Copywriting Contract

| Element | Copy |
|---------|------|
| Header Profile Trigger | `👤 Alex Mercer` + `[ROLE]` pill |
| Modal Title | `User Profile & Access Control` |
| User Bio Subtitle | `Full-Stack Developer • Engineering Team` |
| Role Selector Section | `Simulated Role Context` |
| Role Option ADMIN | `👑 ADMIN — Full read, create, update, and delete access across all resources` |
| Role Option MEMBER | `⚡ MEMBER — Read access; can create and update tasks; cannot delete projects` |
| Role Option VIEWER | `👁️ VIEWER — Strict read-only access; all mutations and deletions disabled` |
| Toast on Role Change | `Switched active role to {ROLE}. Permissions updated.` |
| Disabled Delete Tooltip | `Only ADMIN can delete projects` |
| Disabled Mutation Tooltip | `VIEWER role has read-only access` |

---

## UI Considerations & Interaction States

| Category | Element(s) | Status | Resolution / Reason |
|----------|------------|--------|---------------------|
| Modal Overlay | `ProfileComponent` | ✅ covered | Center-fixed modal with `backdrop-filter: blur(8px)`, animated fade-in and scale `0.95 -> 1.0` |
| Role Selection | 3-Card Selector | ✅ covered | Interactive clickable cards with hover lift `translateY(-2px)` and active ring `box-shadow` |
| Header Badge | Trigger Pill | ✅ covered | Tactile button with active state `scale(0.97)` and luminous role-color border |
| Disabled Project Delete | Header `🗑️` button | ✅ covered | Set `[disabled]="activeRole() !== 'ADMIN'"` with informational title attribute |
| Disabled Task/Project Actions | `+ New Task`, `+ New Project` | ✅ covered | Set `[disabled]="activeRole() === 'VIEWER'"` with informational title attribute |
| Kanban Drag & Drop | Task Cards | ✅ covered | Set `[cdkDragDisabled]="activeRole() === 'VIEWER'"` so cards cannot be dropped into new lanes |

---

## Registry Safety

| Registry | Blocks Used | Safety Gate |
|----------|-------------|-------------|
| shadcn official | none (pure Angular 20) | not required |

---

## Checker Sign-Off

- [x] Dimension 1 Copywriting: PASS
- [x] Dimension 2 Visuals: PASS
- [x] Dimension 3 Color: PASS
- [x] Dimension 4 Typography: PASS
- [x] Dimension 5 Spacing: PASS
- [x] Dimension 6 Registry Safety: PASS

**Approval:** approved 2026-11-05
