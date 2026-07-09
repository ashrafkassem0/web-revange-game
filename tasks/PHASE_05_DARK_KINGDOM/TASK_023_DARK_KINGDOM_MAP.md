# TASK_023 — DARK_KINGDOM_MAP

## Objective
Build the Dark Kingdom — the final zone before the boss, a corrupted fortress with gothic architecture, Canvas 2D lighting overlays, and death pits.

## Detailed Mechanics & User Stories

### Map Specifications
- Size: 2400 × 2400 px (60 × 60 tiles × 40px)
- Zoom: 1.5

### Tile Types
| Type | Description | Passable |
|------|-------------|----------|
| `DARK_GROUND` | Black stone floor | ✅ |
| `DARK_WALL` | Black wall, skull motifs | ❌ |
| `BLOOD_TILE` | Red-tinged floor | ✅ (visual only) |
| `TORCH` | Wall torch, light source | ❌ (wall) |
| `THRONE_ROOM` | Boss arena entrance | 🔒 (locked) |
| `PRISON` | Cage cells, skeleton loot | ✅ |
| `VOID` | Bottomless pits | ❌ (instant death) |
| `GATE_ENTRY` | One-way entrance from Death Valley | ✅ |

### Districts / Zones
```
┌──────────────────────────────────┐
│  Outer Wall (perimeter)          │
│  ┌────────────────────────────┐  │
│  │  Courtyard (patrol guards) │  │
│  │  ┌──────────────────────┐ │  │
│  │  │  Great Hall (traps)  │ │  │
│  │  ├──────────────────────┤ │  │
│  │  │ Prison │ Armory │    │ │  │
│  │  ├────────┴─────────┤    │ │  │
│  │  │   Throne Room    │    │ │  │
│  │  └──────────────────┘    │  │
│  └────────────────────────────┘  │
└──────────────────────────────────┘
```

### Lighting System (Canvas 2D)
- Permanent darkness: full-screen `rgba(0,0,0,0.8)` overlay drawn each frame after entities
- Light radius: 120px around player torch — cut holes via `ctx.globalCompositeOperation = 'destination-out'` with radial gradients
- Wall torches: flame drawn as animated frames (or simple orange/yellow circles with flicker) + soft radial light cone
- Extinguish torches: press E near torch → mark `lit = false`, stop flame draw, remove light hole
- Extinguished torches enable stealth approach past guards
- Red-glowing braziers at Throne Room entrance (cannot be extinguished)

### Traps
| Type | Location | Effect | Visual |
|------|----------|--------|--------|
| Spear | Great Hall walls | 25 damage | Spear sprite shoots from wall, retracts |
| Flame Jet | Floor grates | 20 DMG/s | Flame rises from grate, cycles 3s on/3s off |
| Spike Pit | Hidden floor | 30 damage + fall | Floor tile flips, spikes below |

### Death Pits (VOID tiles)
- Instant death: player HP = 0, death screen
- Respawn at last checkpoint (entry gate) with 50% HP
- Visual: dark abyss fill, particle effects rising from below

### Prison Wing
- Side area with 6 cage cells
- Some cells contain skeleton sprites with loot (coins, health potions)
- Skeleton: drawn sprite/emoji with bone look, interactive (E to search)

### Atmosphere
- Color palette: black, dark red, dark grey
- Ambient audio: chains rattling, low growls, distant screams
- Music: dark orchestral with percussion (AudioManager)
- Particles: floating ash embers (plain JS particle array, small grey dots via `ctx.fillRect` / `arc`)

### Edge Cases
- **One-Way Entry:** Warning dialog before entering: "هل أنت متأكد؟ لن تستطيع العودة!" with confirm
- **Torch Performance:** Pre-bake static torch light into offscreen terrain canvas where possible; only player torch is fully dynamic
- **Save Before Entry:** GameState auto-saves before one-way transition

