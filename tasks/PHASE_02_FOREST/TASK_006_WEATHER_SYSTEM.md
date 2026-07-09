# TASK_006 — WEATHER_SYSTEM

## Objective
Add a forest weather system as **plain JS particle arrays + `ctx` drawing** in the forest loop, integrated with day/night darkness and existing `SFX.startRain` / `stopRain` / `thunder`.

## Status
**Not implemented in forest gameplay** (rain SFX exists; start scene has CSS rain only). This task adds runtime weather to the forest map.

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
// e.g. in forest-weather.js or section of forest-main.js
particles: [{ x, y, vx, vy, len }, ...]  // screen-space or world+camera
// each frame: update positions, wrap; draw with ctx.stroke thin lines
```

### Fog
- Semi-transparent grey `fillRect` over viewport, alpha eased in/out
- Combine with `computeDarkness` (night + fog = darker); campfire lights still help via existing overlay

### Storm FX
- Flash: short full-viewport white `fillRect` alpha decay
- Thunder: `SFX.thunder()` with 0–2s delay after flash
- Shake: temporary offset on `camera` or draw translation for <0.5s

### Scheduling
- Timer in forest update: roll next weather after duration; fade alphas 1–2s between states
- Pause: do not advance weather timers when `gamePaused`
- Persist optional: `maps.forest.weather = { state, remainingMs }` in snapshot

### HUD
- Small icon near clock (`☀️` / `🌧️` / `🌫️` / `⛈️`) in forest HUD HTML

### Integration
- Start/stop `SFX.startRain` / `stopRain` when entering/leaving rainy states; respect TASK_003 mute
- Do not require torch fuel 2× unless player torch exists from TASK_005

## Canvas 2D Implementation Hints
- Prefer new `game/js/forest-weather.js` included from `game/forest/index.html`, updated/drawn from `forest-main.js` after world / before or after night overlay (rain usually after world, flash last).
- Day/night: `forest-time.js` `drawNightOverlay`; weather fog can draw just before/after it.
- Audio: `game/js/sounds.js` — reuse rain loop + thunder; do not fork SFX.
- Keep counts in the 50–150 range; reuse one particles array (clear/rebuild on state change).

## Verification & Acceptance Criteria
- [ ] Weather cycles Clear → rain/fog/storm without breaking the rAF loop
- [ ] Rain uses JS particles + `ctx` strokes at ~50–150 count
- [ ] Heavy rain / storm starts rain SFX; clear/fog stops it
- [ ] Storm shows flash + thunder + brief shake
- [ ] Fog visibly reduces contrast and stacks with night darkness
- [ ] Weather pauses while menus pause the game
- [ ] HUD weather icon updates
- [ ] Low-FPS path can reduce particle count toward ~50
