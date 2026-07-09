# TASK_017 — CITY_PORTAL_INTEGRATION

## Objective
Fully integrate the city with the forest portal system and Death Valley gate, ensuring seamless bidirectional travel with Pixi.js visual effects.

## Detailed Mechanics & User Stories

### Forest → City Portal (existing, refine)
- Portal location: forest south end (1600, 3080), glowing stone archway
- Visual: `PIXI.AnimatedSprite` with 4-frame glow cycle, `PIXI.ParticleContainer` with blue/gold sparkles floating upward
- Press E → dialogue panel (PIXI.Container) with "اذهب إلى المدينة" / "البقاء في الغابة"
- On confirm: save forest state, `SceneManager.navigateTo('city')`

### City → Forest North Gate
- Location: top-center of city map
- Same visual style as forest portal
- Press E → "العودة إلى الغابة"
- Save city state, navigate back. Player appears at forest portal position.

### City → Death Valley South Gate
- Location: bottom-center of city map
- Initially: chained gate (PIXI.Sprite chain overlay) with pulsing red glow
- Locked state: E shows "الطريق إلى وادي الموت مغلق" with condition hint "أكمل مهام المدينة أولاً"
- After Quest 3 completion: chains break animation (chain sprites fall + particle burst), gate swings open
- Open state: E → "اذهب إلى وادي الموت" → save → `SceneManager.navigateTo('deathValley')`

### Transition Screen
- `PIXI.AlphaFilter` fade to black (800ms)
- Loading overlay: "جاري عبور البوابة..." (PIXI.Text)
- Load target scene → fade in

### State Handoff
```javascript
// Forest → City
GameState.saveForestState({ position: {x, y}, enemies, resources, ... });
SceneManager.navigateTo('city', { arriveAt: 'north_gate' });

// City → Forest
GameState.save('cityState', { completedQuests, spokenNpcs, ... });
SceneManager.navigateTo('forest', { arriveAt: 'city_portal' });
```

### Edge Cases
- **Portal Blocked in Combat:** If enemies within 200px, E does nothing. "لا يمكنك المغادرة أثناء المعركة!" notification.
- **Double Activation:** Debounce portal interaction (1s cooldown). `_portalCooldown` flag.
- **Death Valley Locked:** South gate shows chain visual + locked message. After unlock, chain sprite removed permanently.
- **Return Travel:** Portal visual same both ways. Player agency always respected (never forced).

## Pixi.js Technical Implementation Hints
```javascript
class Portal extends PIXI.Container {
  constructor(x, y, type) {
    super();
    this.x = x; this.y = y;
    this.type = type; // 'forest_city' | 'city_forest' | 'city_deathvalley'

    // Archway sprite
    const arch = new PIXI.Sprite(PIXI.Texture.from('portal_arch.png'));
    arch.anchor.set(0.5);
    this.addChild(arch);

    // Glow effect (animated sprites)
    this.glow = new PIXI.AnimatedSprite(glowFrames);
    this.glow.anchor.set(0.5);
    this.glow.animationSpeed = 0.05;
    this.glow.play();
    this.addChild(this.glow);

    // Sparkle particles
    this.particles = new PIXI.ParticleContainer(50, {
      position: true, alpha: true, scale: true
    });
    for (let i = 0; i < 20; i++) {
      const spark = new PIXI.Graphics();
      spark.beginFill(0x88CCFF, 0.8);
      spark.drawCircle(0, 0, 2);
      spark.endFill();
      spark.x = Math.random() * 60 - 30;
      spark.y = Math.random() * 120 - 60;
      spark.vx = (Math.random() - 0.5) * 0.5;
      spark.vy = -Math.random() * 0.5;
      this.particles.addChild(spark);
    }
    this.addChild(this.particles);

    // If gate is locked (death valley before completion)
    if (type === 'city_deathvalley' && !GameState.load('completedCity')) {
      this.locked = true;
      this.chainOverlay = new PIXI.Sprite(PIXI.Texture.from('chain.png'));
      this.chainOverlay.anchor.set(0.5);
      this.addChild(this.chainOverlay);
    }
  }

  unlock() {
    this.locked = false;
    // Chain break animation
    if (this.chainOverlay) {
      // Fall + fade out
      gsap.to(this.chainOverlay, { y: 100, alpha: 0, duration: 0.5, onComplete: () => {
        this.removeChild(this.chainOverlay);
        this.chainOverlay.destroy();
      }});
    }
  }

  update(dt) {
    // Animate sparkles
    this.particles.children.forEach(spark => {
      spark.x += spark.vx;
      spark.y += spark.vy;
      spark.alpha -= 0.01;
      if (spark.alpha <= 0) {
        spark.x = Math.random() * 60 - 30;
        spark.y = 30;
        spark.alpha = 0.8;
        spark.vy = -(Math.random() * 0.5 + 0.2);
      }
    });
  }
}
```

## Verification & Acceptance Criteria
- [ ] Forest portal opens city scene with correct arrival position
- [ ] City north gate returns to forest at correct position
- [ ] State persists correctly on round trip (inventory, position, world state)
- [ ] Portal visual effects (glow, sparkles) display via Pixi.js
- [ ] Fade transition plays (800ms)
- [ ] Portal blocked during combat with notification
- [ ] Debounce prevents double activation
- [ ] South gate chains visual until city completion
- [ ] South gate unlock animation (chains break)
- [ ] Death Valley navigation works after unlock
