# TASK_006 — WEATHER_SYSTEM

## Objective
Implement dynamic weather in the forest using plain JS particle arrays drawn with Canvas 2D `ctx` for rain/fog/storm effects.

## Detailed Mechanics & User Stories

### Weather States
| State | Duration | Effect |
|-------|----------|--------|
| Clear | 3-8 min (random) | Default, no particles |
| Light Rain | 2-4 min | 100 raindrop particles, speed -5% |
| Heavy Rain | 1-3 min | 300 raindrop particles, speed -10%, torch depletes 2x |
| Fog | 1-3 min | Visibility 150px, muffled audio, enemies 50% detection range |
| Storm | 30-90 sec | Heavy rain + thunder + lightning, screen shake, all animals flee |

### Rain Particles (JS array + ctx)
- Plain array of `{ x, y, vx, vy, len }` objects updated each frame
- Each raindrop: thin white/blue line (`ctx.strokeRect` or `lineTo`) falling diagonally
- Speed: 400-600 px/s, angle: 10° from vertical
- Particles wrap from bottom to top
- Storm: larger drops + wind shear (angle changes mid-fall)

### Fog Overlay
- Semi-transparent white/grey `fillRect` over viewport, or soft radial clear around player
- Optional: animate alpha / offset noise with `Math.sin` for organic movement
- Player vision cone reduced via stronger darkness outside a radius (combine with night overlay)

### Lightning & Thunder (Storm)
- Lightning flash: full-screen white `fillRect` with high alpha for 100ms
- Thunder sound: `AudioManager.play('thunder')` with 0-2s random delay after flash
- Lightning strike randomly on ground: bright stroke/bolt at random world position for 200ms
- Screen shake: offset `camera.x` / `camera.y` (or draw offset) with short oscillation

### HUD Indicator
- Weather icon (sun, rain cloud, fog, storm) + transition arrow if changing
- Position: top-right near day/night indicator (HTML HUD or `forest-hud.js`)

### Performance Mode
- If measured FPS < 30 for 2 seconds: reduce rain particles to 50 (Light) / 150 (Heavy)
- Toggle via `autoQuality` flag in settings
- FPS can be estimated from `requestAnimationFrame` delta

### Edge Cases
- **Combined Day/Night + Weather:** Night + fog = extreme darkness. Torch helps but rain reduces it.
- **Pause:** Weather pauses when game pauses. Lightning timer also pauses.
- **Save/Restore:** Current weather and transition state saved in `maps.forest.weather`

## Canvas 2D Implementation Hints
```javascript
class WeatherSystem {
  constructor() {
    this.particles = []; // plain JS array
    this.current = 'clear';
    this.fogAlpha = 0;
    this.flashAlpha = 0;
    this.shake = { x: 0, y: 0 };
  }

  setWeather(type) {
    this.current = type;
    this.particles.length = 0;
    if (type === 'clear') return;

    const count = type === 'lightRain' ? 100 : type === 'heavyRain' || type === 'storm' ? 300 : 0;
    for (let i = 0; i < count; i++) {
      this.particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: 50,
        vy: 400 + Math.random() * 200,
        len: 6 + Math.random() * 4
      });
    }
  }

  update(dt) {
    if (this.current === 'clear') return;
    for (const drop of this.particles) {
      drop.y += drop.vy * dt;
      drop.x += drop.vx * dt;
      if (drop.y > canvas.height) {
        drop.y = -8;
        drop.x = Math.random() * canvas.width;
      }
    }
    if (this.flashAlpha > 0) this.flashAlpha = Math.max(0, this.flashAlpha - dt * 10);
  }

  draw(ctx) {
    if (this.fogAlpha > 0) {
      ctx.fillStyle = `rgba(200,200,210,${this.fogAlpha})`;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
    ctx.strokeStyle = 'rgba(136,136,255,0.6)';
    ctx.lineWidth = 1;
    for (const drop of this.particles) {
      ctx.beginPath();
      ctx.moveTo(drop.x, drop.y);
      ctx.lineTo(drop.x + 2, drop.y + drop.len);
      ctx.stroke();
    }
    if (this.flashAlpha > 0) {
      ctx.fillStyle = `rgba(255,255,255,${this.flashAlpha})`;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
  }
}
```

### Fog + Vision
```javascript
// Soft fog: full-screen fill, then cut a clear circle around the player
function drawFog(ctx, playerSx, playerSy, visionR, alpha) {
  const off = document.createElement('canvas'); // or reuse cached offscreen
  // fill fog, destination-out radial around player, then drawImage to main ctx
}
```

## Verification & Acceptance Criteria
- [ ] Weather transitions smoothly between states with fade
- [ ] Rain particles render at correct angle and speed (JS array + ctx)
- [ ] Fog overlay reduces visibility correctly
- [ ] Storm lightning flash + thunder with screen shake
- [ ] Torch fuel depletes faster in rain
- [ ] Performance mode reduces particles when FPS drops
- [ ] Weather + day/night combine correctly (night fog is darker)
- [ ] HUD shows correct weather icon
