# PHASE_03 — City Hub

> Hub map, NPCs, economy, healer/blacksmith, city quests, portals.  
> Stack: **Canvas 2D + Vanilla JS + HTML/CSS overlays** in `game/city/index.html`. Zero Pixi.

## Tasks

| ID | Status | Summary |
|----|--------|---------|
| 012 | ✅ [`completed/`](../completed/TASK_012_CITY_MAP_GENERATION.md) | City map / districts |
| 013 | ✅ [`completed/`](../completed/TASK_013_NPC_SYSTEM.md) | NPC greetings + spokenTo |
| 014 | ✅ [`completed/`](../completed/TASK_014_ECONOMY_MERCHANT.md) | Merchant barter + coins |
| 015 | ✅ [`completed/`](../completed/TASK_015_HEALER_AND_UPGRADES.md) | Healer + blacksmith polish |
| 016 | ✅ [`completed/`](../completed/TASK_016_CITY_QUESTS.md) | City quests + south unlock |
| 017 | 🔶 open [`TASK_017`](./TASK_017_CITY_PORTAL_INTEGRATION.md) | Portal polish (forest hub; DV page still missing) |
| 045 | ✅ [`completed/`](../completed/TASK_045_CITY_QUEST_HINT_HUD.md) | Quest hint HUD |
| 046 | ✅ [`completed/`](../completed/TASK_046_CITY_AMBIENT_AUDIO.md) | City ambient audio |
| 047 | ⏭️ superseded → [`TASK_048`](../completed/TASK_048_CITY_NPC_PLACEMENT_AND_SLOW_WALK.md) | (merged) |
| 048 | ✅ [`completed/`](../completed/TASK_048_CITY_NPC_PLACEMENT_AND_SLOW_WALK.md) | Talking NPCs static; walkers slow |

## Suggested order
1. Finish **TASK_017** leftovers (Death Valley page guard / south-gate target when 018 exists) **or** start **TASK_018** Death Valley map
2. Forest remains the hub between maps

## Audit (2026-07-10)
- Hub gameplay 012–016 + follow-ups 045/046/048 implemented in `game/city/index.html`.
- `game/death-valley/` does not exist yet.
- North portal city→forest always open; south gate currently returns to forest (`saveAndGoSouthForest`) until DV ships.
