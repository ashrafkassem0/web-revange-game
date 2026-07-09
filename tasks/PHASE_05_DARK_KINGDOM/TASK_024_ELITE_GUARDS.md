# TASK_024 — ELITE_GUARDS (GATEKEEPERS)

## Objective
Design and implement 3 elite gatekeeper enemies guarding the path to the Terror King, each with unique Canvas 2D animated attack patterns.

## Detailed Mechanics & User Stories

### Gatekeeper 1: The Executioner 🪓
| Property | Value |
|----------|-------|
| Location | Courtyard |
| HP | 400 |
| Attack | 40 |
| Speed | Slow |
| Weapon | Giant axe (180° arc, 80px range) |

**Mechanics:**
- **Wind-up Attack:** Raises axe for 1.5s (sprite frame change + red pulsing circle on ground via `ctx.arc`)
- **Swing:** 180° arc deals 50 damage
- **Recovery:** 1s vulnerable window after swing (sprite tinted yellow via `ctx.filter` or yellow overlay)
- **Phase 2 (HP < 50%):** Double swing (two 180° arcs in quick succession)
- **Strategy:** Dodge during wind-up, attack during recovery
- **Loot:** Executioner Key, executionerHood (+10 defense)
- **Dialogue:** "من يجرؤ على تحدّي ملك الرعب؟!"

**Visual:** Executioner sprite (2x normal size), axe with trail effect (`ctx` arc stroke)

### Gatekeeper 2: The Shadow Assassin 🗡️
| Property | Value |
|----------|-------|
| Location | Great Hall |
| HP | 250 |
| Attack | 35 |
| Speed | Very fast |
| Weapon | Dual daggers (multi-hit combo) |

**Mechanics:**
- **Shadow Step:** Teleports behind player every 5s (disappear → puff of smoke particles → reappear behind player)
- **Backstab:** Attacks from behind deal 2x damage (checks player facing direction via dot product)
- **Phase 2 (HP < 50%):** Smoke bomb (screen obscured by black `rgba` overlay for 2s), attacks during smoke
- **Strategy:** Listen for teleport sound, turn to face quickly
- **Loot:** Assassin Key, shadowDaggers (+30 attack, +5% dodge)
- **Dialogue:** "لن تصل إلى الملك أبداً..."

**Visual:** Assassin sprite, teleport: smoke particle burst, smoke bomb: expanding dark circle overlay

### Gatekeeper 3: The Dark Mage 🔮
| Property | Value |
|----------|-------|
| Location | Before Throne Room |
| HP | 300 |
| Attack | 30 |
| Speed | Slow, teleports |
| Weapon | Dark magic (3 spell types) |

**Mechanics:**
- **Spells:**
  1. **Shadow Bolt:** Slow projectile (purple orb drawn with `ctx`), 25 damage, dodgeable
  2. **Dark Pull:** Pulls player toward mage (lerp position + 15 damage)
  3. **Summon Shade:** Spawns 2 shade minions (HP 50, Attack 10) every 20s
- **Phase 2 (HP < 50%):** 2 spells in quick succession, shades every 15s
- **Strategy:** Kill shades first, dodge bolts, attack during spell cooldown (2s window)
- **Loot:** Mage Key, shadowAmulet (+5 magic resist, +20 max HP)
- **Dialogue:** "الملك ينتظر... لكنك لن تصل إليه!"

**Visual:** Mage sprite with glowing staff (orb orbiting staff, updated each frame)

### Gate Progression
```
Executioner → key → Great Hall opens
Assassin → key → Prison Wing opens (optional loot)
Mage → key → Throne Room opens
ALL 3 defeated → final confrontation unlocked
```

### Edge Cases
- **Death Reset:** If player dies to gatekeeper, respawn at last checkpoint, gatekeeper HP resets to 100%
- **Zone Isolation:** Each gatekeeper in locked zone, no backtracking to previous zones
- **Key Items:** Keys are `questItems`, cannot be dropped or lost

