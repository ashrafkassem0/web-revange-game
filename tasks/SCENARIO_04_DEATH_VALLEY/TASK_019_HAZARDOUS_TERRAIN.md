# TASK_019 — HAZARDOUS_TERRAIN_MECHANICS

## Objective
Implement advanced terrain interaction: ledge climbing, rope descents, collapsing ground, lava jumping, stealth in ruins, and weighted platforms — all via Pixi.js.

## Detailed Mechanics & User Stories

### Ledge Climbing
- Some CLIFF tiles are "ledge" variants (lighter brown edge)
- Press `Space` near ledge → climb animation (2s): sprite y decreases, arm-over-arm motion
- Unlocks shortcuts to hidden areas with rare loot
- Visual: reach-up sprite frame (2 frames animated)

### Rope Descent
- Specific CLIFF edges have rope hooks (visual: wooden stake sprite)
- If player has `rope` item (bought in city), press E to descend
- Rope stays after use (persistent, can reuse multiple times)
- Creates shortcut back up

### Collapsing Ground (CRACK tiles)
- Visual warning: CRACK tile shakes (position jitter ±3px) for 1 second before collapse
- Player can step off during warning window
- If collapse happens: player falls through to sub-level cave (200×200)
- Sub-level: small cave with exit ladder sprite (E to climb back up)
- Exit spawns player at nearest safe tile

### Lava Jumping
- Narrow lava pools (1-2 tiles wide) can be jumped across
- Hold Shift + Press Space → jump (arc animation, 2 tiles distance, 0.5s duration)
- Fail: player takes 15 damage, knocked back to nearest safe tile
- Visual: jump arc via `PIXI.Graphics` arc line + sprite y offset

### Stealth in Ruins
- Inside RUINS tiles: stand still for 1 second → become semi-transparent (sprite alpha = 0.3)
- Enemies ignore stealthed player
- Moving breaks stealth (alpha back to 1.0)
- Visual: "🕵️ مختفي" text above player (PIXI.Text, 0.5s fade)

### Weighted Platforms
- 3 pressure plates in ruins area (PIXI.Sprite with arrow symbol)
- Player must place 3 `stone` items on plate (E while standing on plate with stone in inventory)
- Plate depresses animation (sprite y +5), gate to treasure room opens
- Treasure: ancient coins (5) + lore scroll about Terror King

### Edge Cases
- **Fall Damage:** Walk off CLIFF edge unintentionally → 20 damage, respawn at last safe tile
- **Infinite Fall Protection:** If y > world height → teleport to nearest OASIS with 10 HP penalty
- **Jump Cancel:** Player can cancel jump mid-air by pressing opposite direction (reduced distance)

## Pixi.js Technical Implementation Hints
```javascript
class HazardSystem {
  constructor() {
    this.collapsingTiles = [];
    this.ropes = [];
    this.platforms = [];
  }

  // Ledge climb
  tryClimb(player, tileX, tileY) {
    if (!isLedge(tileX, tileY)) return false;
    player.state = 'climbing';
    player.sprite.textures = climbFrames;
    player.sprite.animationSpeed = 0.1;
    player.sprite.play();
    // Animate y position up over 2s
    gsap.to(player, { y: player.y - 40, duration: 2, onComplete: () => {
      player.state = 'idle';
      player.sprite.textures = idleFrames;
    }});
    return true;
  }

  // Collapsing ground
  triggerCollapse(tileX, tileY) {
    const tile = getTile(tileX, tileY);
    if (tile !== T.CRACK) return;
    // Shake warning
    const sprite = getTileSprite(tileX, tileY);
    gsap.to(sprite, { x: sprite.x + 3, duration: 0.1, yoyo: true, repeat: 5 });
    setTimeout(() => {
      if (player.onTile(tileX, tileY)) {
        // Player falls
        player.takeDamage(10);
        this.enterSubLevel(player);
      }
      // Remove tile (reveal hole)
      setTile(tileX, tileY, T.HOLE);
      sprite.visible = false;
    }, 1000);
  }

  // Lava jump
  tryLavaJump(player) {
    if (player.isOnLavaEdge() && player.shiftHeld) {
      player.state = 'jumping';
      player.vy = -8; player.vx = player.facingRight ? 4 : -4;
      // Arc trajectory
      const jumpTicker = () => {
        player.y += player.vy;
        player.x += player.vx;
        player.vy += 0.3; // gravity
        if (player.y >= groundY) {
          player.y = groundY;
          player.state = 'idle';
          App.ticker.remove(jumpTicker);
          // Check if landed on safe tile
          if (isLava(getTile(player.x, player.y))) {
            player.takeDamage(15);
            player.knockback(3);
          }
        }
      };
      App.ticker.add(jumpTicker);
    }
  }

  // Stealth
  updateStealth(player, dt) {
    if (player.onTile(T.RUINS) && !player.moving) {
      player.stealthTimer += dt;
      if (player.stealthTimer > 1) {
        player.sprite.alpha = 0.3;
        player.stealthed = true;
      }
    } else {
      player.stealthTimer = 0;
      player.sprite.alpha = 1.0;
      player.stealthed = false;
    }
  }
}
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
