# TASK_020 — ELITE_ENEMIES

## Objective
Create 5 elite enemy types for Death Valley with unique Canvas 2D draw behaviors, attack patterns, and loot (plain JS enemy objects in arrays, drawn with `ctx` like forest enemies).

## Detailed Mechanics & User Stories

### Enemy 1: Scorpion 🦂
| Property | Value |
|----------|-------|
| HP | 80 |
| Attack | 15 |
| Speed | Moderate |
| Habitat | Sand tiles |
| Loot | `venomSac` (80%), `scorpionShell` (50%) |

**Behavior:**
- Burrows underground (`drawAlpha = 0`, only ground displacement particle visible)
- Emerges when player is within 100px (scale 0→1 over 0.5s)
- Poison attack (contact): 3 HP/s for 5s, green tint on player draw
- Strategy: Listen for burrowing sound, attack when emerging

**Visual:** Scorpion emoji via `ctx.fillText`, burrow: sand puff particles (plain JS array)

### Enemy 2: Vulture 🦅
| Property | Value |
|----------|-------|
| HP | 40 |
| Attack | 10 |
| Speed | Fast (flying) |
| Habitat | Airborne (any) |
| Loot | `vultureFeather` (70%) |

**Behavior:**
- Circles above player at height (y oscillates sinusoidally 20px)
- Dives when player is below (y descends rapidly, 0.3s)
- 3 dive attacks then rests for 5s (circles higher)
- Strategy: Bow is most effective. Dodge dive via double-tap A/D.

**Visual:** Vulture emoji, circle path via sine wave, dive via velocity in update loop

### Enemy 3: Giant Lava Lizard 🦎
| Property | Value |
|----------|-------|
| HP | 200 |
| Attack | 25 |
| Speed | Slow |
| Habitat | Lava tiles |
| Loot | `lavaCrystal` (100%), `fireGland` (60%) |

**Behavior:**
- Emerges from lava pools (emerges with lava splash particles)
- Fire breath: cone AoE (`ctx` filled triangle, orange), 30 damage, 3s charge
- Charge warning: lizard rears head, orange glow in mouth (pulsing fill)
- Strategy: Bait fire breath, dodge to side, attack during 2s cooldown

**Visual:** Lizard emoji with lava glow tint while charging (`ctx.fillStyle` orange overlay)

### Enemy 4: Sand Wraith 👻
| Property | Value |
|----------|-------|
| HP | 60 |
| Attack | 20 (life drain) |
| Speed | Very fast |
| Habitat | CRACK / RUINS tiles |
| Loot | `shadowEssence` (60%), `wraithCloakFragment` (30%) |

**Behavior:**
- Invisible when moving (`drawAlpha = 0.15`), visible when attacking (`drawAlpha = 1.0`)
- Teleports short distances (disappear → reappear 100px away, 0.3s)
- Attack: life drain (player loses HP, wraith heals same amount)
- Vulnerability window: 0.5s after attacking (fully visible, can be hit)
- Strategy: Listen for attack sound, strike during vulnerability window

**Visual:** Semi-transparent ghost emoji, teleport: puff of sand particles

### Enemy 5: Stone Golem 🗿
| Property | Value |
|----------|-------|
| HP | 500 |
| Attack | 35 |
| Speed | Very slow |
| Habitat | Rocky area (guards mineral cluster) |
| Loot | `golemHeart` (unique), 15 minerals |

**Behavior:**
- Awakens when player takes minerals from its territory
- Slow but devastating. Weak point: crystal on back (200% damage from behind)
- Attack: ground slam (AoE shockwave, expanding circle drawn with `ctx`)
- Strategy: Circle around to hit back crystal. Bow is 50% ineffective.
- Phase 2 (HP < 50%): enraged, 1.5x speed, double slam

**Visual:** Golem emoji large (2x font size), crystal on back drawn as overlay shape, weakness indicator

### Shared Elite Mechanics
- Only 1 of each elite per zone
- Territory marked by red glowing border (`ctx.strokeRect` with alpha pulse)
- All 5 elites killed = 1 Valley Trial (need 3 for south gate unlock)
- Elites respawn after player rests twice at campfire
- Elite loot essential for final boss prep

### Edge Cases
- **Elite Escape:** Leave territory → elite pursues 5s then returns, HP resets
- **Multiple Elites:** Rare but possible. Show "هذا كثير جداً!" notification

