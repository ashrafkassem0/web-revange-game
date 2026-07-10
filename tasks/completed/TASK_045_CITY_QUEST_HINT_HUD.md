# TASK_045 — CITY_QUEST_HINT_HUD

## Status
**Done.** `#questHint` + `refreshCityQuestHint()` in `game/city/index.html`; updates from `updateHUD`; hides when `completedCity`.

## Objective
Add a tiny persistent Arabic quest hint under the city HUD so the player always sees active city-quest progress without opening NPC modals. Complements TASK_016 (quests already work inside merchant/blacksmith modals).

## Depends on
- TASK_016 — done (`completed/TASK_016_CITY_QUESTS.md`)

## Current Baseline
- Quests: `quest_traveler_supplies`, `quest_valley_path` in `maps.city.completedQuests`
- Progress only visible inside `openMerchant` / `openBlacksmith` modals
- TASK_016 allowed an optional `#questHint` — never shipped

## Detailed Mechanics & User Stories

### Hint element
- Add `#questHint` fixed under `#hud` (or above `#hint` controls line)
- Style: small Cairo RTL chip, dark translucent bg, `#ffd060` text — match city HUD
- Hidden when both city quests are complete

### Copy rules
| State | Hint text (Arabic) |
|-------|---------------------|
| Traveler incomplete | `مهمة: ذخيرة المسافر — مقايضات X/2 أو سهام ≥20` |
| Traveler done, valley incomplete | `مهمة: طريق الوادي — سلّم للحداد جلد وحشي + 3 أسنان` |
| Valley unlocked, DV not left | `البوابة الجنوبية مفتوحة — وادي الموت` |
| Both done + left / completedCity | hide hint |

Refresh on: trade, quest complete, heal irrelevant, `updateHUD`, modal close.

### Out of scope
- Full J-key quest log
- Minimap `!` / `?` markers
- Forest quests in this HUD

## Canvas 2D / HTML Implementation Hints
```html
<div id="questHint" style="display:none">…</div>
```
```javascript
function refreshCityQuestHint() {
  const el = document.getElementById('questHint');
  if (isQuestDone('quest_valley_path')) {
    el.style.display = 'none'; return;
  }
  // set text from traveler / valley state; el.style.display = 'block';
}
```

## Verification & Acceptance Criteria
- [x] `#questHint` shows correct Arabic line for the active city quest
- [x] Updates after trades / turn-in without reload
- [x] Hidden when city quests complete (or when no active objective)
- [x] Does not block WASD / E; no Pixi; no full quest log

