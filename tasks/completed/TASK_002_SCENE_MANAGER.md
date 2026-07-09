# TASK_002 — SCENE_MANAGER

## Objective
Add a **thin scene router** on top of existing multi-page navigation (`navigateTo`, `SaveManager.mapUrlFor`, CSS `.fade-overlay`) — **not** an SPA `SceneManager` class with shared-renderer lifecycle or a single-page app shell.

## Status
**Done.** Thin multi-page scene router in `shared.js` (`SCENES`, `navigateToScene`, `guardSceneAccess`, nav debounce). No SPA SceneManager.

## Detailed Mechanics & User Stories

### Scene registry (URL map only)
Extend or wrap `mapUrlFor` with a small registry object (same file or a tiny helper in `shared.js`):

```javascript
const SCENES = {
  menu:   { url: 'index.html',          label: 'القائمة',   prereq: null },
  start:  { url: 'start/index.html',    label: 'المقدمة',   prereq: null },
  forest: { url: 'forest/index.html',   label: 'الغابة',    prereq: 'completedIntro' },
  city:   { url: 'city/index.html',     label: 'المدينة',   prereq: 'completedForest' }
  // deathValley / darkKingdom: stub URLs later — mapUrlFor already falls back to forest
};
```

Relative paths from each page stay as today (`../city/index.html` from forest, etc.). Prefer resolving via `mapUrlFor` + a `navigateToScene(sceneId)` helper that picks the correct relative href from the current page.

### `navigateToScene(sceneId)` flow
1. Persist: caller / helper invokes `GameState.autoSave(true)` or forest `saveForestProgress()` / city inventory save
2. Optional prereq check against `GameState` progress flags
3. Fade: existing `.fade-overlay` + `active` (~800ms) via `navigateTo(url)`
4. Full page load of target HTML (each page owns its own canvas + modules)
5. Target init restores from `GameState` / `maps.*` (already true for forest-save / city)

**Do not** implement `onEnter`/`onExit` scene classes that own a shared renderer across pages.

### Loading affordance (lightweight)
- Optional HTML `#loading-screen` or reuse existing city/forest load labels (`جاري تحميل الخريطة…`)
- Short Arabic tip line is fine; keep it simple — no heavy progress simulation required
- Tips RTL; pool can be small (3–5 strings)

### Pause / visibility (per page, not a global SceneManager)
- Forest already has `gamePaused` / menus; on `visibilitychange` → pause forest loop + `GameState.autoSave(true)`
- City: pause rAF draw if needed + save inventory
- Debounce navigation: `_transitioning` flag ~1s so double-clicks on portal / Continue do not stack `location` changes

### Locked scenes
- If `prereq` unmet (e.g. open city URL before `completedForest`), show toast/modal `غير متاح بعد` and `navigateTo` back to forest or menu
- Style like city `#modal`

### History (optional, thin)
- Push last 1–3 scene ids into `sessionStorage`
- Optional `B` only where it does not conflict with forest **build mode** (`B` already toggles build in `forest-main.js`). Prefer menu Back / explicit UI over stealing `B` in forest.

### Edge Cases
- Direct URL to locked map → redirect + Arabic notice
- Broken load → simple HTML message `حدث خطأ في تحميل المشهد` + button to menu (only if you add a boot guard; do not over-engineer)
- Death Valley / Dark Kingdom not built: keep `mapUrlFor` stubs; do not create fake pages in this task

## Canvas 2D Implementation Hints
- Each scene HTML owns Canvas 2D + `requestAnimationFrame` (`forest-main.js`, city inline script).
- Transitions: `game/js/shared.js` → `navigateTo` + `game/css/shared.css` → `.fade-overlay`.
- Cleanup before navigate: forest should cancel rAF / clear timers in the same places that already call `saveForestProgress` then `navigateTo`.
- Loading UI is DOM overlay — never a second WebGL stage or shared app shell.

## Verification & Acceptance Criteria
- [x] `navigateTo` / `navigateToScene('city')` from forest fades then loads `game/city/index.html`
- [x] Return forest ↔ city restores inventory + forest snapshot via existing save path
- [x] Prereq guard blocks city (or shows lock) when `completedForest` is false (if guard added)
- [x] Tab hide in forest pauses gameplay and triggers auto-save
- [x] Double portal / Continue clicks do not double-navigate (debounce)
- [x] No SPA SceneManager class; no shared cross-page renderer lifecycle
- [x] `mapUrlFor` remains the single source of map → URL mapping
