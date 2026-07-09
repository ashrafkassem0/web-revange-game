# TASK_030 — MOBILE_TOUCH_CONTROLS

## Objective
Add responsive touch controls for mobile/tablet play with auto-detect, virtual joystick, and action buttons overlaying the Pixi.js canvas.

## Detailed Mechanics & User Stories

### Auto-Detect
```javascript
const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
if (isTouchDevice) showTouchControls();
```

### Touch Layout
```
┌──────────────────────────────────────┐
│                                      │
│        [Game Canvas - Pixi.js]       │
│                                      │
│                                      │
│   ╭──┐          [C] [F] [I] [K]    │
│   │  │          [Q] [1] [2] [B]    │
│   ╰──┘                    [🗡️/🏹]  │
│   Joystick              Action Btns │
└──────────────────────────────────────┘
  [Quickbar: 1-6 items horizontal]
```

### Virtual Joystick
- Size: 140×140px, bottom-left (10% from edge)
- Touchstart on zone → capture touch ID
- Touchmove → calculate direction vector from center (clamped to radius 50px)
- Touchend → reset to center, stop movement
- Dead zone: 15px (no accidental tiny movements)
- Visual: outer circle (semi-transparent) + inner knob (solid)

### Action Buttons
| Button | Position | Action |
|--------|----------|--------|
| ⚔️ Sword | Bottom-right | Melee attack |
| 🏹 Bow | Above sword | Toggle bow mode |
| E | Above attack | Interact |
| Q | Left of E | Use item |
| C | Top-right | Craft menu |
| F | Left of C | Fish (near water) |
| I | Below C | Inventory |
| K | Below I | Skill tree |
| B | Below K | Build mode |
| 1/2 | Left of Q | Quickbar slots |

### Bow Aiming (Touch)
- When bow equipped: tap right half of screen → aim reticle appears at tap position
- Second tap → shoot arrow at reticle
- Long press on enemy → lock target (same as right-click)

### Responsive Layout
- All positions in `%` not `px`
- `landscape`: joystick left, buttons right
- `portrait`: joystick left, buttons right (smaller)
- Button size: `min(8vh, 8vw)`

### Edge Cases
- **Multiple Touches:** Track touch IDs independently. Joystick uses first touch on left third. Buttons use touches on right two-thirds.
- **Desktop + Touch:** Both input methods work simultaneously
- **Hide Controls:** Settings toggle "إظهار أزرار اللمس"

## Implementation Hints
```html
<div id="touch-controls" class="hidden">
  <div id="joystick-zone">
    <div id="joystick-base">
      <div id="joystick-knob"></div>
    </div>
  </div>
  <div id="action-buttons">
    <button data-action="attack" class="touch-btn">⚔️</button>
    <button data-action="bow" class="touch-btn">🏹</button>
    <button data-action="interact" class="touch-btn">E</button>
    <button data-action="useItem" class="touch-btn">Q</button>
    <button data-action="craft" class="touch-btn">🔧</button>
    <button data-action="fish" class="touch-btn">🎣</button>
    <button data-action="inventory" class="touch-btn">🎒</button>
    <button data-action="skills" class="touch-btn">⭐</button>
    <button data-action="build" class="touch-btn">🏗️</button>
  </div>
</div>
```

### Touch to Game Input Mapping
```javascript
class TouchInput {
  constructor() {
    this.joystick = { active: false, touchId: null, dx: 0, dy: 0 };
    this.buttons = {};
    this.setupJoystick();
    this.setupButtons();
  }

  setupJoystick() {
    const zone = document.getElementById('joystick-zone');
    const knob = document.getElementById('joystick-knob');

    zone.addEventListener('touchstart', (e) => {
      this.joystick.active = true;
      this.joystick.touchId = e.changedTouches[0].identifier;
      this.updateJoystick(e);
    });

    zone.addEventListener('touchmove', (e) => {
      const touch = Array.from(e.changedTouches).find(
        t => t.identifier === this.joystick.touchId
      );
      if (!touch) return;
      this.updateJoystick(e);
    });

    zone.addEventListener('touchend', (e) => {
      const touch = Array.from(e.changedTouches).find(
        t => t.identifier === this.joystick.touchId
      );
      if (!touch) return;
      this.joystick.active = false;
      knob.style.transform = 'translate(-50%, -50%)';
      // Stop player movement
      player.vx = 0; player.vy = 0;
    });
  }

  updateJoystick(e) {
    const touch = Array.from(e.changedTouches).find(
      t => t.identifier === this.joystick.touchId
    );
    if (!touch) return;

    const zone = document.getElementById('joystick-zone');
    const base = document.getElementById('joystick-base');
    const knob = document.getElementById('joystick-knob');
    const rect = zone.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const dx = touch.clientX - centerX;
    const dy = touch.clientY - centerY;
    const dist = Math.hypot(dx, dy);
    const maxDist = 50;

    // Clamp
    const clamped = Math.min(dist, maxDist);
    const angle = Math.atan2(dy, dx);
    const knobX = Math.cos(angle) * clamped;
    const knobY = Math.sin(angle) * clamped;

    knob.style.transform = `translate(calc(-50% + ${knobX}px), calc(-50% + ${knobY}px))`;

    // Map to player movement
    if (dist > 15) { // Dead zone
      player.vx = (dx / dist) * player.speed * (dist / maxDist);
      player.vy = (dy / dist) * player.speed * (dist / maxDist);
    } else {
      player.vx = 0; player.vy = 0;
    }
  }

  setupButtons() {
    document.querySelectorAll('.touch-btn').forEach(btn => {
      btn.addEventListener('touchstart', (e) => {
        e.preventDefault();
        const action = btn.dataset.action;
        this.handleAction(action, 'start');
        btn.classList.add('pressed');
      });
      btn.addEventListener('touchend', (e) => {
        e.preventDefault();
        const action = btn.dataset.action;
        this.handleAction(action, 'end');
        btn.classList.remove('pressed');
      });
    });
  }

  handleAction(action, phase) {
    // Map to existing keyboard input system
    const keyMap = {
      attack: ' ', bow: '2', interact: 'e', useItem: 'q',
      craft: 'f', fish: 'r', inventory: 'i', skills: 'k', build: 'b'
    };
    if (phase === 'start') {
      InputManager.pressKey(keyMap[action]);
    } else {
      InputManager.releaseKey(keyMap[action]);
    }
  }
}
```

## Verification & Acceptance Criteria
- [ ] Touch controls auto-show on touch devices
- [ ] Virtual joystick moves player in all directions with speed control
- [ ] Dead zone prevents accidental movement (15px)
- [ ] All action buttons trigger correct game actions
- [ ] Bow aiming via tap on right half of screen
- [ ] Long press on enemy locks target
- [ ] Multiple touches handled independently (joystick + buttons)
- [ ] Controls responsive in landscape and portrait
- [ ] Hide/show toggle in settings
- [ ] No conflict with mouse+keyboard input
