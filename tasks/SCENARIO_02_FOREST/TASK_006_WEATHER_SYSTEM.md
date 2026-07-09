# TASK_006 — WEATHER_SYSTEM

## Objective
Implement dynamic weather in the forest using Pixi.js ParticleContainer for rain/fog/storm effects.

## Detailed Mechanics & User Stories

### Weather States
| State | Duration | Effect |
|-------|----------|--------|
| Clear | 3-8 min (random) | Default, no particles |
| Light Rain | 2-4 min | 100 raindrop particles, speed -5% |
| Heavy Rain | 1-3 min | 300 raindrop particles, speed -10%, torch depletes 2x |
| Fog | 1-3 min | Visibility 150px, muffled audio, enemies 50% detection range |
| Storm | 30-90 sec | Heavy rain + thunder + lightning, screen shake, all animals flee |

### Rain Particles (PIXI.ParticleContainer)
- GPU-accelerated particle system
- Each raindrop: thin white line (2px × 8px) falling diagonally
- Speed: 400-600 px/s, angle: 10° from vertical
- Particles wrap from bottom to top
- Storm: larger drops + wind shear (angle changes mid-fall)

### Fog Overlay
- Semi-transparent white gradient overlay sprite
- `PIXI.Filter` with noise displacement for organic fog movement
- Player vision cone reduced via mask

### Lightning & Thunder (Storm)
- Lightning flash: screen turns white for 100ms via `PIXI.Filter` (brightness spike)
- Thunder sound: `AudioManager.play('thunder')` with 0-2s random delay after flash
- Lightning strike randomly on ground: flash sprite at random position for 200ms
- Screen shake: `LAYERS.entities.pivot` offset oscillation

### HUD Indicator
- Weather icon (sun, rain cloud, fog, storm) + transition arrow if changing
- Position: top-right near day/night indicator

### Performance Mode
- If `App.ticker.FPS < 30` for 2 seconds: reduce rain particles to 50 (Light) / 150 (Heavy)
- Toggle via `autoQuality` flag in settings

### Edge Cases
- **Combined Day/Night + Weather:** Night + fog = extreme darkness. Torch helps but rain reduces it.
- **Pause:** Weather pauses when game pauses. Lightning timer also pauses.
- **Save/Restore:** Current weather and transition state saved in `maps.forest.weather`

## Pixi.js Technical Implementation Hints
```javascript
class WeatherSystem {
  constructor() {
    this.particles = new PIXI.ParticleContainer(1000, {
      scale: true, position: true, rotation: true, alpha: true
    });
    this.particles.visible = false;
    LAYERS.effects.addChild(this.particles);

    this.fogSprite = new PIXI.Sprite(PIXI.Texture.WHITE);
    this.fogSprite.alpha = 0;
    LAYERS.effects.addChild(this.fogSprite);
  }

  setWeather(type) {
    this.current = type;
    this.particles.removeChildren();
    if (type === 'clear') { this.particles.visible = false; return; }
    this.particles.visible = true;

    const count = type === 'lightRain' ? 100 : type === 'heavyRain' ? 300 : 0;
    for (let i = 0; i < count; i++) {
      const drop = new PIXI.Graphics();
      drop.beginFill(0x8888FF, 0.6);
      drop.drawRect(0, 0, 2, 8);
      drop.endFill();
      drop.x = Math.random() * App.screen.width;
      drop.y = Math.random() * App.screen.height;
      this.particles.addChild(drop);
    }
  }

  update(dt) {
    if (this.current === 'clear') return;
    // Move particles down-right, wrap to top
    this.particles.children.forEach(drop => {
      drop.y += 400 * dt;
      drop.x += 50 * dt;
      if (drop.y > App.screen.height) { drop.y = -8; drop.x = Math.random() * App.screen.width; }
    });
  }
}
```

### Fog Filter
```javascript
// Use PIXI.Filter with custom shader for fog displacement
// Or simpler: draw radial gradient overlay centered on player
const fog = new PIXI.Sprite(PIXI.Texture.WHITE);
fog.tint = 0xCCCCCC;
fog.alpha = 0.4;
fog.blendMode = PIXI.BLEND_MODES.SCREEN;
```

## Verification & Acceptance Criteria
- [ ] Weather transitions smoothly between states with fade
- [ ] Rain particles render at correct angle and speed (PIXI.ParticleContainer)
- [ ] Fog overlay reduces visibility correctly
- [ ] Storm lightning flash + thunder with screen shake
- [ ] Torch fuel depletes faster in rain
- [ ] Performance mode reduces particles when FPS drops
- [ ] Weather + day/night combine correctly (night fog is darker)
- [ ] HUD shows correct weather icon
