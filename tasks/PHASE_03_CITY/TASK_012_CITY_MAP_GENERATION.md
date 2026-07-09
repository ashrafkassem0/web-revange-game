# TASK_012 — CITY_MAP_GENERATION

## Objective
Expand the existing single-file city hub in `game/city/index.html` (~750 lines) so districts read clearly on one Canvas 2D screen. Keep the current architecture: one HTML page, tile map, offscreen `prerenderTerrain`, WASD/arrows top-down movement, decorative building labels — **not** seven enterable building interiors.

## Current Baseline (do not replace)
- Map: `CFG.COLS=22`, `CFG.ROWS=18`, `CFG.TILE=48` → **1056×864**
- Tiles: `T.STONE | ROAD | BUILDING | GRASS | WATER | SAND` via `MAP_STR`
- Collision: `isBlocked` on `BUILDING` only
- Decorative rooftops in `drawBuildings()` (blacksmith / healer / merchant / inn / library / farm / artisan / scholar / tavern)
- Central well (`drawWell`), north forest portal (`FOREST_PORTAL` + `drawPortal`)
- Scripts: inline city logic + `../js/shared.js` (`GameState` / `navigateTo`)

## Detailed Mechanics & User Stories

### Scope: expand in place
Choose **one** of these (prefer A unless playtesting needs more room):

| Option | Size | Notes |
|--------|------|-------|
| **A (preferred)** | Keep ~22×18 (1056×864) | Re-layout `MAP_STR` + labels for clearer districts |
| **B (modest)** | Up to ~28×22 tiles (~1344×1056) | Still one screen; update `CFG.COLS/ROWS`, `W/H`, `MAP_STR`, `prerenderTerrain` |

Do **not** grow to forest-scale (3200×3200) or add a camera scroll unless Option B still fits comfortably on one viewport.

### Labeled districts (visual only)
Redraw / re-label so the hub reads as districts without interior scenes:

```
┌────────────────────────────────────┐
│  بوابة الغابة (شمال)               │
│  حي الحداد / المشفى / التاجر       │
├──────────────┬─────────────────────┤
│  ساحة البئر  │  حديقة / طرق        │
├──────────────┴─────────────────────┤
│  حي الحانة / المزرعة (جنوب)        │
│  بوابة وادي الموت (مقفلة — TASK_016/017) │
└────────────────────────────────────┘
```

- Keep Arabic labels on rooftops (`⚒️ الحداد`, `🏥 المشفى`, `🛒 التاجر`, …) as in `drawBuildings()`.
- Optional: soft district tint on grass/plaza tiles (still pre-rendered on `terrainCanvas`).
- Buildings remain **solid `BUILDING` tiles** + painted roofs. Doors are decorative unless a later task adds a simple overlay room.

### Tile / layout polish
| Type | Role |
|------|------|
| `ROAD` | Main cross streets between districts |
| `STONE` | Plaza / courtyards |
| `GRASS` | Garden / farm edges |
| `WATER` | Optional fountain / well ring (already decorative well at center) |
| `BUILDING` | Impassable footprints under labeled roofs |
| South opening | Leave a clear road stub for `GATE_SOUTH` (wired in TASK_017) |

### Ambient flavor (lightweight)
- Optional 2–4 non-interactive walkers (colored circle + emoji) on short road waypoints — **no** dialogue trees.
- Keep frame budget low; city stays a small hub.

### Edge Cases
- **Collision:** `BUILDING` still blocks; player cannot clip through roofs.
- **Portal north:** `FOREST_PORTAL` stays top-center; E → `saveAndExit()` → forest.
- **South gate:** Visual stub + chains OK here; unlock logic belongs to TASK_016 / TASK_017.
- **No interiors:** Do not implement zoom-in room scenes or separate interior canvases in this task.

## Canvas 2D Implementation Hints
```javascript
// Expand MAP_STR / CFG in game/city/index.html — same prerender pattern
const CFG = { TILE: 48, COLS: 22, ROWS: 18, SPEED: 2.8 }; // or modest bump for Option B
const W = CFG.COLS * CFG.TILE;
const H = CFG.ROWS * CFG.TILE;

function prerenderTerrain(textures) {
  terrainCanvas = document.createElement('canvas');
  terrainCanvas.width = W;
  terrainCanvas.height = H;
  // PASS 1 procedural fills, PASS 2 bombTexture(grass/water/sand), PASS 3 accents
}

function drawDistrictLabels(ctx) {
  // Optional floating Arabic district names above plaza / market / south road
  ctx.font = 'bold 12px Cairo';
  ctx.fillStyle = 'rgba(255,208,96,0.85)';
  ctx.textAlign = 'center';
  ctx.fillText('ساحة المدينة', W / 2, H / 2 - 40);
}

// drawBuildings() — keep labeled roof blocks; do NOT add enterInterior()
```

## Verification & Acceptance Criteria
- [ ] City still loads as **one** page: `game/city/index.html` + `shared.js`
- [ ] Map remains single-screen (Option A ~1056×864 or modest Option B)
- [ ] Districts are visually identifiable via layout + Arabic rooftop / district labels
- [ ] `BUILDING` collision still works; WASD/arrows top-down unchanged
- [ ] North forest portal still works (`saveAndExit` → `../forest/index.html`)
- [ ] South road/gate stub exists for later Death Valley wiring
- [ ] **No** seven enterable interiors; decorative buildings only
- [ ] Terrain still uses offscreen `terrainCanvas` blit each frame
