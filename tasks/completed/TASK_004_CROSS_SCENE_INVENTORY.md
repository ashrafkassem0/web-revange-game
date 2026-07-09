# TASK_004 — CROSS_SCENE_INVENTORY

## Objective
Fix cross-scene inventory sync quirks between forest and city using the existing `GameState` inventory + forest backpack — **not** a full RPG equipment/durability/drag-grid redesign.

## Status
**Done.** Canonical `GameState` inventory sync across forest↔city; food aliases for barter/heal; `finishForest` persists bag before clear; resume prefers GameState over stale forest snapshot.

## Detailed Mechanics & User Stories

### Canonical inventory
Keep the shared schema (extend only if a key is missing in one scene):

```javascript
// shared.js DEFAULT_INVENTORY — source of truth
stick, stone, meat, horn, teeth, leather, fish, arrows,
rawMeat, cookedMeat, rawFish, cookedFish,
beastHide, nightCrystal, venomSac, shadowEssence
```

- Crafted uniques stay in `craftedItems` (`axe`, `fishingRod`, armor flags, etc.) — do not duplicate as inventory stacks unless already done.
- Hero combat stats stay in `heroStats` (`attack`, `defense`, `absorbedAttack`, …).

### Sync rules (gaps to close)
1. **Forest → city:** before `navigateTo('../city/index.html')`, write `GameState.save('inventory', player.inventory)` and `craftedItems` / `heroStats` (audit `finishForest`, portal early-exit, death flows).
2. **City → forest:** city already saves on exit; ensure forest init merges `GameState.getInventory()` into `player.inventory` without wiping forest-only runtime keys.
3. **Key aliasing:** HUD already sums `rawMeat`/`cookedMeat`/`meat` and fish variants — keep display consistent; prefer writing cooked/raw explicitly when cooking (`forest-combat.js`).
4. **Barter stubs:** merchant/healer/blacksmith in `city/index.html` must read/write the same keys forest uses (no parallel `coins`-only economy unless already present).

### Backpack UI (extend existing)
- Keep `I` / backpack panel grid in `forest-hud.js` (`renderBackpack`).
- Allowed polish: show all DEFAULT keys, use/drop/eat actions already wired, clearer Arabic labels via `characters.js` item names if present.
- **Out of scope:** 4×8 drag-and-drop grid, durability bars, 6-slot quickbar hotkeys 1–6, auto-sort categories — unless a tiny sort button fits without new systems.

### Stack / pickup behavior
- Soft caps optional (e.g. resources 99, arrows 999) — only if easy to enforce at pickup in `DroppedItem` / `ResourceNode`.
- Full inventory: if you add a cap, toast `المخزون ممتلئ!` and leave world item; otherwise keep unlimited stacks as today.

### Edge Cases
- City trade with insufficient items: keep existing disabled rows / `تحتاج …` notifies.
- Crafting gray-out already via `Crafting.canCraft` — ensure city and forest see same counts after sync.
- Do not invent equipment slot UI separate from current weapon toggle + crafted bonuses.

## Canvas 2D Implementation Hints
- World pickups remain `DroppedItem` / `ResourceNode` in `forest-entities.js`, drawn in the entity pass.
- Inventory panel is HTML (`#backpackPanel` in `game/forest/index.html`); city uses HUD counters + `#modal` trades.
- Always persist through `GameState.getInventory` / `GameState.save('inventory', …)` in `shared.js`.

## Verification & Acceptance Criteria
- [x] Gather sticks/stones/meat in forest → enter city → HUD/trade shows the same counts
- [x] City barter/heal changes inventory → return to forest → backpack matches
- [x] `craftedItems` (axe / fishingRod / armor) survive forest ↔ city
- [x] Night loot keys appear in backpack when collected and persist across scenes
- [x] Cooking raw→cooked updates counts consistently in HUD and save
- [x] No durability system and no new drag-grid inventory required
- [x] Portal / finishForest / city exit all persist inventory before navigation
