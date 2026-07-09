# TASK_005 — DAY_NIGHT_CYCLE

## Objective
Polish the existing forest day/night system in `forest-time.js` / `forest-config.js` — close gameplay and UX gaps. Do **not** replace the clock, overlay, or wildlife manager with a parallel cycle.

## Status
**Largely done.** In-game clock (`gameClock.minutes`), phases (`dawn|day|dusk|night`), `computeDarkness`, offscreen night canvas + `destination-out` lights via `getLightSources()`, HUD clock (`#clockTime` / phase labels), and night predator spawns already ship.

## Detailed Mechanics & User Stories

### Keep as-is
- Timing: `CFG.GAME_MIN_PER_REAL_SEC` (1 real sec ≈ 1 game minute → ~24 min full day), phase bounds `DAWN_START` / `DAY_START` / `DUSK_START` / `NIGHT_START`, `NIGHT_MAX_DARKNESS`
- Draw: `drawNightOverlay()` in `forest-time.js` called from the forest render path
- Lights: lit `campfire` + `hut` from `forest-build.js` → `getLightSources()`
- Wildlife: `NIGHT_SPAWNS` / day cleanup via existing wildlife helpers
- Sleep advances clock through hut sleep menu (`forest-build.js`)

### Gaps to close (this task)
1. **Pause respect** — when `gamePaused` / craft / backpack / sleep / build menus open, `updateDayNight(dt)` should not advance (or advance only if intentionally desired; default = pause clock).
2. **Persist time** — save/restore `gameClock.minutes` (+ `dayCount` if useful) inside forest snapshot (`forest-save.js` / `maps.forest`), not only structures.
3. **Player light (optional polish)** — if night feels too dark away from campfires, add a small player torch radius into `getLightSources()` (fixed radius, no full fuel economy required). Skip a complex stick-refuel system unless it stays tiny.
4. **Stars (optional)** — few twinkling `ctx.arc` dots when darkness high; keep cheap.
5. **Indoor** — when player is inside/near hut sleep or clearly “indoors”, optionally skip or soften night overlay (hut already contributes a light hole).
6. **Do not** change cycle to an arbitrary 12-minute real-time redesign that fights `CFG`; document and tune CFG instead if designers want faster nights.

### Enemy / wildlife
- Verify night predators spawn/despawn on phase change (`onDayNightPhaseChange`) without leaks.
- Day animals vs night predators: polish counts only; no new bat species required here (see TASK_010 if needed).

### Edge Cases
- Clock wrap at 1440 increments `dayCount`
- Load mid-night restores darkness and HUD phase text (`نهار` / `فجر` / `غسق` / `ليل`)

## Canvas 2D Implementation Hints
- Core files: `game/js/forest-time.js`, constants in `game/js/forest-config.js`, lights in `game/js/forest-build.js`, loop in `game/js/forest-main.js`.
- Overlay pattern already uses offscreen canvas + radial `destination-out` — extend `getLightSources()` rather than rewriting draw.
- HUD: update via `updateClockHUD()` DOM elements in forest HTML.

## Verification & Acceptance Criteria
- [ ] Phases transition smoothly using existing CFG bounds; HUD shows correct Arabic phase + clock
- [ ] Night overlay darkens and campfire/hut light holes remain visible
- [ ] Clock does not advance while game is paused / blocking menus open
- [ ] Time of day restores after save/reload and after city round-trip
- [ ] Night wildlife spawn/despawn still works after polish
- [ ] No second day/night module; `forest-time.js` remains the authority