## Canvas 2D Implementation Hints
```javascript
class DarkKingdomLighting {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    // Offscreen buffer for darkness + light holes
    this.lightCanvas = document.createElement('canvas');
    this.lightCanvas.width = canvas.width;
    this.lightCanvas.height = canvas.height;
    this.lightCtx = this.lightCanvas.getContext('2d');
    this.torches = TORCH_POSITIONS.map(pos => ({
      x: pos.x, y: pos.y, lit: true, flameFrame: 0
    }));
  }

  extinguishTorch(index) {
    this.torches[index].lit = false;
  }

  draw(camera, player) {
    const lctx = this.lightCtx;
    lctx.clearRect(0, 0, this.lightCanvas.width, this.lightCanvas.height);
    // Full darkness
    lctx.fillStyle = 'rgba(0,0,0,0.8)';
    lctx.fillRect(0, 0, this.lightCanvas.width, this.lightCanvas.height);

    // Punch light holes
    lctx.globalCompositeOperation = 'destination-out';
    const drawRadial = (wx, wy, radius, alpha) => {
      const sx = (wx - camera.x) * camera.zoom;
      const sy = (wy - camera.y) * camera.zoom;
      const r = radius * camera.zoom;
      const g = lctx.createRadialGradient(sx, sy, 0, sx, sy, r);
      g.addColorStop(0, `rgba(0,0,0,${alpha})`);
      g.addColorStop(1, 'rgba(0,0,0,0)');
      lctx.fillStyle = g;
      lctx.beginPath();
      lctx.arc(sx, sy, r, 0, Math.PI * 2);
      lctx.fill();
    };

    drawRadial(player.x, player.y, 120, 1);
    this.torches.forEach(t => {
      if (!t.lit) return;
      drawRadial(t.x, t.y, 80, 0.4);
      // Flame flicker on main ctx (caller draws flames separately)
      t.flameFrame = (t.flameFrame + 0.1) % 4;
    });
    lctx.globalCompositeOperation = 'source-over';

    this.ctx.drawImage(this.lightCanvas, 0, 0);
  }
}

// Trap class — plain entity, drawn with ctx
class Trap {
  constructor(type, x, y) {
    this.x = x; this.y = y;
    this.type = type;
    this.active = false;
    this.cooldown = 0;
    this.animY = 0; // spear extension
    this.flameAlpha = 0;
  }

  trigger() {
    if (this.cooldown > 0) return;
    this.active = true;
    if (this.type === 'spear') {
      // Animate spear out then retract (lerp in update)
      this.animY = -40;
      setTimeout(() => {
        this.animY = 0;
        this.active = false;
        this.cooldown = 2;
      }, 700);
    } else if (this.type === 'flame') {
      this.flameAlpha = 1;
      setTimeout(() => {
        this.flameAlpha = 0;
        this.active = false;
        this.cooldown = 3;
      }, 3000);
    }
  }

  update(dt) {
    if (this.cooldown > 0) this.cooldown -= dt;
  }

  draw(ctx, camera) {
    const sx = (this.x - camera.x) * camera.zoom;
    const sy = (this.y - camera.y) * camera.zoom;
    if (this.type === 'spear') {
      ctx.fillStyle = '#888';
      ctx.fillRect(sx - 2, sy + this.animY, 4, 40);
    } else if (this.type === 'flame' && this.flameAlpha > 0) {
      ctx.globalAlpha = this.flameAlpha;
      ctx.fillStyle = '#ff6600';
      ctx.beginPath();
      ctx.arc(sx, sy - 10, 12, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    }
  }
}
```

## Verification & Acceptance Criteria
- [ ] Dark Kingdom map renders with gothic tile set at 2400×2400
- [ ] Lighting system: permanent darkness (`rgba` overlay ~0.8) + torch light holes
- [ ] Wall torches extinguishable (E), enabling stealth
- [ ] Traps: spear (25dmg), flame jet (20dmg/s cycle), spike pit (30dmg)
- [ ] Death pits (VOID) instantly kill, respawn at entry with 50% HP
- [ ] Prison wing has 6 cells with lootable skeleton sprites
- [ ] Armory has Shadow Sword behind guards
- [ ] Throne Room doors sealed, require 3 gatekeeper keys
- [ ] One-way entry warning with auto-save
- [ ] Atmospheric: ash particles, dark orchestral audio, red/black palette
