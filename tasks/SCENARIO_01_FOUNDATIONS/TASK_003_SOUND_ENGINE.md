# TASK_003 — SOUND_ENGINE

## Objective
Upgrade `game/js/sounds.js` from individual SFX functions to a full audio manager with music, ambient loops, volume control, and cross-scene persistence using Web Audio API.

## Detailed Mechanics & User Stories

### AudioManager Singleton
```javascript
class AudioManager {
  constructor() { ... }     // Create AudioContext, gain nodes
  play(id) { ... }           // Play SFX by id
  stop(id) { ... }           // Stop specific sound
  stopAll() { ... }          // Stop all sounds
  setVolume(category, vol) { ... }  // category: 'master'|'sfx'|'music'|'ambient'
  crossfadeMusic(from, to, duration) { ... }
}
```

### Audio Categories
Each with independent volume (0.0–1.0):
- **Master:** Global volume multiplier
- **SFX:** Sound effects (sword, arrow, hit, click, thunder)
- **Music:** Background music per scene
- **Ambient:** Environmental loops (rain, wind, insects, crowd)

### Music System
- Each scene has a theme: forest (calm exploration), city (market hustle), death valley (tense drums), dark kingdom (dark orchestral), boss (epic battle)
- Music crossfades over 2 seconds on scene transition
- Music loops seamlessly (loop points)
- Generated via oscillators OR preloaded audio buffers (prefer buffers for quality)

### Ambient Loops
- Forest: birds, wind through leaves, insects
- City: crowd murmur, merchants calling, distant hammering
- Death Valley: howling wind, sand rustling
- Dark Kingdom: chains rattling, low growls, distant screams

### Spatial Audio (Simple 2D)
- Audio panner: pan left/right based on entity's screen position relative to player
- `PannerNode` with `coneOuterGain` for directional sounds
- Volume falloff with distance (linear, max range = 400px)

### SFX Pool
- Pre-create 5 oscillator/noise buffer slots
- Reuse from pool instead of creating new nodes every time
- Prevents garbage collection stutter

### Sound Cooldown
- Prevent SFX spam: arrow shots limited to 1 per 100ms, sword swings 1 per 300ms

### Edge Cases
- **AudioContext Resume:** Chrome auto-suspends. On any user interaction (click, keypress), call `audioCtx.resume()`. Show "انقر للصوت" overlay until first interaction.
- **Unsupported Audio:** `if (!window.AudioContext) { this._disabled = true; }` — game runs silently, no errors.
- **Tab Background:** Pause ambient + music when tab hidden (Page Visibility API). Resume on show.

## Pixi.js Integration Notes
- Pixi.js does not provide audio. Keep `AudioManager` as a standalone module.
- Scene `onEnter()` calls `AudioManager.playMusic('forest_theme')`, `AudioManager.playAmbient('forest_ambient')`.
- Scene `onExit()` calls `AudioManager.crossfadeMusic('forest_theme', 'city_theme', 2000)`.

## Verification & Acceptance Criteria
- [ ] All existing SFX play through new AudioManager
- [ ] Music crossfades between scenes (2s transition)
- [ ] Ambient loops play per scene and stop on transition
- [ ] Volume sliders for all 4 categories work and persist via SaveManager
- [ ] Global mute works (M key toggle + settings toggle)
- [ ] AudioContext resumes on first user interaction
- [ ] No console errors in browsers without AudioContext
- [ ] SFX pool prevents GC stutter during rapid combat
- [ ] Tab pause stops audio, resume restarts
