# TASK_026 — BOSS_FIGHT_REFINEMENT

## Objective
Polish the boss fight with Pixi.js camera effects, dynamic music, visual spectacle, death/retry mechanics, and kill-screen slow-motion.

## Detailed Mechanics & User Stories

### Camera Intro Sequence
1. Player enters Throne Room → camera locked
2. Camera slowly pans from player to Terror King sitting on throne (3s lerp)
3. Boss stands up (PIXI.AnimatedSprite frame change) + dialogue
4. Camera unlock, fight begins
5. Unskippable

### Phase Transition Effects
- **Phase 1→2:** Boss roars, screen shake (500ms), shockwave pushes player back (gsap position), dialogue, camera briefly zooms to boss
- **Phase 2→3:** Screen red tint (PIXI.ColorMatrixFilter) for 2s, boss aura explosion (particle burst), dialogue, camera shake

### Dynamic Boss Music
- Phase 1: Dark orchestral, steady tempo
- Phase 2: Faster tempo, added percussion
- Phase 3: Max tempo, full orchestra + choir
- Transition: 2s crossfade between tracks via AudioManager

### Death During Boss Fight
1. Screen desaturates (PIXI.ColorMatrixFilter grayscale, 1s transition)
2. "لقد هُزمت..." text overlay (PIXI.Text, 2s)
3. Options: "إعادة المحاولة" / "الرجوع إلى القائمة"
4. Retry: boss HP resets to phase start (e.g., died in phase 2 → boss at 66% HP)
5. Player spawns at arena entrance with 50% HP

### Boss Kill Screen
1. Slow-motion: `App.ticker.speed = 0.3` for 2 seconds on final blow
2. Boss falls (sprite y increases + rotation), dissolves into particles (PIXI.ParticleContainer burst)
3. "لقد انتصرت!" overlay (PIXI.Text, 3s)
4. Auto-transition to ending cutscene

### Easy Mode (After 5 Deaths)
- If player has died 5+ times to boss, offer "وضع سهل" option:
  - Boss HP reduced by 30%
  - Attack speed reduced by 20%
  - Show once per session: "هل تواجه صعوبة؟ تفعيل الوضع السهل؟"

### Edge Cases
- **Disconnect:** If player closes during boss, on reload: boss at last checkpoint phase HP, player at entrance
- **Heal Interrupt:** Boss can hit player during heal animation (1s). Heal cancelled, materials consumed.

