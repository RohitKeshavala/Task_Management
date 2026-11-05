# Attractive Frontend Component Patterns & Recipes

These production-ready component recipes embody modern visual design: subtle depth, soft borders, tactile feedback, and crisp contrast.

---

## 1. Modern Interactive Card

### Visual Strategy:
- Subtly translucent slate background
- Ultra-thin 1px border (`rgba(255, 255, 255, 0.08)`)
- Smooth hover lift (`translateY(-2px)`) + ambient glow
- Clear visual hierarchy: meta badges at top, bold title, subdued body, footer actions

### CSS Recipe:
```css
.card-modern {
  background: #1e293b;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 10px;
  padding: 1rem 1.15rem;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.2), 0 2px 4px -2px rgba(0, 0, 0, 0.1);
  transition: transform 0.2s cubic-bezier(0.4, 0, 0.2, 1),
              box-shadow 0.2s cubic-bezier(0.4, 0, 0.2, 1),
              border-color 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
}

.card-modern:hover {
  transform: translateY(-2px);
  border-color: rgba(99, 102, 241, 0.35);
  box-shadow: 0 10px 20px -3px rgba(0, 0, 0, 0.35), 0 0 15px -3px rgba(99, 102, 241, 0.2);
}
```

---

## 2. Button Hierarchy & Tactile Feedback

Buttons should have clear hierarchy and immediate tactile feedback (hover lift, active scale down).

```css
/* Base Button */
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  font-size: 0.875rem;
  font-weight: 500;
  border-radius: 8px;
  border: 1px solid transparent;
  cursor: pointer;
  transition: all 0.15s cubic-bezier(0.4, 0, 0.2, 1);
  user-select: none;
}

.btn:active:not(:disabled) {
  transform: scale(0.97);
}

/* Primary Button - Luminous Gradient Accent */
.btn-primary {
  background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%);
  color: #ffffff;
  box-shadow: 0 2px 8px -1px rgba(99, 102, 241, 0.4);
}
.btn-primary:hover:not(:disabled) {
  background: linear-gradient(135deg, #4f46e5 0%, #4338ca 100%);
  box-shadow: 0 4px 14px -1px rgba(99, 102, 241, 0.55);
}

/* Secondary Button - Subtle Slate Outline */
.btn-secondary {
  background: #1e293b;
  color: #f1f5f9;
  border: 1px solid rgba(148, 163, 184, 0.2);
}
.btn-secondary:hover:not(:disabled) {
  background: #27354f;
  border-color: rgba(148, 163, 184, 0.35);
}

/* Ghost / Icon Button */
.btn-ghost {
  background: transparent;
  color: #94a3b8;
  border-color: transparent;
}
.btn-ghost:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.06);
  color: #f8fafc;
}

/* Danger Button */
.btn-danger {
  background: rgba(239, 68, 68, 0.15);
  color: #fca5a5;
  border: 1px solid rgba(239, 68, 68, 0.3);
}
.btn-danger:hover:not(:disabled) {
  background: rgba(239, 68, 68, 0.25);
  color: #ffffff;
}
```

---

## 3. Frosted Modal & Dialogs

### Visual Strategy:
- Translucent backdrop blur (`backdrop-filter: blur(8px)`)
- Smooth scale & fade-in entrance animation
- Clear divider lines and header with close button

```css
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(11, 15, 25, 0.75);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  animation: fadeIn 0.2s ease-out;
}

.modal-container {
  background: #1e293b;
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 14px;
  width: 90%;
  max-width: 520px;
  box-shadow: 0 20px 40px -8px rgba(0, 0, 0, 0.5), 0 0 24px -4px rgba(99, 102, 241, 0.15);
  animation: scaleUp 0.22s cubic-bezier(0.16, 1, 0.3, 1);
  overflow: hidden;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes scaleUp {
  from { opacity: 0; transform: scale(0.95); }
  to { opacity: 1; transform: scale(1); }
}
```

---

## 4. Polished Input & Form Controls

```css
.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  margin-bottom: 1.1rem;
}

.form-label {
  font-size: 0.8rem;
  font-weight: 500;
  color: #cbd5e1;
  letter-spacing: -0.01em;
}

.input-control {
  background: #0f172a;
  border: 1px solid rgba(148, 163, 184, 0.2);
  border-radius: 8px;
  padding: 0.6rem 0.85rem;
  color: #f8fafc;
  font-size: 0.9rem;
  outline: none;
  transition: all 0.18s ease-in-out;
}

.input-control:focus {
  border-color: #6366f1;
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.25);
  background: #131c2e;
}

.input-control::placeholder {
  color: #64748b;
}
```

---

## 5. Status Badges & Glowing Tag Pills

A vibrant dot + translucent pill gives a modern telemetry feel.

```css
.status-pill {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.25rem 0.65rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 600;
  letter-spacing: 0.02em;
  background: rgba(99, 102, 241, 0.12);
  border: 1px solid rgba(99, 102, 241, 0.28);
  color: #a5b4fc;
}

.status-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #6366f1;
  box-shadow: 0 0 6px #6366f1;
}

/* Variant: Priority Urgent */
.priority-urgent {
  background: rgba(239, 68, 68, 0.14);
  border-color: rgba(239, 68, 68, 0.35);
  color: #f87171;
}
.priority-urgent .status-dot {
  background: #ef4444;
  box-shadow: 0 0 6px #ef4444;
}
```

---

## 6. Engaging Empty States

Instead of "No items found", empty states should be visually anchored:

```html
<div class="empty-state-box">
  <div class="empty-icon-halo">📋</div>
  <h3 class="empty-title">No tasks in this column</h3>
  <p class="empty-desc">Get started by creating a new task or dragging one here.</p>
  <button class="btn btn-primary btn-sm">+ Add Task</button>
</div>
```

```css
.empty-state-box {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 2.5rem 1.5rem;
  border: 1px dashed rgba(148, 163, 184, 0.18);
  border-radius: 12px;
  background: rgba(15, 23, 42, 0.4);
}

.empty-icon-halo {
  font-size: 2rem;
  margin-bottom: 0.75rem;
  filter: drop-shadow(0 0 12px rgba(99, 102, 241, 0.3));
}

.empty-title {
  margin: 0 0 0.35rem 0;
  font-size: 0.95rem;
  font-weight: 600;
  color: #e2e8f0;
}

.empty-desc {
  margin: 0 0 1.25rem 0;
  font-size: 0.825rem;
  color: #94a3b8;
  max-width: 280px;
}
```

