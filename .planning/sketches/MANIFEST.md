# Sketch Manifest

## Design Direction
Modern Linear / Raycast aesthetic: deep layered dark slate canvas (`#0b0f19` / `#0f172a`), razor-sharp Inter typography with tight negative tracking (`-0.02em`), 1px translucent glass borders (`rgba(255, 255, 255, 0.08)`), luminous accent pills, and tactile hover lifts (`translateY(-2px)`). Production-grade responsiveness and dark/light theme support.

## Reference Points
- **Linear (linear.app)**: Razor-thin 1px borders, subtle depth, high information density, glowing status indicators, keyboard-centric micro-interactions.
- **Raycast (raycast.com)**: Tactile feel, frosted glass overlays (`backdrop-filter: blur(12px)`), luminous focus rings, refined badge pills.
- **TaskFlow Domain Model**: Angular 20 Standalone Signals, RBAC roles (`ADMIN`, `MEMBER`, `VIEWER`), DAG dependency blocker warnings, custom calendar datepicker, priority tags.

## Sketches

| Number | Name | Design Question | Approach | Variants | Winner | Status |
|---|---|---|---|---|---|---|
| 001 | kanban-board-cards | How should the core Kanban board and task cards look and behave to feel like Linear? | Card density, glowing priority pills, blocker badges, tactile drag states | 3 (A: Linear Minimal, B: Raycast Tactile Glass, C: High-Density Monolith) | | Ready for Review |
| 002 | header-filter-hub | How should the app header and filter bar present project switching, search, and RBAC badges seamlessly? | Unified command header vs two-tier toolbar vs compact studio bar | 3 (A: Integrated Command Bar, B: Two-Tier Linear Workspace, C: Compact Studio Bar) | | Ready for Review |
| 003 | modals-datepicker | How should modal dialogs, task creation forms, and calendar datepickers feel for a desktop-grade experience? | Frosted glass dialogs, luminous focus rings, pill presets, interactive datepicker grid | 3 (A: Frosted Glass Dialog, B: Sharp Minimalist Slate, C: Floating Layered Sheet) | | Ready for Review |

