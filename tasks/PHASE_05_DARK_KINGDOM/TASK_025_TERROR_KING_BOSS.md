# TASK_025 — TERROR_KING_BOSS

## Objective
Design and implement the final boss — Terror King (ملك الرعب) — with a 3-phase epic battle using Canvas 2D sprites, rgba overlays, and complex attack patterns.

## Detailed Mechanics & User Stories

### Boss Arena
- Throne Room: 1000×1000px circular room
- Floor: black marble with red glowing runes (`ctx` path strokes with alpha pulse)
- 4 pillars provide cover (drawn sprites, destructible after 10 hits each)

### Terror King Stats
| Property | Value |
|----------|-------|
| HP | 1000 |
| Phases | 3 (100-66%, 66-33%, 33-0%) |
| Speed | Moderate, increases per phase |
| Weakness | Fire (fire arrows 1.5x damage) |

### Phase 1 — "المقدمة" (100-66% HP)
**Attack Pattern (looping):**
1. **Sword Slash:** 120° arc, 30 damage, 2s wind-up (red flash on sword sprite)
2. **Whip Crack:** Ranged whip (150px), 20 damage, knockback, 1.5s wind-up
3. **Dark Wave:** Ground wave (linear 200px), 25 damage, jump over with Space

**Pattern repeats predictably. Learnable.**

**Dialogue:** "لقد عدتَ... أيها الطفل الأحمق!"

### Phase 2 — "الغضب" (66-33% HP)
- All Phase 1 attacks at 1.5x speed
- **Shadow Clones:** Boss splits into 3 copies (2 fake, 1 real). Fakes disappear on 1 hit. Real attacks during split.
- **Dark Orbs:** 3 floating orbs orbit boss (orbital motion each frame), shoot slow projectiles every 3s
- Environment: Floor runes glow brighter, random fire jets from ground

**Dialogue:** "لا زلت تصر على الموت!"

### Phase 3 — "اليأس" (33-0% HP)
- All Phase 1+2 attacks at 2x speed
- **Aura of Despair:** Continuous 2 HP/s damage to player within melee range (red `rgba` screen tint)
- **Meteor Call:** Summons 2 meteors at random player positions (3s warning circle, same as DV meteor)
- **Desperation Move (10% HP):** Boss invulnerable 3s, charges massive AoE (200px radius, 80 damage). Player hides behind pillar. Pillar check: if destroyed, full damage.
- Visual: Boss larger, red/black aura, eyes glow, screen shakes constantly

**Dialogue:** "مستحيل! كيف لك أن... ARGHHH!"

### Boss UI (HTML/CSS overlay preferred, or Canvas HUD)
- Giant HP bar at top: red fill bar, "ملك الرعب" + crown icon
- Phase indicator: 3 circles, filled = phase passed
- Attack warnings: text at top-center, e.g., "⚔️ هجوم سيف!" with red flash
- Player HP prominently displayed above player sprite

### Boss Rewards
- 1000 XP (guaranteed level up)
- Terror King's Sword: +80 attack, durability 999, black flame visual
- Terror King's Crown: quest item
- 100 coins

### Edge Cases
- **Pillar Cover:** Pillars destroyed after 10 hits. If no cover for desperation move, player takes full 80 damage.
- **Healing During Fight:** Player can use items (Q) but animation takes 1s. Boss can interrupt with attack.
- **No Escape:** Invisible wall at arena edges. "لا مفر من المواجهة!" message.

