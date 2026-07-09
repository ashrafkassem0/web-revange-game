# لعبة الانتقام — Development Tasks

> Production-ready task breakdown for **Revenge** (الانتقام), a browser-based 2D Arabic revenge RPG.
> Stack: **HTML5 Canvas 2D** · **Vanilla JS** · **CSS3** · **Node.js + Express + SQLite** (backend)

## Structure

```
tasks/
├── completed/                 — Done (server APIs: 034–036)
├── PHASE_01_FOUNDATIONS/      — GameState, SceneManager, Sound, Inventory
├── PHASE_02_FOREST/           — Day/night, weather, campfires, resources, AI
├── PHASE_03_CITY/             — Map, NPCs, economy, quests, portals
├── PHASE_04_DEATH_VALLEY/     — Hazards, elites, advanced crafting, weather
├── PHASE_05_DARK_KINGDOM/     — Gatekeepers, Terror King, ending
├── PHASE_06_CROSS_CUTTING/    — Skill tree, settings, mobile, achievements, perf
├── PHASE_07_MAIN_MENU/        — Enhanced main menu / map select / NG+
└── PHASE_08_CLIENT_SYNC/      — Wire game client to backend + leaderboard UI
```

## Execution Order (dependency-safe)

Execute **one phase at a time**, and within each phase **top → bottom**.  
No task depends on a later unfinished task.

| # | Task | Depends on (must be done first) |
|---|------|----------------------------------|
| 1 | TASK_001 GameState refactor | — |
| 2 | TASK_002 SceneManager | 001 |
| 3 | TASK_003 Sound engine | — |
| 4 | TASK_004 Cross-scene inventory | 001, 002 |
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
| 24 | TASK_024 Elite guards | 023, 020 |
| 25 | TASK_025 Terror King boss | 024 |
| 26 | TASK_026 Boss fight refinement | 025, 003 |
| 27 | TASK_027 Ending cutscene | 025 |
| 28 | TASK_028 Skill tree | 001, 004 |
| 29 | TASK_029 Settings screen | 003 |
| 30 | TASK_030 Mobile touch | 002 |
| 31 | TASK_031 Achievements | 001 |
| 32 | TASK_032 Performance | after scenes exist (012+) |
| 33 | TASK_033 Advanced main menu | 002, 017, 027, 029, 031 |
| 34 | TASK_037 Client integration | 001, ~~034–036~~ (done) |
| 35 | TASK_038 Leaderboard UI | 037, 029 |

> **Completed (skip):** TASK_034, TASK_035, TASK_036 → see [`completed/`](./completed/)

## Audit notes (current codebase)

- Forest + small city hub exist (Canvas 2D + HTML/CSS overlays).
- Death Valley / Dark Kingdom / ending scenes: **not started**.
- Backend auth + saves + leaderboard **API**: **done** (034–036).
- Client sync / auth UI / leaderboard UI: **not started** (037–038).
- Many early tasks (001–015, etc.) have **partial** stubs — treat them as **still open** until acceptance criteria pass.

## Task File Format

Each `.md` file contains:
- **Objective** — What this task achieves
- **Detailed Mechanics & User Stories** — Every feature, edge case, and interaction
- **Canvas 2D / Implementation Hints** — Canvas 2D, HTML/CSS overlay patterns, and code
- **Verification & Acceptance Criteria** — Testable checklist

## Canvas 2D Architecture

All world rendering uses HTML5 Canvas 2D (`canvas.getContext('2d')`) with a `requestAnimationFrame` game loop. UI menus and HUD overlays use HTML/CSS.

| Layer | Approach | Purpose |
|-------|----------|---------|
| Ground | Pre-rendered offscreen canvas | Tile-based world map, static terrain |
| Entities | Drawn each frame with `ctx` | Player, enemies, NPCs |
| Effects | Plain JS particle arrays | Weather, fire, smoke, particles |
| Lighting | `rgba` overlays / radial gradients | Day/night, torch, fog |
| UI | HTML/CSS overlays | HUD, dialogues, menus, modals |
| Transitions | CSS `.fade-overlay` | Fade, scene transitions |

## Totals

- **Completed:** 3 (034–036)
- **Remaining:** 35 (001–033, 037–038)
- **Phases:** 8 execution phases + `completed/`
