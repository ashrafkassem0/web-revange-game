# Completed Tasks

Tasks whose acceptance criteria are met.

| Task | Title | Evidence |
|------|-------|----------|
| TASK_001 | GameState Refactor | `SaveManager` + versioned slots in `game/js/shared.js`; legacy `GameState` API preserved |
| TASK_002 | Scene Manager | Thin `SCENES` + `navigateToScene` / `guardSceneAccess` in `shared.js` |
| TASK_003 | Sound Engine | Extended `SFX` volumes/mute/ambient bus + forest/menu audio UI |
| TASK_004 | Cross-Scene Inventory | Canonical `GameState` inventory sync forest↔city |
| TASK_005 | Day/Night Cycle | Pause-aware clock; `forest-time.js` authority |
| TASK_006 | Weather System | Forest particles + fog/storm FX; HUD icon |
| TASK_007 | Campfire Save Points | E-menu Save/Rest/Cook/Light |
| TASK_008 | Advanced Resources | Herb/honey nodes + crafts |
| TASK_009 | Building System | Placement UX, gate, repair, persist |
| TASK_010 | Enemy AI Refinement | Stuck recovery, alert/pack cues |
| TASK_011 | Forest Completion Flow | CFG thresholds, portal, graduation |
| TASK_012 | City Map Generation | Districts + rooftops + walkers in `game/city/index.html` |
| TASK_013 | NPC System | 3 NPCs greetings + `spokenToNpcs` |
| TASK_014 | Economy / Merchant | Expanded barter + coins + `boughtItems` |
| TASK_015 | Healer & Upgrades | Rest-once + night crafts + weapon sharpen |
| TASK_016 | City Quests | Traveler supplies + valley path unlocks south gate |
| TASK_034 | Backend Foundation | Express + SQLite + Knex |
| TASK_035 | Auth System | Register / login / refresh / JWT |
| TASK_036 | Game State API | Save CRUD + sync + conflict 409 |
| TASK_045 | City Quest Hint HUD | `#questHint` + `refreshCityQuestHint` |
| TASK_046 | City Ambient Audio | `SFX.startCityAmbient` / stop + portal whoosh |
| TASK_048 | City NPC Place + Slow Walk | Static talking NPCs at buildings; slow ambient walkers |

**Also completed (forest levels):** TASK_039–044 — see files in this folder.

**Not moved here (still open):**
- TASK_017 — portal leftovers vs Death Valley page (south currently → forest hub)
- TASK_037 — client `auth.js` / `sync.js` + auth modal wiring
- TASK_038 — client leaderboard HTML panel

See [`../README.md`](../README.md).
