# TASK_008 — ADVANCED_RESOURCES

## Objective
Add a **small** set of gatherables that fit the existing stick/stone nodes and night-loot inventory keys — **not** a large herb/mineral economy or many new biomes.

## Status
**Done.** World pickups `herb` (×10) + `honey` (×6); recipes `herbSalve` / `revitalTonic`; keys in `DEFAULT_INVENTORY` + forest/city HUD sync. Night loot unchanged.

## Detailed Mechanics & User Stories

### World pickups
| Id | How obtained | Notes |
|----|--------------|-------|
| `herb` | Rare grass `ResourceNode`, pick with `E` | 10 on map; stack; craft salve |
| `honey` | Sparse hive props | 6 on map; craft tonic / eat |
| Existing night loot | Keep as-is from enemies | Unchanged |

### Crafting
- `herbSalve`: 2× herb → consumable heal (~18 HP)
- `revitalTonic`: 1× herb + 1× honey → better heal (~28 HP)

### Collection UX
- Reuse ResourceNode: `[E] خذ`, toast `+1 …` Arabic name
- Non-respawning; persisted via `collectedResources`

### Inventory
- Keys in `DEFAULT_INVENTORY` / player init / backpack / city HUD

## Canvas 2D Implementation Hints
- Spawn: `forest-world.js`; draw: `forest-entities.js`
- Names: `characters.js`; recipes: `crafting.js`; HUD: `forest-hud.js`

## Verification & Acceptance Criteria
- [x] At least one new gatherable appears in the forest and collects into inventory via `E`
- [x] New key persists through GameState forest ↔ city
- [x] At most 1–2 new recipes craftable in the existing craft UI
- [x] Stick/stone/night loot behavior unchanged
- [x] No large herb economy, no mandatory multi-tool progression
