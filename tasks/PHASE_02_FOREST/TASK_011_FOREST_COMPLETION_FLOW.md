# TASK_011 — FOREST_COMPLETION_FLOW

## Objective
Polish forest → city completion using the **real** CFG thresholds and existing banner/portal flow — align copy, checks, and persistence (no invented 5 km / 4-challenge requirements).

## Status
**Mostly done.** `checkCompletion` / `showCompletion` / `finishForest` / city portal panel live in `forest-main.js`; HUD progress in `forest-hud.js`; portal at `CITY_PORTAL` in `forest-config.js`.

## Authoritative requirements (`forest-config.js`)
```javascript
CFG.KILLS_NEEDED = 10
CFG.DIST_NEEDED = 3000        // world distance units (HUD treats as progress to 3000, not “5 km”)
CFG.CHALLENGES_NEEDED = 2    // axe + fishingRod crafted
```

Challenge count today: `(craftedItems.axe ? 1 : 0) + (craftedItems.fishingRod ? 1 : 0)`.

## Detailed Mechanics & User Stories

### Completion detection
- Keep `checkCompletion()` on kills, distance milestones, craft success
- When all three met: set `gameCompleted`, play `SFX.victory`, show `#completionBanner` + notifies:
  - `أكملت تدريب الغابة! توجّه إلى بوابة المدينة جنوباً`
  - Portal hint south

### Portal panel (`#cityPortalPanel`)
- Incomplete: Arabic warning that training is unfinished; allow confirm early leave **or** cancel (keep existing early-exit behavior; ensure copy matches).
- Complete: primary CTA to city → `finishForest()`:
  - `GameState.save('completedForest', true)`
  - clear/save forest state as today
  - `GameState.setCurrentMap('city')`
  - `navigateTo('../city/index.html')` with `.fade-overlay`

### Graduation beat (polish, optional but fitting)
- Before navigate, short HTML typewriter over fade (Arabic), e.g.  
  `تدرب أشرف في الغابة لأيام... تعلم الصيد والصناعة والقتال... حان الوقت لمواصلة الرحلة...`  
- Then call existing `navigateTo` — do not build a separate scene page.

### Post-completion forest
- Forest remains reachable from city north/forest portal
- Optional light polish: reduced XP or trivial combat — only if easy; not required to show `??` levels unless already desired
- Resources/building remain available

### HUD
- Progress bars must display `kills / 10`, distance toward `3000`, challenges `/ 2` (already in `forest-hud.js`) — fix any label that still says km incorrectly if present.

### Edge Cases
- Banner dismissible / auto-hide (already ~5s) without pausing the run
- `completedForest` true prevents re-trigger spam of victory banner
- Early leave without completion should not set `completedForest`

## Canvas 2D Implementation Hints
- Logic: `game/js/forest-main.js` (`checkCompletion`, `showCompletion`, `finishForest`, portal panel)
- Constants: `game/js/forest-config.js`
- HUD: `game/js/forest-hud.js`
- Markup/CSS: `game/forest/index.html` (`#completionBanner`, `#cityPortalPanel`)
- Transition: `navigateTo` + `.fade-overlay` in `shared.js` / `shared.css`
- Persistence: `GameState.save('completedForest', true)` in `shared.js` progress

## Verification & Acceptance Criteria
- [ ] Completion requires **10** kills, **3000** distance, **2** challenges (axe + fishing rod)
- [ ] Banner + Arabic notifies appear when conditions met; game stays playable
- [ ] Portal to city with completion sets `completedForest` and loads city via fade
- [ ] Early portal use does **not** set `completedForest` without confirm flow as designed
- [ ] HUD progress matches CFG values (not 5 km / 4 challenges)
- [ ] Optional graduation typewriter plays before city load without breaking save
- [ ] Returning from city still loads forest snapshot
