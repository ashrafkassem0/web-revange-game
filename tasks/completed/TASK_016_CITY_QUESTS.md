# TASK_016 — CITY_QUESTS

## Status
**Done.** Quest A `quest_traveler_supplies` (merchant: 2 barters or ≥20 arrows → +10 arrows). Quest B `quest_valley_path` (blacksmith: turn in beastHide+teeth → unlocks south gate). Progress in `maps.city.completedQuests`.

## Objective
Add **1–2** city quests tracked in `maps.city.completedQuests`, delivered through the existing three NPCs + `#modal`. Unlock the south gate for Death Valley. Avoid cellars / well caves unless a tiny same-canvas sub-area is unavoidable — prefer inventory + talk objectives.

## Current Baseline
- `DEFAULT_MAPS.city` in `game/js/shared.js`: `{ completedQuests: [], spokenToNpcs: [], boughtItems: [] }`
- NPCs: merchant, healer, blacksmith only (no tavern keeper / scholar / guard captain yet — attach quests to these three or add **at most one** extra gate guard NPC if needed)
- Decorative well and south road stub from TASK_012

## Detailed Mechanics & User Stories

### Quest A — «ذخيرة المسافر» (recommended)
| Field | Value |
|-------|-------|
| Giver | التاجر (`merchant`) |
| Objective | Complete any 2 barters **or** hold ≥20 arrows after trading |
| Track | `boughtItems.length` and/or `inventory.arrows` |
| Reward | +10 arrows **or** small HP restore; Arabic toast «✔️ اكتملت: ذخيرة المسافر» |
| Persist | push `'quest_traveler_supplies'` into `completedQuests` |

### Quest B — «طريق الوادي» (unlock gate)
| Field | Value |
|-------|-------|
| Giver | الحداد or optional south-gate guard NPC |
| Objective | Bring night-prep materials, e.g. `beastHide ≥ 1` **and** `teeth ≥ 3` (from forest) — turn in via modal |
| Reward | South gate unlock flag; toast «البوابة الجنوبية فُتحت» |
| Persist | `'quest_valley_path'` in `completedQuests`; set `maps.city.southGateUnlocked = true` (or derive unlock from completed list) |

Optional flavor only: healer asks player to rest once (`spokenToNpcs` / rest flag) — do **not** require a rat cellar.

### Quest flow
1. NPC intro (TASK_013) → button «هل لديك عمل؟» if quest available.
2. Accept → store `activeQuestId` in `maps.city` (or infer from incomplete definitions).
3. Progress checked on interact / trade / inventory.
4. Turn-in modal grants reward + `completedQuests.push(id)`.
5. After Quest B: south gate interactable (TASK_017 navigates to Death Valley).

### UI
- Prefer quest status **inside NPC modals** (progress line in Arabic).
- Optional tiny `#questHint` under HUD — **not** a full J-key quest log / minimap markers system.

### Edge Cases
- Already completed → NPC says «أنجزت هذا من قبل.» / offers no repeat (or a trivial repeatable barter tip).
- Missing items on turn-in → list what’s missing in Arabic.
- Do **not** require rope + well cave or tavern cellar combat for v1.

### Out of scope
- 3-quest chain with rat waves / lost book cave
- Reputation rewards
- Minimap `!` / `?` markers

## Canvas 2D / HTML Implementation Hints
```javascript
function getCityState() {
  // read/write maps.city via GameState helpers
}

function isQuestDone(id) {
  return (getCityState().completedQuests || []).includes(id);
}

function completeQuest(id, rewardFn) {
  const city = getCityState();
  if (!city.completedQuests.includes(id)) city.completedQuests.push(id);
  rewardFn?.();
  persistCity(city);
  notify(`✔️ اكتملت المهمة`, '#6ddc6d');
}

function isSouthGateUnlocked() {
  return isQuestDone('quest_valley_path');
}

// South gate draw: chains if !unlocked; [E] hint if unlocked
```

## Verification & Acceptance Criteria
- [x] 1–2 quests only; IDs stored in `maps.city.completedQuests`
- [x] Quests start/turn in via existing `#modal` + NPC E interact
- [x] Quest B unlocks south gate (flag or completedQuests check)
- [x] Rewards apply to inventory / HP and persist through `GameState`
- [x] No rat cellar / well cave required; Arabic strings throughout
- [x] Reload mid-quest restores progress from `maps.city`
