# TASK_005 — DAY_NIGHT_CYCLE

## Objective
Add a dynamic day/night cycle to the forest scene using Canvas 2D rgba overlays (extending `forest-time.js`), affecting visibility, enemy behavior, and gameplay.

## Detailed Mechanics & User Stories

### Cycle Duration
- Full cycle = 12 minutes real-time (6 min day, 6 min night)
- Phases: Dawn (1 min), Day (5 min), Dusk (1 min), Night (5 min)

### Visual Overlay (Canvas 2D fillRect)
- Draw a full-viewport night layer with `ctx.fillRect` / offscreen canvas (same approach as existing `drawNightOverlay` in `forest-time.js`):
  - **Day:** No overlay (full brightness)
  - **Dawn/Dusk:** Warm/orange-tinted `rgba(...)` fill, alpha ~0.3
  - **Night:** Dark blue tint, alpha ~0.7
- Smooth transition over 2 minutes between phases via `computeDarkness()`

### Lighting Mask
- At night, player has a torch light circle (radius 200px)
- Implement with offscreen canvas + `destination-out` radial gradients (already used for campfire lights in `forest-time.js`)
- Outside light circle: darkness
- Multiple light sources: torch, campfires, enemy torches via `getLightSources()`

### Torch Mechanic
- Torch burns automatically at night
- Fuel: initially 100, depletes at 1/sec
- When empty: light radius shrinks to 50px
- Refuel: press F → "Refuel Torch" → 1 stick = 30s fuel
- Visual: animated flame drawn with `ctx` (flickering arcs/ellipses, 4-frame cycle via time index)

### Enemy Behavior Changes
- **Night:** Wolves double aggro range. Bats spawn (new enemy). Snakes hide. Rabbits/deer sleep (reduced flee range).
- **Day:** Rabbits/deer spawn more. Wolves reduced aggro. Bats despawn.

### Sky Visual
- Sky gradient: `ctx` fill at top of viewport, color transitions with phase
- Stars at night: 50 small white circles (`ctx.arc`), twinkle via alpha oscillation

### HUD Element
- Moon/sun icon + phase text ("الفجر", "النهار", "المساء", "الليل") in forest HUD HTML (or canvas HUD draw in `forest-hud.js`)
- Position: top-right of game view

### Edge Cases
- **Indoor/Building:** When player enters interior, day/night overlay is hidden, indoor lighting applied
- **Pause:** Cycle pauses when game is paused (`SceneManager.onPause`)
- **Save/Restore:** Time of day saved in `maps.forest.timeOfDay`, restored on scene entry

## Canvas 2D Implementation Hints
```javascript
// Extend forest-time.js patterns
class DayNightCycle {
  constructor() {
    this.timeOfDay = 0;       // 0-1440 minutes (in-game)
    this.phase = 'day';
    this.alpha = 0;
    this._nightCanvas = null;
    this._nightCtx = null;
  }

  update(dt) {
    this.timeOfDay += dt * 2;  // 12 min real = 24 hr in-game
    this.phase = this.getPhase();
    this.alpha = this.getDarknessAlpha();
  }

  draw(ctx, canvas) {
    if (this.alpha <= 0.012) return;
    const W = canvas.width, H = canvas.height;
    if (!this._nightCanvas) {
      this._nightCanvas = document.createElement('canvas');
      this._nightCtx = this._nightCanvas.getContext('2d');
    }
    // ... size sync, fillRect rgba tint, destination-out light holes ...
    ctx.drawImage(this._nightCanvas, 0, 0);
  }

  drawTorchLight(nc, playerScreenX, playerScreenY, radius) {
    nc.globalCompositeOperation = 'destination-out';
    const g = nc.createRadialGradient(playerScreenX, playerScreenY, radius * 0.12,
                                      playerScreenX, playerScreenY, radius);
    g.addColorStop(0, 'rgba(0,0,0,0.95)');
    g.addColorStop(1, 'rgba(0,0,0,0)');
    nc.fillStyle = g;
    nc.beginPath();
    nc.arc(playerScreenX, playerScreenY, radius, 0, Math.PI * 2);
    nc.fill();
    nc.globalCompositeOperation = 'source-over';
  }
}
```

### Torch Flame Draw
```javascript
function drawTorchFlame(ctx, sx, sy, fuel) {
  const t = Date.now() * 0.01;
  const h = 8 + Math.sin(t) * 2;
  ctx.fillStyle = `rgba(255,140,0,${0.5 + fuel / 200})`;
  ctx.beginPath();
  ctx.ellipse(sx, sy - h, 4, h, 0, 0, Math.PI * 2);
  ctx.fill();
}
```

## Verification & Acceptance Criteria
- [ ] Day/night transitions smoothly over 12 min cycle
- [ ] Canvas rgba overlay darkens at night correctly
- [ ] Torch light circle visible at night via radial cutout
- [ ] Torch fuel depletes and refuels with sticks
- [ ] Enemy behavior changes between day and night
- [ ] Stars appear at night with twinkle
- [ ] HUD shows correct time of day icon and text
- [ ] Cycle pauses when game is paused
- [ ] Indoor areas hide day/night overlay
