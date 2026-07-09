# TASK_019 — HAZARDOUS_TERRAIN_MECHANICS

## Objective
Implement advanced terrain interaction: ledge climbing, rope descents, collapsing ground, lava jumping, stealth in ruins, and weighted platforms — all via Canvas 2D drawing and vanilla JS state machines in the game loop.

## Detailed Mechanics & User Stories

### Ledge Climbing
- Some CLIFF tiles are "ledge" variants (lighter brown edge)
- Press `Space` near ledge → climb animation (2s): player y decreases, arm-over-arm motion via frame index
- Unlocks shortcuts to hidden areas with rare loot
- Visual: reach-up draw frames (2 frames alternating)

### Rope Descent
- Specific CLIFF edges have rope hooks (visual: wooden stake drawn with `ctx`)
- If player has `rope` item (bought in city), press E to descend
- Rope stays after use (persistent, can reuse multiple times)
- Creates shortcut back up

### Collapsing Ground (CRACK tiles)
- Visual warning: CRACK tile shakes (draw offset ±3px) for 1 second before collapse
- Player can step off during warning window
- If collapse happens: player falls through to sub-level cave (200×200)
- Sub-level: small cave with exit ladder (E to climb back up)
- Exit spawns player at nearest safe tile

### Lava Jumping
- Narrow lava pools (1-2 tiles wide) can be jumped across
- Hold Shift + Press Space → jump (arc animation, 2 tiles distance, 0.5s duration)
- Fail: player takes 15 damage, knocked back to nearest safe tile
- Visual: jump arc via `ctx` stroke arc + player y offset during jump

### Stealth in Ruins
- Inside RUINS tiles: stand still for 1 second → become semi-transparent (`ctx.globalAlpha = 0.3`)
- Enemies ignore stealthed player
- Moving breaks stealth (`globalAlpha` back to 1.0)
- Visual: "🕵️ مختفي" text above player (`ctx.fillText`, 0.5s fade)

### Weighted Platforms
- 3 pressure plates in ruins area (drawn with arrow symbol)
- Player must place 3 `stone` items on plate (E while standing on plate with stone in inventory)
- Plate depresses animation (draw y +5), gate to treasure room opens
- Treasure: ancient coins (5) + lore scroll about Terror King

### Edge Cases
- **Fall Damage:** Walk off CLIFF edge unintentionally → 20 damage, respawn at last safe tile
- **Infinite Fall Protection:** If y > world height → teleport to nearest OASIS with 10 HP penalty
- **Jump Cancel:** Player can cancel jump mid-air by pressing opposite direction (reduced distance)

## Canvas 2D Implementation Hints
```javascript
class HazardSystem {
  constructor() {
    this.collapsingTiles = [];
    this.ropes = [];
    this.platforms = [];
  }

  // Ledge climb — animate in update() via requestAnimationFrame dt
  tryClimb(player, tileX, tileY) {
    if (!isLedge(tileX, tileY)) return false;
    player.state = 'climbing';
    player.climbTimer = 2;
    player.climbStartY = player.y;
    player.climbTargetY = player.y - 40;
    player.animFrame = 0;
    return true;
  }

  updateClimb(player, dt) {
    if (player.state !== 'climbing') return;
    player.climbTimer -= dt;
    const t = 1 - player.climbTimer / 2;
    player.y = player.climbStartY + (player.climbTargetY - player.climbStartY) * t;
    player.animFrame = Math.floor(t * 8) % 2;
    if (player.climbTimer <= 0) {
      player.y = player.climbTargetY;
      player.state = 'idle';
    }
  }

  // Collapsing ground
  triggerCollapse(tileX, tileY) {
    const tile = getTile(tileX, tileY);
    if (tile !== T.CRACK) return;
    const entry = { tileX, tileY, shakeTimer: 1, shake: 0 };
    this.collapsingTiles.push(entry);
    setTimeout(() => {
      if (player.onTile(tileX, tileY)) {
        player.takeDamage(10);
        this.enterSubLevel(player);
      }
      setTile(tileX, tileY, T.HOLE);
    }, 1000);
  }

  drawCrackShake(ctx, entry, camera) {
    entry.shake = (Math.random() - 0.5) * 6;
    const px = entry.tileX * 40 - camera.x + entry.shake;
    const py = entry.tileY * 40 - camera.y;
    ctx.fillStyle = '#6B5B45';
    ctx.fillRect(px, py, 40, 40);
  }

  // Lava jump — physics in game loop (no external ticker)
  tryLavaJump(player) {
    if (player.isOnLavaEdge() && player.shiftHeld) {
      player.state = 'jumping';
      player.vy = -8;
      player.vx = player.facingRight ? 4 : -4;
      player.groundY = player.y;
    }
  }

  updateJump(player, dt) {
    if (player.state !== 'jumping') return;
    player.y += player.vy;
    player.x += player.vx;
    player.vy += 0.3; // gravity
    if (player.y >= player.groundY) {
      player.y = player.groundY;
      player.state = 'idle';
      if (isLava(getTileAt(player.x, player.y))) {
        player.takeDamage(15);
        player.knockback(3);
      }
    }
  }

  // Stealth
  updateStealth(player, dt) {
    if (player.onTile(T.RUINS) && !player.moving) {
      player.stealthTimer += dt;
      if (player.stealthTimer > 1) {
        player.drawAlpha = 0.3;
        player.stealthed = true;
      }
    } else {
      player.stealthTimer = 0;
      player.drawAlpha = 1.0;
      player.stealthed = false;
    }
  }
}

// When drawing player: ctx.globalAlpha = player.drawAlpha
```

## Verification & Acceptance Criteria
- [ ] Ledge climbing works with Space (2s animation)
- [ ] Rope descent creates persistent shortcut
- [ ] Collapsing ground shakes for 1s then opens hole
- [ ] Sub-level cave renders when player falls through
- [ ] Lava jump crosses narrow pools (Hold Shift + Space, 0.5s arc)
- [ ] Stealth in ruins makes player semi-transparent, enemies ignore
- [ ] Weighted platform (3 stone) opens gate to treasure
- [ ] Fall damage (20 HP) on cliff edge
- [ ] Under-map recovery teleport works
