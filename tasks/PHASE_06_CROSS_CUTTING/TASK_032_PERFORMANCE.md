# TASK_032 — PERFORMANCE_OPTIMIZATION

## Objective
Optimize the Canvas 2D game for smooth 60fps across all scenes, with object pooling, tile culling, offscreen rendering, and auto-quality adjustment.

## Detailed Mechanics & User Stories

### Rendering Optimization

**Tile Culling:**
- Only render tiles within camera viewport + 2 tile margin
- Skip update/render for tiles outside this range
- Check: `if (tile.x + 40 < camera.x - margin || tile.x > camera.x + viewW + margin) continue;`

**Entity Culling:**
- Skip update/render for entities > 100px outside camera view
- `if (entity.x + entity.radius < camera.x - 100 || entity.x - entity.radius > camera.x + viewW + 100) continue;`

**Offscreen Canvas:**
- Pre-render static map layers (ground tiles, buildings) to an offscreen `document.createElement('canvas')`
- Only redraw when something changes (tree chopped, resource collected)
- Dynamic entities (player, enemies, particles) drawn each frame on the main canvas via `ctx.drawImage(offscreen, ...)`

**Particle Pool:**
- Fixed-size pool: plain JS array of particle objects, max capacity
- Max 200 particles for weather, smoke, fire effects
- Reuse dead particles (mark `alive = false`, reuse on spawn)

### Memory Optimization

**Object Pooling:**
```javascript
class ObjectPool {
  constructor(factory, size) {
    this.pool = Array.from({ length: size }, factory);
    this.active = [];
  }

  acquire() {
    const obj = this.pool.find(o => !o.active);
    if (obj) { obj.active = true; return obj; }
    return null; // Pool exhausted
  }

  release(obj) {
    obj.active = false;
    obj.alive = false;
  }
}

const arrowPool = new ObjectPool(() => new Arrow(), 30);
const projectilePool = new ObjectPool(() => new Projectile(), 50);
```

### JavaScript Optimization
- Single `requestAnimationFrame` loop — no `setInterval` for game logic
- Debounce saves: max once per 5s
- Avoid `new` in hot loops. Pre-allocate objects.
- Web Worker for enemy AI if CPU-bound (>50 enemies)

### Auto Quality Adjustment
```javascript
let fpsHistory = [];
let lastFrame = performance.now();
let quality = 'high';

function gameLoop(now) {
  const dt = (now - lastFrame) / 1000;
  lastFrame = now;
  const fps = 1 / dt;
  fpsHistory.push(fps);
  if (fpsHistory.length > 150) fpsHistory.shift();
  const avg = fpsHistory.reduce((a, b) => a + b, 0) / fpsHistory.length;

  if (avg < 20 && quality !== 'low') {
    setQuality('low');
    showToast('تم تخفيض جودة الرسومات لتحسين الأداء');
  }

  if (!document.hidden) {
    update(dt);
    draw();
  }
  requestAnimationFrame(gameLoop);
}

function setQuality(level) {
  quality = level;
  switch (level) {
    case 'low':
      particleMax = 50;
      weatherEnabled = false;
      lightingEnabled = false;
      shadowEnabled = false;
      break;
    case 'medium':
      particleMax = 100;
      weatherEnabled = true;
      lightingEnabled = true;
      shadowEnabled = false;
      break;
    case 'high':
      particleMax = 500;
      weatherEnabled = true;
      lightingEnabled = true;
      shadowEnabled = true;
      break;
  }
}
```

### FPS Counter
- Press F3: toggle HTML overlay (or canvas text) at top-left
- Shows FPS, draw calls estimate, entity count, particle count
- Green if > 50fps, yellow if 30-50, red if < 30

### Edge Cases
- **Very Old Devices:** If `navigator.hardwareConcurrency < 2` → minimal config
- **Tab Background:** Pause updates when `document.hidden` is true (skip update/draw in rAF or cancel rAF)
- **Memory Leak Prevention:** On scene exit, clear entity arrays, release pools, null large offscreen canvases, remove event listeners

## Canvas 2D Implementation Hints
```javascript
// Pre-render static ground to offscreen canvas
class OptimizedWorld {
  constructor(worldW, worldH) {
    this.offscreen = document.createElement('canvas');
    this.offscreen.width = worldW;
    this.offscreen.height = worldH;
    this.offCtx = this.offscreen.getContext('2d');
    this.dirty = true;
  }

  bakeStatic(tiles, staticObjects) {
    const ctx = this.offCtx;
    ctx.clearRect(0, 0, this.offscreen.width, this.offscreen.height);
    // Draw all ground tiles, static objects once
    tiles.forEach(t => drawTile(ctx, t));
    staticObjects.forEach(o => drawStatic(ctx, o));
    this.dirty = false;
  }

  draw(ctx, camera) {
    if (this.dirty) this.bakeStatic(tiles, staticObjects);
    // Draw visible portion of offscreen into main canvas
    const sx = camera.x, sy = camera.y;
    const sw = ctx.canvas.width / camera.zoom;
    const sh = ctx.canvas.height / camera.zoom;
    ctx.drawImage(
      this.offscreen,
      sx, sy, sw, sh,
      0, 0, ctx.canvas.width, ctx.canvas.height
    );
  }
}

// Culling helper
function isVisible(entity, camera, viewW, viewH) {
  const margin = 100;
  return entity.x + entity.radius > camera.x - margin &&
         entity.x - entity.radius < camera.x + viewW + margin &&
         entity.y + entity.radius > camera.y - margin &&
         entity.y - entity.radius < camera.y + viewH + margin;
}
```

## Verification & Acceptance Criteria
- [ ] Game runs at 60fps on modern devices (Intel i5 + integrated GPU)
- [ ] Tile culling reduces draw work by >50% (verify with FPS counter)
- [ ] Offscreen canvas pre-bakes static layers
- [ ] Object pool reuses entities (no GC spikes during combat)
- [ ] FPS counter toggles with F3, shows correct metrics
- [ ] Auto quality adjustment triggers at <20fps
- [ ] Tab background pauses game updates
- [ ] No memory leaks after 30min continuous play (check Chrome DevTools)
- [ ] Scene transitions clean up canvases, pools, and listeners
