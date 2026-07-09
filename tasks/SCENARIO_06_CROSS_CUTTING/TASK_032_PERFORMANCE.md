# TASK_032 — PERFORMANCE_OPTIMIZATION

## Objective
Optimize the Pixi.js game for smooth 60fps across all scenes, with object pooling, tile culling, offscreen rendering, and auto-quality adjustment.

## Detailed Mechanics & User Stories

### Rendering Optimization

**Tile Culling:**
- Only render tiles within camera viewport + 2 tile margin
- Skip update/render for tiles outside this range
- Check: `if (tile.x + 40 < camera.x - margin || tile.x > camera.x + viewW + margin) continue;`

**Entity Culling:**
- Skip update/render for entities > 100px outside camera view
- `if (entity.x + entity.radius < camera.x - 100 || entity.x - entity.radius > camera.x + viewW + 100) continue;`

**Offscreen Canvas (PIXI.RenderTexture):**
- Pre-render static map layers (ground tiles, buildings) to `PIXI.RenderTexture`
- Only redraw when something changes (tree chopped, resource collected)
- Dynamic entities (player, enemies, particles) drawn on separate container

**Particle Pool:**
- Fixed-size pool: `new PIXI.ParticleContainer(MAX_PARTICLES, {...})`
- Max 200 particles for weather, smoke, fire effects
- Reuse dead particles (mark `visible = false`, reuse on spawn)

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
    obj.visible = false;
  }
}

const arrowPool = new ObjectPool(() => new Arrow(), 30);
const projectilePool = new ObjectPool(() => new Projectile(), 50);
```

### JavaScript Optimization
- Single `App.ticker` loop — no `setInterval` for game logic
- Debounce saves: max once per 5s
- Avoid `new` in hot loops. Pre-allocate objects.
- Web Worker for enemy AI if CPU-bound (>50 enemies)

### Auto Quality Adjustment
```javascript
let fpsHistory = [];
App.ticker.add(() => {
  const fps = App.ticker.FPS;
  fpsHistory.push(fps);
  if (fpsHistory.length > 150) fpsHistory.shift();
  const avg = fpsHistory.reduce((a, b) => a + b, 0) / fpsHistory.length;

  if (avg < 20 && quality !== 'low') {
    setQuality('low');
    showToast('تم تخفيض جودة الرسومات لتحسين الأداء');
  }
});

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
- Press F3: toggle PIXI.Text overlay at top-left
- Shows FPS, draw calls, entity count, particle count
- Green if > 50fps, yellow if 30-50, red if < 30

### Edge Cases
- **Very Old Devices:** If `navigator.hardwareConcurrency < 2` → minimal config
- **Tab Background:** `PIXI.Application` auto-pauses when tab hidden. `document.hidden` check in ticker.
- **Memory Leak Prevention:** On scene `onExit()`, destroy all containers: `container.removeChildren().forEach(c => c.destroy({ children: true, texture: true }))`

## Pixi.js Technical Implementation Hints
```javascript
// Pre-render static ground to RenderTexture
class OptimizedWorld {
  constructor() {
    this.staticLayer = new PIXI.Container();
    this.dynamicLayer = new PIXI.Container();
    this.renderTexture = PIXI.RenderTexture.create({
      width: CFG.WORLD_W, height: CFG.WORLD_H
    });
    this.staticSprite = new PIXI.Sprite(this.renderTexture);
  }

  bakeStatic() {
    // Draw all ground tiles, static objects to renderTexture once
    const renderer = App.renderer;
    renderer.render(this.staticLayer, { renderTexture: this.renderTexture });
    // Now only dynamicLayer needs per-frame updates
  }

  updateDynamic() {
    // Clear and redraw only moving entities
    this.dynamicLayer.removeChildren();
    this.dynamicLayer.addChild(player.sprite);
    enemies.forEach(e => {
      if (this.isVisible(e)) this.dynamicLayer.addChild(e);
    });
  }
}

// Culling helper
function isVisible(entity, camera) {
  const margin = 100;
  return entity.x + entity.radius > camera.x - margin &&
         entity.x - entity.radius < camera.x + App.screen.width / ZOOM + margin &&
         entity.y + entity.radius > camera.y - margin &&
         entity.y - entity.radius < camera.y + App.screen.height / ZOOM + margin;
}
```

## Verification & Acceptance Criteria
- [ ] Game runs at 60fps on modern devices (Intel i5 + integrated GPU)
- [ ] Tile culling reduces draw calls by >50% (verify with FPS counter)
- [ ] Texture atlas pre-bakes static layers
- [ ] Object pool reuses entities (no GC spikes during combat)
- [ ] FPS counter toggles with F3, shows correct metrics
- [ ] Auto quality adjustment triggers at <20fps
- [ ] Tab background pauses App.ticker
- [ ] No memory leaks after 30min continuous play (check Chrome DevTools)
- [ ] Scene transitions clean up all Pixi.js resources
