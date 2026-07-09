# TASK_027 — ENDING_CUTSCENE

## Objective
Create the emotional game ending — Ashraf's revenge is complete, he returns to his family's graves, and closure is achieved — using HTML/CSS overlays with typewriter text and CSS fade transitions.

## Detailed Mechanics & User Stories

### Final Cutscene (6 Interactive Scenes)
Scene-by-scene with typewriter text (same system as intro):

1. **"النهاية"** — Ashraf stands over defeated Terror King. Dark kingdom crumbles (particle animation on canvas, screen shake).
2. **"العودة"** — Ashraf walks back through Death Valley → city → forest. Familiar places now peaceful.
3. **"القبور"** — Ashraf arrives at family graves. Kneels. Places Terror King's Crown on father's grave.
4. **"الغفران"** — Ashraf speaks: "لقد وفيت بوعدي... أرجوكم سامحوني..."
5. **"السلام"** — Ashraf looks up. Rain stops. Sun breaks through clouds. He smiles slightly. Fade to white.
6. **Text:** "قصة أشرف... لم تنته بعد" → Credits roll.

### Mechanics
- Same typewriter text as intro (45ms per character)
- Press Space/Click to advance scene
- Each scene has a background image (`<img>` or CSS `background-image`) + foreground elements
- Linear — no choices
- Scene transitions via CSS `.fade-overlay`

### Credits
- Scrolling HTML text over black background
- Developer names, special thanks, music credits
- Duration: 15 seconds, auto-advance
- "العودة إلى القائمة الرئيسية" button at end

### New Game+ Flag
```javascript
GameState.save('completedGame', true);
GameState.save('newGamePlus', true); // Enables NG+
```
- NG+: Keep all stats/inventory. Enemies have 1.5x HP and damage.
- Main menu shows "قصة كاملة ✔️" badge + "الحملة الجديدة+" button

### Story Movie Mode
- After completion: "عرض القصة" button on main menu
- Plays all scenes from intro → ending sequentially as a cinematic
- Auto-advance mode (no clicking needed, 5s per scene)

### Edge Cases
- **Skip Cutscene:** Escape → "تخطي المشهد؟" confirm dialog → yes → credits
- **Post-Credits Tease:** After credits, brief text: "...لكن مملكة الظلام لن تموت أبداً" (hint for potential sequel)

## Implementation Hints
```html
<div id="ending-cutscene" class="hidden">
  <div class="scene-bg"></div>
  <div class="vignette"></div>
  <p id="ending-text" class="typewriter"></p>
</div>
<div class="fade-overlay"></div>
<div id="credits" class="hidden">
  <div id="credits-scroll"></div>
  <button id="credits-menu-btn">العودة للقائمة</button>
</div>
```

```javascript
class EndingCutscene {
  constructor() {
    this.root = document.getElementById('ending-cutscene');
    this.textEl = document.getElementById('ending-text');
    this.bgEl = this.root.querySelector('.scene-bg');
    this.fade = document.querySelector('.fade-overlay');
    this.scenes = [
      { image: 'scene_defeat_boss.png', text: 'وَقَفَ أَشْرَفُ فَوْقَ مَلِكِ الرُّعْبِ... اِنْتَهَى الْعَدُوُّ...' },
      { image: 'scene_return_forest.png', text: 'عَادَ أَشْرَفُ مِنْ طَرِيقِ وَادِي الْمَوْتِ... مَرَّ بِالْمَدِينَةِ... ثُمَّ الْغَابَةِ...' },
      { image: 'scene_graves.png', text: 'وَقَفَ أَمَامَ قُبُورِ عَائِلَتِهِ... وَضَعَ تَاجَ مَلِكِ الرُّعْبِ عَلَى قَبْرِ أَبِيهِ...' },
      { image: 'scene_graves.png', text: 'لَقَدْ وَفَّيْتُ بِوَعْدِي... أَرْجُوكُمْ سَامِحُونِي...' },
      { image: 'scene_sunbreak.png', text: 'نَظَرَ أَشْرَفُ إِلَى السَّمَاءِ... تَوَقَّفَ الْمَطَرُ... أَشْرَقَتِ الشَّمْسُ...' }
    ];
    this.currentScene = 0;
  }

  start() {
    this.root.classList.remove('hidden');
    this.showScene(0);
  }

  showScene(index) {
    const scene = this.scenes[index];
    this.bgEl.style.backgroundImage = `url(${scene.image})`;
    this.textEl.textContent = '';
    let i = 0;
    clearInterval(this.typewriterTimer);
    this.typewriterTimer = setInterval(() => {
      if (i >= scene.text.length) { clearInterval(this.typewriterTimer); return; }
      this.textEl.textContent += scene.text[i++];
    }, 45);
  }

  async nextScene() {
    clearInterval(this.typewriterTimer);
    this.currentScene++;
    if (this.currentScene >= this.scenes.length) {
      this.showFinalText();
      return;
    }
    this.fade.classList.add('active');
    await this.wait(500);
    this.showScene(this.currentScene);
    this.fade.classList.remove('active');
  }

  showFinalText() {
    this.root.innerHTML = '<p class="final-line">قصة أشرف... لم تنته بعد</p>';
    setTimeout(() => this.showCredits(), 3000);
  }

  showCredits() {
    this.root.classList.add('hidden');
    const credits = document.getElementById('credits');
    const scroll = document.getElementById('credits-scroll');
    scroll.innerHTML = [
      '--- الانتقام: قصة أشرف ---',
      '',
      'المطور:     [Your Name]',
      'الفنان:     [Artist Name]',
      'الموسيقى:   [Composer Name]',
      '',
      'شكر خاص لعائلتي وأصدقائي',
      '',
      'صنع بـ ❤️ في عالم الألعاب العربية',
      '',
      '...',
      'لكن مملكة الظلام لن تموت أبداً'
    ].map(l => `<p>${l || '&nbsp;'}</p>`).join('');
    credits.classList.remove('hidden');
    scroll.style.transform = 'translateY(100vh)';
    scroll.style.transition = 'transform 15s linear';
    requestAnimationFrame(() => {
      scroll.style.transform = 'translateY(-100%)';
    });
    setTimeout(() => {
      document.getElementById('credits-menu-btn').classList.remove('hidden');
    }, 15000);
  }
}
```

## Verification & Acceptance Criteria
- [ ] 5 ending scenes play sequentially with typewriter text (45ms/char)
- [ ] Each scene has appropriate background image
- [ ] Space/Click advances scenes with fade transition (`.fade-overlay`)
- [ ] Final text "قصة أشرف... لم تنته بعد" displays for 3s
- [ ] Credits scroll over 15s with developer names
- [ ] "العودة للقائمة" button works after credits
- [ ] `completedGame` and `newGamePlus` flags saved
- [ ] New Game+ button appears on main menu after completion
- [ ] Skip cutscene (Escape) with confirm dialog
- [ ] Post-credits tease text: "...لكن مملكة الظلام لن تموت أبداً"
- [ ] Story movie mode accessible from main menu
