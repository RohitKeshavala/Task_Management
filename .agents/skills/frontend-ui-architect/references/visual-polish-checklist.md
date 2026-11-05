# 10-Point Visual Polish & Decision Audit

Before finalizing any frontend UI feature or change, run through this 10-point rubric to ensure the interface is attractive, intentional, and high-quality.

---

## The 10-Point Aesthetic Rubric

### 1. Visual Hierarchy & Contrast
- [ ] Is there an obvious primary focal point on the page or card?
- [ ] Are headings clearly differentiated from body copy through weight, size, and slight negative letter-spacing?
- [ ] Does text contrast pass WCAG AA standards (minimum 4.5:1 for body text, 3:1 for large text)?
- [ ] Is secondary/tertiary text muted (`#94a3b8` / `#64748b`) rather than competing with primary text?

### 2. Surface Depth & Elevation Layering
- [ ] Does the UI feel layered rather than flat? (Canvas -> Surface -> Card -> Hover -> Popover)
- [ ] Are borders subtle and translucent (`rgba(255, 255, 255, 0.08)`) rather than harsh solid lines (`#ffffff` or `#555555`)?
- [ ] Do shadows use multi-layer ambient dispersion instead of harsh black drops?

### 3. Color Harmony & Restraint (60-30-10 Rule)
- [ ] Does the design respect the 60-30-10 rule? (60% background/neutral, 30% card/surface, 10% intentional accent)
- [ ] Are status badges/tags using soft translucent backgrounds with saturated text/dots rather than harsh solid neon rectangles?
- [ ] Do colors harmonize with the dark slate theme (`#0f172a`, `#1e293b`, `#6366f1`)?

### 4. Spacing Consistency & Breathing Room
- [ ] Does all padding and margin adhere to the 4px/8px grid scale?
- [ ] Are related elements grouped closely (4-8px) and distinct sections separated generously (16-32px)?
- [ ] Do cards have adequate inner padding (at least 16px to 20px) so content doesn't feel cramped?

### 5. Tactile Micro-Interactions & Hover States
- [ ] Do interactive elements (buttons, cards, chips, rows) have visible hover, active, and focus states?
- [ ] Is there an active press feedback (`transform: scale(0.98)` or `translateY(0)`) on buttons?
- [ ] Are transitions bounded between 150ms and 250ms with `cubic-bezier(0.4, 0, 0.2, 1)`?

### 6. Form Fields & Interactive Controls
- [ ] Do inputs feature a luminous focus ring (`box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.25)`)?
- [ ] Are placeholders legible but distinctly muted?
- [ ] Are interactive click targets at least 40px x 40px (or 44px on mobile)?

### 7. Empty, Loading & Error States
- [ ] Are empty states visually engaging with an icon/halo, descriptive headline, and direct call-to-action?
- [ ] Do loading states maintain layout stability (e.g. skeleton placeholders rather than jarring content jumps)?
- [ ] Are errors presented with friendly, actionable inline alerts with retry mechanisms?

### 8. Typography Craft & Polish
- [ ] Are titles using modern tracking (`-0.02em` to `-0.03em`)?
- [ ] Are uppercase pills or tags given positive letter-spacing (`+0.04em`)?
- [ ] Is line height comfortable (1.4 - 1.6 for body copy)?

### 9. Responsiveness & Edge Cases
- [ ] Does the layout adapt gracefully from desktop (>1200px) to tablet (768px-1024px) and mobile (<640px)?
- [ ] Does long text truncate gracefully with ellipsis (`text-overflow: ellipsis`) or wrap cleanly without breaking card layouts?
- [ ] Are scrollbars customized with thin, dark tracks rather than native chunky browser scrollbars?

### 10. Cohesion with Design System
- [ ] Does this component look like it belongs in the same family as existing TaskFlow components?
- [ ] Does it avoid introducing random rogue colors, fonts, or arbitrary border radii?

