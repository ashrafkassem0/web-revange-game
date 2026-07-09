# TASK_019 — HAZARDOUS_TERRAIN

## Objective
Add **top-down** hazardous terrain to Death Valley that fits Revenge’s WASD/arrows movement — **no** Space-jump, rope climb, ledge climb animations, or sub-cave levels. Keep the spirit of dangerous ground: heat/lava DoT, slow sand, knockback, brief unstable tiles.

## Architecture constraint
Movement is planar (`player.x/y` + blocked tiles), same as `game/city/index.html` and forest. Do **not** introduce gravity, jump arcs, or interior cellar scenes.

## Detailed Mechanics & User Stories

### 1. Lava / heat damage tiles
- Standing on `LAVA`: apply DoT (e.g. **5 HP/s**), tick in `update(dt)`.
- Visual: animate lava fill + soft radial glow + few bubble particles (plain array), as sketched in TASK_018.
- Optional: brief i-frames after knockback so DoT doesn’t stack unfairly with shove.

### 2. Slow sand
- On deep `SAND` (or flagged slow tiles): move speed × **0.7** (or ×0.5 in “soft sand” pockets).
- Arabic hint when entering: «الرمل يبطئ خطاك…».

### 3. Hazard knockback
- Entering lava edge or geyser tile: push player away from tile center (~40–80px), deal small burst damage (e.g. 8–12).
- Implement as velocity impulse decayed over ~0.2–0.4s in the top-down plane (`kbX`, `kbY`) — **not** a jump.

### 4. Unstable ground (replaces collapsing cave)
- `CRACK` / unstable tiles: after standing **≥0.6–1.0s**, tile “gives”:
  - Screen/tile shake (±3px draw offset) for ~0.4s warning
  - Then: damage (e.g. 10 HP) + slow for 2s **or** short knockback to nearest safe tile
- Tile may become a darker scar (still walkable, stronger slow) — **do not** drop into a 200×200 sub-level.

### 5. Ruins “cover” (optional light stealth)
- While on `RUINS` and not moving for 1s: `drawAlpha = 0.45`; elites ignore until player moves.
- No weighted pressure-plate puzzle required for this task (treasure can be a simple E pickup in ruins).

### Heat meter integration
- Open sand/rock: heat rises; oasis/ruins: heat falls (TASK_018 bar).
- At 100% heat: +2 HP/s until shade.

### Edge Cases
- **Safe tiles:** oasis clears heat and should not apply sand slow.
- **Death:** use existing hero HP / forest-style defeat handling if present; respawn at north plateau or last oasis — not under-map teleport caves.
- **CLIFF:** still impassable; walking into cliff does nothing (no fall damage off ledges).

### Out of scope (explicitly removed from old design)
- Space ledge climb, rope descent, Shift+Space lava jump
- Sub-level caves / ladders
- Weighted platforms needing 3 stones

## Canvas 2D Implementation Hints
```javascript
function updateHazards(player, dt) {
  const tile = getTileAt(player.x, player.y);

  if (tile === T.LAVA) {
    player.hp -= 5 * dt;
    applyKnockbackFromTile(player, tileCenter, 60);
  }

  if (tile === T.SAND_DEEP) {
    player.speedMul = 0.7;
  } else {
    player.speedMul = 1;
  }

  if (tile === T.CRACK) {
    player.unstableTimer = (player.unstableTimer || 0) + dt;
    if (player.unstableTimer > 0.8) {
      player.hp -= 10;
      player.slowTimer = 2;
      player.unstableTimer = 0;
      notify('الأرض غير مستقرة!', '#e74c3c');
    }
  } else {
    player.unstableTimer = 0;
  }

  // decay knockback
  player.x += player.kbX; player.y += player.kbY;
  player.kbX *= 0.8; player.kbY *= 0.8;
}
```

## Verification & Acceptance Criteria
- [ ] Lava deals DoT; glow/bubbles draw on Canvas 2D
- [ ] Deep sand slows WASD movement (no jump required to cross hazards)
- [ ] At least one knockback hazard works in the top-down plane
- [ ] Unstable ground warns (shake) then damages/slows — **no** sub-cave
- [ ] Heat meter interacts with oasis/ruins vs open sand
- [ ] CLIFF remains blocked; no rope/climb/jump controls added
- [ ] Arabic notify strings for slow sand / unstable ground
