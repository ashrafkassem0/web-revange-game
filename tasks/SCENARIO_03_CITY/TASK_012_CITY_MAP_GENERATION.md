# TASK_012 — CITY_MAP_GENERATION

## Objective
Build the city map (`game/city/index.html`) with distinct districts, enterable buildings, NPC sprites, and Pixi.js tile rendering.

## Detailed Mechanics & User Stories

### Map Specifications
- Size: 2400 × 2400 px (60 × 60 tiles × 40px)
- Zoom: 1.5
- Camera bounds: constrained to map edges

### Tile Types (PIXI.TilingSprite or atlas sprites)
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
Each building has an interior scene rendered as a separate `PIXI.Container` overlay:
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
3. Zoom-in effect: camera zooms to door (0.5s), then fade to black (0.3s)
4. Interior container shown, player sprite appears at interior entrance point
5. Reverse on exit

### Ambient NPCs
- 5-10 non-interactive NPCs walking predefined paths
- `PIXI.AnimatedSprite` with walk animation
- Patrol between 2-3 waypoints, simple `{ x, y }` movement
- Draw as colored circles with emoji if no sprite sheet

### Edge Cases
- **House Collision:** BUILDING tiles and WALL tiles block movement (collision check in player update)
- **Interior On Exit:** Player exits interior → return to same DOOR tile position
- **Gate North:** Always open, E to interact → navigate to forest
- **Gate South:** Chains visual (PIXI.Sprite overlay). E → "غير متاح بعد" until `completedCity`

## Pixi.js Technical Implementation Hints
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

  // Create tiling sprites
  const tileTextures = {
    [T.GROUND]: PIXI.Texture.from('city_ground.png'),
    [T.ROAD]: PIXI.Texture.from('city_road.png'),
    // ...
  };

  // Use PIXI.TilingSprite for each contiguous tile type region
  // Or draw each tile as individual PIXI.Sprite from a texture atlas
}

// Interior scene
class InteriorScene extends PIXI.Container {
  constructor(buildingId) {
    super();
    this.visible = false;
    // Draw interior walls, floor, furniture
    // Place NPC sprites, interactive elements
    // Add exit door sprite
  }
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
