# Revenge Game — Project Plans & Scenarios

> Browser-based 2D Arabic revenge RPG  
> Stack: Vanilla JS · HTML5 Canvas · CSS3

---

## Game Overview

A 2D top-down RPG where the protagonist **أشرف** seeks revenge after losing his family.  
The journey spans multiple scenes: **Main Menu → Forest (training) → City → Future stages**.

---

## Current Scenes

| Scene | File | Status |
|-------|------|--------|
| Main Menu | `game/index.html` | ✅ Complete |
| Forest | `game/forest/index.html` + `game/js/forest-*.js` | ✅ Complete |
| City | `game/city/index.html` | 🔧 In progress |

---

## Completed Features

### Main Menu (`game/index.html`)
- Arabic intro story with typewriter effect
- New Game / Continue Game / Settings buttons
- **Continue Game** skips the forest intro and enters directly into the game world (`skipForestIntro` flag)
- SFX on button clicks

### Forest Scene
- **World Generation** — tile-based map with biomes: grass, rock, dark forest, sand, water
- **Zoom** — set to `1.5` (reduced from `2.0`) for higher visible resolution / less pixel-block feel
- **Player** — WASD movement, sword / bow weapons, health/XP/stamina HUD
- **Combat** — melee attack (`E`/`Space`), bow + arrows (`2` key), poison system
- **Crafting** — press `F` to open crafting menu
- **Fishing** — press `R` near water
- **Resources** — trees (chop), drops (pick up with `E`)
- **Enemies with natural habitats** — wolves on rocky mountains, bears near water/forest, crocodiles in water (swim-capable), rabbits in open forest, snakes in dark zones
- **City Portal** — glowing ring indicator; shows a dialogue panel (not forced entry); player chooses to go or stay
- **Completion Banner** — slim non-blocking top banner when all enemies defeated; game continues running
- **Idle Poem System** — after 10 s of no movement, a random Arabic classical poem appears with typewriter verse animation; dismisses instantly on movement

### Poem System Details
- 5 hardcoded fallback poems available immediately at game start
- Full `arabic_poems.json` dataset loaded 4 s after start (XHR, first 80 poems parsed)
- Custom parser reads only first N poems from the 20 MB file to avoid UI-thread freeze
- All poem timers tracked in a `Set`; `stopIdlePoem()` cancels every pending timer at once
- Poem dismissed instantly when any movement key (WASD / Arrow) is pressed

---

## Architecture

```
game/
├── index.html              — Main menu
├── city/
│   └── index.html          — City scene
├── forest/
│   └── index.html          — Forest scene (HTML + CSS)
├── js/
│   ├── forest-config.js    — Constants (ZOOM, tile sizes, portals …)
│   ├── forest-world.js     — World generation, enemy spawning (habitat zones)
│   ├── forest-entities.js  — Enemy class, AI, swimming logic
│   ├── forest-player.js    — Player state, movement, stats
│   ├── forest-combat.js    — Attack, arrows, poison
│   ├── forest-hud.js       — HUD draw, minimap, portal glow
│   ├── forest-save.js      — LocalStorage save/load
│   ├── forest-main.js      — Game loop, input, poem system, portal panel
│   └── characters.js       — Enemy templates (stats, behavior, swims flag)
├── data/
│   └── arabic_poems.json   — Classical Arabic poem dataset
└── textures/               — Tile textures (grass, rock, dark, sand, water, deep)
```

---

## Key Design Decisions

| Decision | Rationale |
|----------|-----------|
| Separate `forest-*.js` modules | Keeps game-loop file manageable; easier to extend per-scene |
| `GameState` singleton in `localStorage` | Persists progress across page navigations without a backend |
| `skipForestIntro` flag | Continue Game skips the unskippable story sequence |
| City portal panel instead of forced `E` entry | Player agency; hint shown, deliberate action required |
| Completion banner instead of full overlay | Game keeps running so player can navigate freely |
| `swims: true` on crocodile template | Single flag enables water-preference wander + no water collision |
| Habitat zone spawn table in `spawnEnemies()` | Tile-type affinity ensures natural placement without hard coordinates |
| Poem parser reads first 80 poems only | Avoids 100–300 ms UI freeze from parsing the full 20 MB JSON |

---

## Planned Next Steps

### City Scene
- [ ] City map with districts (market, barracks, palace)
- [ ] NPC interactions and quest givers
- [ ] Boss encounter: the main villain
- [ ] Economy system (buy/sell at market)

### Forest Enhancements
- [ ] Day/night cycle affecting enemy behavior
- [ ] Weather effects (rain, fog)
- [ ] More resource types (herbs, minerals)
- [ ] Save points / campfires

### Cross-Scene Features
- [ ] Persistent inventory between scenes
- [ ] Skill tree / level-up screen
- [ ] Settings screen (volume, zoom, language)
- [ ] Mobile touch controls

---

## Enemy Habitat Map

| Enemy | Preferred Tile | Zone (approx.) |
|-------|---------------|----------------|
| Wolf | Rock (`T.ROCK`) | North mountains |
| Bear | Any land near water | Mid-west, riverbanks |
| Crocodile | Water (`T.WATER`) | River / lake areas |
| Rabbit | Grass / dark forest | Open central zones |
| Snake | Dark forest (`T.DARK`) | South-east dark zone |

---

## Input Reference

| Key | Action |
|-----|--------|
| W A S D / Arrows | Move |
| E | Interact (chop, pick up, melee) |
| Space | Sword attack |
| F | Crafting menu |
| Q | Eat meat |
| R | Fish (near water) |
| 1 | Equip sword |
| 2 | Equip bow |
| Escape | Close menu |
