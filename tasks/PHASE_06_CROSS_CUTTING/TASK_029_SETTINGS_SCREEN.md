# TASK_029 — SETTINGS_SCREEN

## Objective
Build a comprehensive settings screen accessible from main menu and in-game pause menu, using HTML/CSS for the menu overlay.

## Detailed Mechanics & User Stories

### Access Paths
- Main menu: "الإعدادات" button
- In-game: Escape → Pause menu → "الإعدادات" button

### Settings Categories (Tabbed)

**🎵 الصوت (Audio)**
| Setting | Type | Range | Default |
|---------|------|-------|---------|
| Master Volume | Slider | 0-100 | 80 |
| Music Volume | Slider | 0-100 | 70 |
| SFX Volume | Slider | 0-100 | 90 |
| Ambient Volume | Slider | 0-100 | 60 |
| Test Sound | Button | — | Plays click SFX |

**🎮 التحكم (Controls)**
| Setting | Type | Default |
|---------|------|---------|
| Move Up | Key | W |
| Move Down | Key | S |
| Move Left | Key | A |
| Move Right | Key | D |
| Interact | Key | E |
| Attack | Key | Space |
| Craft | Key | F |
| Use Item | Key | Q |
| Fish | Key | R |
| Weapon 1 | Key | 1 |
| Weapon 2 | Key | 2 |
| Inventory | Key | I |
| Skill Tree | Key | K |
| Pause | Key | Escape |
| Reset Defaults | Button | — |

Key remapping: Click key → press new key → validate no conflicts → save

**🖥️ العرض (Display)**
| Setting | Type | Range | Default |
|---------|------|-------|---------|
| Zoom Level | Slider | 1.0-2.5 | 1.5 |
| Fullscreen | Toggle | On/Off | Off |
| Quality | Dropdown | Low/Medium/High | High |
| Show FPS | Toggle | On/Off | Off |

**💾 الحفظ (Save)**
- Show current save slot info (level, play time, map)
- Save to Slot 1 / Slot 2 buttons
- Load from Slot 1 / Slot 2 buttons (with warning)
- Delete Save (with confirmation)

### Settings Persistence
```javascript
const DEFAULT_SETTINGS = {
  audio: { master: 80, music: 70, sfx: 90, ambient: 60 },
  controls: { moveUp: 'W', moveDown: 'S', moveLeft: 'A', moveRight: 'D', interact: 'E', attack: ' ', craft: 'F', useItem: 'Q', fish: 'R', weapon1: '1', weapon2: '2', inventory: 'I', skillTree: 'K', pause: 'Escape' },
  display: { zoom: 1.5, fullscreen: false, quality: 'high', showFps: false }
};
```
- Saved to `localStorage` under `revenge_settings`
- Loaded on game start, applied to game systems

### Edge Cases
- **Key Conflict:** If player remaps to an already-used key, show "هذا المفتاح مستخدم بالفعل" and don't apply
- **Low Quality:** Disable particles, reduce shadow, simplify water. Auto-detect if FPS < 20.
- **Fullscreen:** `document.documentElement.requestFullscreen()`, handle `fullscreenchange` event

## Implementation Hints
- HTML/CSS overlay — simpler for form elements
- CSS: `position: fixed`, `z-index: 2000`, `overflow-y: auto`, RTL alignment
- Tabs via `<div>` with `data-tab` attributes + CSS `display: none/block`
- Sliders: `<input type="range">` with event listeners
- Key binding: `keydown` listener, capture `event.code`, check conflicts

## Verification & Acceptance Criteria
- [ ] Settings accessible from main menu and in-game pause
- [ ] Volume sliders affect AudioManager correctly and persist
- [ ] Key remapping works with conflict detection
- [ ] Reset defaults restores all settings
- [ ] Zoom slider updates Canvas 2D camera zoom
- [ ] Fullscreen toggle works
- [ ] Quality setting reduces particles and effects
- [ ] Save/load slot management works with confirmation
- [ ] Delete save with "هل أنت متأكد؟" confirmation
- [ ] All settings persist across sessions
