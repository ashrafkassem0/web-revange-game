# TASK_041 — FOREST_QUEST_FOUNDATION

## Objective
Add a **lightweight, event-driven quest layer** for the forest only: save schema, quest definitions, progress events (`kill` / `collect` / `talk`), shared modal + tiny HUD hint. Types A/B/C (TASK_042–044) plug into this foundation — do not implement those quest contents here.

## Depends on
- TASK_039 (enemy levels — kill events can include `enemy.level` / `enemy.id`)

## Current Baseline
- [`game/js/shared.js`](../../game/js/shared.js) `DEFAULT_MAPS.forest`: position, choppedTrees, deadEnemies, collectedResources, campStructures, snapshot — **no** quest fields
- City already has `completedQuests` / `spokenToNpcs` under `maps.city` (TASK_016) — **do not** reuse city arrays for forest
- Forest “challenges” (kills / distance / craft) in HUD are **training gates** for `completedForest` — keep them; quests are a separate system
- City uses `E` + `#modal` for NPCs — mirror that pattern in forest HTML

## Detailed Mechanics & User Stories

### Save schema (`maps.forest`)
Extend defaults + migration so old saves get empty arrays:

```javascript
// DEFAULT_MAPS.forest additions
activeQuests: [],      // [{ id, progress, source }]  source: 'giver'|'board'|'radiant'
completedQuests: [],   // string ids (story / board one-shots)
spokenToNpcs: [],      // e.g. 'forest_hunter'
huntBoard: {
  activeId: null,      // optional mirror of board-sourced active quest
  completedIds: []     // if board hunts are one-shot; radiant uses separate fields
},
radiant: {
  lastId: null,
  lastDayIndex: null,  // or lastGameDay from day/night cycle
  activeId: null
}
```

Persist via existing GameState / forest-save paths. Prefer writing quest state into `maps.forest` (not only snapshot) so it survives even if snapshot is rebuilt.

### Quest definition shape
Central table (new file e.g. `game/js/forest-quests.js` or section in `forest-config.js`):

```javascript
{
  id: 'fq_rabbits_1',
  title: 'صيد الأرانب',
  description: 'اقتل 5 أرانب برية.',
  source: 'giver',           // giver | board | radiant
  objectives: [
    { type: 'kill', enemyId: 'wildRabbit', count: 5, minLevel: 1 }
  ],
  rewards: { xp: 20, items: { rawMeat: 2 } }, // ~0.8× objective kill XP — see TASK_040
  prereq: null,              // or previous quest id
  repeatable: false
}
```

Foundation only needs the **engine** + 0–1 stub definition for smoke tests. Real quest lists live in 042–044.

### Quest manager (event-driven)
```text
onGameEvent({ type: 'kill'|'collect'|'talk', ...payload })
  → for each activeQuest
      → advance matching objectives
      → if all complete → mark readyToTurnIn (or auto-complete if no turn-in)
  → update HUD hint
  → persist
```

- Emit `kill` from existing death path in `forest-entities.js` with `{ enemyId, level }`.
- Emit `collect` when picking world drops / inventory gains if needed later.
- Emit `talk` when interacting with forest NPC / board.

API sketch:
- `ForestQuests.accept(id, source)`
- `ForestQuests.abandon(id)` (optional; board may allow swap)
- `ForestQuests.turnIn(id)` → apply rewards, push to `completedQuests`, clear active
- `ForestQuests.getHudHint()` → Arabic one-liner for active quest progress

### UI (shared)
1. **Modal** — reuse / add `#forest-quest-modal` in [`game/forest/index.html`](../../game/forest/index.html) (Arabic RTL). Used by NPC, board, and radiant turn-in.
2. **HUD hint** — one line under existing HUD, e.g. `مهمة: اقتل أرانب 3/5`. Hidden if no active quest.
3. **No** full quest log key (J), no minimap markers, no reputation.

### Limits
- **v1 rule (implemented):** at most **one active quest total** across all sources (`ForestQuests.MAX_ACTIVE_TOTAL = 1`).
- Board/radiant (042–044) must abandon or finish the current quest before accepting another.

### Edge cases
- Reload mid-quest restores `activeQuests` progress
- Completing forest training challenges must not clear quest state
- Unknown quest id in save → ignore / drop safely
- Rewards must go through inventory / `player.xp` helpers already used elsewhere

### Out of scope
- Concrete NPC, board UI list, radiant templates (042–044)
- City quests
- Server-authoritative quest validation

## Canvas 2D / HTML Implementation Hints
```javascript
// forest-quests.js
const ForestQuests = {
  defs: { /* filled by later tasks */ },
  getState() { /* maps.forest via GameState */ },
  onEvent(ev) { /* advance */ },
  accept(id, source) { /* ... */ },
  turnIn(id) { /* rewards + completedQuests */ },
  getHudHint() { /* Arabic */ }
};

// forest-entities.js on kill
ForestQuests.onEvent({ type: 'kill', enemyId: enemy.id, level: enemy.level });
```

Wire script tag in `forest/index.html` after `shared.js` / config.

## Verification & Acceptance Criteria
- [x] `maps.forest` defaults include quest-related fields; old saves migrate without crash
- [x] `ForestQuests.onEvent({type:'kill',...})` advances a stub/test active quest
- [x] Accept / turn-in / complete persist across reload
- [x] HUD hint shows progress when a quest is active; hidden otherwise
- [x] Modal shell exists and can show title + description + buttons
- [x] Forest training challenges still work independently
- [x] No Pixi; Arabic UI strings
- [x] Documented rule for max concurrent actives (one total or one per source)
