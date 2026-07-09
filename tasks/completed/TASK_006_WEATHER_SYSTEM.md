# TASK_006 — WEATHER_SYSTEM

## Objective
Add a forest weather system as **plain JS particle arrays + `ctx` drawing** in the forest loop, integrated with day/night darkness and existing `SFX.startRain` / `stopRain` / `thunder`.

## Status
**Done.** Runtime weather in `game/js/forest-weather.js`: clear / light–heavy rain / fog / storm, HUD icon, pause-aware timers, optional snapshot persist, FPS particle clamp.

## Detailed Mechanics & User Stories

### Weather states (keep scope realistic)
| State | Duration (real) | Particles | Gameplay |
|-------|-----------------|-----------|----------|
| Clear | 3–8 min | 0 | Default |
| Light rain | 2–4 min | ~50–80 drops | Slight move slow optional (−5%) |
| Heavy rain | 1–3 min | ~100–150 drops | −10% speed; call `SFX.startRain` |
| Fog | 1–3 min | 0 particles + soft fill | Extra veil; slightly stronger effective darkness |
| Storm | 30–90 s | ~120–150 drops | Rain + `SFX.thunder` + brief white flash + light camera shake |

**Particle budget:** target **~50–150** on screen (not 300+). If FPS dips, clamp toward 50.

### Rain particles
```javascript
// forest-weather.js
particles: [{ x, y, vx, vy, len }, ...]  // screen-space
// each frame: update positions, wrap; draw with ctx.stroke thin lines
```

### Fog
- Semi-transparent grey `fillRect` over viewport, alpha eased in/out
- Combine with `computeDarkness` (night + fog = darker); campfire lights still help via existing overlay

### Storm FX
- Flash: short full-viewport white `fillRect` alpha decay
- Thunder: `SFX.thunder()` with 0–2s delay after flash
- Shake: temporary offset on `camera` for <0.5s

### Scheduling
- Timer in forest update: roll next weather after duration; fade alphas ~1–2s between states
- Pause: do not advance weather timers when menus / `gamePaused` / build
- Persist: `maps.forest.snapshot.weather = { state, remainingMs }`

### HUD
- Small icon near clock (`#weatherIcon`) in forest HUD HTML

### Integration
- Start/stop `SFX.startRain` / `stopRain` when entering/leaving rainy states; respect TASK_003 mute
- Player speed mul via `getWeatherSpeedMul()` (no torch fuel change)

## Canvas 2D Implementation Hints
- `game/js/forest-weather.js` included from `game/forest/index.html`, updated/drawn from `forest-main.js` after night overlay (flash last).
- Day/night: `forest-time.js` `drawNightOverlay` + `getWeatherFogBoost()`.
- Audio: `game/js/sounds.js` — reuse rain loop + thunder; do not fork SFX.

## Verification & Acceptance Criteria
- [x] Weather cycles Clear → rain/fog/storm without breaking the rAF loop
- [x] Rain uses JS particles + `ctx` strokes at ~50–150 count
- [x] Heavy rain / storm starts rain SFX; clear/fog stops it
- [x] Storm shows flash + thunder + brief shake
- [x] Fog visibly reduces contrast and stacks with night darkness
- [x] Weather pauses while menus pause the game
- [x] HUD weather icon updates
- [x] Low-FPS path can reduce particle count toward ~50