## Canvas 2D Implementation Hints
```javascript
class Gatekeeper {
  constructor(type, x, y) {
    this.type = type;
    this.x = x; this.y = y;
    this.hp = type === 'executioner' ? 400 : type === 'assassin' ? 250 : 300;
    this.maxHp = this.hp;
    this.phase = 1;
    this.state = 'idle';
    this.attackCooldown = 0;
    this.frame = 0;
    this.tint = null; // 'yellow' when vulnerable
    this.windupTimer = 0;
    this.recoveryTimer = 0;
  }

  update(dt, player) {
    this.attackCooldown = Math.max(0, this.attackCooldown - dt);
    switch (this.type) {
      case 'executioner': this.updateExecutioner(dt, player); break;
      case 'assassin': this.updateAssassin(dt, player); break;
      case 'mage': this.updateMage(dt, player); break;
    }
  }

  draw(ctx, camera) {
    const sx = (this.x - camera.x) * camera.zoom;
    const sy = (this.y - camera.y) * camera.zoom;
    ctx.save();
    if (this.tint === 'yellow') ctx.filter = 'sepia(1) saturate(5) hue-rotate(20deg)';
    // Draw sprite / emoji at 2x for executioner
    const scale = this.type === 'executioner' ? 2 : 1;
    ctx.font = `${32 * scale}px sans-serif`;
    ctx.textAlign = 'center';
    const icons = { executioner: '🪓', assassin: '🗡️', mage: '🔮' };
    ctx.fillText(icons[this.type], sx, sy);
    ctx.restore();

    // HP bar
    const barW = 60;
    ctx.fillStyle = '#333';
    ctx.fillRect(sx - barW / 2, sy - 50, barW, 6);
    ctx.fillStyle = '#c44';
    ctx.fillRect(sx - barW / 2, sy - 50, barW * (this.hp / this.maxHp), 6);

    // Name
    const names = { executioner: 'الجلاّد 🪓', assassin: 'القاتل الظل 🗡️', mage: 'الساحر المظلم 🔮' };
    ctx.fillStyle = '#f44';
    ctx.font = 'bold 14px sans-serif';
    ctx.fillText(names[this.type], sx, sy - 58);

    // Wind-up warning circle
    if (this.state === 'windup') {
      const pulse = 0.3 + 0.2 * Math.sin(Date.now() * 0.01);
      ctx.strokeStyle = `rgba(255,0,0,${pulse})`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(sx, sy, 80 * camera.zoom, 0, Math.PI * 2);
      ctx.stroke();
    }
  }

  updateExecutioner(dt, player) {
    const dist = Math.hypot(this.x - player.x, this.y - player.y);
    switch (this.state) {
      case 'idle':
        if (dist < 120 && this.attackCooldown <= 0) {
          this.state = 'windup';
          this.windupTimer = 0;
        }
        break;
      case 'windup':
        this.windupTimer += dt;
        this.frame = 1; // wind-up frame
        if (this.windupTimer >= 1.5) {
          this.state = 'swing';
          this.performSwing(player);
        }
        break;
      case 'recovery':
        this.recoveryTimer += dt;
        this.tint = 'yellow';
        if (this.recoveryTimer >= 1) {
          this.state = 'idle';
          this.tint = null;
          this.attackCooldown = this.phase === 2 ? 0.5 : 1.5;
        }
        break;
    }
  }

  updateAssassin(dt, player) {
    if (this.state === 'idle' && this.attackCooldown <= 0) {
      const angle = Math.atan2(player.y - this.y, player.x - this.x);
      this.spawnSmokeParticles(this.x, this.y);
      this.x = player.x - Math.cos(angle) * 40;
      this.y = player.y - Math.sin(angle) * 40;
      this.spawnSmokeParticles(this.x, this.y);

      const playerFacing = player.facingRight ? 1 : -1;
      const assassinDir = this.x > player.x ? 1 : -1;
      this.attack(player, playerFacing === assassinDir ? 2 : 1);
      this.attackCooldown = 5;
    }
  }

  updateMage(dt, player) {
    if (this.state === 'idle' && this.attackCooldown <= 0) {
      const spellChoice = Math.random();
      if (spellChoice < 0.4) this.castShadowBolt(player);
      else if (spellChoice < 0.7) this.castDarkPull(player);
      else this.summonShades();
      this.attackCooldown = 3;
    }
  }

  castShadowBolt(player) {
    const angle = Math.atan2(player.y - this.y, player.x - this.x);
    projectiles.push({
      x: this.x, y: this.y,
      vx: Math.cos(angle) * 5,
      vy: Math.sin(angle) * 5,
      damage: 25,
      color: '#8800ff',
      radius: 8,
      alive: true
    });
  }

  spawnSmokeParticles(x, y) {
    for (let i = 0; i < 12; i++) {
      particles.push({
        x, y,
        vx: (Math.random() - 0.5) * 4,
        vy: (Math.random() - 0.5) * 4,
        life: 0.6,
        color: 'rgba(40,40,40,0.7)',
        size: 4 + Math.random() * 6
      });
    }
  }
}

// In game loop: update & draw projectiles
function updateProjectiles(dt, player) {
  for (const bolt of projectiles) {
    if (!bolt.alive) continue;
    bolt.x += bolt.vx;
    bolt.y += bolt.vy;
    if (Math.hypot(bolt.x - player.x, bolt.y - player.y) < 20) {
      player.takeDamage(bolt.damage);
      bolt.alive = false;
    }
  }
}
```

## Verification & Acceptance Criteria
- [ ] Executioner: wind-up (1.5s) → swing (180° arc) → recovery (1s vulnerable)
- [ ] Executioner Phase 2: double swing
- [ ] Assassin: shadow step behind player with smoke puff particles
- [ ] Assassin: backstab deals 2x damage (facing direction check)
- [ ] Assassin Phase 2: smoke bomb obscures screen
- [ ] Mage: 3 spell types (Shadow Bolt, Dark Pull, Summon Shades)
- [ ] Mage Phase 2: casts 2 spells in sequence
- [ ] Keys drop on gatekeeper death
- [ ] Each gatekeeper in isolated zone (no backtracking)
- [ ] Death resets gatekeeper to 100% HP