## Pixi.js Technical Implementation Hints
```javascript
class BossCinematics {
  constructor(boss, player) {
    this.boss = boss;
    this.player = player;
  }

  async playIntro() {
    // Lock camera to boss throne
    this.lockCamera(boss.throneX, boss.throneY);
    // Slow pan to boss
    await this.panCamera(boss.x, boss.y, 3000);
    // Boss stands up
    this.boss.sprite.textures = bossStandUpFrames;
    this.boss.sprite.play();
    await this.wait(1000);
    // Dialogue
    this.showDialogue('لقد عدتَ... أيها الطفل الأحمق!');
    await this.wait(2000);
    // Unlock camera
    this.unlockCamera();
  }

  async phaseTransition(phaseNum) {
    // Screen shake
    this.shakeScreen(20, 500);
    // Shockwave (expanding ring)
    const shockwave = new PIXI.Graphics();
    shockwave.beginFill(0xFFFFFF, 0.3);
    shockwave.drawCircle(0, 0, 10);
    shockwave.endFill();
    shockwave.x = this.boss.x; shockwave.y = this.boss.y;
    LAYERS.effects.addChild(shockwave);
    gsap.to(shockwave.scale, { x: 10, y: 10, duration: 0.5 });
    gsap.to(shockwave, { alpha: 0, duration: 0.5, onComplete: () => shockwave.destroy() });

    // Push player back
    const angle = Math.atan2(this.player.y - this.boss.y, this.player.x - this.boss.x);
    gsap.to(this.player, {
      x: this.player.x + Math.cos(angle) * 80,
      y: this.player.y + Math.sin(angle) * 80,
      duration: 0.3
    });

    // Music crossfade
    AudioManager.crossfadeMusic(`boss_phase${phaseNum - 1}`, `boss_phase${phaseNum}`, 2000);

    // Color tint for phase 3
    if (phaseNum === 3) {
      const tintFilter = new PIXI.ColorMatrixFilter();
      tintFilter.tint(255, 50, 50, 0.3);
      LAYERS.entities.filters = [tintFilter];
      gsap.to(tintFilter, { alpha: 0, duration: 2, delay: 2, onComplete: () => {
        LAYERS.entities.filters = [];
      }});
    }
  }

  // Death slow-motion
  async playKillSequence() {
    // Slow motion
    App.ticker.speed = 0.3;

    // Boss death animation
    gsap.to(this.boss.sprite, { rotation: Math.PI / 2, y: this.boss.y + 50, duration: 0.5 });
    gsap.to(this.boss.sprite, { alpha: 0, duration: 1, delay: 0.5 });

    // Particle burst
    const particles = new PIXI.ParticleContainer(100, {
      position: true, alpha: true, scale: true, rotation: true
    });
    for (let i = 0; i < 50; i++) {
      const p = new PIXI.Graphics();
      p.beginFill([0xFF0000, 0x440000, 0x000000][Math.floor(Math.random() * 3)], 0.8);
      p.drawCircle(0, 0, 2 + Math.random() * 4);
      p.endFill();
      p.x = this.boss.x; p.y = this.boss.y;
      p.vx = (Math.random() - 0.5) * 10;
      p.vy = (Math.random() - 0.5) * 10;
      particles.addChild(p);
    }
    LAYERS.effects.addChild(particles);

    // Animate particles
    gsap.to(particles.children, {
      alpha: 0, duration: 2,
      onUpdate: () => {
        particles.children.forEach(p => {
          p.x += p.vx; p.y += p.vy;
          p.vx *= 0.98; p.vy *= 0.98;
        });
      },
      onComplete: () => { App.ticker.speed = 1; }
    });

    // Victory text
    await this.wait(1500);
    this.showVictoryText();
  }

  // Retry system
  showDeathScreen() {
    // Grayscale
    const grayFilter = new PIXI.ColorMatrixFilter();
    grayFilter.greyscale(1, false);
    LAYERS.entities.filters = [grayFilter];

    // Death text
    const text = new PIXI.Text('لقد هُزمت...', {
      fontSize: 48, fill: 0xFF4444, fontWeight: 'bold'
    });
    text.anchor.set(0.5);
    text.x = App.screen.width / 2; text.y = App.screen.height / 2;
    LAYERS.overlay.addChild(text);

    // Buttons
    const retryBtn = this.createButton('إعادة المحاولة', App.screen.width / 2 - 100, App.screen.height / 2 + 60);
    retryBtn.on('pointerdown', () => this.retry());
    const menuBtn = this.createButton('القائمة الرئيسية', App.screen.width / 2 + 20, App.screen.height / 2 + 60);
    menuBtn.on('pointerdown', () => SceneManager.navigateTo('mainMenu'));

    LAYERS.overlay.addChild(retryBtn, menuBtn);
  }
}
```

## Verification & Acceptance Criteria
- [ ] Camera intro sequence: pan to throne → boss stands → fight begins
- [ ] Phase transitions: screen shake, shockwave, player pushback, dialogue
- [ ] Boss music changes per phase with crossfade
- [ ] Death: grayscale filter, death text, retry/menu buttons
- [ ] Retry restores boss to phase-start HP, player at entrance with 50% HP
- [ ] Kill slow-motion: 0.3x speed for 2s, boss dissolves into particles
- [ ] Victory text "لقد انتصرت!" plays before ending
- [ ] Easy mode offered after 5 deaths (boss HP -30%, speed -20%)
- [ ] Disconnect recovery: boss at checkpoint HP
- [ ] Heal interrupt works (boss cancels player heal)
