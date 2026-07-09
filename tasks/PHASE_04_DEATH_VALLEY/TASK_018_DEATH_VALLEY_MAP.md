# TASK_018 — DEATH_VALLEY_MAP

## Objective
Create a new multi-page zone `game/death-valley/index.html` using the same patterns as forest/city: Canvas 2D, offscreen terrain, WASD/arrows top-down, `shared.js` (`GameState` / `SaveManager` / `navigateTo`). Scale similar to forest (**3200×3200**) or slightly smaller (~**2400×2400**). Zero Pixi.

## Architecture (must follow)
| Piece | Pattern |
|-------|---------|
| Page | `game/death-valley/index.html` (HTML + canvas + HUD) |
| Modules | Prefer `game/js/dv-*.js` **or** reuse `forest-config`/`forest-world` patterns copied lightly — do not invent Pixi scenes |
| Save | `maps.deathValley` already in `DEFAULT_MAPS`: `{ trialsCompleted: 0, eliteEnemiesKilled: [] }` |
| URL | `SaveManager.mapUrlFor('deathValley')` → `'death-valley/index.html'` (fix the current forest fallback) |
| Entry | From city south gate (TASK_017); exit north gate → city |

## Detailed Mechanics & User Stories

### Map specs
- Tile size ~40px (match forest `CFG.TILE_SIZE` if reusing helpers).
- World: **~2400–3200** square (not 4000×4000).
- Camera follows player; blit `terrainCanvas` at `-camX, -camY` like `forest-world.js`.

### Tile types (pre-render static; animate hazards in draw pass)
| Type | Color (approx) | Passable | Notes |
|------|----------------|----------|-------|
| `SAND` | #D4A574 | ✅ | Default floor; may slow (TASK_019) |
| `ROCK` | #8B7355 | ✅ | Minerals / footing |
| `CLIFF` | #4A3728 | ❌ | Blocks movement (no jump/climb physics) |
| `LAVA` | #FF4400 | ✅* | DoT on stand (TASK_019); animate glow each frame |
| `OASIS` | #4488AA | ✅ | Safe / heat relief |
| `RUINS` | #8B7D6B | ✅ | Cover flavor + crafting access later |
| `GATE_NORTH` | portal | ✅ | Return to city |
| `GATE_SOUTH` | portal | ❌ locked | Dark Kingdom stub (later phase) |

### Layout sketch
```
North: rocky plateau + city portal (safe)
Center: sand basin, lava pools, cliff walls
SE: ruins pockets
SW: hazard sand / unstable patches (TASK_019)
Far south: locked red gate (visual only for now)
```

### Resources (light)
| Id | Where | Notes |
|----|-------|-------|
| `mineral` or reuse `stone` | rock belts | pick up / interact |
| `cactusFruit` (new inv key) | oasis | small heal |
| DV elite drops | TASK_020 | wire into inventory defaults in `shared.js` |

### Heat meter (basic — deepen in TASK_019/022)
- HTML bar near HUD (like city `#hpBar`).
- Fills on open sand; drains on `OASIS` / `RUINS`.
- At full: small HP DoT.

### Edge Cases
- Leaving map bounds: clamp or soft push-back — **no** fall-into-sublevel.
- North gate: save DV state + `navigateTo('../city/index.html')`.
- South gate: locked message «غير متاح بعد».

## Canvas 2D Implementation Hints
```javascript
// game/death-valley/index.html
// <script src="../js/shared.js"></script>
// optional: characters.js, crafting.js, dv-world.js, dv-main.js

const CFG = { WORLD_W: 2400, WORLD_H: 2400, TILE_SIZE: 40, SPEED: 2.6 };

function prerenderDVTerrain() {
  terrainCanvas = document.createElement('canvas');
  terrainCanvas.width = CFG.WORLD_W;
  terrainCanvas.height = CFG.WORLD_H;
  // fill non-lava tiles once; draw lava dynamically
}

// SaveManager.mapUrlFor
case 'deathValley': return 'death-valley/index.html';
```

## Verification & Acceptance Criteria
- [ ] `game/death-valley/index.html` loads with Canvas 2D + `shared.js`
- [ ] World size ~2400–3200; camera + offscreen terrain blit work
- [ ] CLIFF blocks; lava/oasis/ruins/sand distinct
- [ ] North gate returns to city with inventory/HP saved
- [ ] `SaveManager.mapUrlFor('deathValley')` returns death-valley URL
- [ ] `maps.deathValley` read/written without breaking forest/city saves
- [ ] No Pixi; WASD/arrows only (no jump physics)
