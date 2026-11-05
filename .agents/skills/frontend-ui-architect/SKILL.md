---
name: frontend-ui-architect
description: >-
  Framework and decision-making runbook for designing attractive, high-polish frontend user interfaces.
  Use this skill whenever working on UI components, templates, styling, animations, layouts, typography,
  color palettes, or visual polish to make the application look modern, captivating, and cohesive.
---

# Frontend UI Architect & Decision Framework

This skill guides the primary agent and subagents in making **superior frontend UI/UX decisions** so every component, view, and interaction in the project feels visually attractive, professional, tactile, and modern.

---

## The 6-Step Frontend UI Decision Process

When tasked with creating or modifying any UI element, follow this 6-step framework:

```
┌─────────────────────────────────────────────────────────────┐
│ 1. Hierarchy & Purpose: Identify the primary user focus    │
│ 2. Elevation & Depth: Establish layered surfaces (no flat)  │
│ 3. Typography & Spacing: Apply tight tracking & 8pt scale   │
│ 4. Color & Accents: Enforce 60-30-10 palette balance        │
│ 5. Motion & Feedback: Add hover lift, focus rings, clicks   │
│ 6. Visual Audit: Pass the 10-point polish checklist         │
└─────────────────────────────────────────────────────────────┘
```

---

### Step 1: Hierarchy & Focal Point
- **Define the Primary Action**: Every screen or card must have exactly one obvious primary action (e.g. `+ New Task`, `Save`). Use vibrant luminous styling for this.
- **De-clutter Secondary Actions**: Secondary actions (cancel, edit, filter) should use ghost or subtle outline buttons.
- **Information Chunking**: Group related fields together with consistent margins (12px to 16px).

### Step 2: Elevation & Depth Layering
- **Never use flat single-color blocks**: Use layered surfaces:
  - Background Canvas: `#0b0f19` / `#0f172a`
  - Container / Card: `#1e293b` with a 1px border `rgba(255, 255, 255, 0.08)`
  - Hover / Active Surface: `#27354f` with subtle ambient glow `0 0 16px -2px rgba(99, 102, 241, 0.25)`
  - Modals & Floating Overlays: Frosted glass with `backdrop-filter: blur(8px)` and `rgba(30, 41, 59, 0.85)`
- **See Reference**: [Design Tokens Reference](./references/design-tokens.md)

### Step 3: Typography & Layout Craft
- **Headings**: Use bold weights (600-700) with slight negative letter-spacing (`-0.02em` to `-0.03em`) to achieve a high-end designer look.
- **Body & Labels**: Keep font size at `0.875rem` (14px) with high readability (`#cbd5e1`).
- **Metadata & Micro-badges**: Use `0.75rem` (12px) with slight positive letter spacing (`+0.02em`).
- **Spacing Grid**: Use multiples of 4px / 8px (4, 8, 12, 16, 20, 24, 32px).

### Step 4: Color Harmony (The 60-30-10 Rule)
- **60% Dominant Neutral**: Dark slate canvas and container borders (`#0f172a`, `#1e293b`).
- **30% Structural Secondary**: Subtle borders, muted text, headers, and secondary badges.
- **10% Intentional Accent**: Primary buttons, active pill indicators, glowing notification dots (`#6366f1` Indigo, `#3b82f6` Blue, or semantic colors).
- **Status Pills**: Avoid harsh solid neon rectangles. Use a 12% translucent background + 30% border + solid glowing indicator dot:
  ```css
  background: rgba(16, 185, 129, 0.12);
  border: 1px solid rgba(16, 185, 129, 0.3);
  color: #34d399;
  ```

### Step 5: Tactile Micro-Interactions
- **Cards**: Add subtle lift on hover: `transform: translateY(-2px);` with `transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1)`.
- **Buttons**: Provide active feedback: `transform: scale(0.97);` on `:active`.
- **Inputs**: Luminous outer glow on focus: `box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.25);`.
- **Drag & Drop**: Highlight drop targets with dashed borders and faint ambient glow.
- **See Reference**: [Component Patterns](./references/component-patterns.md)

### Step 6: 10-Point Aesthetic Audit
Before considering any UI task complete, test against the:
- [Visual Polish Checklist](./references/visual-polish-checklist.md)
- [Angular 20 Styling Guide](./references/angular-styling-guide.md)

---

## Before & After Aesthetic Upgrade Examples

### 1. Plain Flat Card vs. Modern Tactile Card
| Element | Plain Flat Approach (Avoid) | Modern Tactile Approach (Apply) |
| :--- | :--- | :--- |
| **Background** | Solid `#222222` | `#1e293b` with 1px `rgba(255, 255, 255, 0.08)` border |
| **Shadow** | None or harsh black drop shadow | Soft ambient `0 4px 12px -2px rgba(0,0,0,0.3)` |
| **Hover** | Static or simple background darken | Lift `translateY(-2px)`, border glow `#6366f1` |
| **Tags** | Plain square text blocks | Rounded pill with glowing indicator dot |

### 2. Modals & Dialogs
| Element | Generic Approach | Elevated Approach |
| :--- | :--- | :--- |
| **Backdrop** | Black 50% opacity | `rgba(11, 15, 25, 0.75)` with `backdrop-filter: blur(8px)` |
| **Entrance** | Sudden pop-in | Smooth `scale(0.95) -> scale(1)` + `opacity` (200ms) |
| **Borders** | Thick gray border | Subdued translucent top border highlight |

---

## When to Invoke the `frontend-ui-designer` Subagent

Delegate directly to the `frontend-ui-designer` subagent whenever:
1. Designing a new page, dashboard, modal, or component layout from scratch.
2. The user requests to make the UI "look cleaner", "more modern", "attractive", or "polished".
3. Redesigning complex workflows (e.g. Kanban boards, drag-and-drop, data grids, filter bars).
4. Creating animations, micro-interactions, or theming systems.
