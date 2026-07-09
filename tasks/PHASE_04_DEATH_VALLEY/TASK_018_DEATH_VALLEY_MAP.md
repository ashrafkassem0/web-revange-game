# TASK_018 — DEATH_VALLEY_MAP

## Objective
Build the Death Valley map — a harsh, dangerous mountainous zone with extreme terrain and scarce resources, rendered with HTML5 Canvas 2D (offscreen terrain canvas + `requestAnimationFrame` loop, same pattern as forest/city).

## Detailed Mechanics & User Stories

### Map Specifications
- Size: 4000 × 4000 px (100 × 100 tiles × 40px) — largest map
- Zoom: 1.2 (wider view to see hazards)

### Tile Types (pre-rendered on offscreen terrain canvas)
| Type | Color | Effect |
|------|-------|--------|
| `SAND` | #D4A574 | Main floor, 90% speed |
| `ROCK` | #8B7355 | Normal speed, minerals spawn here |
| `CLIFF` | #4A3728 | Impassable, blocks movement |
| `LAVA` | #FF4400 | 5 HP/s damage, animated glow |
| `OASIS` | #4488AA | Safe zone, restores stamina |
| `CRACK` | #6B5B45 | 20% collapse chance → fall + 10 DMG |
| `RUINS` | #8B7D6B | Ancient structures, stealth cover |
| `GATE_NORTH` | portal blue | Returns to city |
| `GATE_SOUTH` | portal red | Dark Kingdom (locked until trials) |

### Layout
```
North (entrance from city): Rocky plateau, safe
Center: Sand valley with lava pools, cliff walls
South-east: Ruins area with treasure chests
South-west: Dense crack zone (dangerous shortcuts)
Far south: Red gate to Dark Kingdom
```

### Lava Animation (Canvas 2D)
- Animate lava tiles each frame: cycle fill color / drawImage frame index (4 frames, loop)
- Orange/yellow glow: `ctx.globalCompositeOperation = 'lighter'` (or soft radial gradient), alpha oscillating 0.2–0.5
- Bubble particles: plain JS array of `{x,y,vy,life}` orange circles rising and popping

### Heat Meter (HUD)
- If player stands on non-shaded tiles (not OASIS/RUINS) for >30s → heat meter fills
- At 100%: 2 HP/s damage
- Shade (OASIS, RUINS) resets meter
- HUD bar: HTML thermometer icon + CSS bar (or drawn on canvas HUD strip)

### Resource Spawns
| Resource | Count | Location | Tool |
|----------|-------|----------|------|
| `mineral` | 20 | Rocky areas | Pickaxe |
| `cactusFruit` | 10 | Oasis | None (heals 5 HP) |
| `ancientCoin` | 8 | Ruins | None (worth 5 coins) |
| `lavaCrystal` | 3 | Near lava | Pickaxe (rare) |

### Edge Cases
- **Falling off map:** Teleport to nearest OASIS with 10 HP penalty
- **Lava + Rain:** Rain doesn't exist here (too hot). No weather interaction.
- **Gate South:** Locked until all 3 Valley Trials complete (TASK_020)

## Canvas 2D Implementation Hints
```javascript
// Death Valley world generation
function generateDVWorld() {
  const world = [];
  for (let y = 0; y < 100; y++) {
    world[y] = [];
    for (let x = 0; x < 100; x++) {
      world[y][x] = getDVTile(x, y);
    }
  }
  return world;
}

// Static terrain once; lava/glow drawn dynamically each frame
function prerenderDVTerrain(world) {
  terrainCanvas = document.createElement('canvas');
  terrainCanvas.width = 4000;
  terrainCanvas.height = 4000;
  const tc = terrainCanvas.getContext('2d');
  for (let y = 0; y < 100; y++) {
    for (let x = 0; x < 100; x++) {
      if (world[y][x] === T.LAVA) continue; // animated separately
      tc.fillStyle = TILE_COLORS[world[y][x]];
      tc.fillRect(x * 40, y * 40, 40, 40);
    }
  }
}

const lavaBubbles = []; // plain particle array

function drawLava(ctx, world, camera, time) {
  const frame = Math.floor(time / 100) % 4;
  for (let y = 0; y < 100; y++) {
    for (let x = 0; x < 100; x++) {
      if (world[y][x] !== T.LAVA) continue;
      const px = x * 40 - camera.x;
      const py = y * 40 - camera.y;
      const heat = 0.7 + 0.3 * Math.sin(time * 0.005 + x + y);
      ctx.fillStyle = `rgb(${200 + frame * 10}, ${40 + frame * 20}, 0)`;
      ctx.fillRect(px, py, 40, 40);
      ctx.globalCompositeOperation = 'lighter';
      ctx.fillStyle = `rgba(255,100,0,${0.2 + heat * 0.3})`;
      ctx.fillRect(px - 4, py - 4, 48, 48);
      ctx.globalCompositeOperation = 'source-over';
    }
  }
  // Bubbles
  for (const b of lavaBubbles) {
    ctx.fillStyle = `rgba(255,180,40,${b.life})`;
    ctx.beginPath();
    ctx.arc(b.x - camera.x, b.y - camera.y, b.r, 0, Math.PI * 2);
    ctx.fill();
  }
}

// Heat meter — HTML HUD preferred (match city #hpBar)
class HeatMeter {
  constructor() {
    this.value = 0;
    this.max = 100;
    this.el = document.getElementById('heatBar');
  }

  update(dt, playerTile) {
    if (playerTile === T.OASIS || playerTile === T.RUINS) {
      this.value = Math.max(0, this.value - dt * 5);
    } else {
      this.value = Math.min(this.max, this.value + dt * 3.3); // 30s to full
    }
    const ratio = this.value / this.max;
    this.el.style.width = (ratio * 100) + '%';
    this.el.style.background = ratio < 0.5 ? '#FFAA00' : ratio < 0.8 ? '#FF6600' : '#FF0000';
  }
}
```

## Verification & Acceptance Criteria
- [ ] Death Valley map renders at 4000×4000 with 9 tile types
- [ ] Lava pools animate with glow + damage player on contact (5 HP/s)
- [ ] CLIFF tiles block movement
- [ ] Heat meter fills in 30s on unshaded tiles, deals 2 HP/s at 100%
- [ ] OASIS and RUINS reset heat meter
- [ ] Resources spawn at correct locations
- [ ] North gate returns to city
- [ ] South gate locked until 3 Valley Trials completed
- [ ] Map music changes to tense drums + wind ambience
