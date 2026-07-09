# TASK_027 — ENDING_CUTSCENE

## Objective
Ship the emotional ending as an **HTML typewriter cutscene** page, same approach as `game/start/index.html`: **3–4 scenes** + credits. No cinematic engine, no Pixi.

## Architecture (must follow)
- New page: `game/ending/index.html`
- Pattern: background image/CSS + typewriter text + `.fade-overlay` (copy start page structure)
- Entered after Terror King victory (TASK_025)
- Sets `GameState` / save flags: `completedGame: true` (and related progress)
- Return button → `../index.html` main menu
- **No Pixi**, no Canvas required (optional tiny particle flourish only)

## Detailed Mechanics & User Stories

### Scenes (3–4 total)
1. **النهاية** — Ashraf over the fallen king; short line that revenge is done
2. **العودة** — Brief return home / through familiar lands (one paragraph)
3. **القبور** — At the family graves; places the crown / speaks forgiveness
4. **Optional fourth** — Rain stops / sun; «قصة أشرف... لم تنته بعد»

Advance: Space / click after typewriter finishes (or skip typewriter on second press — match start behavior).

### Credits
- Scrolling or static HTML list on black background (~10–15s or click-to-skip)
- Dev / thanks lines in Arabic
- Button: «العودة إلى القائمة الرئيسية»
- Optional one-line post-credits tease (sequel hint) — keep short

### Flags (no NG+ required)
```javascript
GameState.save('completedGame', true);
GameState.save('defeatedTerrorKing', true);
// Do NOT require newGamePlus — menu badge is enough (TASK_033)
```

### Edge cases
- Escape → confirm skip → jump to credits or menu
- Revisit: main menu can link «عرض النهاية» later (TASK_033) by reloading this page

## Implementation Hints
Mirror `game/start/index.html`:
- `#ending-text` typewriter ~40–50ms/char
- Scene list as JS array `{ bg, text }`
- CSS rain/vignette optional; prefer simple bg + fade

```html
<!-- game/ending/index.html -->
<div class="game-container">
  <div class="bg-image">...</div>
  <p id="ending-text" class="typewriter"></p>
  <div class="fade-overlay"></div>
</div>
```

## Verification & Acceptance Criteria
- [ ] `game/ending/index.html` plays 3–4 typewriter scenes
- [ ] Space/click advances with fade (like start)
- [ ] Credits + return to main menu
- [ ] `completedGame` (or equivalent) saved
- [ ] Skip with confirm works
- [ ] Zero Pixi; HTML/CSS/JS only like the intro
