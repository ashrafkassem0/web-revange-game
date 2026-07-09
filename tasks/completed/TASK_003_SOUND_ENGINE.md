# TASK_003 — SOUND_ENGINE

## Objective
Extend the existing Web Audio `SFX` module in `game/js/sounds.js` with volume, mute, and light ambient control — **not** a from-scratch `AudioManager` rewrite or a full music engine.

## Status
**Done.** Extended `SFX` with master/sfx/ambient volume, mute, ambient bus, visibility quieting, and HTML audio controls — no AudioManager rewrite.

## Detailed Mechanics & User Stories

### Extend `SFX` (same IIFE)
Add minimal state on the existing object:

```javascript
// Conceptual API — implement on SFX, do not replace the module
SFX.setMasterVolume(0..1)
SFX.setSfxVolume(0..1)
SFX.setAmbientVolume(0..1)
SFX.mute(true|false)          // or toggleMute()
SFX.isMuted()
// Optional: persist under GameState.flags.audio = { master, sfx, ambient, muted }
```

- Route all `playTone` / `noise` / rain gain through master × category gains (or multiply volumes at call sites).
- Keep procedural generation; no requirement for streamed music files in this task.

### Ambient (reuse rain + small additions)
- Forest weather (TASK_006) calls existing `SFX.startRain()` / `stopRain()` / `SFX.thunder()`.
- Optional soft wind/insects loop later — only if cheap (filtered noise loop like rain). Prefer one ambient bus gain so mute/volume applies.
- City: optional quiet loop later; stubs OK — do not block on city music.

### Mute & settings UI
- `M` key toggles mute (skip when typing in inputs; respect open modals if needed).
- Small HTML controls in forest HUD settings or pause area (and/or main menu): master + SFX sliders, mute checkbox.
- Labels Arabic: e.g. `الصوت`, `كتم الصوت`.
- Persist via `GameState.save('flags'…)` or a dedicated flag key already used by `GameState.save` default branch.

### Cooldowns (light touch)
- Optional: gate `arrow` / `sword` spam (e.g. 100ms / 300ms) inside those methods — only if combat feels noisy.

### Edge Cases
- First gesture: keep `getCtx()` resume behavior; optional overlay `انقر للصوت` only if browsers still block after current resume-on-play.
- No `AudioContext`: guard `getCtx` / methods so the game stays silent without throwing.
- Tab hidden: pause/stop rain loop and optionally skip new SFX; resume on visible.
- Do **not** require crossfade BGM between all five stages or spatial `PannerNode` for this task.

## Canvas 2D Implementation Hints
- Audio stays in `game/js/sounds.js`; forest/city call `SFX.*` from combat/UI as today.
- Volume UI = HTML overlay (forest HUD / city `#modal` pattern), not canvas-drawn knobs.
- Weather integration: `forest-main.js` (or a small `forest-weather.js`) calls `SFX.startRain` when rain state starts.

## Verification & Acceptance Criteria
- [x] All existing `SFX` methods still play after volume plumbing
- [x] Master / SFX (and ambient if present) sliders change loudness and persist across reload via GameState
- [x] Mute (`M` + UI) silences SFX and rain loop; unmute restores
- [x] `startRain` / `stopRain` / `thunder` still work and respect mute/ambient gain
- [x] No console errors when Web Audio is unavailable
- [x] Tab hide stops or quiets ambient rain; show resumes if weather still rainy
- [x] No full AudioManager class rewrite; file remains an extended `SFX` module
