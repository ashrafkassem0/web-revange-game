# TASK_018 — DEATH_VALLEY_MAP

## Objective
Build the Death Valley map — a harsh, dangerous mountainous zone with extreme terrain and scarce resources, rendered via Pixi.js.

## Detailed Mechanics & User Stories

### Map Specifications
- Size: 4000 × 4000 px (100 × 100 tiles × 40px) — largest map
- Zoom: 1.2 (wider view to see hazards)

### Tile Types (PIXI.TilingSprite)
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

### Lava Animation (Pixi.js)
- `PIXI.AnimatedSprite` with lava texture frames (4 frames, loop)
- Orange/yellow glow overlay: `PIXI.Sprite` with `blendMode: PIXI.BLEND_MODES.ADD`, alpha oscillating 0.2-0.5
- Bubble particles: `PIXI.ParticleContainer` with orange circles rising and popping

### Heat Meter (HUD)
- If player stands on non-shaded tiles (not OASIS/RUINS) for >30s → heat meter fills
- At 100%: 2 HP/s damage
- Shade (OASIS, RUINS) resets meter
- HUD bar: red thermometer icon (PIXI.Sprite) + graphics bar

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

## Pixi.js Technical Implementation Hints
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

  // Lava animation
  const lavaContainer = new PIXI.Container();
  for (let y = 0; y < 100; y++) {
    for (let x = 0; x < 100; x++) {
      if (world[y][x] === T.LAVA) {
        const lava = new PIXI.AnimatedSprite(lavaFrames);
        lava.x = x * 40; lava.y = y * 40;
        lava.animationSpeed = 0.1 + Math.random() * 0.05;
        lava.play();
        lavaContainer.addChild(lava);
      }
    }
  }
  LAYERS.ground.addChild(lavaContainer);

  // Lava glow overlay
  const lavaGlow = new PIXI.Sprite(PIXI.Texture.from('lava_glow.png'));
  lavaGlow.blendMode = PIXI.BLEND_MODES.ADD;
  lavaGlow.alpha = 0.3;
  LAYERS.lighting.addChild(lavaGlow);
}

// Heat meter
class HeatMeter {
  constructor() {
    this.value = 0;
    this.max = 100;
    this.bar = new PIXI.Graphics();
    this.bar.x = 20; this.bar.y = App.screen.height - 60;
    LAYERS.ui.addChild(this.bar);
  }

  update(dt, playerTile) {
    if (playerTile === T.OASIS || playerTile === T.RUINS) {
      this.value = Math.max(0, this.value - dt * 5);
    } else {
      this.value = Math.min(this.max, this.value + dt * 3.3); // 30s to full
    }
    this.draw();
  }

  draw() {
    this.bar.clear();
    // Background
    this.bar.beginFill(0x333333);
    this.bar.drawRect(0, 0, 200, 20);
    this.bar.endFill();
    // Fill
    const ratio = this.value / this.max;
    const color = ratio < 0.5 ? 0xFFAA00 : ratio < 0.8 ? 0xFF6600 : 0xFF0000;
    this.bar.beginFill(color);
    this.bar.drawRect(0, 0, 200 * ratio, 20);
    this.bar.endFill();
    // Icon
    const icon = new PIXI.Text('🌡️', { fontSize: 20 });
    icon.x = -30;
    this.bar.addChild(icon);
  }
}
```

## Verification & Acceptance Criteria
- [ ] Death Valley map renders at 4000×4000 with 9 tile types
- [ ] Lava pools have AnimatedSprite frames + damaging player on contact (5 HP/s)
- [ ] CLIFF tiles block movement
- [ ] Heat meter fills in 30s on unshaded tiles, deals 2 HP/s at 100%
- [ ] OASIS and RUINS reset heat meter
- [ ] Resources spawn at correct locations
- [ ] North gate returns to city
- [ ] South gate locked until 3 Valley Trials completed
- [ ] Map music changes to tense drums + wind ambience
