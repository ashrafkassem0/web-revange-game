# TASK_025 — TERROR_KING_BOSS

## Objective
Design and implement the final boss — Terror King (ملك الرعب) — with a 3-phase epic battle using Pixi.js animated sprites, filters, and complex attack patterns.

## Detailed Mechanics & User Stories

### Boss Arena
- Throne Room: 1000×1000px circular room
- Floor: black marble with red glowing runes (PIXI.Graphics rune pattern with alpha pulse)
- 4 pillars provide cover (PIXI.Sprite, destructible after 10 hits each)

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
- **Dark Orbs:** 3 floating orbs orbit boss (PIXI.Sprite orbital motion), shoot slow projectiles every 3s
- Environment: Floor runes glow brighter, random fire jets from ground

**Dialogue:** "لا زلت تصر على الموت!"

### Phase 3 — "اليأس" (33-0% HP)
- All Phase 1+2 attacks at 2x speed
- **Aura of Despair:** Continuous 2 HP/s damage to player within melee range (PIXI.ColorMatrixFilter red tint)
- **Meteor Call:** Summons 2 meteors at random player positions (3s warning circle, same as DV meteor)
- **Desperation Move (10% HP):** Boss invulnerable 3s, charges massive AoE (200px radius, 80 damage). Player hides behind pillar. Pillar check: if destroyed, full damage.
- Visual: Boss larger, red/black aura, eyes glow, screen shakes constantly

**Dialogue:** "مستحيل! كيف لك أن... ARGHHH!"

### Boss UI (Pixi.js)
- Giant HP bar at top: PIXI.Graphics bar, red fill, "ملك الرعب" + crown icon
- Phase indicator: 3 circles (PIXI.Graphics), filled = phase passed
- Attack warnings: PIXI.Text at top-center, e.g., "⚔️ هجوم سيف!" with red flash
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

## Pixi.js Technical Implementation Hints
```javascript
class TerrorKing extends PIXI.Container {
  constructor() {
    super();
    this.hp = 1000;
    this.maxHp = 1000;
    this.phase = 1;
    this.state = 'intro'; // intro → idle → windup → attack → recovery
    this.attackCooldown = 0;
    this.cloneList = [];
    this.orbList = [];

    // Main sprite (large, 3x normal)
    this.sprite = new PIXI.AnimatedSprite(terrorKingFrames);
    this.sprite.anchor.set(0.5);
    this.sprite.scale.set(3);
    this.addChild(this.sprite);

    // Aura effect (phase 3)
    this.aura = new PIXI.Sprite(PIXI.Texture.from('dark_aura.png'));
    this.aura.anchor.set(0.5);
    this.aura.blendMode = PIXI.BLEND_MODES.ADD;
    this.aura.alpha = 0;
    this.addChild(this.aura);

    // HP bar
    this.hpBarBg = new PIXI.Graphics();
    this.hpBarBg.beginFill(0x333333);
    this.hpBarBg.drawRect(App.screen.width / 2 - 300, 20, 600, 30);
    this.hpBarBg.endFill();
    LAYERS.ui.addChild(this.hpBarBg);

    this.hpBarFill = new PIXI.Graphics();
    LAYERS.ui.addChild(this.hpBarFill);

    this.bossName = new PIXI.Text('👑 ملك الرعب', {
      fontSize: 24, fill: 0xFF0000, fontWeight: 'bold'
    });
    this.bossName.anchor.set(0.5);
    this.bossName.x = App.screen.width / 2; this.bossName.y = 10;
    LAYERS.ui.addChild(this.bossName);

    // Phase indicators (3 circles)
    this.phaseDots = [];
    for (let i = 0; i < 3; i++) {
      const dot = new PIXI.Graphics();
      dot.beginFill(0x444444);
      dot.drawCircle(App.screen.width / 2 - 120 + i * 80, 60, 10);
      dot.endFill();
      LAYERS.ui.addChild(dot);
      this.phaseDots.push(dot);
    }
  }

  update(dt, player) {
    // Update phase based on HP
    const hpRatio = this.hp / this.maxHp;
    if (hpRatio <= 0.66 && this.phase === 1) this.transitionPhase(2);
    if (hpRatio <= 0.33 && this.phase === 2) this.transitionPhase(3);

    this.attackCooldown = Math.max(0, this.attackCooldown - dt);

    switch (this.state) {
      case 'idle':
        if (this.attackCooldown <= 0) this.chooseAttack(player);
        break;
      case 'swordSlash':
        this.updateSwordSlash(dt, player);
        break;
      case 'whipCrack':
        this.updateWhipCrack(dt, player);
        break;
      case 'darkWave':
        this.updateDarkWave(dt, player);
        break;
    }

    // Update clones
    this.cloneList = this.cloneList.filter(c => c.hp > 0);
    this.cloneList.forEach(c => c.update(dt, player));

    // Update orbs
    this.orbList.forEach((orb, i) => {
      const angle = (Date.now() * 0.002) + (i * Math.PI * 2 / 3);
      orb.x = this.x + Math.cos(angle) * 80;
      orb.y = this.y + Math.sin(angle) * 80;
    });

    // Update aura (phase 3)
    if (this.phase === 3) {
      this.aura.alpha = 0.3 + Math.sin(Date.now() * 0.005) * 0.2;
      this.aura.scale.set(1 + Math.sin(Date.now() * 0.003) * 0.1);
    }

    this.drawHPBar();
  }

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
    // Show warning text
    this.showWarning('⚔️ هجوم سيف!');
    // Red flash on sword sprite
    this.sprite.tint = 0xFF0000;
  }

  transitionPhase(newPhase) {
    this.phase = newPhase;
    // Phase transition effect
    this.sprite.tint = 0xFFFFFF;
    // Screen shake
    this.shakeScreen(15, 500);
    // Phase dialogue
    const dialogues = {
      2: 'لا زلت تصر على الموت!',
      3: 'مستحيل! كيف لك أن...'
    };
    this.showDialogue(dialogues[newPhase], 3);
    // Update phase dot
    this.phaseDots[newPhase - 1].clear();
    this.phaseDots[newPhase - 1].beginFill(0xFF0000);
    this.phaseDots[newPhase - 1].drawCircle(App.screen.width / 2 - 120 + (newPhase - 1) * 80, 60, 10);
    this.phaseDots[newPhase - 1].endFill();
  }

  // Desperation move at 10% HP
  desperationMove() {
    this.state = 'desperation';
    this.invulnerable = true;
    this.showWarning('💀 هلاك شامل! اختبئ خلف الأعمدة!');
    // Charge for 3s
    this.chargeTimer = 3;
    // AoE indicator
    this.aoeIndicator = new PIXI.Graphics();
    this.aoeIndicator.beginFill(0xFF0000, 0.3);
    this.aoeIndicator.drawCircle(0, 0, 200);
    this.aoeIndicator.endFill();
    this.addChild(this.aoeIndicator);
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
