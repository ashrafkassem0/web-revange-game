# TASK_020 — ELITE_ENEMIES

## Objective
Create 5 elite enemy types for Death Valley with unique Pixi.js sprite behaviors, attack patterns, and loot.

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
- Burrows underground (PIXI.Sprite alpha = 0, only ground displacement particle visible)
- Emerges when player is within 100px (sprite scale 0→1 over 0.5s)
- Poison attack (contact): 3 HP/s for 5s, green tint on player sprite
- Strategy: Listen for burrowing sound, attack when emerging

**Visual:** Scorpion emoji sprite, burrow: sand puff particles (PIXI.ParticleContainer)

### Enemy 2: Vulture 🦅
| Property | Value |
|----------|-------|
| HP | 40 |
| Attack | 10 |
| Speed | Fast (flying) |
| Habitat | Airborne (any) |
| Loot | `vultureFeather` (70%) |

**Behavior:**
- Circles above player at height (sprite y oscillates sinusoidally 20px)
- Dives when player is below (sprite y descends rapidly, 0.3s)
- 3 dive attacks then rests for 5s (circles higher)
- Strategy: Bow is most effective. Dodge dive via double-tap A/D.

**Visual:** Vulture emoji sprite, circle path via sine wave, dive via gsap

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
- Fire breath: cone AoE (PIXI.Graphics orange triangle), 30 damage, 3s charge
- Charge warning: lizard rears head, orange glow in mouth (PIXI.AnimatedSprite)
- Strategy: Bait fire breath, dodge to side, attack during 2s cooldown

**Visual:** Lizard emoji with lava glow (sprite.tint = 0xFF4400 while charging)

### Enemy 4: Sand Wraith 👻
| Property | Value |
|----------|-------|
| HP | 60 |
| Attack | 20 (life drain) |
| Speed | Very fast |
| Habitat | CRACK / RUINS tiles |
| Loot | `shadowEssence` (60%), `wraithCloakFragment` (30%) |

**Behavior:**
- Invisible when moving (sprite alpha = 0.15), visible when attacking (alpha = 1.0)
- Teleports short distances (disappear → reappear 100px away, 0.3s)
- Attack: life drain (player loses HP, wraith heals same amount)
- Vulnerability window: 0.5s after attacking (sprite visible, can be hit)
- Strategy: Listen for attack sound, strike during vulnerability window

**Visual:** Semi-transparent ghost sprite, teleport: puff of sand particles

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
- Attack: ground slam (AoE shockwave, PIXI.Graphics expanding circle)
- Strategy: Circle around to hit back crystal. Bow is 50% ineffective.
- Phase 2 (HP < 50%): enraged, 1.5x speed, double slam

**Visual:** Golem emoji large sprite (2x normal), crystal on back via PIXI.Sprite overlay, weakness indicator

### Shared Elite Mechanics
- Only 1 of each elite per zone
- Territory marked by red glowing border (PIXI.Graphics rect with alpha pulse)
- All 5 elites killed = 1 Valley Trial (need 3 for south gate unlock)
- Elites respawn after player rests twice at campfire
- Elite loot essential for final boss prep

### Edge Cases
- **Elite Escape:** Leave territory → elite pursues 5s then returns, HP resets
- **Multiple Elites:** Rare but possible. Show "هذا كثير جداً!" notification

## Pixi.js Technical Implementation Hints
```javascript
class EliteEnemy extends PIXI.Container {
  constructor(template) {
    super();
    this.template = template;
    this.hp = template.hp;
    this.maxHp = template.hp;
    this.state = 'idle';
    this.phase = 1;

    // Main sprite
    this.sprite = new PIXI.Sprite(emojiToTexture(template.emoji, 32));
    this.sprite.anchor.set(0.5);
    this.addChild(this.sprite);

    // HP bar
    this.hpBar = new PIXI.Graphics();
    this.hpBar.y = -30;
    this.addChild(this.hpBar);

    // Territory glow
    this.territoryGlow = new PIXI.Graphics();
    this.territoryGlow.alpha = 0.3;
    LAYERS.effects.addChild(this.territoryGlow);
  }

  update(dt, player) {
    switch (this.template.id) {
      case 'elite_scorpion': this.updateScorpion(dt, player); break;
      case 'elite_vulture': this.updateVulture(dt, player); break;
      case 'elite_lavaLizard': this.updateLavaLizard(dt, player); break;
      case 'elite_sandWraith': this.updateSandWraith(dt, player); break;
      case 'elite_stoneGolem': this.updateStoneGolem(dt, player); break;
    }
    this.drawHPBar();
  }

  // Example: Scorpion state machine
  updateScorpion(dt, player) {
    const dist = Math.hypot(this.x - player.x, this.y - player.y);
    switch (this.state) {
      case 'idle':
        if (dist < 100) { this.state = 'emerging'; this.emerge(); }
        break;
      case 'emerging':
        // Alpha 0→1, spawn particles
        this.sprite.alpha = Math.min(1, this.sprite.alpha + dt * 2);
        if (this.sprite.alpha >= 1) this.state = 'chase';
        break;
      case 'chase':
        this.moveToward(player, 2.5);
        if (dist < 30) this.attack(player);
        break;
      case 'attack':
        // Poison, cooldown
        break;
    }
  }

  // Lava lizard fire breath
  fireBreath() {
    // Animated cone
    const cone = new PIXI.Graphics();
    cone.beginFill(0xFF4400, 0.6);
    cone.moveTo(0, 0);
    cone.lineTo(100, -30);
    cone.lineTo(100, 30);
    cone.closePath();
    cone.endFill();
    cone.x = this.x + (this.facingRight ? 20 : -20);
    cone.y = this.y;
    LAYERS.effects.addChild(cone);
    gsap.to(cone, { alpha: 0, duration: 0.5, onComplete: () => cone.destroy() });
  }
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
