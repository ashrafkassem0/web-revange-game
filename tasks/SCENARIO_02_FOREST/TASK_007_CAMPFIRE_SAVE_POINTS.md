# TASK_007 — CAMPFIRE_SAVE_POINTS

## Objective
Add campfires as save points, healing spots, fast travel anchors, and enemy repellent zones using Pixi.js animated sprites and effects.

## Detailed Mechanics & User Stories

### Placement
5 campfires at fixed strategic locations:
1. North near lake entrance
2. Central clearing (near build zone)
3. East rock area
4. South forest edge (near city portal path)
5. West dark forest edge

### Visual (Pixi.js AnimatedSprite)
- 3 flame layers (red, orange, yellow) with `PIXI.AnimatedSprite` (4 frames each, randomized playback speed)
- Glow: `PIXI.Sprite` with radial gradient texture, `blendMode: PIXI.BLEND_MODES.ADD`, alpha 0.3
- Smoke particles: `PIXI.ParticleContainer` with small grey circles rising and fading
- Each layer offset slightly and scaled differently for organic feel

### Interaction
Press `E` near campfire → radial menu (PIXI.Container) with options:
1. **Save Game** (disk icon) — manual save to auto slot, "تم الحفظ!" toast
2. **Rest** (moon icon) — advance time to 6:00 (dawn), full HP/stamina restore, "لقد استرتحت حتى الصباح" toast
3. **Cook Food** (fire icon) — if has `rawMeat` or `rawFish` → 3s progress bar → converts to `cookedMeat`/`cookedFish` (heals more)
4. **Fast Travel** (map icon) — show discovered campfires on map overlay, click to teleport (costs 1 stick)
5. **Light Campfire** (if unlit) — requires 2 sticks, "أضرم النار" button

### Discovery
- First approach: "اكتشفت مخيم جديد!" toast via PIXI.Text notification
- Campfire added to fast travel network (stored in `maps.forest.discoveredCampfires` array)

### Enemy Repulsion
- Enemies within 200px of lit campfire: flee state activated (move away from campfire)
- Check in enemy update loop: `if (distanceToCampfire < 200) { state = 'flee'; }`

### Unlit Campfires
- New campfires start unlit (no flame sprite, no glow, no repulsion)
- "Light Campfire (2 🪵)" option in interaction menu
- Requires 2 sticks in inventory

### Edge Cases
- **Save During Combat:** Interaction blocked if enemies within 200px. "لا يمكن الاسترخاء مع وجود أعداء قريبين"
- **Rain Extinguishes:** Heavy rain or storm → after 15s, fire shrinks and extinguishes (animation: flame shrinks → smoke puff → gone). Re-light with 1 stick.
- **All Campfires Unlit:** Fast travel disabled. "أضرم نار المخيم أولاً" message.

## Pixi.js Technical Implementation Hints
```javascript
class Campfire extends PIXI.Container {
  constructor(x, y) {
    super();
    this.x = x; this.y = y;
    this.discovered = false;
    this.lit = false;
    this.fuel = 100;

    // Base ring (stones)
    const base = new PIXI.Sprite(PIXI.Texture.from('campfire_stones.png'));
    this.addChild(base);

    // Flame layers
    this.flames = [];
    for (const color of [0xFF0000, 0xFF6600, 0xFFFF00]) {
      const sprite = new PIXI.AnimatedSprite(flameFrames);
      sprite.tint = color;
      sprite.alpha = 0.8;
      sprite.animationSpeed = 0.2 + Math.random() * 0.1;
      sprite.scale.set(0.8 + Math.random() * 0.4);
      sprite.y = -5 + Math.random() * -10;
      this.addChild(sprite);
      this.flames.push(sprite);
    }

    // Glow
    this.glow = new PIXI.Sprite(PIXI.Texture.from('glow_radial.png'));
    this.glow.anchor.set(0.5);
    this.glow.alpha = 0.2;
    this.glow.blendMode = PIXI.BLEND_MODES.ADD;
    this.addChildAt(this.glow, 0);

    this.visible = false; // Hidden until discovered
  }

  light() {
    if (!this.lit) { this.lit = true; this.flames.forEach(f => f.play()); }
  }

  extinguish() {
    this.lit = false;
    this.flames.forEach(f => { f.stop(); f.alpha = 0; });
    this.glow.alpha = 0;
  }
}
```

## Verification & Acceptance Criteria
- [ ] 5 campfires exist at fixed locations on the Pixi.js tile map
- [ ] Approaching shows interaction prompt (PIXI.Text "اضغط E")
- [ ] Save works at campfire
- [ ] Rest advances time to dawn and full heal
- [ ] Cooking converts raw meat/fish to cooked versions
- [ ] Fast travel between discovered campfires costs 1 stick
- [ ] Enemies flee from lit campfire (200px radius)
- [ ] Rain extinguishes campfire after 15s with animation
- [ ] Unlit campfire requires 2 sticks to light
- [ ] Discovery toast appears on first approach
