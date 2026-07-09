# TASK_031 — ACHIEVEMENTS

## Objective
Add **8–10 achievements** stored in **localStorage** first, with an HTML toast on unlock. Optional server sync can come later with TASK_037 — not required here.

## Architecture (must follow)
- Module e.g. `game/js/achievements.js` + toast markup in shared CSS
- Progress counters in `localStorage` / `GameState` meta
- Hook kill/craft/map flags from existing forest events
- HTML toast + simple achievements list modal from menu/pause
- **No Pixi**

## Detailed Mechanics & User Stories

### Achievement list (8–10 — finalize in this set)
| ID | Name | Condition |
|----|------|-----------|
| `first_kill` | القاتل المبتدئ | First enemy kill |
| `wolf_hunter` | صياد الذئاب | Kill N wolves (e.g. 10) |
| `crafter` | الحرفي | Craft N items |
| `explorer_forest` | مستكشف الغابة | `completedForest` or distance flag |
| `campsite` | مخيمك الخاص | Build camp / place campfire if available |
| `city_visitor` | زائر المدينة | Enter city page |
| `gatekeeper` | كاسر الأبواب | Defeat Dark Kingdom gatekeeper(s) |
| `revenge` | الانتقام | Defeat Terror King |
| `survivor` | الناجي | Die fewer than X times by end (optional) |
| `level_5` | المتدرب | Reach level 5 |

Trim to 8 if some systems are not ready; keep IDs stable.

### Toast
- Slide-in HTML toast (name + short desc), ~3s, queue if multiple
- Optional small XP bonus — only if level system can accept it cleanly

### Screen
- Grid/list of 8–10 rows: locked grey / unlocked gold
- Secret entries optional (show ??? until unlocked)

### Persistence
```javascript
localStorage.setItem('revenge_achievements', JSON.stringify({ unlocked: [], progress: {} }));
```
Later: push with sync.js (037) — document as future hook only.

## Implementation Hints
```javascript
AchievementManager.unlock('first_kill');
AchievementManager.on('kill', { type: 'wolf' });
// toast queue in HTML #achievement-toast
```

## Verification & Acceptance Criteria
- [ ] 8–10 achievements defined and unlock correctly
- [ ] Toast appears on unlock; no duplicate unlocks
- [ ] Progress persists in localStorage
- [ ] List UI from menu or pause
- [ ] Server sync not required for acceptance
- [ ] Zero Pixi
