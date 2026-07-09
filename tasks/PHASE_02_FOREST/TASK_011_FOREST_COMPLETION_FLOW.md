# TASK_011 — FOREST_COMPLETION_FLOW

## Objective
Polish the forest-to-city transition with clear completion flow, graduation sequence, and persistent world state marking using HTML/CSS overlays and the existing CSS `.fade-overlay` transition.

## Detailed Mechanics & User Stories

### Completion Conditions
```javascript
KILLS_NEEDED: 10        // Up from 3 — more challenging
DISTANCE_NEEDED: 5.0    // km walked
CHALLENGES_NEEDED: 4    // axe, fishingRod, campfire built, workbench built
```

### Completion Banner (HTML/CSS UI)
- Non-blocking banner at top of screen: HTML `<div>` sliding down via CSS transition / class
- Trophy icon + "أكملت تدريب الغابة!"
- Stats display: kills / distance / challenges in a row
- "انتقل إلى المدينة" glowing button
- Banner enters via animation: `transform: translateY` from `-100%` to `0` over 500ms
- Dismissible with close button (X)

### Graduation Scene
When player uses city portal with completion met:
1. Fade to black via existing CSS `.fade-overlay` (add `.active`, ~1s)
2. Typewriter text overlay (HTML): "تدرب أشرف في الغابة لأيام... تعلم الصيد والصناعة والقتال... حان الوقت لمواصلة الرحلة..."
3. Typewriter at 45ms per character into a centered HTML element
4. Fade to city scene via `navigateTo('../city/index.html')`

### Persistent Forest State
- `completedForest = true` set in GameState
- Forest remains accessible via city north gate
- Enemies no longer give XP (xpMultiplier = 0)
- Resources still collectible, respawn normally

### Edge Cases
- **Leave Early:** Portal with incomplete conditions → warning dialog: "لم تكمل تدريبك بعد! هل أنت متأكد؟" with confirm/cancel buttons via HTML modal (city `#modal` pattern)
- **Return Post-Completion:** Enemies display "??" level indicator above head (`ctx.fillText('مستوى ??', ...)`). Combat is trivial (enemies die in 1 hit).
- **Completion Check Frequency:** `checkCompletion()` runs every 30s and on key events (kill, craft, rest).

## Canvas 2D Implementation Hints
```javascript
// HTML banner — prefer DOM over canvas UI
class CompletionBanner {
  constructor() {
    this.el = document.getElementById('completion-banner');
    this.killsEl = this.el.querySelector('.stats-kills');
    this.el.hidden = true;
    this.el.classList.remove('visible');
    this.el.querySelector('.go-city').addEventListener('click', () => this.goToCity());
  }

  show(kills, distance, challenges) {
    this.el.hidden = false;
    this.killsEl.textContent =
      `⚔️ ${kills} قتلة  |  🚶 ${distance.toFixed(1)} كم  |  🔧 ${challenges} تحديات`;
    requestAnimationFrame(() => this.el.classList.add('visible')); // CSS slide-down
  }

  hide() {
    this.el.classList.remove('visible');
    setTimeout(() => { this.el.hidden = true; }, 300);
  }

  goToCity() {
    // graduation typewriter then navigateTo
  }
}
```

### Graduation Text Overlay
```javascript
// HTML typewriter over fade-overlay
class TypewriterOverlay {
  constructor(text, onComplete) {
    this.el = document.getElementById('graduation-text');
    this.text = text;
    this.idx = 0;
    this.onComplete = onComplete;
    this.el.textContent = '';
    this.el.hidden = false;
    this.timer = setInterval(() => this.typeChar(), 45);
  }

  typeChar() {
    if (this.idx >= this.text.length) {
      clearInterval(this.timer);
      this.onComplete?.();
      return;
    }
    this.el.textContent += this.text[this.idx++];
  }
}

// Transition uses shared.js navigateTo + .fade-overlay
function startGraduationThenCity() {
  document.querySelector('.fade-overlay')?.classList.add('active');
  setTimeout(() => {
    new TypewriterOverlay(
      'تدرب أشرف في الغابة لأيام... تعلم الصيد والصناعة والقتال... حان الوقت لمواصلة الرحلة...',
      () => navigateTo('../city/index.html')
    );
  }, 1000);
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
