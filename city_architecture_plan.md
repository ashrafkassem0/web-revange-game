# City Stage Architecture Plan (Generalized Framework Edition)

## Scope

The City Stage is the safe social hub between forest expeditions. It contains streets, buildings, interactive citizens, a player HUD, a minimap, quests, and travel gates. 

To prevent code duplication across the Forest, City, and future stages, the stage logic is split into a **generalized, data-driven framework** and **stage-specific configurations**.

---

## 1. Generalized Core Modules (Reusable)

These classes are shared globally in `game/js/core/` and are inherited or instantiated by any stage:

| Module | Location | Responsibility |
| --- | --- | --- |
| **BaseTerrainManager** | `game/js/core/base-terrain.js` | Manages grids, walkability/collisions, and pre-renders terrain using texture bombing. |
| **BaseNPCManager** | `game/js/core/base-npcs.js` | Drives static NPCs and roaming citizens/animals (schedules, conversations, speech bubbles). |
| **BaseTimeWeatherSystem** | `game/js/core/base-weather.js` | Controls game clock, ambient day/night color tints, and weather particles (rain, leaves, snow). |

---

## 2. City-v2 Specific Modules

The new modular city-v2 stage is located in `game/city-v2/` and uses the core classes with custom configurations.

### A. Configuration & State Files

#### `game/city-v2/js/city-config.js`
* Defines map size (22x18), tile size (48), speeds, portal locations (Forest Portal, South Gate).
* Configures day/night color nodes and supported weather types (Clear, Sun Shower, Autumn Breeze, Snowy, Fog).

#### `game/city-v2/js/city-data.js`
* Defines item translations, merchant trade recipes (barter, sell, buy), bakery recipes (tarts, honey cakes), bookstore content, and academy badges.
* Stores dialog data for static NPCs and roaming citizens/kids/animals in Arabic.

#### `game/city-v2/js/city-state.js`
* Manages runtime city state (player coordinates, current weather active variables, clock).
* Persists inventory, coins, badges, and quest progress to `GameState`.

### B. World & Entity Extenders

#### `game/city-v2/js/city-map.js`
* Integrates `BaseTerrainManager` with the static 22x18 layout grid.
* Handles collision validation against building tiles and water boundaries.

#### `game/city-v2/js/city-buildings.js`
* Renders buildings: Blacksmith, pharmacy, bakery/café (instead of tavern), bookstore/library (instead of inn), and Junior Rangers academy.
* Draws roofs, doors, lit windows, and signboards.

#### `game/city-v2/js/city-player.js`
* Updates player position based on keyboard inputs, running collision checks against the terrain.
* Renders player sprite reflecting equipped armor and weapon (sword, spear).

#### `game/city-v2/js/city-npcs.js`
* Extends `BaseNPCManager` to populate the city with Salim, Laila, Omar, Maryam, children playing hopscotch, dogs, kittens, and flying pigeons.

#### `game/city-v2/js/city-dialogue.js`
* Formats modals for merchant services, healer treatments, book readers, and badge rewards.
* Triggers speech bubble overlays on screen.

### C. Gameplay, Interfaces & Main Loop

#### `game/city-v2/js/city-trade.js`
* Implements barter validation, bakery cooking, and bookstore interactions.

#### `game/city-v2/js/city-services.js`
* Implements healer health restorations (sweets, rest) and blacksmith sharpening upgrades (+5 Attack).

#### `game/city-v2/js/city-quests.js`
* Evaluates city quest criteria ("Traveler Supplies", "Valley Path") and updates task board.

#### `game/city-v2/js/city-portals.js`
* Detects proximity to gate zones and performs safe scene transition via `navigateToScene`.

#### `game/city-v2/js/city-hud.js`
* Refreshes DOM elements (health bar, coins, item counts, missions, audio panel sliders).

#### `game/city-v2/js/city-main.js`
* Instantiates core managers (`BaseTerrainManager`, `BaseNPCManager`, `BaseTimeWeatherSystem`) with `CityStageConfig`.
* Drives the central `requestAnimationFrame` game loop.

---

## 3. Dependency Structure

```text
shared.js + sounds.js
        │
        ├── [CORE] base-terrain.js ── base-npcs.js ── base-weather.js
        │                  │                  │               │
        │                  └──────────┬───────┘               │
        │                             │                       │
        ├── city-config.js ── city-data.js ── city-state.js    │
        │          │                 │                        │
        │          └────┬────────────┘                        │
        │               │                                     │
        ├── city-map.js ┴── city-buildings.js ── city-player.js│
        │        │                  │                         │
        │        └── city-npcs.js ──┴── city-dialogue.js      │
        │                    │                                │
        ├── city-trade.js ── city-services.js ── city-quests.js│
        │                                                │    │
        ├── city-portals.js ─────────────────────────────┼────┤
        │                                                │    │
        ├── city-hud.js                                  │    │
        │                                                │    │
        └── city-main.js <───────────────────────────────┘────┘
```

---

## 4. Verification Plan

### Automated Tests
1. `game/tests/city-trade.test.js`: Validates trade limits, bakery combinations, and coin changes.
2. `game/tests/city-quests.test.js`: Validates quest checkpoints and gate locks.
3. `game/tests/city-state.test.js`: Verifies serialization of state data.

### Manual Verification
* Run local server and visit `game/city-v2/index.html`.
* Validate that day/night lighting shifts and weather types (e.g. sun showers) animate correctly.
* Verify bookstore reading and bakery food cooking.
