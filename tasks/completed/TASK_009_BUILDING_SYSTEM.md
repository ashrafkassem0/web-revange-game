# TASK_009 — BUILDING_SYSTEM

## Objective
Polish the existing forest building system in `forest-build.js` (fence / gate / campfire / hut) — close UX and persistence gaps. Do **not** invent a parallel tent/workbench/chest tech tree.

## Status
**Done.** Clear Arabic placement feedback, gate `E` toggle with nearest-interact priority, repair prompts, `uid`/`maxHp`/`lit`/`open` persistence, siege HP toasts. Four structure types only.

## Detailed Mechanics & User Stories

### Keep as-is
| Structure | Cost (current) | Role |
|-----------|----------------|------|
| سياج `fenceWall` | stick×3 | Solid barrier |
| بوابة `gate` | stick×4 | Player pass / toggle |
| موقد `campfire` | stick×5 + stone×3 | Light + (TASK_007 menu) |
| كوخ `hut` | stick×12 + leather×4 + stone×4 | Sleep / shelter light |

### Gaps closed
1. **Placement feedback** — `المواد غير كافية: …` + reach/overlap Arabic reasons
2. **Gate UX** — `toggleNearbyGate` via `E`; nearest among gate/hut/campfire
3. **Repair** — `[E] 🔧 إصلاح` prompt on damaged fence/gate/hut
4. **Persistence** — serialize `hp`, `maxHp`, `open`, `lit`, `uid`
5. **Combat** — nocturnal siege damage + throttled HP toast
6. No new structure types

### Build mode rules
- Entering build closes backpack/craft/menus; soft-pauses combat (existing loop)
- Escape exits build mode

## Verification & Acceptance Criteria
- [x] `B` toggles build mode with placement preview and costs for fence/gate/campfire/hut
- [x] Placed structures block or gate correctly and redraw after reload
- [x] Hut sleep menu still works; campfires still register as lights
- [x] Insufficient materials show clear Arabic feedback
- [x] Structures persist forest → city → forest
- [x] No new parallel building tech tree beyond the four existing types
