# TASK_001 — GAMESTATE_REFACTOR

## Objective
Refactor `GameState` in `game/js/shared.js` into a robust, extensible state management system supporting all 5 stages, complex nested data, versioning, and migration handling.

## Detailed Mechanics & User Stories

### Data Versioning
- Every save has a `version` integer. On load, a migration pipeline upgrades old saves to the current version.
- Current version: `2`. Migration functions transform data from version N to N+1.

### Player Profile
- `{ name: 'أشرف', totalPlayMs, totalDistance, totalKills, createdAt }`

### Map-Specific States
Each scene writes its world state under `maps.{sceneId}`:
```javascript
maps: {
  forest: { position: {x,y}, choppedTrees:[], deadEnemies:[], collectedResources:[], campStructures:[] },
  city: { completedQuests:[], spokenToNpcs:[], boughtItems:[] },
  deathValley: { trialsCompleted, eliteEnemiesKilled:[] },
  darkKingdom: { gatekeepersDefeated:[], bossPhase, bossCheckpointHp }
}
```
On entering a scene, its local state is restored from this namespace.

### Save Slots
- 3 slots: `auto`, `slot1`, `slot2`. Auto-save overwrites the auto slot; manual saves go to a selected slot.
- Slot metadata: `{ slot, level, currentMap, playTime, timestamp }` for the load-game selection screen.

### Save Triggers
- Every 30 seconds (auto-save, debounced to max once per 5s)
- On zone transition (portal/gate between maps)
- On player death
- On level-up
- On completing a quest
- On crafting a unique item
- On closing the browser (`beforeunload`)

### Load Flow
1. `index.html` loads → check localStorage
2. If save exists → "Continue Game" button enabled with slot summary
3. On click → read `currentMap` from profile → `navigateTo(mapUrl)` (existing `shared.js` fade)
4. Target scene's init restores position + world state from `maps.{sceneId}`

### Corruption Handling
- `try { JSON.parse }` on every key. On failure, delete that key and reset to default. Toast: "بيانات الحفظ تالفة. بدء من جديد."
- If all slots corrupt, show "حذف جميع البيانات والبدء من جديد" with confirm dialog.

### Edge Cases
- **Save During Combat:** If `hp < 20` at save time, on next load the player spawns at the last campfire with 50% HP (ignoring saved position).
- **Save Scumming:** If a save is loaded within 10s of the previous load, show "إعادة التحميل المتكرر قد يسبب مشاكل في التقدم."
- **Migration Chain:** Save with no `version` field → v0 → run migrators 0→1, then 1→2, etc.
- **Browser Storage Full:** `localStorage` quota exceeded → catch error → notify "مساحة التخزين ممتلئة. احذف بعض الحفظات القديمة."

## Canvas 2D Implementation Hints
- State persistence is pure JS — keep `GameState` / `SaveManager` as modules with zero canvas dependency (same pattern as current `GameState` in `shared.js`).
- On scene load, each map's main module (e.g. `forest-main.js`) reads restored data and rebuilds world arrays: tree/enemy/resource objects, then the existing `requestAnimationFrame` loop draws them with `ctx`.
- Example: `forest-main.js` init reads `maps.forest.choppedTrees` and marks those trees as chopped so `forest-world.js` skips drawing them / treats them as stumps.

### SaveManager Class Structure
```javascript
const CURRENT_VERSION = 2;

const MIGRATIONS = {
  1: (data) => {
    data.profile = data.profile || { name: 'أشرف', totalPlayMs: 0, totalDistance: 0, totalKills: 0 };
    return data;
  }
};

class SaveManager {
  static STORAGE_KEY = 'revenge_save_v2';

  static save(slot, data) { ... }        // serialize → localStorage
  static load(slot) { ... }               // localStorage → parse → migrate
  static deleteSlot(slot) { ... }
  static listSlots() { ... }              // return [{slot, level, map, timestamp}, ...]
  static getAutoSave() { ... }
  static setAutoSave(data) { ... }
  static migrate(data) { ... }
  static validate(data) { ... }
  static getAllSaves() { ... }            // for sync with backend (TASK_036)
}
```

## Verification & Acceptance Criteria
- [ ] Save/load cycle preserves all data including nested map states
- [ ] Loading v1 save auto-migrates to v2 without data loss
- [ ] 3 save slots operate independently (slot1 ≠ slot2)
- [ ] Auto-save fires at correct intervals and on all trigger events
- [ ] Corrupted save data resets gracefully with Arabic toast
- [ ] Save-scum warning triggers within 10s reload window
- [ ] Save during combat → spawn at campfire with 50% HP
- [ ] Cross-map persistence: kill enemies in forest → travel to city → return → enemies remain dead
- [ ] Storage full error caught and shown to player
