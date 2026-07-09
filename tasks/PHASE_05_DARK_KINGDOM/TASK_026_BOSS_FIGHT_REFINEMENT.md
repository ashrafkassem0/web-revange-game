# TASK_026 — BOSS_FIGHT_REFINEMENT

## Objective
Polish the boss fight with Canvas 2D camera effects, dynamic music, visual spectacle, death/retry mechanics, and kill-screen slow-motion.

## Detailed Mechanics & User Stories

### Camera Intro Sequence
1. Player enters Throne Room → camera locked
2. Camera slowly pans from player to Terror King sitting on throne (3s lerp)
3. Boss stands up (sprite frame change) + dialogue
4. Camera unlock, fight begins
5. Unskippable

### Phase Transition Effects
- **Phase 1→2:** Boss roars, screen shake (500ms), shockwave pushes player back (lerp position), dialogue, camera briefly zooms to boss
- **Phase 2→3:** Screen red tint (`rgba` overlay) for 2s, boss aura explosion (particle burst), dialogue, camera shake

### Dynamic Boss Music
- Phase 1: Dark orchestral, steady tempo
- Phase 2: Faster tempo, added percussion
- Phase 3: Max tempo, full orchestra + choir
- Transition: 2s crossfade between tracks via AudioManager

### Death During Boss Fight
1. Screen desaturates (`ctx.filter = 'grayscale(1)'` or CSS filter on canvas, 1s transition)
2. "لقد هُزمت..." text overlay (HTML modal or canvas text, 2s)
3. Options: "إعادة المحاولة" / "الرجوع إلى القائمة" (HTML buttons)
4. Retry: boss HP resets to phase start (e.g., died in phase 2 → boss at 66% HP)
5. Player spawns at arena entrance with 50% HP

### Boss Kill Screen
1. Slow-motion: `timeScale = 0.3` for 2 seconds on final blow (multiply `dt` in game loop)
2. Boss falls (sprite y increases + rotation), dissolves into particles (JS particle array burst)
3. "لقد انتصرت!" overlay (HTML or canvas text, 3s)
4. Auto-transition to ending cutscene

### Easy Mode (After 5 Deaths)
- If player has died 5+ times to boss, offer "وضع سهل" option:
  - Boss HP reduced by 30%
  - Attack speed reduced by 20%
  - Show once per session: "هل تواجه صعوبة؟ تفعيل الوضع السهل؟"

### Edge Cases
- **Disconnect:** If player closes during boss, on reload: boss at last checkpoint phase HP, player at entrance
- **Heal Interrupt:** Boss can hit player during heal animation (1s). Heal cancelled, materials consumed.

## Canvas 2D Implementation Hints
```javascript
class BossCinematics {
  constructor(boss, player, camera) {
    this.boss = boss;
    this.player = player;
    this.camera = camera;
    this.timeScale = 1;
    this.redTintAlpha = 0;
    this.grayscale = 0;
  }

  async playIntro() {
    this.lockCamera(this.boss.throneX, this.boss.throneY);
    await this.panCamera(this.boss.x, this.boss.y, 3000);
    this.boss.frame = 'standUp';
    await this.wait(1000);
    this.showDialogue('لقد عدتَ... أيها الطفل الأحمق!');
    await this.wait(2000);
    this.unlockCamera();
  }

  async phaseTransition(phaseNum) {
    this.shakeScreen(20, 500);

    // Shockwave as expanding ring particle / drawn circle
    shockwaves.push({
      x: this.boss.x, y: this.boss.y,
      radius: 10, maxRadius: 200, alpha: 0.3, life: 0.5
    });

    const angle = Math.atan2(this.player.y - this.boss.y, this.player.x - this.boss.x);
    this.player.x += Math.cos(angle) * 80;
    this.player.y += Math.sin(angle) * 80;

    AudioManager.crossfadeMusic(`boss_phase${phaseNum - 1}`, `boss_phase${phaseNum}`, 2000);

    if (phaseNum === 3) {
      this.redTintAlpha = 0.35;
      // Fade out over 2s in update()
    }
  }

  drawOverlays(ctx, w, h) {
    if (this.redTintAlpha > 0) {
      ctx.fillStyle = `rgba(255,50,50,${this.redTintAlpha})`;
      ctx.fillRect(0, 0, w, h);
    }
    if (this.grayscale > 0) {
      // Prefer CSS: canvas.style.filter = `grayscale(${this.grayscale})`
    }
  }

  async playKillSequence() {
    this.timeScale = 0.3;

    // Boss death: fall + fade handled in boss.update with deathTimer
    this.boss.dying = true;
    this.boss.rotation = 0;

    for (let i = 0; i < 50; i++) {
      particles.push({
        x: this.boss.x, y: this.boss.y,
        vx: (Math.random() - 0.5) * 10,
        vy: (Math.random() - 0.5) * 10,
        life: 2,
        color: ['#ff0000', '#440000', '#000000'][Math.floor(Math.random() * 3)],
        size: 2 + Math.random() * 4
      });
    }

    await this.wait(1500);
    this.showVictoryText(); // HTML: #victory-overlay
    this.timeScale = 1;
  }

  showDeathScreen() {
    this.grayscale = 1;
    // HTML overlay preferred:
    const el = document.getElementById('boss-death-overlay');
    el.classList.remove('hidden');
    el.querySelector('.death-text').textContent = 'لقد هُزمت...';
    el.querySelector('[data-action="retry"]').onclick = () => this.retry();
    el.querySelector('[data-action="menu"]').onclick = () => SceneManager.navigateTo('mainMenu');
  }
}

// In requestAnimationFrame loop:
function gameLoop(now) {
  const rawDt = (now - last) / 1000;
  const dt = rawDt * (bossCinematics?.timeScale ?? 1);
  update(dt);
  draw();
  requestAnimationFrame(gameLoop);
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
