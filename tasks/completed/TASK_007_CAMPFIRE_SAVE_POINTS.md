# TASK_007 — CAMPFIRE_SAVE_POINTS

## Objective
Add an **E-menu on existing player-built campfires** (save / rest / cook) using HTML overlays like the hut sleep panel — **not** a fixed 5-campfire fast-travel network (unless a very small optional teleport between lit fires).

## Status
**Done.** `#campfirePanel` with Save / Rest / Cook / Light; prompt near fire; enemy block; rain extinguish; light AI repel. No fast-travel network.

## Detailed Mechanics & User Stories

### Interaction target
- Within ~70px of a campfire → `#campfireHint` (`اضغط E`)
- `E` opens `#campfirePanel` (sleep-panel pattern)
- Unlit: `أضرم النار` costs 2 sticks → `s.lit = true`

### Menu actions
1. **حفظ** — `saveForestProgress({ campfire })` + `meta.lastCampfire`; toast `تم الحفظ!`
2. **راحة** — HP/stamina restore + ~1.5h clock nudge
3. **طبخ** — existing `cookFood()` for raw meat/fish

### Optional (kept simple)
- Fast travel: **omitted**
- Enemy block: aggressive within ~200px disables Rest/Save
- Weather: heavy rain/storm extinguishes after delay
- Enemy repulsion: lit campfire push in `Enemy.update`

### Edge Cases
- Build / backpack / craft open → do not open campfire menu
- Hut vs campfire `E`: nearest interactable wins

## Canvas 2D Implementation Hints
- Structures + menu: `game/js/forest-build.js`
- Input: `game/js/forest-main.js` key `E`
- Save: `game/js/forest-save.js` + `meta.lastCampfire`
- Cook: `forest-combat.js` `cookFood`; UI in `game/forest/index.html`

## Verification & Acceptance Criteria
- [x] Near lit campfire, `E` opens Arabic HTML menu with Save / Rest / Cook
- [x] Save writes forest snapshot and updates `lastCampfire`
- [x] Rest heals (and optionally nudges clock) with toast
- [x] Cook converts raw meat/fish to cooked using existing inventory keys
- [x] Unlit fire can be lit with sticks when applicable
- [x] Menu blocked or warned when enemies are too close
- [x] No requirement for 5 fixed world campfires or full fast-travel map
