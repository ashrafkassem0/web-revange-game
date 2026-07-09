# TASK_009 — BUILDING_SYSTEM

## Objective
Polish the existing forest building system in `forest-build.js` (fence / gate / campfire / hut) — close UX and persistence gaps. Do **not** invent a parallel tent/workbench/chest tech tree.

## Status
**Largely done.** Build mode (`B`), structure defs, costs, placement, solid collision, gate open/close, repair, hut sleep menu, campfire lights, draw routines, and snapshot restore (`restoreStructures`) already exist.

## Detailed Mechanics & User Stories

### Keep as-is
| Structure | Cost (current) | Role |
|-----------|----------------|------|
| سياج `fenceWall` | stick×3 | Solid barrier |
| بوابة `gate` | stick×4 | Player pass / toggle |
| موقد `campfire` | stick×5 + stone×3 | Light + (TASK_007 menu) |
| كوخ `hut` | stick×12 + leather×4 + stone×4 | Sleep / shelter light |

- `BUILD_REACH`, build panel HTML, green/red preview, `saveForestProgress` on place/remove

### Gaps to close (this task)
1. **Placement feedback** — clearer Arabic toasts for insufficient mats (`المواد غير كافية` / list missing items) and out-of-reach.
2. **Gate UX** — ensure `E` toggles nearby gate reliably without fighting hut/campfire interact priority.
3. **Repair** — verify repair cost/flow is discoverable (prompt when damaged fence/hut).
4. **Persistence** — confirm structures survive city round-trip via `maps.forest` snapshot; fix any missing fields (`lit`, `open`, `hp`, `uid`).
5. **Combat vs buildings** — if enemies already damage structures, polish HP feedback; if not, optional light damage is enough — no raid event required.
6. **Do not** add tent/workbench/chest/bed/dummy grid, merchant NPC visitors, or 8×8 camp-only zoning unless already partially present.

### Build mode rules
- Entering build closes backpack; combat can keep running or soft-pause — match current behavior, document it.
- Escape exits build mode (already wired in main).

### Edge Cases
- Overlap invalid cells stay red
- Removing structure refunds partial mats if that logic exists — keep consistent

## Canvas 2D Implementation Hints
- Authority: `game/js/forest-build.js`; input/toggle in `forest-main.js`; panel markup in `game/forest/index.html`.
- Draw structures in world pass; grid overlay only while `buildMode`.
- Lights: `getLightSources()` for night overlay in `forest-time.js`.
- Save: `forest-save.js` serializes `structures` array.

## Verification & Acceptance Criteria
- [ ] `B` toggles build mode with placement preview and costs for fence/gate/campfire/hut
- [ ] Placed structures block or gate correctly and redraw after reload
- [ ] Hut sleep menu still works; campfires still register as lights
- [ ] Insufficient materials show clear Arabic feedback
- [ ] Structures persist forest → city → forest
- [ ] No new parallel building tech tree beyond the four existing types
