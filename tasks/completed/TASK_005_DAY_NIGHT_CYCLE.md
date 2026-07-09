# TASK_005 — DAY_NIGHT_CYCLE

## Objective
Polish the existing forest day/night system in `forest-time.js` / `forest-config.js` — close gameplay and UX gaps. Do **not** replace the clock, overlay, or wildlife manager with a parallel cycle.

## Status
**Done.** Clock pause on menus/build, persist `clockMinutes`/`dayCount`, player torch + stars + indoor soften, wildlife flag sync on load. `forest-time.js` remains the authority.

## Detailed Mechanics & User Stories

### Keep as-is
- Timing: `CFG.GAME_MIN_PER_REAL_SEC` (1 real sec ≈ 1 game minute → ~24 min full day), phase bounds `DAWN_START` / `DAY_START` / `DUSK_START` / `NIGHT_START`, `NIGHT_MAX_DARKNESS`
- Draw: `drawNightOverlay()` in `forest-time.js` called from the forest render path
- Lights: lit `campfire` + `hut` from `forest-build.js` → `getLightSources()` (+ player torch)
- Wildlife: `NIGHT_SPAWNS` / day cleanup via existing wildlife helpers
- Sleep advances clock through hut sleep menu (`forest-build.js`)

### Gaps closed
1. **Pause respect** — `isClockPaused()` + loop: no advance while `gamePaused` / craft / backpack / sleep / build.
2. **Persist time** — `clockMinutes` + `dayCount` in forest snapshot (`forest-save.js` / `maps.forest`).
3. **Player light** — fixed-radius torch in `getLightSources()` (`CFG.PLAYER_TORCH_*`).
4. **Stars** — cheap twinkling `ctx.arc` dots when darkness high (`CFG.STAR_COUNT`).
5. **Indoor** — soften overlay near hut / sleep menu (`CFG.INDOOR_DARKNESS_SCALE`).
6. Cycle timing left on CFG (no arbitrary redesign).

### Enemy / wildlife
- `syncNightWildlifeFlag()` after enemy restore; spawn/despawn still via `onDayNightPhaseChange`.

### Edge Cases
- Clock wrap at 1440 increments `dayCount`
- Load mid-night restores darkness and HUD phase text (`نهار` / `فجر` / `غسق` / `ليل`)

## Canvas 2D Implementation Hints
- Core files: `game/js/forest-time.js`, constants in `game/js/forest-config.js`, lights in `game/js/forest-build.js`, loop in `game/js/forest-main.js`.
- Overlay pattern already uses offscreen canvas + radial `destination-out` — extend `getLightSources()` rather than rewriting draw.
- HUD: update via `updateClockHUD()` DOM elements in forest HTML.

## Verification & Acceptance Criteria
- [x] Phases transition smoothly using existing CFG bounds; HUD shows correct Arabic phase + clock
- [x] Night overlay darkens and campfire/hut light holes remain visible
- [x] Clock does not advance while game is paused / blocking menus open
- [x] Time of day restores after save/reload and after city round-trip
- [x] Night wildlife spawn/despawn still works after polish
- [x] No second day/night module; `forest-time.js` remains the authority
