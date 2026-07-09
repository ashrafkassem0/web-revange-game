# TASK_007 — CAMPFIRE_SAVE_POINTS

## Objective
Add campfires as save points, healing spots, fast travel anchors, and enemy repellent zones using Canvas 2D drawing and HTML interaction menus.

## Detailed Mechanics & User Stories

### Placement
5 campfires at fixed strategic locations:
1. North near lake entrance
2. Central clearing (near build zone)
3. East rock area
4. South forest edge (near city portal path)
5. West dark forest edge

### Visual (Canvas 2D)
- 3 flame layers (red, orange, yellow) drawn with `ctx` ellipses/arcs; flicker via `Math.sin(Date.now() * speed + offset)`
- Glow: radial gradient (`ctx.createRadialGradient`) with `globalCompositeOperation = 'lighter'`, alpha ~0.3
- Smoke particles: plain JS array of small grey circles rising and fading, drawn with `ctx.arc`
- Each layer offset slightly and scaled differently for organic feel

### Interaction
Press `E` near campfire → HTML radial/list menu (city-modal style) with options:
1. **Save Game** (disk icon) — manual save to auto slot, "تم الحفظ!" toast
2. **Rest** (moon icon) — advance time to 6:00 (dawn), full HP/stamina restore, "لقد استرتحت حتى الصباح" toast
3. **Cook Food** (fire icon) — if has `rawMeat` or `rawFish` → 3s progress bar (HTML or canvas bar) → converts to `cookedMeat`/`cookedFish` (heals more)
4. **Fast Travel** (map icon) — show discovered campfires on map overlay (HTML), click to teleport (costs 1 stick)
5. **Light Campfire** (if unlit) — requires 2 sticks, "أضرم النار" button

### Discovery
- First approach: "اكتشفت مخيم جديد!" toast (HTML notification, same as forest HUD toasts)
- Campfire added to fast travel network (stored in `maps.forest.discoveredCampfires` array)

### Enemy Repulsion
- Enemies within 200px of lit campfire: flee state activated (move away from campfire)
- Check in enemy update loop: `if (distanceToCampfire < 200) { state = 'flee'; }`

### Unlit Campfires
- New campfires start unlit (no flame, no glow, no repulsion)
- "Light Campfire (2 🪵)" option in interaction menu
- Requires 2 sticks in inventory

### Edge Cases
- **Save During Combat:** Interaction blocked if enemies within 200px. "لا يمكن الاسترخاء مع وجود أعداء قريبين"
- **Rain Extinguishes:** Heavy rain or storm → after 15s, fire shrinks and extinguishes (animation: flame shrinks → smoke puff → gone). Re-light with 1 stick.
- **All Campfires Unlit:** Fast travel disabled. "أضرم نار المخيم أولاً" message.

## Canvas 2D Implementation Hints
```javascript
class Campfire {
  constructor(x, y) {
    this.x = x; this.y = y;
    this.discovered = false;
    this.lit = false;
    this.fuel = 100;
    this.smoke = []; // { x, y, r, a, vy }
  }

  light() {
    if (!this.lit) this.lit = true;
  }

  extinguish() {
    this.lit = false;
    this.smoke.length = 0;
  }

  update(dt) {
    if (!this.lit) return;
    // spawn/update smoke particles
    if (Math.random() < 0.3) {
      this.smoke.push({ x: this.x, y: this.y - 10, r: 3, a: 0.5, vy: -20 });
    }
    for (const s of this.smoke) {
      s.y += s.vy * dt;
      s.a -= dt * 0.4;
    }
    this.smoke = this.smoke.filter(s => s.a > 0);
  }

  draw(ctx, camera, ZOOM) {
    const sx = (this.x - camera.x) * ZOOM;
    const sy = (this.y - camera.y) * ZOOM;
    // stone ring
    ctx.fillStyle = '#555';
    ctx.beginPath(); ctx.arc(sx, sy, 14, 0, Math.PI * 2); ctx.fill();
    if (!this.lit) return;
    // glow
    const g = ctx.createRadialGradient(sx, sy, 4, sx, sy, 40);
    g.addColorStop(0, 'rgba(255,120,0,0.35)');
    g.addColorStop(1, 'rgba(255,80,0,0)');
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(sx, sy, 40, 0, Math.PI * 2); ctx.fill();
    // flame layers
    const t = Date.now() * 0.01;
    for (const [color, scale, phase] of [
      ['#ff0000', 1.0, 0], ['#ff6600', 0.8, 1], ['#ffff00', 0.55, 2]
    ]) {
      const h = 10 * scale + Math.sin(t + phase) * 2;
      ctx.fillStyle = color;
      ctx.globalAlpha = 0.8;
      ctx.beginPath();
      ctx.ellipse(sx, sy - h * 0.5, 5 * scale, h, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    for (const s of this.smoke) {
      const ssx = (s.x - camera.x) * ZOOM;
      const ssy = (s.y - camera.y) * ZOOM;
      ctx.fillStyle = `rgba(80,80,80,${s.a})`;
      ctx.beginPath(); ctx.arc(ssx, ssy, s.r, 0, Math.PI * 2); ctx.fill();
    }
  }
}
```

- Interaction prompt "اضغط E": HTML floating label or short `ctx.fillText` near campfire (match existing forest prompts).
- Register lit campfires in `getLightSources()` so `forest-time.js` night overlay punches light holes.

## Verification & Acceptance Criteria
- [ ] 5 campfires exist at fixed locations on the forest map
- [ ] Approaching shows interaction prompt ("اضغط E")
- [ ] Save works at campfire
- [ ] Rest advances time to dawn and full heal
- [ ] Cooking converts raw meat/fish to cooked versions
- [ ] Fast travel between discovered campfires costs 1 stick
- [ ] Enemies flee from lit campfire (200px radius)
- [ ] Rain extinguishes campfire after 15s with animation
- [ ] Unlit campfire requires 2 sticks to light
- [ ] Discovery toast appears on first approach
