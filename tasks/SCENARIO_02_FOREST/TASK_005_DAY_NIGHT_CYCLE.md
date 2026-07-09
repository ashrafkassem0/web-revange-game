# TASK_005 — DAY_NIGHT_CYCLE

## Objective
Add a dynamic day/night cycle to the forest scene using Pixi.js filters, affecting visibility, enemy behavior, and gameplay.

## Detailed Mechanics & User Stories

### Cycle Duration
- Full cycle = 12 minutes real-time (6 min day, 6 min night)
- Phases: Dawn (1 min), Day (5 min), Dusk (1 min), Night (5 min)

### Visual Overlay (Pixi.js Filter)
- Use `PIXI.ColorMatrixFilter` on the lighting container:
  - **Day:** No filter (full brightness)
  - **Dawn/Dusk:** Orange/warm tint, alpha 0.3
  - **Night:** Dark blue tint, alpha 0.7
- Smooth transition over 2 minutes between phases

### Lighting Mask
- At night, player has a torch light circle (radius 200px)
- Implement as a `PIXI.Mesh` with radial gradient or a sprite mask
- Outside light circle: darkness
- Multiple light sources: torch, campfires, enemy torches

### Torch Mechanic
- Torch burns automatically at night
- Fuel: initially 100, depletes at 1/sec
- When empty: light radius shrinks to 50px
- Refuel: press F → "Refuel Torch" → 1 stick = 30s fuel
- Visual: animated flame sprite (PIXI.AnimatedSprite with 4 frames)

### Enemy Behavior Changes
- **Night:** Wolves double aggro range. Bats spawn (new enemy). Snakes hide. Rabbits/deer sleep (reduced flee range).
- **Day:** Rabbits/deer spawn more. Wolves reduced aggro. Bats despawn.

### Sky Visual
- Sky gradient: PIXI.Graphics rectangle at top of viewport, color transitions with phase
- Stars at night: 50 small white circles (PIXI.Graphics), twinkle via alpha oscillation

### HUD Element
- Moon/sun icon (PIXI.Sprite) + phase text ("الفجر", "النهار", "المساء", "الليل")
- Position: top-right of game view

### Edge Cases
- **Indoor/Building:** When player enters interior, day/night overlay is hidden, indoor lighting applied
- **Pause:** Cycle pauses when game is paused (`SceneManager.onPause`)
- **Save/Restore:** Time of day saved in `maps.forest.timeOfDay`, restored on scene entry

## Pixi.js Technical Implementation Hints
```javascript
class DayNightCycle {
  constructor() {
    this.filter = new PIXI.ColorMatrixFilter();
    LAYERS.lighting.filters = [this.filter];
    this.timeOfDay = 0;       // 0-1440 minutes (in-game)
    this.phase = 'day';
    this.alpha = 0;
  }

  update(dt) {
    this.timeOfDay += dt * 2;  // 12 min real = 24 hr in-game
    this.phase = this.getPhase();
    this.alpha = this.getDarknessAlpha();

    // Apply night tint
    if (this.alpha > 0) {
      this.filter.reset();
      this.filter.tint(10, 10, 30, this.alpha);
    } else {
      this.filter.reset();
    }
  }

  drawTorchLight(ctx) {
    // Radial gradient sprite centered on player
    // Use PIXI.Mesh or PIXI.Sprite with radial gradient texture
  }
}
```

### Torch Light as Sprite Mask
```javascript
const lightTexture = PIXI.Texture.from('torch_light.png'); // pre-made radial gradient
const lightSprite = new PIXI.Sprite(lightTexture);
lightSprite.anchor.set(0.5);
lightSprite.blendMode = PIXI.BLEND_MODES.ADD;
lightSprite.alpha = 0.6;
```

## Verification & Acceptance Criteria
- [ ] Day/night transitions smoothly over 12 min cycle
- [ ] PIXI.ColorMatrixFilter darkens at night correctly
- [ ] Torch light circle visible at night via sprite mask
- [ ] Torch fuel depletes and refuels with sticks
- [ ] Enemy behavior changes between day and night
- [ ] Stars appear at night with twinkle
- [ ] HUD shows correct time of day icon and text
- [ ] Cycle pauses when game is paused
- [ ] Indoor areas hide day/night overlay
