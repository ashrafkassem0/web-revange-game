# TASK_002 — SCENE_MANAGER

## Objective
Build a centralized scene routing/navigation system that handles transitions between all 5 game stages with loading screens, Pixi.js-powered fade effects, and state passing.

## Detailed Mechanics & User Stories

### Scene Registry
```javascript
const SCENES = {
  start:        { url: '../start/index.html',         label: 'المقدمة',   prereq: null,                  icon: '📖' },
  forest:       { url: '../forest/index.html',        label: 'الغابة',    prereq: 'completedIntro',      icon: '🌲' },
  city:         { url: '../city/index.html',          label: 'المدينة',   prereq: 'completedForest',     icon: '🏙️' },
  deathValley:  { url: '../death-valley/index.html',  label: 'وادي الموت',prereq: 'completedCity',       icon: '🏜️' },
  darkKingdom:  { url: '../dark-kingdom/index.html',  label: 'مملكة الظلام',prereq: 'completedDeathValley', icon: '🏰' },
  ending:       { url: '../ending/index.html',        label: 'النهاية',   prereq: 'completedGame',       icon: '🏆' }
};
```

### navigateTo(sceneId, params)
1. Call current scene's `onExit()` → returns state object
2. Fade out via Pixi.js overlay (800ms, PIXI.AlphaFilter)
3. Show loading screen HTML overlay
4. Load target scene HTML + JS (dynamic `<script>` injection or page navigation)
5. Call target scene's `onEnter(params)` with saved state
6. Fade in via Pixi.js overlay

### Loading Screen
- HTML `<div id="loading-screen">` overlaid on Pixi.js canvas
- Arabic "جاري التحميل..." with animated progress bar
- Random tip from pool (10 tips covering crafting, combat, survival)
- Tips are RTL Arabic strings

### Scene Lifecycle
```javascript
SceneManager.register('forest', {
  onEnter(params) {
    // Restore world state from maps.forest
    // Rebuild Pixi scene graph: tile sprites, entity sprites, effects
    // Position player sprite at saved coordinates
    // Restore day/night cycle, weather, enemy positions
  },
  onExit() {
    // Save current state via SaveManager
    // Clean up Pixi resources (destroy sprites, remove from containers)
  },
  onPause() {
    // Pause game loop timers
    // Disable input
    // Show pause menu (Pixi overlay container)
  },
  onResume() {
    // Resume game loop
    // Re-enable input
  }
});
```

### Transition Effects (Pixi.js)
```javascript
// Fade transition using PIXI.AlphaFilter on a full-screen overlay sprite
const overlay = new PIXI.Sprite(PIXI.Texture.WHITE);
overlay.tint = 0x000000;
overlay.alpha = 0;
LAYERS.overlay.addChild(overlay);

async function fadeOut(duration = 800) {
  return new Promise(resolve => {
    const ticker = (delta) => {
      overlay.alpha = Math.min(1, overlay.alpha + delta * 0.001 * (1000/duration));
      if (overlay.alpha >= 1) { App.ticker.remove(ticker); resolve(); }
    };
    App.ticker.add(ticker);
  });
}
```

### History Stack
- Track last 3 scenes in `sessionStorage`
- Right-click or `B` key → `SceneManager.back()` → navigate to `history.pop()`
- History entries: `[{ sceneId, params }]`

### Locked Scenes
- If scene prereq not met, show PIXI overlay with lock icon + "غير متاح بعد" + condition text
- Use `PIXI.Text` with Arabic font and red tint

### Edge Cases
- **Direct URL Access:** Guard at top of each scene's JS: if prereq not met, `SceneManager.navigateTo('mainMenu')` with notification toast
- **Tab Visibility:** `document.visibilitychange` → auto-pause via `onPause()`, auto-save via `SaveManager`
- **Double Navigation:** Debounce `navigateTo` calls (1s cooldown via `_transitioning` flag)
- **Broken Scene Load:** `script.onerror` → show error PIXI overlay "حدث خطأ في تحميل المشهد" + "العودة للقائمة" button

## Pixi.js Technical Implementation Hints
- Loading screen is HTML/CSS (not Pixi) — it overlays the canvas. The canvas can be hidden during transition.
- All transition effects use `PIXI.AlphaFilter`, `PIXI.BlurFilter` (for dream sequences), or container position animation.
- The main menu (`index.html`) is a separate HTML page without Pixi.js — only game scenes use Pixi.
- Scene cleanup: on `onExit()`, destroy all children of `LAYERS.ground`, `LAYERS.entities`, `LAYERS.effects` to prevent memory leaks. Use `container.removeChildren().forEach(c => c.destroy(true))`.

## Verification & Acceptance Criteria
- [ ] `navigateTo('city')` from forest → fade → loading screen → city scene renders via Pixi
- [ ] Returning from city to forest restores exact position and world state
- [ ] Direct URL to locked map redirects with notification
- [ ] Tab hide triggers pause + auto-save
- [ ] Lifecycle callbacks fire in correct order (onExit → onEnter)
- [ ] Back navigation (`B` key) returns to previous scene
- [ ] Loading screen shows tips
- [ ] Double-navigate prevented by debounce
- [ ] Broken scene shows error screen with return button
