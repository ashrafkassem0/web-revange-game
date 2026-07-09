# TASK_008 — ADVANCED_RESOURCES

## Objective
Add a **small** set of gatherables that fit the existing stick/stone nodes and night-loot inventory keys — **not** a large herb/mineral economy or many new biomes.

## Status
**Baseline exists.** `ResourceNode` stick/stone in `forest-world.js` / `forest-entities.js`; tree chops drop sticks; fishing; night enemies drop `beastHide` / `nightCrystal` / `venomSac` / `shadowEssence`; crafting already uses those for night blade / shadow armor.

## Detailed Mechanics & User Stories

### Add only a few world pickups
Prefer 2–3 types max:

| Id | How obtained | Notes |
|----|--------------|-------|
| `herb` (optional) | Rare grass `ResourceNode`, pick with `E` | Stack in inventory; 1 simple craft |
| `honey` or `flower` (pick one) | Sparse nodes or arrow-hit hive prop | Low count (3–8 on map) |
| Existing night loot | Keep as-is from enemies | Do not re-implement |

Avoid: full mineral veins, pickaxe tool tree, antidote/poison pipelines, 20+ herb spawns — unless a single pickaxe recipe is trivial (`stone`+`stick`) and one rock node type.

### Crafting (minimal)
Add **at most 1–2** recipes in `crafting.js`, e.g.:
- Small heal consumable: few `herb` → restore modest HP (or reuse meat heal path)
- Or arrows variant using stone+stick if not redundant with existing `arrows` recipe

Wire into existing craft menu / `Crafting.canCraft`.

### Collection UX
- Reuse ResourceNode / DroppedItem patterns: prompt `اضغط E`, toast `+1 …` with Arabic name
- Respawn: optional long timer for herbs only; minerals/honey can be non-respawning

### Inventory
- Add new keys to `DEFAULT_INVENTORY` in `shared.js` **and** forest player init / backpack key list / city merge so TASK_004 sync stays valid.

### Edge Cases
- Missing tool (if pickaxe exists): Arabic tip `تحتاج …`
- Do not require beehive particle systems beyond a simple emoji/prop draw

## Canvas 2D Implementation Hints
- Spawn in `game/js/forest-world.js` beside stick/stone loops; draw/collect in `forest-entities.js`.
- Names/emojis: extend maps in `game/js/characters.js` if used for toasts.
- Recipes: `game/js/crafting.js`; HUD backpack keys: `forest-hud.js`.
- Persist collected ids in forest snapshot `collectedResources` like existing nodes.

## Verification & Acceptance Criteria
- [ ] At least one new gatherable appears in the forest and collects into inventory via `E`
- [ ] New key persists through GameState forest ↔ city
- [ ] At most 1–2 new recipes craftable in the existing craft UI
- [ ] Stick/stone/night loot behavior unchanged
- [ ] No large herb economy, no mandatory multi-tool progression
