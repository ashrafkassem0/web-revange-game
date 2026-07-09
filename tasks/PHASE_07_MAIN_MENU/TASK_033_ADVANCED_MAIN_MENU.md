# TASK_033 — ADVANCED_MAIN_MENU

## Objective
Enhance `game/index.html` with a **settings** entry, **map select for unlocked stages**, and a **completion badge**. New Game+ is **not** required.

## Architecture (must follow)
- HTML/CSS/JS on the existing main menu (particles / vignette already there)
- Navigation via `SaveManager.mapUrlFor(stage)` + `GameState` progress flags
- Stages today: intro → forest → city; later deathValley / darkKingdom / ending when built (mapUrlFor currently stubs DV/DK → forest — update as pages ship)
- **No Pixi**

## Detailed Mechanics & User Stories

### Keep existing
- Title «الانتقام» / «قصة أشرف»
- «لعبة جديدة» / «متابعة اللعب»
- Version footer

### Add
1. **الإعدادات** — opens TASK_029 panel
2. **اختيار الخريطة** (if any non-forest stage unlocked) — list/cards:
   - 🌲 الغابة — always after intro
   - 🏙 المدينة — if `completedForest` / city unlocked
   - 🏜 وادي الموت — when DV page exists + unlocked
   - 🏰 مملكة الظلام — when DK unlocked
   - Locked stages show 🔒 and are not clickable
3. **Completion badge** — if `completedGame`: trophy + «القصة مكتملة!»
4. **الإنجازات** — opens TASK_031 list (if present)
5. Optional: «عرض النهاية» → `ending/index.html` when completed

### Explicitly out of scope
- New Game+ campaign
- Full story-movie mode chaining every cutscene (optional later)
- Parallax mouse background (nice-to-have only)

### Edge cases
- First launch / no save → intro (`start/index.html`) as today
- Guest auth banner only if TASK_037 auth UI exists

## Implementation Hints
```javascript
const stages = [
  { id: 'forest', label: 'الغابة', unlock: () => true },
  { id: 'city', label: 'المدينة', unlock: () => GameState.load('completedForest') },
  { id: 'darkKingdom', label: 'مملكة الظلام', unlock: () => GameState.load('unlockedDarkKingdom') }
];
// location.href = SaveManager.mapUrlFor(id)
```

## Verification & Acceptance Criteria
- [ ] Settings button works
- [ ] Map select shows only unlocked stages; locked are disabled
- [ ] Completion badge when `completedGame`
- [ ] Continue / New Game still work
- [ ] No NG+ requirement
- [ ] HTML/CSS menu — zero Pixi
