# TASK_007 — CAMPFIRE_SAVE_POINTS

## Objective
Add an **E-menu on existing player-built campfires** (save / rest / cook) using HTML overlays like the hut sleep panel — **not** a fixed 5-campfire fast-travel network (unless a very small optional teleport between lit fires).

## Status
**Partial.** Campfires are placeable structures in `forest-build.js` (`type: 'campfire'`, lit light sources, draw flames). Hut already has sleep UI (`sleepPanel`). Cooking helpers exist in `forest-combat.js` (`cook` raw meat/fish). Manual/auto save exists via `forest-save.js` / `GameState`.

## Detailed Mechanics & User Stories

### Interaction target
- When player is within ~70px of a **lit** campfire (reuse `nearCampfire`-style checks), show prompt `اضغط E` (DOM or `ctx.fillText`).
- `E` opens HTML menu (clone patterns from `#sleepPanel` / city `#modal`), e.g. `#campfirePanel`.
- If unlit: option `أضرم النار` costing sticks/stones consistent with build cost leftovers (e.g. 1–2 stick) → set `s.lit = true`.

### Menu actions
1. **حفظ** — `saveForestProgress()` / `GameState.autoSave(true)`; set `meta.lastCampfire = { x, y }`; toast `تم الحفظ!`
2. **راحة** — restore a chunk of HP/stamina (or small heal); optional advance clock by 1–2 hours (lighter than hut sleep). Toast Arabic confirmation.
3. **طبخ** — if `rawMeat` / `rawFish` (or `meat`/`fish` if used as raw): run existing cook helpers → `cookedMeat` / `cookedFish`; short progress (HTML bar or notify). Block if none: `لا يوجد طعام نيء`.

### Optional (keep simple)
- Fast travel: **skip** fixed 5-point network. If anything, teleport only between **discovered lit campfires the player built**, costing 1 stick — otherwise omit entirely.
- Enemy block: if aggressive enemy within ~200px, disable Rest/Save with `لا يمكن الاسترخاء مع وجود أعداء قريبين`.

### Weather hook (TASK_006)
- Optional: heavy rain/storm can set `lit = false` after a delay; re-light with sticks. Only if weather ships; otherwise leave always-lit after place.

### Enemy repulsion (light)
- Optional: aggressive AI steers away within ~150–200px of lit campfire — small tweak in `Enemy.update`, not a new system.

### Edge Cases
- Build mode / backpack / craft open → do not open campfire menu
- Hut `E` sleep vs campfire `E`: prefer nearest interactable (hut vs campfire distance)

## Canvas 2D Implementation Hints
- Structures + draw: `game/js/forest-build.js` (campfire branch already draws flame/glow).
- Input: `game/js/forest-main.js` key `E` handler — branch to `openCampfireMenu()` when near fire.
- Save: `game/js/forest-save.js` + `SaveManager` meta `lastCampfire`.
- Cook: reuse `forest-combat.js` cook functions; UI in `game/forest/index.html`.
- Lights: keep `getLightSources()` so night overlay punches holes for lit fires.

## Verification & Acceptance Criteria
- [ ] Near lit campfire, `E` opens Arabic HTML menu with Save / Rest / Cook
- [ ] Save writes forest snapshot and updates `lastCampfire`
- [ ] Rest heals (and optionally nudges clock) with toast
- [ ] Cook converts raw meat/fish to cooked using existing inventory keys
- [ ] Unlit fire can be lit with sticks when applicable
- [ ] Menu blocked or warned when enemies are too close
- [ ] No requirement for 5 fixed world campfires or full fast-travel map