## Canvas 2D Implementation Hints
```javascript
class TerrorKing {
  constructor(x, y) {
    this.x = x; this.y = y;
    this.hp = 1000;
    this.maxHp = 1000;
    this.phase = 1;
    this.state = 'intro'; // intro → idle → windup → attack → recovery
    this.attackCooldown = 0;
    this.cloneList = [];
    this.orbList = [];
    this.auraAlpha = 0;
    this.scale = 3;
    this.invulnerable = false;
  }

  update(dt, player) {
    const hpRatio = this.hp / this.maxHp;
    if (hpRatio <= 0.66 && this.phase === 1) this.transitionPhase(2);
    if (hpRatio <= 0.33 && this.phase === 2) this.transitionPhase(3);

    this.attackCooldown = Math.max(0, this.attackCooldown - dt);

    if (this.state === 'idle' && this.attackCooldown <= 0) {
      this.chooseAttack(player);
    }

    this.cloneList = this.cloneList.filter(c => c.hp > 0);
    this.cloneList.forEach(c => c.update(dt, player));

    this.orbList.forEach((orb, i) => {
      const angle = (Date.now() * 0.002) + (i * Math.PI * 2 / 3);
      orb.x = this.x + Math.cos(angle) * 80;
      orb.y = this.y + Math.sin(angle) * 80;
    });

    if (this.phase === 3) {
      this.auraAlpha = 0.3 + Math.sin(Date.now() * 0.005) * 0.2;
      // Aura damage
      if (Math.hypot(player.x - this.x, player.y - this.y) < 60) {
        player.takeDamage(2 * dt);
      }
    }
  }

  draw(ctx, camera) {
    const sx = (this.x - camera.x) * camera.zoom;
    const sy = (this.y - camera.y) * camera.zoom;

    // Aura (phase 3)
    if (this.phase === 3 && this.auraAlpha > 0) {
      const r = 80 * this.scale * (1 + Math.sin(Date.now() * 0.003) * 0.1);
      const g = ctx.createRadialGradient(sx, sy, 0, sx, sy, r);
      g.addColorStop(0, `rgba(180,0,0,${this.auraAlpha})`);
      g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(sx, sy, r, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.font = `${48 * this.scale / 3}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText('👑', sx, sy);

    // Orbs
    this.orbList.forEach(orb => {
      const ox = (orb.x - camera.x) * camera.zoom;
      const oy = (orb.y - camera.y) * camera.zoom;
      ctx.fillStyle = '#440088';
      ctx.beginPath();
      ctx.arc(ox, oy, 10, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  drawHUD(ctx, canvasW) {
    // Giant HP bar
    const barX = canvasW / 2 - 300;
    ctx.fillStyle = '#333';
    ctx.fillRect(barX, 20, 600, 30);
    ctx.fillStyle = '#c00';
    ctx.fillRect(barX, 20, 600 * (this.hp / this.maxHp), 30);

    ctx.fillStyle = '#f00';
    ctx.font = 'bold 24px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('👑 ملك الرعب', canvasW / 2, 14);

    // Phase dots
    for (let i = 0; i < 3; i++) {
      ctx.beginPath();
      ctx.fillStyle = i < this.phase ? '#f00' : '#444';
      ctx.arc(canvasW / 2 - 120 + i * 80, 60, 10, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Prefer HTML for warnings:
  // document.getElementById('boss-warning').textContent = '⚔️ هجوم سيف!';

  chooseAttack(player) {
    if (this.phase >= 2 && Math.random() < 0.3 && this.cloneList.length === 0) {
      this.createShadowClones();
      return;
    }
    const attacks = ['swordSlash', 'whipCrack', 'darkWave'];
    if (this.phase >= 2) attacks.push('shadowClones', 'darkOrbs');
    if (this.phase >= 3) attacks.push('meteorCall');
    const attack = attacks[Math.floor(Math.random() * attacks.length)];
    this[attack](player);
  }

  swordSlash(player) {
    this.state = 'windup';
    this.windupTimer = 0;
    this.attackType = 'swordSlash';
    this.showWarning('⚔️ هجوم سيف!');
  }

  transitionPhase(newPhase) {
    this.phase = newPhase;
    this.shakeScreen(15, 500);
    const dialogues = {
      2: 'لا زلت تصر على الموت!',
      3: 'مستحيل! كيف لك أن...'
    };
    this.showDialogue(dialogues[newPhase], 3);
  }

  desperationMove() {
    this.state = 'desperation';
    this.invulnerable = true;
    this.showWarning('💀 هلاك شامل! اختبئ خلف الأعمدة!');
    this.chargeTimer = 3;
    this.aoeRadius = 200;
  }

  drawAoeIndicator(ctx, camera) {
    if (this.state !== 'desperation') return;
    const sx = (this.x - camera.x) * camera.zoom;
    const sy = (this.y - camera.y) * camera.zoom;
    ctx.fillStyle = 'rgba(255,0,0,0.3)';
    ctx.beginPath();
    ctx.arc(sx, sy, this.aoeRadius * camera.zoom, 0, Math.PI * 2);
    ctx.fill();
  }
}
```

## Verification & Acceptance Criteria
- [ ] Phase 1: sword slash (120° arc, 30dmg), whip crack (150px ranged, 20dmg), dark wave (linear 200px, 25dmg)
- [ ] Phase 1 attack pattern loops predictably
- [ ] Phase 2: shadow clones (3 copies, 2 fake), dark orbs (3 orbiting, shoot projectiles)
- [ ] Phase 2: all Phase 1 attacks at 1.5x speed
- [ ] Phase 3: aura of despair (2 HP/s damage in melee), meteor call (3s warning)
- [ ] Phase 3: all attacks at 2x speed
- [ ] Desperation move at 10% HP (3s charge, 200px AoE, 80 damage, hide behind pillar)
- [ ] Boss HP bar + phase indicator dots display correctly
- [ ] Attack warning text appears for special moves
- [ ] Fire arrows deal 1.5x damage (weakness from city library quest)
- [ ] Pillars destructible (10 hits), desperation safe-zone check
- [ ] No arena escape (invisible walls)
- [ ] Victory triggers ending cutscene
- [ ] Boss rewards granted on kill
