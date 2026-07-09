# TASK_002 — SCENE_MANAGER

## Objective
Build a centralized scene routing/navigation system that handles transitions between all 5 game stages with loading screens, CSS fade overlays, and state passing — extending the existing `navigateTo` in `shared.js`.

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
1. Call current scene's `onExit()` → returns state object (persist via SaveManager)
2. Fade out via existing CSS `.fade-overlay` (add `.active`, ~800ms — same as `shared.js`)
3. Show loading screen HTML overlay
4. Navigate to target scene HTML (`window.location.href` or enhanced router)
5. Target scene init / `onEnter(params)` restores saved state
6. Fade in: remove `.active` from `.fade-overlay` after load

### Loading Screen
- HTML `<div id="loading-screen">` overlaid on the game canvas / page
- Arabic "جاري التحميل..." with animated progress bar (CSS)
- Random tip from pool (10 tips covering crafting, combat, survival)
- Tips are RTL Arabic strings

### Scene Lifecycle
```javascript
SceneManager.register('forest', {
  onEnter(params) {
    // Restore world state from maps.forest
    // Rebuild entity arrays (trees, enemies, resources) for Canvas 2D draw
    // Position player at saved coordinates
    // Restore day/night cycle, weather, enemy positions
  },
  onExit() {
    // Save current state via SaveManager
    // Cancel rAF loop, clear timers, null large arrays to free memory
  },
  onPause() {
    // Pause game loop timers / skip update when paused flag set
    // Disable input
    // Show pause menu (HTML overlay, like city modals)
  },
  onResume() {
    // Resume game loop
    // Re-enable input
  }
});
```

### Transition Effects (CSS fade-overlay)
```javascript
// Extend existing navigateTo in shared.js
function navigateTo(page) {
  const overlay = document.querySelector('.fade-overlay');
  if (overlay) {
    overlay.classList.add('active');
    setTimeout(() => {
      window.location.href = page;
    }, 800);
  } else {
    window.location.href = page;
  }
}

// Optional: dream / soft transition via CSS filter on overlay
// .fade-overlay.dream { backdrop-filter: blur(4px); }
```

### History Stack
- Track last 3 scenes in `sessionStorage`
- Right-click or `B` key → `SceneManager.back()` → navigate to `history.pop()`
- History entries: `[{ sceneId, params }]`

### Locked Scenes
- If scene prereq not met, show HTML overlay with lock icon + "غير متاح بعد" + condition text
- Style with existing shared CSS / modal pattern (city `#modal`)

### Edge Cases
- **Direct URL Access:** Guard at top of each scene's JS: if prereq not met, `SceneManager.navigateTo('mainMenu')` with notification toast
- **Tab Visibility:** `document.visibilitychange` → auto-pause via `onPause()`, auto-save via `SaveManager`
- **Double Navigation:** Debounce `navigateTo` calls (1s cooldown via `_transitioning` flag)
- **Broken Scene Load:** On load failure → show HTML error overlay "حدث خطأ في تحميل المشهد" + "العودة للقائمة" button

## Canvas 2D Implementation Hints
- Loading screen is HTML/CSS — it overlays the canvas. The canvas can be hidden during transition.
- All page transitions use the existing `.fade-overlay` in `shared.css` / `navigateTo` in `shared.js`. Soft/dream effects can use CSS `backdrop-filter` or opacity on the same overlay.
- The main menu (`index.html`) and game scenes are separate HTML pages; each scene owns its Canvas 2D context and modules (`forest-main.js`, etc.).
- Scene cleanup: on `onExit()`, cancel `requestAnimationFrame`, clear interval timers, and drop references to large world arrays so GC can reclaim memory before navigation.

## Verification & Acceptance Criteria
- [ ] `navigateTo('city')` from forest → fade → loading screen → city scene renders
- [ ] Returning from city to forest restores exact position and world state
- [ ] Direct URL to locked map redirects with notification
- [ ] Tab hide triggers pause + auto-save
- [ ] Lifecycle callbacks fire in correct order (onExit → onEnter)
- [ ] Back navigation (`B` key) returns to previous scene
- [ ] Loading screen shows tips
- [ ] Double-navigate prevented by debounce
- [ ] Broken scene shows error screen with return button
