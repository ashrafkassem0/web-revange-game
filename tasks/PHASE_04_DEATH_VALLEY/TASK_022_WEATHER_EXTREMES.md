# TASK_022 — WEATHER_EXTREMES

## Objective
Implement Death Valley-specific weather extremes (sandstorms, heat waves, meteor showers) with Canvas 2D particle arrays, screen effects, and gameplay impact.

## Detailed Mechanics & User Stories

### Sandstorm
| Property | Value |
|----------|-------|
| Chance | 10% every 5 min |
| Duration | 60s |
| Particles | 500 orange/brown dots (plain JS array drawn with `ctx`) |
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
| Visual | Screen shimmer (subtle vertical sine offset when blitting / overlay), sun icon pulse |
| Strategy | Carry cactus fruit (reduces heat by 30 points) |

### Meteor Shower (Rare)
| Property | Value |
|----------|-------|
| Chance | 5% every 10 min |
| Duration | 30s |
| Meteors | 1 per 2s, 15 total |
| Damage | 50 in 60px radius |
| Warning | 3s red circle on ground (`ctx` arc, alpha pulse) |
| Shelter | Ruins, cliff overhangs |
| Reward | 3-5 "star fragments" spawn at impact sites |

### Meteor Impact Sequence
1. Warning: red circle appears at random position, grows from radius 10→60 over 3s, alpha pulses
2. Impact: screen flash (full-canvas white rect, alpha 0.8 for 100ms), screen shake (camera offset jitter)
3. Crater: temporary obstacle drawn on ground (dark ellipse), lasts 60s
4. Star fragment: dropped item at impact center, collectible

### Weather Forecast
- Press `Y` → HTML toast / HUD text prediction with 80% accuracy:
  - "تبدو السماء... عاصفة رملية قادمة" (sandstorm)
  - "الجو حار جداً اليوم" (heat wave)
  - "سماء غريبة... ربما زخات نيزكية" (meteor shower)
  - "الطقس معتدل اليوم" (clear)

### Edge Cases
- **Multiple Events:** Never more than one event active. Exclusive flag.
- **Underground/Cave:** All weather effects pause. Sub-level / cave draw passes not affected.
- **Meteor Hit Player:** If player stands in warning circle and doesn't move, takes 50 damage. "احترس من النيازك!" warning text.

## Canvas 2D Implementation Hints
```javascript
class DVWeatherSystem {
  constructor() {
    this.currentEvent = null;
    this.eventTimer = 0;
    this.sandParticles = [];
    this.meteors = [];
    this.shake = { x: 0, y: 0, timer: 0 };
    this.flashAlpha = 0;
    this.heatShimmerT = 0;
  }

  startSandstorm() {
    this.currentEvent = 'sandstorm';
    this.sandParticles = [];
    for (let i = 0; i < 500; i++) {
      this.sandParticles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: 2 + Math.random() * 4,
        vy: 0.5 + Math.random(),
        alpha: 0.3 + Math.random() * 0.4,
        w: 2 + Math.random() * 2,
        h: 4 + Math.random() * 4
      });
    }
    AudioManager.playAmbient('sandstorm');
  }

  updateSandstorm(dt) {
    for (const p of this.sandParticles) {
      p.x += p.vx;
      p.y += p.vy;
      if (p.x > canvas.width) p.x = 0;
      if (p.y > canvas.height) p.y = 0;
    }
  }

  drawSandstorm(ctx) {
    // Dim visibility overlay
    ctx.fillStyle = 'rgba(40,25,10,0.35)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    for (const p of this.sandParticles) {
      ctx.fillStyle = `rgba(204,136,68,${p.alpha})`;
      ctx.fillRect(p.x, p.y, p.w, p.h);
    }
  }

  // Heat wave shimmer: slight sine offset when drawing world, or CSS filter on canvas
  drawHeatShimmer(ctx) {
    this.heatShimmerT += 0.05;
    // Optional: draw a semi-transparent warm overlay
    ctx.fillStyle = `rgba(255,120,40,${0.08 + 0.04 * Math.sin(this.heatShimmerT)})`;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  startMeteorShower() {
    this.currentEvent = 'meteor';
    this.meteorCount = 0;
    this.meteorSpawnAcc = 0;
  }

  updateMeteorShower(dt, player, camera) {
    this.meteorSpawnAcc += dt;
    if (this.meteorSpawnAcc >= 2 && this.meteorCount < 15) {
      this.meteorSpawnAcc = 0;
      this.meteorCount++;
      this.spawnMeteor(player, camera);
    }
    for (const m of this.meteors) {
      m.warnTimer -= dt;
      m.warnRadius = 10 + (1 - m.warnTimer / 3) * 50;
      m.warnAlpha = 0.3 + 0.3 * Math.sin(Date.now() * 0.01);
      if (m.warnTimer <= 0 && !m.impacted) {
        m.impacted = true;
        this.impactMeteor(m, player);
      }
    }
  }

  spawnMeteor(player, camera) {
    this.meteors.push({
      x: camera.x + Math.random() * canvas.width,
      y: camera.y + Math.random() * canvas.height,
      warnTimer: 3,
      warnRadius: 10,
      warnAlpha: 0.3,
      impacted: false
    });
  }

  impactMeteor(m, player) {
    const dist = Math.hypot(player.x - m.x, player.y - m.y);
    if (dist < 60) player.takeDamage(50);
    this.flashAlpha = 0.8;
    this.shake.timer = 0.3;
    this.shake.intensity = 10;
    m.craterLife = 60;
    spawnDroppedItem('starFragment', m.x, m.y);
  }

  drawMeteors(ctx, camera) {
    for (const m of this.meteors) {
      if (!m.impacted) {
        ctx.fillStyle = `rgba(255,0,0,${m.warnAlpha})`;
        ctx.beginPath();
        ctx.arc(m.x - camera.x, m.y - camera.y, m.warnRadius, 0, Math.PI * 2);
        ctx.fill();
      } else if (m.craterLife > 0) {
        ctx.fillStyle = 'rgba(30,20,15,0.8)';
        ctx.beginPath();
        ctx.ellipse(m.x - camera.x, m.y - camera.y, 28, 16, 0, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    if (this.flashAlpha > 0) {
      ctx.fillStyle = `rgba(255,255,255,${this.flashAlpha})`;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      this.flashAlpha = Math.max(0, this.flashAlpha - 0.15);
    }
  }

  updateShake(camera, dt) {
    if (this.shake.timer <= 0) {
      this.shake.x = 0; this.shake.y = 0;
      return;
    }
    this.shake.timer -= dt;
    this.shake.x = (Math.random() - 0.5) * this.shake.intensity;
    this.shake.y = (Math.random() - 0.5) * this.shake.intensity;
  }

  // Forecast — HTML notify toast
  showForecast() {
    const msg = predictWeather(0.8); // 80% accuracy
    notify(msg, '#ffd060');
  }
}
```

## Verification & Acceptance Criteria
- [ ] Sandstorm reduces visibility (dim overlay), speed, and arrow range
- [ ] 500 sand particles render via plain JS array + Canvas 2D
- [ ] Heat wave doubles heat meter fill rate
- [ ] Cactus fruit reduces heat by 30 points
- [ ] Meteor warning red circle appears 3s before impact
- [ ] Meteor impact: flash, screen shake, 50 damage in 60px radius
- [ ] Star fragments spawn at impact sites (3-5 per shower)
- [ ] Weather forecast predicts with ~80% accuracy (Y key)
- [ ] Events are exclusive (no double events)
- [ ] Underground shelters from all weather
