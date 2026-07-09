# TASK_030 — MOBILE_TOUCH_CONTROLS

## Objective
Add a **virtual joystick + 3–4 action buttons** as an HTML overlay on the game canvas for touch devices. Match forest controls; keep the button count small.

## Architecture (must follow)
- HTML/CSS overlay on `game/forest/index.html` (and later dark-kingdom / boss)
- Auto-show when `ontouchstart` / `maxTouchPoints > 0` (or settings toggle)
- Map touches to the same actions keyboard already uses (move, attack, interact, item)
- **No Pixi**

## Detailed Mechanics & User Stories

### Layout
```
┌─────────────────────────────┐
│         Canvas 2D           │
│  (joystick)     [⚔][E][Q]  │
│   bottom-left   bottom-right│
└─────────────────────────────┘
```

### Controls (3–4 buttons max)
| Control | Action |
|---------|--------|
| Joystick | Move (WASD equivalent) |
| Attack | Sword / current weapon (Space) |
| Interact | E |
| Use item | Q |
| Optional 4th | Bow toggle or inventory |

Do **not** ship a 9-button craft/fish/build/skill cluster.

### Joystick
- Bottom-left; knob clamped to ~50px radius; dead zone ~15px
- Track `touch.identifier` so joystick + buttons work together
- `touchend` → stop movement

### Settings
- Toggle «إظهار أزرار اللمس» in TASK_029 settings (or local flag)

### Edge cases
- Desktop + touch: both work
- `preventDefault` on buttons to avoid scroll/zoom
- Portrait: slightly smaller hit targets via `vh`/`vw`

## Implementation Hints
```html
<div id="touch-controls" class="hidden">
  <div id="joystick-zone"><div id="joystick-knob"></div></div>
  <div id="touch-actions">
    <button data-action="attack">⚔️</button>
    <button data-action="interact">E</button>
    <button data-action="useItem">Q</button>
  </div>
</div>
```

Feed into existing key/input state object used by forest-main (set `keys.w` etc. or `player.vx/vy`).

## Verification & Acceptance Criteria
- [ ] Touch devices show joystick + 3–4 buttons
- [ ] Joystick moves the player; dead zone works
- [ ] Attack / interact / use-item fire correctly
- [ ] Multi-touch: move + attack together
- [ ] Can hide via setting
- [ ] Zero Pixi; HTML overlay only
