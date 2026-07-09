# TASK_027 — ENDING_CUTSCENE

## Objective
Create the emotional game ending — Ashraf's revenge is complete, he returns to his family's graves, and closure is achieved — using Pixi.js typewriter text and scene transitions.

## Detailed Mechanics & User Stories

### Final Cutscene (6 Interactive Scenes)
Scene-by-scene with typewriter text (same system as intro):

1. **"النهاية"** — Ashraf stands over defeated Terror King. Dark kingdom crumbles (particle animation, screen shake).
2. **"العودة"** — Ashraf walks back through Death Valley → city → forest. Familiar places now peaceful.
3. **"القبور"** — Ashraf arrives at family graves. Kneels. Places Terror King's Crown on father's grave.
4. **"الغفران"** — Ashraf speaks: "لقد وفيت بوعدي... أرجوكم سامحوني..."
5. **"السلام"** — Ashraf looks up. Rain stops. Sun breaks through clouds. He smiles slightly. Fade to white.
6. **Text:** "قصة أشرف... لم تنته بعد" → Credits roll.

### Mechanics
- Same typewriter text as intro (45ms per character)
- Press Space/Click to advance scene
- Each scene has a background image (PIXI.Sprite) + foreground elements
- Linear — no choices

### Credits
- Scrolling PIXI.Text over black background
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

## Pixi.js Technical Implementation Hints
```javascript
class EndingCutscene {
  constructor() {
    this.container = new PIXI.Container();
    LAYERS.overlay.addChild(this.container);

    this.scenes = [
      { image: 'scene_defeat_boss.png', text: 'وَقَفَ أَشْرَفُ فَوْقَ مَلِكِ الرُّعْبِ... اِنْتَهَى الْعَدُوُّ...' },
      { image: 'scene_return_forest.png', text: 'عَادَ أَشْرَفُ مِنْ طَرِيقِ وَادِي الْمَوْتِ... مَرَّ بِالْمَدِينَةِ... ثُمَّ الْغَابَةِ...' },
      { image: 'scene_graves.png', text: 'وَقَفَ أَمَامَ قُبُورِ عَائِلَتِهِ... وَضَعَ تَاجَ مَلِكِ الرُّعْبِ عَلَى قَبْرِ أَبِيهِ...' },
      { image: 'scene_graves.png', text: 'لَقَدْ وَفَّيْتُ بِوَعْدِي... أَرْجُوكُمْ سَامِحُونِي...' },
      { image: 'scene_sunbreak.png', text: 'نَظَرَ أَشْرَفُ إِلَى السَّمَاءِ... تَوَقَّفَ الْمَطَرُ... أَشْرَقَتِ الشَّمْسُ...' }
    ];
    this.currentScene = 0;
    this.textSprite = new PIXI.Text('', { fontSize: 24, fill: 0xFFFFFF, wordWrap: true, wordWrapWidth: 600 });
    this.textSprite.anchor.set(0.5);
    this.textSprite.x = App.screen.width / 2;
    this.textSprite.y = App.screen.height * 0.8;
    this.container.addChild(this.textSprite);
  }

  start() {
    this.showScene(0);
  }

  showScene(index) {
    this.container.removeChildren();

    // Background
    const bg = new PIXI.Sprite(PIXI.Texture.from(this.scenes[index].image));
    bg.width = App.screen.width;
    bg.height = App.screen.height;
    this.container.addChild(bg);

    // Vignette overlay
    const vignette = new PIXI.Sprite(PIXI.Texture.from('vignette.png'));
    vignette.width = App.screen.width;
    vignette.height = App.screen.height;
    vignette.alpha = 0.6;
    this.container.addChild(vignette);

    // Typewriter text
    this.textSprite.text = '';
    this.textSprite.y = App.screen.height * 0.8;
    this.container.addChild(this.textSprite);

    // Typewriter
    let i = 0;
    const text = this.scenes[index].text;
    this.typewriterTimer = setInterval(() => {
      if (i >= text.length) { clearInterval(this.typewriterTimer); return; }
      this.textSprite.text += text[i++];
    }, 45);
  }

  nextScene() {
    clearInterval(this.typewriterTimer);
    this.currentScene++;
    if (this.currentScene >= this.scenes.length) {
      this.showFinalText();
    } else {
      // Fade transition
      gsap.to(this.container, { alpha: 0, duration: 0.5, onComplete: () => {
        this.showScene(this.currentScene);
        gsap.to(this.container, { alpha: 1, duration: 0.5 });
      }});
    }
  }

  showFinalText() {
    this.container.removeChildren();
    const finalText = new PIXI.Text('قصة أشرف... لم تنته بعد', {
      fontSize: 36, fill: 0xFFD700, fontWeight: 'bold'
    });
    finalText.anchor.set(0.5);
    finalText.x = App.screen.width / 2;
    finalText.y = App.screen.height / 2;
    this.container.addChild(finalText);

    // After 3s, show credits
    setTimeout(() => this.showCredits(), 3000);
  }

  showCredits() {
    this.container.removeChildren();
    const credits = [
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
    ];

    const creditsText = new PIXI.Text(credits.join('\n'), {
      fontSize: 20, fill: 0xFFFFFF, align: 'center'
    });
    creditsText.anchor.set(0.5);
    creditsText.x = App.screen.width / 2;
    creditsText.y = App.screen.height + 200; // Start below screen
    this.container.addChild(creditsText);

    // Scroll up
    gsap.to(creditsText, { y: -creditsText.height, duration: 15, ease: 'none', onComplete: () => {
      this.showMainMenuButton();
    }});
  }

  showMainMenuButton() {
    const btn = new PIXI.Graphics();
    btn.beginFill(0x444488);
    btn.drawRoundedRect(App.screen.width / 2 - 100, App.screen.height / 2, 200, 50, 8);
    btn.endFill();
    btn.interactive = true;
    btn.on('pointerdown', () => SceneManager.navigateTo('mainMenu'));

    const btnText = new PIXI.Text('العودة للقائمة', { fontSize: 20, fill: 0xFFFFFF });
    btnText.anchor.set(0.5);
    btnText.x = App.screen.width / 2; btnText.y = App.screen.height / 2 + 25;
    this.container.addChild(btn, btnText);
  }
}
```

## Verification & Acceptance Criteria
- [ ] 5 ending scenes play sequentially with typewriter text (45ms/char)
- [ ] Each scene has appropriate background PIXI.Sprite
- [ ] Space/Click advances scenes with fade transition
- [ ] Final text "قصة أشرف... لم تنته بعد" displays for 3s
- [ ] Credits scroll over 15s with developer names
- [ ] "العودة للقائمة" button works after credits
- [ ] `completedGame` and `newGamePlus` flags saved
- [ ] New Game+ button appears on main menu after completion
- [ ] Skip cutscene (Escape) with confirm dialog
- [ ] Post-credits tease text: "...لكن مملكة الظلام لن تموت أبداً"
- [ ] Story movie mode accessible from main menu
