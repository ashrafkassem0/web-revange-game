# TASK_024 — ELITE_GUARDS (GATEKEEPERS)

## Objective
Design and implement 3 elite gatekeeper enemies guarding the path to the Terror King, each with unique Pixi.js animated attack patterns.

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
- **Wind-up Attack:** Raises axe for 1.5s (PIXI.AnimatedSprite frame change + red pulsing circle on ground)
- **Swing:** 180° arc deals 50 damage
- **Recovery:** 1s vulnerable window after swing (sprite tinted yellow)
- **Phase 2 (HP < 50%):** Double swing (two 180° arcs in quick succession)
- **Strategy:** Dodge during wind-up, attack during recovery
- **Loot:** Executioner Key, executionerHood (+10 defense)
- **Dialogue:** "من يجرؤ على تحدّي ملك الرعب؟!"

**Visual:** Executioner sprite (2x normal size), axe with trail effect (PIXI.Graphics arc)

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
- **Phase 2 (HP < 50%):** Smoke bomb (screen obscured by PIXI.Graphics black overlay for 2s), attacks during smoke
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
  1. **Shadow Bolt:** Slow projectile (PIXI.Sprite purple orb), 25 damage, dodgeable
  2. **Dark Pull:** Pulls player toward mage (gsp animation + 15 damage)
  3. **Summon Shade:** Spawns 2 shade minions (HP 50, Attack 10) every 20s
- **Phase 2 (HP < 50%):** 2 spells in quick succession, shades every 15s
- **Strategy:** Kill shades first, dodge bolts, attack during spell cooldown (2s window)
- **Loot:** Mage Key, shadowAmulet (+5 magic resist, +20 max HP)
- **Dialogue:** "الملك ينتظر... لكنك لن تصل إليه!"

**Visual:** Mage sprite with glowing staff (PIXI.AnimatedSprite orb orbiting staff)

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

## Pixi.js Technical Implementation Hints
```javascript
class Gatekeeper extends PIXI.Container {
  constructor(type) {
    super();
    this.type = type;
    this.hp = type === 'executioner' ? 400 : type === 'assassin' ? 250 : 300;
    this.maxHp = this.hp;
    this.phase = 1;
    this.state = 'idle';
    this.attackCooldown = 0;

    // Main sprite
    this.sprite = new PIXI.AnimatedSprite(gatekeeperFrames[type]);
    this.sprite.anchor.set(0.5);
    this.addChild(this.sprite);

    // HP bar
    this.hpBar = new PIXI.Graphics();
    this.hpBar.y = -40;
    this.addChild(this.hpBar);

    // Name label
    const names = { executioner: 'الجلاّد 🪓', assassin: 'القاتل الظل 🗡️', mage: 'الساحر المظلم 🔮' };
    this.nameLabel = new PIXI.Text(names[type], { fontSize: 14, fill: 0xFF4444, fontWeight: 'bold' });
    this.nameLabel.anchor.set(0.5);
    this.nameLabel.y = -55;
    this.addChild(this.nameLabel);
  }

  update(dt, player) {
    this.attackCooldown = Math.max(0, this.attackCooldown - dt);

    switch (this.type) {
      case 'executioner': this.updateExecutioner(dt, player); break;
      case 'assassin': this.updateAssassin(dt, player); break;
      case 'mage': this.updateMage(dt, player); break;
    }

    this.drawHPBar();
  }

  // Executioner: wind-up → swing → recovery cycle
  updateExecutioner(dt, player) {
    const dist = Math.hypot(this.x - player.x, this.y - player.y);
    switch (this.state) {
      case 'idle':
        if (dist < 120 && this.attackCooldown <= 0) this.state = 'windup';
        break;
      case 'windup':
        // 1.5s wind-up animation
        this.windupTimer += dt;
        this.sprite.play(); // Wind-up animation frame
        // Red circle warning on ground
        if (this.windupTimer >= 1.5) {
          this.state = 'swing';
          this.performSwing();
        }
        break;
      case 'swing':
        // Arc attack
        break;
      case 'recovery':
        this.recoveryTimer += dt;
        this.sprite.tint = 0xFFFF00; // Vulnerable
        if (this.recoveryTimer >= 1) {
          this.state = 'idle';
          this.sprite.tint = 0xFFFFFF;
          this.attackCooldown = this.phase === 2 ? 0.5 : 1.5;
        }
        break;
    }
  }

  // Assassin: shadow step behind player
  updateAssassin(dt, player) {
    if (this.state === 'idle' && this.attackCooldown <= 0) {
      // Teleport behind player
      const angle = Math.atan2(player.y - this.y, player.x - this.x);
      const behindX = player.x - Math.cos(angle) * 40;
      const behindY = player.y - Math.sin(angle) * 40;

      // Smoke puff at current position
      this.spawnSmokeParticles(this.x, this.y);

      // Teleport
      this.x = behindX; this.y = behindY;

      // Smoke puff at new position
      this.spawnSmokeParticles(this.x, this.y);

      // Check if facing away from assassin (backstab)
      const playerFacing = player.facingRight ? 1 : -1;
      const assassinDir = this.x > player.x ? 1 : -1;
      if (playerFacing === assassinDir) {
        this.attack(player, 2); // 2x damage backstab
      } else {
        this.attack(player, 1);
      }

      this.attackCooldown = 5;
    }
  }

  // Mage: spell casting
  updateMage(dt, player) {
    const dist = Math.hypot(this.x - player.x, this.y - player.y);
    if (this.state === 'idle' && this.attackCooldown <= 0) {
      const spellChoice = Math.random();
      if (spellChoice < 0.4) this.castShadowBolt(player);
      else if (spellChoice < 0.7) this.castDarkPull(player);
      else this.summonShades();
      this.attackCooldown = 3;
    }
  }

  castShadowBolt(player) {
    // Create projectile sprite
    const bolt = new PIXI.Sprite(PIXI.Texture.from('shadow_bolt.png'));
    bolt.x = this.x; bolt.y = this.y;
    const angle = Math.atan2(player.y - this.y, player.x - this.x);
    bolt.vx = Math.cos(angle) * 5;
    bolt.vy = Math.sin(angle) * 5;
    LAYERS.effects.addChild(bolt);

    const ticker = () => {
      bolt.x += bolt.vx; bolt.y += bolt.vy;
      if (Math.hypot(bolt.x - player.x, bolt.y - player.y) < 20) {
        player.takeDamage(25);
        App.ticker.remove(ticker);
        bolt.destroy();
      }
      // Remove if off screen
      if (bolt.x < camera.x - 100 || bolt.x > camera.x + App.screen.width + 100) {
        App.ticker.remove(ticker);
        bolt.destroy();
      }
    };
    App.ticker.add(ticker);
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
