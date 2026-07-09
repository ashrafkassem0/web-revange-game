# TASK_012 — CITY_MAP_GENERATION

## Objective
Build the city map (`game/city/index.html`) with distinct districts, enterable buildings, NPC sprites, and Canvas 2D tile rendering (same pattern as the existing city/forest maps).

## Detailed Mechanics & User Stories

### Map Specifications
- Size: 2400 × 2400 px (60 × 60 tiles × 40px)
- Zoom: 1.5
- Camera bounds: constrained to map edges

### Tile Types (drawn on offscreen terrain canvas, then blitted each frame)
| Type | Color | Description | Passable |
|------|-------|-------------|----------|
| `GROUND` | #8B7355 | Dirt/stone path | ✅ |
| `ROAD` | #6B5B45 | Wide stone road | ✅ |
| `BUILDING` | #4A3F35 | Solid wall | ❌ |
| `DOOR` | #5C4033 | Building entrance | ✅ (triggers interior) |
| `PLAZA` | #A0896B | Central square | ✅ |
| `GARDEN` | #4A7A3A | Green area | ✅ |
| `WALL` | #3A3A3A | City boundary | ❌ |
| `GATE_NORTH` | #8B7355 + glow | Returns to forest | ✅ |
| `GATE_SOUTH` | #8B0000 + chains | Locked until city completion | ❌ (locked) |

### Districts Layout
```
┌──────────────────────────────┐
│  Government District  │ Temple │  ← North
│  (palace, barracks)   │  Dist  │
├──────────┬───────────┼────────┤
│          │           │        │
│  Plaza   │  Fountain  │ Garden │
│ (center) │   Square   │        │
├──────────┴───────────┼────────┤
│  Market District     │ Resid. │  ← South
│  (shops, stalls)     │  Dist  │
│                      │        │
└──────────────────────────────┘
```

### Enterable Buildings (Interior Overlays)
Each building has an interior scene rendered as a separate offscreen canvas (or a dedicated draw pass) shown over the exterior:
1. **General Merchant** — 3 NPC counters
2. **Weapons Merchant** — Weapons displayed on walls
3. **Rare Goods Merchant** — Dimly lit, mysterious
4. **Healer's Temple** — Altar, candles, healing pool
5. **Blacksmith** — Anvil, forge fire (animated), tools
6. **Tavern** — Tables, ambient NPCs
7. **Library** — Bookshelves, scholar NPC

### Interior Transition
1. Player walks onto `DOOR` tile
2. Exterior game pauses (`onPause`)
3. Zoom-in effect: camera zooms to door (0.5s), then CSS `.fade-overlay` fades to black (0.3s)
4. Interior canvas/draw pass shown, player appears at interior entrance point
5. Reverse on exit

### Ambient NPCs
- 5-10 non-interactive NPCs walking predefined paths
- Walk cycle via frame index updated in the `requestAnimationFrame` loop
- Patrol between 2-3 waypoints, simple `{ x, y }` movement
- Draw as colored circles with emoji (`ctx.fillText`) if no sprite sheet

### Edge Cases
- **House Collision:** BUILDING tiles and WALL tiles block movement (collision check in player update)
- **Interior On Exit:** Player exits interior → return to same DOOR tile position
- **Gate North:** Always open, E to interact → navigate to forest
- **Gate South:** Chains visual (drawn with `ctx` over the gate). E → "غير متاح بعد" until `completedCity`

## Canvas 2D Implementation Hints
```javascript
// City world generation (similar to forest but with city tile rules)
function generateCityWorld() {
  const world = [];
  for (let y = 0; y < 60; y++) {
    world[y] = [];
    for (let x = 0; x < 60; x++) {
      // Determine tile based on district zones
      world[y][x] = getCityTile(x, y);
    }
  }
}

// Pre-render static terrain once (same pattern as city/index.html prerenderTerrain)
function prerenderCityTerrain() {
  terrainCanvas = document.createElement('canvas');
  terrainCanvas.width = 2400;
  terrainCanvas.height = 2400;
  const tc = terrainCanvas.getContext('2d');
  for (let y = 0; y < 60; y++) {
    for (let x = 0; x < 60; x++) {
      tc.fillStyle = TILE_COLORS[world[y][x]];
      tc.fillRect(x * 40, y * 40, 40, 40);
    }
  }
}

// Each frame: blit terrain, then draw dynamic entities
function draw() {
  ctx.drawImage(terrainCanvas, -camera.x, -camera.y);
  drawBuildings(ctx);
  drawAmbientNPCs(ctx);
  drawPlayer(ctx);
  drawGateOverlays(ctx); // chains on south gate, glow on north
}

// Interior scene — separate offscreen canvas or draw mode flag
const interiors = {}; // buildingId → { canvas, npcs, exitPoint }
function enterInterior(buildingId) {
  onPause();
  // CSS fade-overlay → swap draw mode to interior
  fadeOverlay(() => {
    currentInterior = interiors[buildingId];
    player.x = currentInterior.exitPoint.x;
    player.y = currentInterior.exitPoint.y;
  });
}

// Collision check
function isWalkable(x, y) {
  const tile = getTile(x, y);
  return tile !== T.BUILDING && tile !== T.WALL && !(tile === T.GATE_SOUTH && !completedCity);
}
```

## Verification & Acceptance Criteria
- [ ] City map renders at 2400×2400 with 9 tile types
- [ ] 5 districts distinct and identifiable
- [ ] 7 enterable buildings with interior overlays
- [ ] COLLISION on BUILDING and WALL tiles works
- [ ] Ambient NPCs walk patrol paths
- [ ] North gate → navigate to forest scene
- [ ] South gate locked with chain visual until city completion
- [ ] Interior transition shows zoom-in + fade effect
- [ ] Exiting interior returns to correct door position
