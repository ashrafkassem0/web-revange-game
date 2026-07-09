# TASK_023 — DARK_KINGDOM_MAP

## Objective
Build the Dark Kingdom — the final zone before the boss, a corrupted fortress with gothic architecture, Pixi.js lighting system, and death pits.

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

### Lighting System (Pixi.js)
- Permanent darkness: PIXI.AlphaFilter on lighting layer, alpha = 0.8
- Light radius: 120px around player torch
- Wall torches: PIXI.Sprite with PIXI.AnimatedSprite flame + PIXI.Mesh light cone
- Extinguish torches: press E near torch → torch.sprite.alpha = 0, light removed
- Extinguished torches enable stealth approach past guards
- Red-glowing braziers at Throne Room entrance (cannot be extinguished)

### Traps
| Type | Location | Effect | Visual |
|------|----------|--------|--------|
| Spear | Great Hall walls | 25 damage | Spear sprite shoots from wall, retracts |
| Flame Jet | Floor grates | 20 DMG/s | Flame sprite rises from grate, cycles 3s on/3s off |
| Spike Pit | Hidden floor | 30 damage + fall | Floor tile flips, spikes below |

### Death Pits (VOID tiles)
- Instant death: player HP = 0, death screen
- Respawn at last checkpoint (entry gate) with 50% HP
- Visual: dark abyss sprite, particle effects rising from below

### Prison Wing
- Side area with 6 cage cells
- Some cells contain skeleton sprites with loot (coins, health potions)
- Skeleton: PIXI.Sprite with bone texture, interactive (E to search)

### Atmosphere
- Color palette: black, dark red, dark grey
- Ambient audio: chains rattling, low growls, distant screams
- Music: dark orchestral with percussion (AudioManager)
- Particles: floating ash embers (PIXI.ParticleContainer, small grey dots)

### Edge Cases
- **One-Way Entry:** Warning dialog before entering: "هل أنت متأكد؟ لن تستطيع العودة!" with confirm
- **Torch Performance:** Pre-bake static torch light as textures, only dynamic for player torch
- **Save Before Entry:** GameState auto-saves before one-way transition

## Pixi.js Technical Implementation Hints
```javascript
class DarkKingdomLighting {
  constructor() {
    // Main darkness filter
    this.darkness = new PIXI.AlphaFilter(0.8);
    LAYERS.lighting.filters = [this.darkness];

    // Torch light sprite (follows player)
    this.torchLight = new PIXI.Sprite(PIXI.Texture.from('light_radial.png'));
    this.torchLight.anchor.set(0.5);
    this.torchLight.blendMode = PIXI.BLEND_MODES.ADD;
    this.torchLight.scale.set(4);
    LAYERS.lighting.addChild(this.torchLight);

    // Static torch lights
    this.torches = [];
    TORCH_POSITIONS.forEach(pos => {
      const flame = new PIXI.AnimatedSprite(flameFrames);
      flame.x = pos.x; flame.y = pos.y;
      flame.animationSpeed = 0.1;
      flame.play();
      LAYERS.ground.addChild(flame);

      const light = new PIXI.Sprite(PIXI.Texture.from('light_radial.png'));
      light.anchor.set(0.5);
      light.x = pos.x; light.y = pos.y;
      light.alpha = 0.4; light.blendMode = PIXI.BLEND_MODES.ADD;
      light.scale.set(2);
      LAYERS.lighting.addChild(light);

      this.torches.push({ flame, light, lit: true });
    });
  }

  extinguishTorch(index) {
    const torch = this.torches[index];
    torch.lit = false;
    torch.flame.alpha = 0;
    torch.flame.stop();
    torch.light.alpha = 0;
  }

  update(player) {
    // Torch follows player
    this.torchLight.x = player.x;
    this.torchLight.y = player.y;
  }
}

// Trap class
class Trap extends PIXI.Container {
  constructor(type, x, y) {
    super();
    this.x = x; this.y = y;
    this.type = type;
    this.active = false;
    this.cooldown = 0;

    if (type === 'spear') {
      this.sprite = new PIXI.Sprite(PIXI.Texture.from('spear.png'));
      this.sprite.anchor.set(0.5, 1);
      this.sprite.y = 0;
      this.addChild(this.sprite);
    } else if (type === 'flame') {
      this.sprite = new PIXI.AnimatedSprite(flameFrames);
      this.sprite.anchor.set(0.5);
      this.sprite.alpha = 0;
      this.addChild(this.sprite);
    }
  }

  trigger() {
    if (this.cooldown > 0) return;
    this.active = true;
    if (this.type === 'spear') {
      // Spear shoots out
      gsap.to(this.sprite, { y: -40, duration: 0.2, onComplete: () => {
        gsap.to(this.sprite, { y: 0, duration: 0.5, delay: 0.5, onComplete: () => {
          this.active = false; this.cooldown = 2;
        }});
      }});
    } else if (this.type === 'flame') {
      this.sprite.alpha = 1; this.sprite.play();
      setTimeout(() => { this.sprite.alpha = 0; this.sprite.stop(); this.active = false; this.cooldown = 3; }, 3000);
    }
  }

  update(dt) {
    if (this.cooldown > 0) this.cooldown -= dt;
  }
}
```

## Verification & Acceptance Criteria
- [ ] Dark Kingdom map renders with gothic tile set at 2400×2400
- [ ] Lighting system: permanent darkness (PIXI.AlphaFilter 0.8) + torch light
- [ ] Wall torches extinguishable (E), enabling stealth
- [ ] Traps: spear (25dmg), flame jet (20dmg/s cycle), spike pit (30dmg)
- [ ] Death pits (VOID) instantly kill, respawn at entry with 50% HP
- [ ] Prison wing has 6 cells with lootable skeleton sprites
- [ ] Armory has Shadow Sword behind guards
- [ ] Throne Room doors sealed, require 3 gatekeeper keys
- [ ] One-way entry warning with auto-save
- [ ] Atmospheric: ash particles, dark orchestral audio, red/black palette
