# Frontend UI Design Tokens & Foundations

These design tokens serve as the single source of truth for creating cohesive, modern, and attractive UI across the project. Use these tokens in CSS variables, SCSS, or utility classes.

---

## 1. Color Palette: Dark & Slate Theme (Primary)

Modern dark interfaces rely on deep, rich slate/navy hues rather than flat pitch black (#000000) or bland grays (#333333).

### Canvas & Surfaces
| Token | Value | Purpose |
| :--- | :--- | :--- |
| `--surface-canvas` | `#0b0f19` | Deepest root background / body |
| `--surface-subtle` | `#0f172a` | App shell, sidebars, main panels |
| `--surface-card` | `#1e293b` | Primary cards, content containers, tables |
| `--surface-elevated` | `#27354f` | Raised cards on hover, popovers, dropdowns |
| `--surface-modal` | `rgba(30, 41, 59, 0.85)` | Modals, dialogs, drawers (with backdrop blur) |
| `--surface-glass` | `rgba(255, 255, 255, 0.04)` | Glassmorphism card surfaces, frosted overlays |

### Borders & Dividers
| Token | Value | Purpose |
| :--- | :--- | :--- |
| `--border-subtle` | `rgba(255, 255, 255, 0.06)` | Quiet borders between list items or columns |
| `--border-default` | `rgba(148, 163, 184, 0.16)` | Card borders, container outlines |
| `--border-strong` | `rgba(148, 163, 184, 0.30)` | Active inputs, selected states, headers |
| `--border-accent` | `rgba(99, 102, 241, 0.50)` | Primary accent focus border |

### Typography & Text Contrast
| Token | Value | Purpose |
| :--- | :--- | :--- |
| `--text-primary` | `#f8fafc` (Slate 50) | Main headlines, titles, active labels (high contrast) |
| `--text-secondary` | `#cbd5e1` (Slate 300) | Body copy, card descriptions, readable paragraphs |
| `--text-muted` | `#94a3b8` (Slate 400) | Secondary metadata, timestamps, helper text |
| `--text-subtle` | `#64748b` (Slate 500) | Placeholders, inactive icons, keyboard shortcuts |

### Accent & Brand Gradients
| Token | Value / Gradient | Purpose |
| :--- | :--- | :--- |
| `--accent-primary` | `#6366f1` (Indigo 500) | Primary buttons, active tabs, brand highlights |
| `--accent-hover` | `#4f46e5` (Indigo 600) | Primary button hover state |
| `--accent-glow` | `rgba(99, 102, 241, 0.35)` | Ambient card glow, outer focus rings |
| `--brand-gradient` | `linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #ec4899 100%)` | Hero badges, logos, special CTA borders |

### Semantic Status Colors
| State | Solid Base | Soft Tint (Bg) | Border Tint | Text |
| :--- | :--- | :--- | :--- | :--- |
| **Success** | `#10b981` (Emerald) | `rgba(16, 185, 129, 0.12)` | `rgba(16, 185, 129, 0.3)` | `#34d399` |
| **Warning** | `#f59e0b` (Amber) | `rgba(245, 158, 11, 0.12)` | `rgba(245, 158, 11, 0.3)` | `#fbbf24` |
| **Danger** | `#ef4444` (Rose) | `rgba(239, 68, 68, 0.12)` | `rgba(239, 68, 68, 0.3)` | `#f87171` |
| **Info / Tech** | `#0ea5e9` (Sky) | `rgba(14, 165, 233, 0.12)` | `rgba(14, 165, 233, 0.3)` | `#38bdf8` |

---

## 2. Typography Scale & Letter Spacing

| Style | Size | Weight | Line Height | Tracking (Letter Spacing) |
| :--- | :--- | :--- | :--- | :--- |
| **Display Title** | `2rem` (32px) | 700 / Bold | 1.2 | `-0.03em` |
| **Heading 1** | `1.5rem` (24px) | 700 / Bold | 1.25 | `-0.025em` |
| **Heading 2** | `1.25rem` (20px) | 600 / SemiBold | 1.3 | `-0.02em` |
| **Heading 3 / Card Title** | `1rem` (16px) | 600 / SemiBold | 1.4 | `-0.015em` |
| **Body (Default)** | `0.875rem` (14px) | 400 / Regular | 1.5 | `normal` |
| **Body (Medium)** | `0.875rem` (14px) | 500 / Medium | 1.5 | `normal` |
| **Small / Meta** | `0.75rem` (12px) | 500 / Medium | 1.4 | `+0.01em` |
| **Code / Micro-Pill** | `0.7rem` (11.2px) | 600 / SemiBold | 1.3 | `+0.04em` (Uppercase) |

> **Typography Rule**: Large headlines should always have negative letter-spacing (`-0.02em` to `-0.03em`) to look compact, modern, and designer-crafted. Small uppercase badges must have positive letter-spacing (`+0.03em` to `+0.05em`) for legibility.

---

## 3. Elevation, Box Shadows & Glassmorphism

```css
/* Multi-layered soft ambient shadows */
--shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.2);
--shadow-md: 0 4px 12px -2px rgba(0, 0, 0, 0.3), 0 2px 4px -2px rgba(0, 0, 0, 0.2);
--shadow-lg: 0 12px 32px -4px rgba(0, 0, 0, 0.4), 0 4px 12px -2px rgba(0, 0, 0, 0.25);
--shadow-glow: 0 0 20px -3px rgba(99, 102, 241, 0.4);

/* Glassmorphism recipe */
--glass-bg: rgba(30, 41, 59, 0.72);
--glass-blur: blur(12px);
--glass-border: 1px solid rgba(255, 255, 255, 0.08);
```

---

## 4. Spacing Scale (8pt Grid System)

- `space-1`: `0.25rem` (4px) - micro spacing, icon-to-text gap
- `space-2`: `0.5rem` (8px) - badge padding, compact element gaps
- `space-3`: `0.75rem` (12px) - card internal element margins
- `space-4`: `1rem` (16px) - standard container padding
- `space-5`: `1.25rem` (20px) - card content padding
- `space-6`: `1.5rem` (24px) - grid gaps, section margins
- `space-8`: `2rem` (32px) - large layout gaps

---

## 5. Border Radius (Radii)

- `--radius-xs`: `4px` - micro tags, checkboxes
- `--radius-sm`: `6px` - buttons, input fields, badges
- `--radius-md`: `10px` - task cards, dropdown menus
- `--radius-lg`: `16px` - modals, dialog cards, large containers
- `--radius-pill`: `9999px` - pill badges, status chips, floating controls

---

## 6. Timing & Transitions (Tactile Micro-interactions)

```css
--transition-fast: 150ms cubic-bezier(0.4, 0, 0.2, 1);
--transition-base: 200ms cubic-bezier(0.4, 0, 0.2, 1);
--transition-spring: 300ms cubic-bezier(0.34, 1.56, 0.64, 1);
```

