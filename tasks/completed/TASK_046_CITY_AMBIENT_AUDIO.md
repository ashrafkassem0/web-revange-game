# TASK_046 — CITY_AMBIENT_AUDIO

## Status
**Done.** `SFX.startCityAmbient` / `stopCityAmbient` in `sounds.js`; city starts after first gesture, stops on leave/pagehide; `portalWhoosh` on portals.

## Objective
Give the city hub a light ambient soundscape (plaza murmur / soft wind) using the existing `SFX` engine — pause-aware, mute-respecting, no new audio library.

## Depends on
- TASK_003 — done (`completed/TASK_003_SOUND_ENGINE.md`)
- TASK_012 — done (`completed/TASK_012_CITY_MAP_GENERATION.md`)

## Current Baseline
- City page has no ambient loop; forest uses weather/ambient via `sounds.js` / `SFX`
- `flags.audio` mute + volumes already persist

## Detailed Mechanics & User Stories

### Ambient bus
- On city load (after first user gesture if browser requires): start a low looping ambient (reuse forest plaza-safe clip or add one short loop under `game/sounds/` / existing assets)
- Volume: quieter than forest combat SFX; respect master/mute from TASK_003
- On `visibilitychange` hidden / page unload / `saveAndExit` / DV navigate: stop ambient

### Optional one-shots (≤3)
- Soft chime when completing a city quest
- Soft whoosh on portal E confirm (forest or south)
- Do **not** add per-NPC voice lines

### Out of scope
- Full city music score / dynamic day-night stems
- Spatial 3D audio
- Rebuilding the sound engine

## Implementation Hints
```javascript
// game/city/index.html — after shared.js + sounds if not already loaded
function startCityAmbient() {
  if (typeof SFX === 'undefined' || SFX.isMuted?.()) return;
  SFX.playAmbient?.('cityPlaza', { loop: true, volume: 0.25 });
}
function stopCityAmbient() {
  SFX.stopAmbient?.('cityPlaza');
}
window.addEventListener('pagehide', stopCityAmbient);
```

Wire `sounds.js` only if a city ambient helper is missing — prefer extending `SFX` like forest ambient.

## Verification & Acceptance Criteria
- [x] City plays a looping ambient that respects mute / volume settings
- [x] Ambient stops on leave (forest / DV / tab hide)
- [x] Optional quest/portal one-shots do not stack-spam
- [x] No new audio libraries; Arabic UI unchanged

