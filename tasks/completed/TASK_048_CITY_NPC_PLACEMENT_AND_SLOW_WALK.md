# TASK_048 — CITY_NPC_PLACEMENT_AND_SLOW_WALK

## Status
**Done.** Talking NPCs static at building fronts (blacksmith/healer/merchant); ambient walkers at `speed ~0.025–0.03`; no patrol on service NPCs.

## Objective
Place each **talking** city NPC beside their labeled building and keep them **stationary**. Only ambient (non-talking) walkers move — at a **natural slow** pace (not the current dash).

## Depends on
- TASK_012, TASK_013 — done
- Supersedes **TASK_047** (placement only) — implement this instead of 047

## Design rule (authoritative)
| Who | Moves? |
|-----|--------|
| التاجر / المعالج / الحداد (`NPCS` — talk with E) | **No** — stand still at building front |
| Ambient walkers (`walkers` — decorative only) | **Yes** — slow natural stroll on roads |

Do **not** add patrol / pacing to service NPCs.

## Current Baseline (`game/city/index.html`)

### Interactive NPCs (static, wrong spots)
| NPC | Building label | Building footprint | Current NPC pos |
|-----|----------------|--------------------|-----------------|
| الحداد `blacksmith` | ⚒️ الحداد | `c:1, r:2` | ≈ `(10.5, 3.5)` tiles |
| المعالج `healer` | 🏥 المشفى | `c:5, r:2` | ≈ `(16.5, 8.5)` |
| التاجر `merchant` | 🛒 التاجر | `c:9, r:2` | ≈ `(5.5, 8.5)` |

### Ambient walkers (too fast)
`WALKER_WAYPOINTS` uses `speed: 0.45–0.55` with `w.t += w.speed * dt * 0.06` — reads as rushing across the plaza.

## Detailed Mechanics & User Stories

### A — Talking NPCs: place + freeze
Stand on a **walkable** stone/road tile just south of the building door (not on `BUILDING`):

| NPC | Target |
|-----|--------|
| الحداد | أمام مبنى الحداد |
| المعالج | أمام المشفى |
| التاجر | أمام مبنى التجارة / التاجر |

- Fixed `x,y` every frame — **no** `patrol`, **no** waypoint lerp on `NPCS`
- Keep E interact radius ~55px; no overlap with well / north portal / each other
- Optional soft ground marker under NPC (building accent color)
- Dialogue + `openNpcIntro` / services **unchanged**
- No enterable interiors

### B — Ambient walkers only: natural slow motion
1. Cut speeds roughly **3–5×** (e.g. `0.10–0.18` instead of `0.45–0.55`), or lower the `dt` multiplier so a road crossing takes several seconds
2. Optional polish: brief pause (0.5–1.5s) at waypoint ends so motion feels like a stroll
3. Walkers stay **non-interactive** (no dialogue, no E)
4. Walkers must not be confused with service NPCs (different emoji / no `[E]` hint)

### Out of scope
- Moving / patrolling merchant, healer, or blacksmith
- New interactive NPCs (inn / tavern / farm)
- Pathfinding around the player
- Night despawn / schedules

## Canvas 2D Implementation Hints
```javascript
// Talking NPCs — static at building fronts (tune to MAP_STR)
const NPCS = [
  { id: 'blacksmith', x: CFG.TILE * 3,    y: CFG.TILE * 5.5, /* … */ },
  { id: 'healer',     x: CFG.TILE * 7,    y: CFG.TILE * 5.5, /* … */ },
  { id: 'merchant',   x: CFG.TILE * 11.5, y: CFG.TILE * 5.5, /* … */ },
];
// Do NOT add patrol fields or update positions in the game loop

// Ambient only — calm pace
const WALKER_WAYPOINTS = [
  { pts: […], emoji: '👤', color: '#7a9a6a', speed: 0.12 }, // was ~0.5
  // …
];
```

## Verification & Acceptance Criteria
- [x] الحداد at الحداد building; المعالج at المشفى; التاجر at التاجر
- [x] Talking NPCs **never move** (fixed position while playing / talking)
- [x] Ambient walkers move at a natural slow stroll (not a dash)
- [x] Walkers have no E dialogue; only the 3 service NPCs talk
- [x] E dialogue / merchant / healer / blacksmith still work
- [x] `BUILDING` collision unchanged; player can reach all three talking NPCs
- [x] No Pixi; no new interactive NPCs

