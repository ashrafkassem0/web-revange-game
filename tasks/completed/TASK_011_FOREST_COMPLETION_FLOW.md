# TASK_011 — FOREST_COMPLETION_FLOW

## Objective
Polish forest → city completion using the **real** CFG thresholds and existing banner/portal flow — align copy, checks, and persistence (no invented 5 km / 4-challenge requirements).

## Status
**Done.** CFG thresholds enforced; HUD distance label fixed; portal complete/early copy; graduation typewriter; `finishForest` keeps forest snapshot + sets `completedForest`; early leave does not.

## Authoritative requirements (`forest-config.js`)
```javascript
CFG.KILLS_NEEDED = 10
CFG.DIST_NEEDED = 3000
CFG.CHALLENGES_NEEDED = 2    // axe + fishingRod
```

## Gaps closed
- HUD: `مسافة` toward 3000 (not “كم”)
- Portal: incomplete warning vs complete CTA
- Graduation typewriter before city navigate
- Keep `maps.forest` snapshot on finish (return from city works)
- Early portal → city without `completedForest`
- No victory banner spam if already completed

## Verification & Acceptance Criteria
- [x] Completion requires **10** kills, **3000** distance, **2** challenges (axe + fishing rod)
- [x] Banner + Arabic notifies appear when conditions met; game stays playable
- [x] Portal to city with completion sets `completedForest` and loads city via fade
- [x] Early portal use does **not** set `completedForest` without confirm flow as designed
- [x] HUD progress matches CFG values (not 5 km / 4 challenges)
- [x] Optional graduation typewriter plays before city load without breaking save
- [x] Returning from city still loads forest snapshot