## Canvas 2D Implementation Hints
```javascript
// Elite as plain object in enemies[] array — update + draw in game loop
function createElite(template, x, y) {
  return {
    ...template,
    x, y,
    hp: template.hp,
    maxHp: template.hp,
    state: 'idle',
    phase: 1,
    drawAlpha: 1,
    scale: 1,
    particles: []
  };
}

function updateElite(e, dt, player) {
  switch (e.id) {
    case 'elite_scorpion': updateScorpion(e, dt, player); break;
    case 'elite_vulture': updateVulture(e, dt, player); break;
    case 'elite_lavaLizard': updateLavaLizard(e, dt, player); break;
    case 'elite_sandWraith': updateSandWraith(e, dt, player); break;
    case 'elite_stoneGolem': updateStoneGolem(e, dt, player); break;
  }
}

function drawElite(ctx, e, camera) {
  const sx = e.x - camera.x;
  const sy = e.y - camera.y;

  // Territory glow
  ctx.save();
  ctx.globalAlpha = 0.2 + 0.1 * Math.sin(Date.now() * 0.004);
  ctx.strokeStyle = '#FF2222';
  ctx.lineWidth = 2;
  ctx.strokeRect(sx - e.territoryR, sy - e.territoryR, e.territoryR * 2, e.territoryR * 2);
  ctx.restore();

  // Sprite
  ctx.save();
  ctx.globalAlpha = e.drawAlpha;
  ctx.translate(sx, sy);
  ctx.scale(e.scale, e.scale);
  ctx.font = `${e.id === 'elite_stoneGolem' ? 48 : 28}px Cairo`;
  ctx.textAlign = 'center';
  ctx.fillText(e.emoji, 0, 0);
  ctx.restore();

  // HP bar
  const ratio = e.hp / e.maxHp;
  ctx.fillStyle = '#333';
  ctx.fillRect(sx - 20, sy - 36, 40, 5);
  ctx.fillStyle = ratio > 0.5 ? '#44FF44' : '#FF4444';
  ctx.fillRect(sx - 20, sy - 36, 40 * ratio, 5);

  // Particles
  for (const p of e.particles) {
    ctx.fillStyle = `rgba(${p.r},${p.g},${p.b},${p.alpha})`;
    ctx.beginPath();
    ctx.arc(p.x - camera.x, p.y - camera.y, p.size, 0, Math.PI * 2);
    ctx.fill();
  }
}

function updateScorpion(e, dt, player) {
  const dist = Math.hypot(e.x - player.x, e.y - player.y);
  switch (e.state) {
    case 'idle':
      e.drawAlpha = 0;
      if (dist < 100) { e.state = 'emerging'; e.scale = 0; e.drawAlpha = 1; spawnSandPuffs(e); }
      break;
    case 'emerging':
      e.scale = Math.min(1, e.scale + dt * 2);
      if (e.scale >= 1) e.state = 'chase';
      break;
    case 'chase':
      moveToward(e, player, 2.5);
      if (dist < 30) attackPoison(e, player);
      break;
  }
}

function fireBreath(e) {
  // Store cone for one frame of damage + draw
  e.breathCone = {
    x: e.x + (e.facingRight ? 20 : -20),
    y: e.y,
    life: 0.5,
    facingRight: e.facingRight
  };
}

function drawFireBreath(ctx, cone, camera) {
  if (!cone || cone.life <= 0) return;
  const x = cone.x - camera.x;
  const y = cone.y - camera.y;
  const dir = cone.facingRight ? 1 : -1;
  ctx.fillStyle = `rgba(255,68,0,${0.6 * cone.life / 0.5})`;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x + 100 * dir, y - 30);
  ctx.lineTo(x + 100 * dir, y + 30);
  ctx.closePath();
  ctx.fill();
}
```

## Verification & Acceptance Criteria
- [ ] 5 elite enemies exist and spawn in correct habitats
- [ ] Scorpion burrows underground, emerges when player near
- [ ] Vulture circles and dives (3 dives then rest)
- [ ] Lava lizard emerges from lava with fire breath cone
- [ ] Sand wraith turns invisible, teleports, life drains
- [ ] Stone golem has back weak point (200% damage from behind)
- [ ] Elite territories have red glowing border
- [ ] Killing all 5 progresses Valley Trials
- [ ] Elite loot drops correctly (essential for boss prep)
- [ ] Elites respawn after 2 rest cycles
