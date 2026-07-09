# لعبة الانتقام — Development Tasks

> Production-ready task breakdown for **Revenge** (الانتقام), a browser-based 2D Arabic revenge RPG.  
> Stack: **HTML5 Canvas 2D** · **Vanilla JS** · **CSS3** · **Node.js + Express + SQLite** (backend)

## Rewrite policy (not delete)

All task markdown files are **kept** (same filenames and task IDs). When plans drifted toward Pixi or oversized systems, tasks were **rewritten** to match the real game: **multi-page HTML + Canvas 2D + HTML/CSS overlays**. Nothing in `tasks/` was deleted for scope cuts — scope was reduced inside the files instead.

**Zero Pixi** anywhere in remaining work.

## Structure

```
tasks/
├── completed/                 — Done (001, server APIs 034–036)
├── PHASE_01_FOUNDATIONS/      — GameState, SceneManager, Sound, Inventory
├── PHASE_02_FOREST/           — Day/night, weather (006), campfires, resources, AI
├── PHASE_03_CITY/             — Map, NPCs, economy, quests, portals
├── PHASE_04_DEATH_VALLEY/     — Map, hazards (019), elites, crafting, weather (022)
├── PHASE_05_DARK_KINGDOM/     — Fortress map, gatekeepers, boss pages, ending
├── PHASE_06_CROSS_CUTTING/    — Level-up picks, settings, mobile, achievements, perf
├── PHASE_07_MAIN_MENU/        — Enhanced main menu / map select / completion badge
└── PHASE_08_CLIENT_SYNC/      — Client auth/sync + leaderboard UI
```

## Execution Order (dependency-safe)

Execute **one phase at a time**, and within each phase **top → bottom**.  
No task depends on a later unfinished task.

| # | Task | Depends on (must be done first) |
|---|------|----------------------------------|
| 1 | TASK_001 GameState refactor | — *(done — see `completed/`)* |
| 2 | TASK_002 SceneManager | 001 *(done — see `completed/`)* |
| 3 | TASK_003 Sound engine | — *(done — see `completed/`)* |
| 4 | TASK_004 Cross-scene inventory | 001, 002 *(done — see `completed/`)* |
| 5 | TASK_005 Day/night cycle | 001 |
| 6 | TASK_006 Weather system | 005 (optional polish with 003) |
| 7 | TASK_007 Campfire save points | 001, 005 |
| 8 | TASK_008 Advanced resources | 004 |
| 9 | TASK_009 Building system | 007, 008 |
| 10 | TASK_010 Enemy AI refinement | 005 |
| 11 | TASK_011 Forest completion flow | 002, 004, 010 |
| 12 | TASK_012 City map | 002 |
| 13 | TASK_013 NPC system | 012 |
| 14 | TASK_014 Economy / merchant | 013, 004 |
| 15 | TASK_015 Healer & blacksmith | 013, 004 |
| 16 | TASK_016 City quests | 013, 014 |
| 17 | TASK_017 City portal integration | 002, 011, 016 |
| 18 | TASK_018 Death Valley map | 017 |
| 19 | TASK_019 Hazardous terrain | 018 |
| 20 | TASK_020 Elite enemies | 018 |
| 21 | TASK_021 Advanced crafting | 008, 009, 020 |
| 22 | TASK_022 Weather extremes | 006, 018 |
| 23 | TASK_023 Dark Kingdom map | 018 |
| 24 | TASK_024 Elite guards (1–2) | 023, 020 |
| 25 | TASK_025 Terror King boss | 024 |
| 26 | TASK_026 Boss fight polish | 025, 003 |
| 27 | TASK_027 Ending cutscene | 025 |
| 28 | TASK_028 Level-up skill picks | 001, 004 |
| 29 | TASK_029 Settings screen | 003 |
| 30 | TASK_030 Mobile touch | 002 |
| 31 | TASK_031 Achievements | 001 |
| 32 | TASK_032 Performance | after scenes exist (012+) |
| 33 | TASK_033 Advanced main menu | 002, 017, 027, 029, 031 |
| 34 | TASK_037 Client integration | 001, ~~034–036~~ (done) |
| 35 | TASK_038 Leaderboard UI | 037, 029 |

> **Completed (skip implementation):** TASK_001–004, TASK_034, TASK_035, TASK_036 → see [`completed/`](./completed/)  
> Weather tasks **006** and **022** remain in the plan.  
> TASK_019 remains in the execution table (Death Valley hazards).

## Audit notes (current codebase)

- **Forest** (full) + **city** (stub) + **start** (intro) + **index** (menu): Canvas 2D + HTML/CSS overlays.
- `SaveManager.mapUrlFor` currently stubs `deathValley` / `darkKingdom` → forest until those pages exist.
- Boss / ending should be **new pages** (e.g. `game/boss/index.html`, `game/ending/index.html`, `game/dark-kingdom/index.html`) mirroring `start/` and `forest/`.
- Enemies: `characters.js` + `forest-entities.js` style objects drawn with `ctx`.
- Skills: `heroStats.skills` + XP/level in `GameState` — level-up = simple HTML 3-choice panel (028), not a Pixi tree.
- Backend auth + saves + leaderboard **API**: **done** (034–036).
- Client sync / auth UI / leaderboard UI: **not started** (037–038).
- Early tasks may be partially implemented — leave open until acceptance criteria pass (except completed/).

## Task File Format

Each `.md` file contains:
- **Objective** — What this task achieves
- **Detailed Mechanics & User Stories** — Scoped features and edge cases
- **Canvas 2D / Implementation Hints** — Canvas 2D, HTML/CSS overlays, file paths
- **Verification & Acceptance Criteria** — Testable checklist

## Canvas 2D Architecture

All world rendering uses HTML5 Canvas 2D (`canvas.getContext('2d')`) with a `requestAnimationFrame` game loop. UI menus and HUD overlays use HTML/CSS.

| Layer | Approach | Purpose |
|-------|----------|---------|
| Ground | Pre-rendered offscreen canvas | Tile-based world map, static terrain |
| Entities | Drawn each frame with `ctx` | Player, enemies, NPCs |
| Effects | Plain JS particle arrays | Weather, fire, ash (capped) |
| Lighting | `rgba` overlays / radial gradients | Day/night, torch, fortress dark |
| UI | HTML/CSS overlays | HUD, dialogues, menus, modals, settings |
| Transitions | CSS `.fade-overlay` + multi-page navigations | Scene changes |

## Totals

- **~38 tasks** in the plan (IDs 001–033 + 037–038; server 034–036 live under `completed/`)
- **Completed:** 001–004, 034, 035, 036 (7)
- **Remaining open files:** 005–033, 037–038 (weather 006 & 022 included)
- **Phases:** 8 execution phases + `completed/`
- **Pixi:** none
