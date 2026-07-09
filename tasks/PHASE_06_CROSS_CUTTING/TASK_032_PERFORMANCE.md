# TASK_032 — PERFORMANCE_OPTIMIZATION

## Objective
**Audit and tighten** the existing Canvas 2D pipeline: offscreen terrain, entity culling, particle caps. Do **not** build a new engine or Web Worker AI layer.

## Architecture (must follow)
- Forest already bakes / draws world via offscreen-style patterns (`forest-world.js`) — extend the same approach to dark-kingdom / boss if needed
- Single `requestAnimationFrame` loop (already the model)
- **No Pixi**, no rewrite of the renderer

## Detailed Mechanics & User Stories

### Audit checklist
1. **Offscreen terrain** — confirm static ground is not fully redrawn tile-by-tile every frame; fix if regressions appear on new maps
2. **Entity culling** — skip `update`/`draw` for enemies/props outside camera + margin (~100px)
3. **Particle caps** — hard max (e.g. 80–150) for weather/ash/blood; drop oldest when full
4. **Pause when hidden** — if `document.hidden`, skip heavy update/draw (keep rAF cheap or pause)

### Optional light extras
- F3 FPS overlay (HTML): fps + enemy count + particle count
- If avg FPS < 20 for several seconds: lower particle max / disable ash (toast once)

### Explicitly out of scope
- Object-pool framework for every projectile class
- Web Workers for AI
- Automatic quality dropdown with shadow systems that do not exist
- “60fps guarantee on all devices” as a hard gate — aim for smooth play on a typical laptop

## Implementation Hints
```javascript
function isOnScreen(e, cam, viewW, viewH, margin = 100) {
  return e.x > cam.x - margin && e.x < cam.x + viewW + margin &&
         e.y > cam.y - margin && e.y < cam.y + viewH + margin;
}
// particles.length > MAX → particles.splice(0, particles.length - MAX)
```

## Verification & Acceptance Criteria
- [ ] Entity culling applied on forest (and new maps if present)
- [ ] Particle count capped
- [ ] Offscreen / baked terrain path verified or fixed
- [ ] Tab background does not burn CPU unnecessarily
- [ ] No new rendering engine introduced
- [ ] Zero Pixi
