# TASK_022 — WEATHER_EXTREMES

## Objective
Keep Death Valley weather: **sandstorm** and **heat haze** as Canvas 2D particle arrays + overlays in the DV scene. Integrate with forest weather ideas from `TASK_006` / shared helper if one exists (or a small `dv-weather.js` / shared `weather-particles.js`). Use realistic particle counts. Optional light meteor is OK; do not depend on underground shelters.

## Architecture
- DV page rAF loop calls `weather.update(dt)` + `weather.draw(ctx)`.
- Prefer extracting a tiny helper reusable from forest rain (particle pool, wrap, dim overlay) — but DV-specific events stay in DV.
- Persist optional `maps.deathValley.weather` (`{ type, timeLeft }`) via `GameState`.
- Top-down only: weather affects speed, visibility, heat — no cave “pause weather” requirement.

## Detailed Mechanics & User Stories

### Sandstorm (primary)
| Property | Value |
|----------|-------|
| Trigger | ~10% check every 4–6 min, or scripted timer |
| Duration | 45–75s |
| Particles | **120–220** sand motes (not 500) — raise only if FPS stable |
| Visual | brown/orange `fillRect`/`arc` drift + dim overlay `rgba(40,25,10,0.3)` |
| Gameplay | move speed −25%, optional shorter bow range; Arabic toast «عاصفة رملية!» |
| Shelter | standing on `RUINS` or `OASIS` reduces slow / clears overlay alpha by half |

### Heat haze (primary)
| Property | Value |
|----------|-------|
| Trigger | often while on open sand, or timed “heat wave” 60–90s |
| Visual | warm overlay `rgba(255,120,40,0.06–0.12)` + subtle sine shimmer on overlay alpha |
| Gameplay | heat meter fills ~1.5–2× faster (TASK_018/019); oasis still best relief |
| Item | `cactusFruit` reduces heat by a chunk; desert cloak (TASK_021) slows heat gain |

### Meteor shower (optional, light)
- Rare, short (20–30s), **4–8** impacts max.
- Warning circle 2s → small damage if player stays in radius; soft camera shake.
- Skip star-fragment economy if it bloats scope; flavor FX is enough.

### Forecast (optional)
- Key or HUD button → `#notify` Arabic line with rough prediction («عاصفة رملية قادمة» / «الجو معتدل»).
- No need for 80% accuracy simulation — simple based on next scheduled event.

### Performance
- If frame dt spikes, cut sand particles in half (same idea as TASK_006 performance mode).
- One event at a time (`currentEvent` exclusive).

### Edge Cases
- Clear weather default; never stack sandstorm + meteor.
- Pause: if DV has a pause/modal, freeze weather timers.
- City/forest unaffected unless shared helper is explicitly reused there for rain only.

## Canvas 2D Implementation Hints
```javascript
class DVWeather {
  constructor() {
    this.current = 'clear';
    this.particles = [];
    this.t = 0;
  }

  startSandstorm() {
    this.current = 'sandstorm';
    this.particles = [];
    const n = 160;
    for (let i = 0; i < n; i++) {
      this.particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: 2 + Math.random() * 3,
        vy: 0.4 + Math.random() * 0.8,
        a: 0.25 + Math.random() * 0.35
      });
    }
    notify('عاصفة رملية!', '#e0a060');
  }

  draw(ctx) {
    if (this.current === 'sandstorm') {
      ctx.fillStyle = 'rgba(40,25,10,0.32)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      for (const p of this.particles) {
        ctx.fillStyle = `rgba(204,136,68,${p.a})`;
        ctx.fillRect(p.x, p.y, 2, 3);
      }
    }
    if (this.current === 'heat' || this.heatHaze) {
      const a = 0.08 + 0.04 * Math.sin(this.t * 2);
      ctx.fillStyle = `rgba(255,120,40,${a})`;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
  }
}
```

## Verification & Acceptance Criteria
- [ ] Sandstorm draws particle array + dim overlay; slows player; Arabic notify
- [ ] Heat haze overlay integrates with heat meter (faster fill / oasis relief)
- [ ] Particle counts stay in a realistic range (~120–220 sand); FPS-safe fallback
- [ ] Only one weather event active at a time
- [ ] Optional meteor is limited and top-down (warning circle + damage) — no cave shelter dependency
- [ ] Shared/forest weather helper reused only if clean; otherwise `dv-weather.js` is fine
- [ ] Zero Pixi; works inside `game/death-valley` Canvas loop
