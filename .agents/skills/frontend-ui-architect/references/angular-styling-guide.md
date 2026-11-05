# Angular 20 Styling & UI Integration Guide

Practical patterns for applying modern UI styling within Angular components.

---

## 1. Component `:host` Styling
Always define `:host` as a proper block or flex container to avoid sizing glitches:

```css
:host {
  display: block;
  width: 100%;
  box-sizing: border-box;
}
```

---

## 2. Dynamic Theming via CSS Custom Properties & Angular Signals
Bind dynamic values (like tag colors, progress percentages, active themes) directly using style custom property bindings:

```html
<div 
  class="custom-tag-chip"
  [style.--chip-color]="tag.color"
  [style.--chip-glow]="tag.color + '40'">
  <span class="tag-dot"></span>
  {{ tag.name }}
</div>
```

```css
.custom-tag-chip {
  background: var(--chip-glow, rgba(99, 102, 241, 0.15));
  border: 1px solid var(--chip-color, #6366f1);
  color: #ffffff;
}

.custom-tag-chip .tag-dot {
  background-color: var(--chip-color, #6366f1);
  box-shadow: 0 0 6px var(--chip-color, #6366f1);
}
```

---

## 3. Smooth State Transitions & Empty States with Signals
When switching views or toggling filters with Angular signals, avoid abrupt DOM flashes:

```html
@if (loading()) {
  <div class="skeleton-grid">
    <div class="skeleton-card" *ngFor="let i of [1,2,3]"></div>
  </div>
} @else if (tasks().length === 0) {
  <div class="empty-state-box animate-fade-in">
    <span class="empty-icon-halo">📋</span>
    <h3>No Tasks Yet</h3>
    <p>Create a task to get moving.</p>
  </div>
} @else {
  <div class="task-list animate-fade-in">
    <!-- Tasks -->
  </div>
}
```

```css
.animate-fade-in {
  animation: fadeIn 0.2s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(4px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
```

---

## 4. Drag & Drop Feedback Styling
When dragging task cards, ensure high-clarity tactile cues:

```css
/* Card currently being dragged */
.task-card.dragging {
  opacity: 0.45;
  transform: scale(0.96) rotate(1deg);
  border-style: dashed;
}

/* Kanban column receiving hover */
.kanban-column.drag-over {
  background: rgba(99, 102, 241, 0.08);
  border: 2px dashed rgba(99, 102, 241, 0.6);
  box-shadow: inset 0 0 20px rgba(99, 102, 241, 0.15);
}
```

---

## 5. Modern Thin Dark Scrollbars

```css
/* Subtle custom scrollbar */
::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}
::-webkit-scrollbar-track {
  background: rgba(15, 23, 42, 0.6);
}
::-webkit-scrollbar-thumb {
  background: #334155;
  border-radius: 9999px;
}
::-webkit-scrollbar-thumb:hover {
  background: #475569;
}
```

