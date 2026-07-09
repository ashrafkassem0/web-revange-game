# Completed Tasks

Tasks whose acceptance criteria are met.

| Task | Title | Evidence |
|------|-------|----------|
| TASK_001 | GameState Refactor | `SaveManager` + versioned slots in `game/js/shared.js`; legacy `GameState` API preserved *(file kept; may still appear under foundations for history — treat as done)* |
| TASK_002 | Scene Manager | Thin `SCENES` + `navigateToScene` / `guardSceneAccess` in `shared.js`; fade debounce; forest/city visibility pause+save; no SPA |
| TASK_003 | Sound Engine | Extended `SFX` volumes/mute/ambient bus + forest/menu audio UI; persists `flags.audio` |
| TASK_004 | Cross-Scene Inventory | Canonical `GameState` inventory sync forest↔city; food aliases; finishForest persists bag |
| TASK_034 | Backend Foundation | Express + SQLite + Knex + CORS + rate limit + `.env.example` |
| TASK_035 | Auth System | Register / login / refresh / logout / me + bcrypt + JWT + Zod |
| TASK_036 | Game State API | Save CRUD + sync + conflict 409 + 1MB limit |

**Not moved here (still open):**
- TASK_037 — client `auth.js` / `sync.js` + auth modal wiring
- TASK_038 — client leaderboard HTML panel (API exists; UI does not)

Remaining phase tasks (002–033, etc.) were **rewritten for Canvas multi-page compatibility**, not deleted. See [`../README.md`](../README.md).
