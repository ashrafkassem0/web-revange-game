# TASK_022 — WEATHER_EXTREMES

## Objective
Implement Death Valley-specific weather extremes (sandstorms, heat waves, meteor showers) with Pixi.js particle effects and gameplay impact.

## Detailed Mechanics & User Stories

### Sandstorm
| Property | Value |
|----------|-------|
| Chance | 10% every 5 min |
| Duration | 60s |
| Particles | 500 orange/brown dots (PIXI.ParticleContainer) |
| Effects | Visibility 80px, speed -30%, arrow range halved |
| Shelter | Ruins (complete), Oasis (50%) |
| Wind sound | AudioManager.playAmbient('sandstorm') |

### Heat Wave
| Property | Value |
|----------|-------|
| Chance | 15% every 8 min |
| Duration | 90s |
| Effects | Heat meter fills 2x faster, oasis restores 2x slower |
| Shelter | Ruins only |
| Visual | Screen shimmer (canvas distortion filter), sun icon pulse |
| Strategy | Carry cactus fruit (reduces heat by 30 points) |

### Meteor Shower (Rare)
| Property | Value |
|----------|-------|
| Chance | 5% every 10 min |
| Duration | 30s |
| Meteors | 1 per 2s, 15 total |
| Damage | 50 in 60px radius |
| Warning | 3s red circle on ground (PIXI.Graphics, alpha pulse) |
| Shelter | Ruins, cliff overhangs |
| Reward | 3-5 "star fragments" spawn at impact sites |

### Meteor Impact Sequence
1. Warning: red circle appears at random position, grows from radius 10→60 over 3s, alpha pulses
2. Impact: screen flash (PIXI.AlphaFilter brightness = 2 for 100ms), screen shake (container pivot offset)
3. Crater: temporary obstacle sprite (PIXI.Sprite, crater texture), lasts 60s
4. Star fragment: droppedItem sprite at impact center, collectible

### Weather Forecast
- Press `Y` → PIXI.Text prediction with 80% accuracy:
  - "تبدو السماء... عاصفة رملية قادمة" (sandstorm)
  - "الجو حار جداً اليوم" (heat wave)
  - "سماء غريبة... ربما زخات نيزكية" (meteor shower)
  - "الطقس معتدل اليوم" (clear)

### Edge Cases
- **Multiple Events:** Never more than one event active. Exclusive flag.
- **Underground/Cave:** All weather effects pause. Underground containers not affected.
- **Meteor Hit Player:** If player stands in warning circle and doesn't move, takes 50 damage. "احترس من النيازك!" warning text.

## Pixi.js Technical Implementation Hints
```javascript
class DVWeatherSystem {
  constructor() {
    this.currentEvent = null;
    this.eventTimer = 0;
    this.meteors = [];

    // Sandstorm particles
    this.sandParticles = new PIXI.ParticleContainer(1000, {
      position: true, alpha: true, rotation: true
    });
    LAYERS.effects.addChild(this.sandParticles);

    // Heat wave filter (screen distortion)
    this.heatFilter = new PIXI.Filter(null, `
      varying vec2 vTextureCoord;
      uniform sampler2D uSampler;
      uniform float time;
      void main(void) {
        vec2 uv = vTextureCoord;
        uv.y += sin(uv.x * 20.0 + time * 3.0) * 0.01;
        gl_FragColor = texture2D(uSampler, uv);
      }
    `);
  }

  startSandstorm() {
    this.currentEvent = 'sandstorm';
    // Spawn 500 sand particles
    for (let i = 0; i < 500; i++) {
      const p = new PIXI.Graphics();
      p.beginFill(0xCC8844, 0.5);
      p.drawRect(0, 0, 3, 6);
      p.endFill();
      p.x = Math.random() * App.screen.width;
      p.y = Math.random() * App.screen.height;
      p.rotation = 0.2; // angle
      this.sandParticles.addChild(p);
    }
    AudioManager.playAmbient('sandstorm');
    // Apply visibility filter
    LAYERS.lighting.filters = [new PIXI.AlphaFilter(0.6)];
  }

  startMeteorShower() {
    this.currentEvent = 'meteor';
    this.meteorTimer = setInterval(() => this.spawnMeteor(), 2000);
  }

  spawnMeteor() {
    // Warning circle
    const x = Math.random() * App.screen.width;
    const y = Math.random() * App.screen.height;
    const warning = new PIXI.Graphics();
    warning.beginFill(0xFF0000, 0.3);
    warning.drawCircle(0, 0, 10);
    warning.endFill();
    warning.x = x; warning.y = y;
    LAYERS.effects.addChild(warning);

    // Grow warning over 3s
    gsap.to(warning.scale, { x: 6, y: 6, duration: 3 });
    gsap.to(warning, { alpha: 0.6, duration: 3, yoyo: true, repeat: 1 });

    // Impact after 3s
    setTimeout(() => {
      // Check if player in radius
      const dist = Math.hypot(player.x - x + camera.x, player.y - y + camera.y);
      if (dist < 60) player.takeDamage(50);

      // Screen shake
      this.shakeScreen(10, 300);

      // Flash
      const flash = new PIXI.Sprite(PIXI.Texture.WHITE);
      flash.tint = 0xFFFFFF;
      flash.alpha = 0.8;
      LAYERS.overlay.addChild(flash);
      gsap.to(flash, { alpha: 0, duration: 0.1, onComplete: () => flash.destroy() });

      // Crater
      const crater = new PIXI.Sprite(PIXI.Texture.from('crater.png'));
      crater.x = x; crater.y = y;
      LAYERS.ground.addChild(crater);

      // Star fragment
      const fragment = new DroppedItem('starFragment', x, y);
      LAYERS.entities.addChild(fragment);

      warning.destroy();
    }, 3000);
  }

  shakeScreen(intensity, duration) {
    const original = { x: LAYERS.entities.pivot.x, y: LAYERS.entities.pivot.y };
    gsap.to(LAYERS.entities.pivot, {
      x: original.x + (Math.random() - 0.5) * intensity,
      y: original.y + (Math.random() - 0.5) * intensity,
      duration: 0.05, repeat: Math.floor(duration / 50),
      onComplete: () => { LAYERS.entities.pivot.x = original.x; LAYERS.entities.pivot.y = original.y; }
    });
  }
}
```

## Verification & Acceptance Criteria
- [ ] Sandstorm reduces visibility (PIXI.AlphaFilter), speed, and arrow range
- [ ] 500 sand particles render via PIXI.ParticleContainer
- [ ] Heat wave doubles heat meter fill rate
- [ ] Cactus fruit reduces heat by 30 points
- [ ] Meteor warning red circle appears 3s before impact
- [ ] Meteor impact: flash, screen shake, 50 damage in 60px radius
- [ ] Star fragments spawn at impact sites (3-5 per shower)
- [ ] Weather forecast predicts with ~80% accuracy (Y key)
- [ ] Events are exclusive (no double events)
- [ ] Underground shelters from all weather
