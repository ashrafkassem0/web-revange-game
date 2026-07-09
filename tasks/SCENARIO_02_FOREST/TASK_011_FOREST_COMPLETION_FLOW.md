# TASK_011 — FOREST_COMPLETION_FLOW

## Objective
Polish the forest-to-city transition with clear completion flow, graduation sequence, and persistent world state marking using Pixi.js UI elements.

## Detailed Mechanics & User Stories

### Completion Conditions
```javascript
KILLS_NEEDED: 10        // Up from 3 — more challenging
DISTANCE_NEEDED: 5.0    // km walked
CHALLENGES_NEEDED: 4    // axe, fishingRod, campfire built, workbench built
```

### Completion Banner (Pixi.js UI)
- Non-blocking banner at top of screen: `PIXI.Container` sliding down from above
- Trophy icon (PIXI.Sprite) + "أكملت تدريب الغابة!" (PIXI.Text)
- Stats display: kills / distance / challenges in a row of PIXI.Text elements
- "انتقل إلى المدينة" glowing button (PIXI.Graphics rounded rect + PIXI.Text)
- Banner enters via animation: `container.y` from `-100` to `0` over 500ms
- Dismissible with close button (X)

### Graduation Scene
When player uses city portal with completion met:
1. Fade to black via PIXI.AlphaFilter (1s)
2. Typewriter text overlay: "تدرب أشرف في الغابة لأيام... تعلم الصيد والصناعة والقتال... حان الوقت لمواصلة الرحلة..."
3. PIXI.Text with 45ms per character typewriter effect
4. Fade to city scene

### Persistent Forest State
- `completedForest = true` set in GameState
- Forest remains accessible via city north gate
- Enemies no longer give XP (xpMultiplier = 0)
- Resources still collectible, respawn normally

### Edge Cases
- **Leave Early:** Portal with incomplete conditions → warning dialog: "لم تكمل تدريبك بعد! هل أنت متأكد؟" with confirm/cancel buttons via PIXI.Container
- **Return Post-Completion:** Enemies display "??" level indicator above head (PIXI.Text "مستوى ??"). Combat is trivial (enemies die in 1 hit).
- **Completion Check Frequency:** `checkCompletion()` runs every 30s and on key events (kill, craft, rest).

## Pixi.js Technical Implementation Hints
```javascript
class CompletionBanner extends PIXI.Container {
  constructor() {
    super();
    this.y = -200; // Hidden above screen
    this.visible = false;

    // Background
    const bg = new PIXI.Graphics();
    bg.beginFill(0x1a1a2e, 0.95);
    bg.drawRoundedRect(0, 0, App.screen.width, 120, 10);
    bg.endFill();
    this.addChild(bg);

    // Trophy
    const trophy = new PIXI.Text('🏆', { fontSize: 40 });
    trophy.x = 20; trophy.y = 10;
    this.addChild(trophy);

    // Title
    const title = new PIXI.Text('أكملت تدريب الغابة!', {
      fontFamily: 'Arial', fontSize: 28, fill: 0xFFD700, fontWeight: 'bold'
    });
    title.x = 80; title.y = 10;
    this.addChild(title);

    // Stats
    this.killsText = new PIXI.Text('', { fontSize: 16, fill: 0xFFFFFF });
    this.killsText.x = 80; this.killsText.y = 50;
    this.addChild(this.killsText);

    // Go to City button
    const btn = new PIXI.Graphics();
    btn.beginFill(0x00AA00);
    btn.drawRoundedRect(App.screen.width - 200, 30, 170, 50, 8);
    btn.endFill();
    btn.interactive = true;
    btn.on('pointerdown', () => this.goToCity());
    const btnText = new PIXI.Text('انتقل إلى المدينة', { fontSize: 18, fill: 0xFFFFFF });
    btnText.anchor.set(0.5);
    btnText.x = App.screen.width - 115; btnText.y = 55;
    this.addChild(btn, btnText);
  }

  show(kills, distance, challenges) {
    this.visible = true;
    this.killsText.text = `⚔️ ${kills} قتلة  |  🚶 ${distance.toFixed(1)} كم  |  🔧 ${challenges} تحديات`;
    // Slide down animation
    gsap.to(this, { y: 0, duration: 0.5, ease: 'back.out' });
  }

  hide() {
    gsap.to(this, { y: -200, duration: 0.3, onComplete: () => { this.visible = false; } });
  }
}
```

### Graduation Text Overlay
```javascript
// Reuse intro typewriter system
class TypewriterOverlay extends PIXI.Container {
  constructor(text, onComplete) {
    super();
    this.text = text;
    this.idx = 0;
    this.textSprite = new PIXI.Text('', { fontSize: 24, fill: 0xFFFFFF, wordWrap: true, wordWrapWidth: 600 });
    this.textSprite.anchor.set(0.5);
    this.textSprite.x = App.screen.width / 2;
    this.textSprite.y = App.screen.height / 2;
    this.addChild(this.textSprite);
    this.timer = setInterval(() => this.typeChar(), 45);
  }

  typeChar() {
    if (this.idx >= this.text.length) { clearInterval(this.timer); this.onComplete?.(); return; }
    this.textSprite.text += this.text[this.idx++];
  }
}
```

## Verification & Acceptance Criteria
- [ ] Completion banner slides down when all conditions met (10 kills, 5km, 4 challenges)
- [ ] Banner shows correct stats
- [ ] Graduation typewriter scene plays on city portal use
- [ ] `completedForest = true` saved in GameState
- [ ] Returning to forest post-completion shows "??" level on enemies, no XP gain
- [ ] Early exit warning dialog with confirm/cancel
- [ ] Completion check runs every 30s and on key game events
