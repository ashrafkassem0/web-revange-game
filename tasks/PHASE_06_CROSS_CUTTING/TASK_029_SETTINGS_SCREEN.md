# TASK_029 — SETTINGS_SCREEN

## Objective
Add a compact **HTML/CSS settings** panel: master/SFX volume (wired to `sounds.js` / `SFX`), mute, and fullscreen — reachable from the **main menu** and **in-game pause**.

## Architecture (must follow)
- HTML overlay (like existing menu / forest pause UI), RTL Arabic
- Persist `localStorage` key e.g. `revenge_settings`
- Wire volume into existing Web Audio `SFX` module (gain multiplier) — there is no separate AudioManager yet; extend `sounds.js` with `SFX.setVolume(v)` / `SFX.setMuted(m)`
- **No Pixi**, no full key-rebinding suite required for this task

## Detailed Mechanics & User Stories

### Access
- Main menu (`game/index.html`): «الإعدادات» button
- In-game: Escape pause → «الإعدادات»

### Settings (keep focused)
| Setting | Control | Default | Behavior |
|---------|---------|---------|----------|
| Master / SFX volume | Range 0–100 | 80 | Scales `SFX` output gain |
| Mute | Toggle | Off | Forces volume 0; remembers prior level |
| Fullscreen | Toggle | Off | `requestFullscreen` / `exitFullscreen` |

### Optional (only if quick)
- Show FPS toggle (pairs with TASK_032)
- Music slider stub that no-ops until music exists

### Explicitly out of scope for this task
- Full key remapping matrix
- Multi-slot save manager UI (SaveManager already exists)
- Quality presets (see TASK_032)

### Persistence
```javascript
const DEFAULT_SETTINGS = {
  volume: 80,
  muted: false,
  fullscreen: false
};
// localStorage 'revenge_settings'
```

### Edge cases
- Apply volume on load before first SFX
- Fullscreen change via browser UI should update toggle (`fullscreenchange`)
- Mute while slider moves: unmute when user raises volume

## Implementation Hints
```javascript
// sounds.js
let masterGain = 0.8, muted = false;
function effectiveVolume(v) { return muted ? 0 : v * masterGain; }
SFX.setVolume = (pct) => { masterGain = pct / 100; };
SFX.setMuted = (m) => { muted = m; };
```

Shared modal partial can live in `shared.css` + small `settings.js` included from menu + forest.

## Verification & Acceptance Criteria
- [ ] Settings open from main menu and pause
- [ ] Volume / mute change audible SFX output
- [ ] Fullscreen toggle works
- [ ] Settings persist in localStorage
- [ ] HTML/CSS only — matches existing menu look
- [ ] Zero Pixi
