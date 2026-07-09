# لعبة الانتقام — Development Tasks

> Production-ready task breakdown for **Revenge** (الانتقام), a browser-based 2D Arabic revenge RPG.
> Stack: **Pixi.js** (WebGL rendering) · **Vanilla JS** · **CSS3** · **Node.js + Express + SQLite** (backend)

## Structure

```
tasks/
├── SCENARIO_01_FOUNDATIONS/     — Core engine: GameState, SceneManager, Sound, Inventory
├── SCENARIO_02_FOREST/          — Forest scene completion: day/night, weather, campfires, AI
├── SCENARIO_03_CITY/            — City scene: map, NPCs, economy, quests, portals
├── SCENARIO_04_DEATH_VALLEY/    — Death Valley: hazards, elites, advanced crafting, weather
├── SCENARIO_05_DARK_KINGDOM/    — Final zone: gatekeepers, Terror King boss, ending
├── SCENARIO_06_CROSS_CUTTING/   — Skill tree, settings, mobile touch, achievements, perf
├── SCENARIO_07_MAIN_MENU/       — Enhanced main menu with map select and post-game
└── SCENARIO_08_BACKEND/         — Node.js backend: auth, save API, sync, leaderboard
```

## Task File Format

Each `.md` file contains:
- **Objective** — What this task achieves
- **Detailed Mechanics & User Stories** — Every feature, edge case, and interaction
- **Pixi.js Technical Implementation Hints** — Specific Pixi.js classes, patterns, and code
- **Verification & Acceptance Criteria** — Testable checklist

## Pixi.js Architecture

All rendering uses Pixi.js WebGL instead of raw Canvas 2D:

| Layer | Pixi.js Class | Purpose |
|-------|--------------|---------|
| Ground | `PIXI.TilingSprite` | Tile-based world map |
| Entities | `PIXI.Sprite` / `PIXI.AnimatedSprite` | Player, enemies, NPCs |
| Effects | `PIXI.ParticleContainer` | Weather, fire, smoke, particles |
| Lighting | `PIXI.Filter` / `PIXI.Mesh` | Day/night, torch, fog |
| UI | `PIXI.Text` / `PIXI.Container` | HUD, dialogues, menus |
| Transitions | `PIXI.AlphaFilter` | Fade, screen flash |

## Total

**38 tasks** across **8 scenarios**.
