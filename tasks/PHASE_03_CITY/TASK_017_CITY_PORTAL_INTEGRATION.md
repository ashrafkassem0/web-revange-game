# TASK_017 — CITY_PORTAL_INTEGRATION

## Status
**Partial.** Forest ↔ city round-trip, south-gate lock/unlock UI, fade navigation, and portal debounce already work in `game/city/index.html` + `forest-main.js`. Remaining gaps below must pass before moving to `completed/`.

## Design rule (authoritative)
**الغابة هي نقطة الربط (hub) بين كل الخرائط/القرى.**

```
        ┌─────────┐
        │  المدينة │
        └────┬────┘
             │ بوابة الشمال — دائماً مفتوحة
             ▼
        ┌─────────┐
   … ←→ │  الغابة  │ ←→ …
        └────┬────┘
             │ (بوابات لاحقة)
             ▼
        وادي الموت / … 
```

- **مدينة → غابة (شمال):** دائماً مفتوحة — لا قفل بمهام، لا منع بسبب `quest_valley_path`.
- **غابة → مدينة:** كما هو (بعد إكمال الغابة / بوابة المدينة في الغابة).
- **مدينة → وادي الموت (جنوب):** منفصلة؛ تُقفل حتى مهمة المدينة، ثم تُوجَّه لصفحة DV عند وجودها — **لا** تستبدل بوابة الغابة.

## Objective
Polish travel with forest-as-hub: keep city↔forest always available, wire south gate to Death Valley when `game/death-valley/index.html` exists, and close handoff gaps (spawn, missing-page guard, combat block, `completedCity`). Reuse `navigateTo` / `navigateToScene` + CSS `.fade-overlay`.

## Depends on
- TASK_002, TASK_011, TASK_016 — done (`completed/`)

## What already works (do not rebuild)
- City north: `FOREST_PORTAL` → `saveAndExit()` → forest with fade
- City south: locked notify / unlocked confirm → `saveAndGoDeathValley()`
- Forest → city via `enterCity()` / `navigateToScene('city')`
- `MAP_URLS.deathValley = 'death-valley/index.html'` (page itself is TASK_018 — not created yet)
- Portal E debounce (~1s); modal open ignores portal E
- Inventory / HP / `maps.city` persist across forest ↔ city

## Remaining work (implement these)

### 1. City → Forest portal stays always open
Current code shows a confirm modal when `quest_valley_path` is incomplete («لم تفتح طريق وادي الموت بعد…»). That ties forest return to the valley quest and conflicts with the hub rule.

**Required:**
- Pressing E on north portal always returns to forest (after save) — **no quest gate**
- Optional soft tip only (never blocks): e.g. toast «يمكنك العودة للغابة في أي وقت — الغابة تربط كل المناطق»
- Prefer **direct** `saveAndExit()` (or a simple «العودة للغابة؟ نعم/لا» without mentioning valley lock)
- Remove any copy that implies the forest portal is locked until city quests finish

### 2. City arrival spawn near north gate
Today player defaults to south (`y: H - CFG.TILE * 2.5`). On load from forest:
- Spawn near `FOREST_PORTAL` (e.g. `x: W/2`, `y: FOREST_PORTAL.y + ~60`)
- Keep south spawn only if returning from Death Valley later (optional flag)

### 3. Missing Death Valley page guard
`game/death-valley/index.html` does **not** exist yet. Unlocked south gate must **not** navigate to a 404 / fall back to forest by mistake.
- Before `navigateToScene('deathValley')`: probe page existence **or** keep a `DV_PAGE_READY` / feature flag until TASK_018 ships
- If missing → Arabic toast/modal «قريباً — وادي الموت قيد الإعداد» and stay in city
- Player can still leave via **north → forest** (hub)

### 4. Combat proximity block (forest → city only)
In `forest-main.js` `enterCity()`: if any living enemy within ~200px of player, block with «لا يمكنك المغادرة أثناء المعركة!»
- **Do not** block city → forest for combat (city has no hostiles); city→forest stays open

### 5. Set `progress.completedCity`
Mirror forest's `completedForest`:
- When Quest B completes **or** when player confirms south-gate travel (prefer on successful DV navigate / when DV ready)
- `GameState.save('completedCity', true)` so menu / `inferCurrentMap` unlock correctly
- Completing city must **never** close the north forest portal

## Canvas 2D / Implementation Hints
```javascript
// North portal — always open (hub return)
if (isNearPortal(FOREST_PORTAL)) {
  // optional simple confirm; never check quest_valley_path
  saveAndExit(); // → forest
  return;
}

// City init — spawn at north when arriving from forest
player.x = FOREST_PORTAL.x;
player.y = FOREST_PORTAL.y + 64;

function saveAndGoDeathValley() {
  if (!isDeathValleyPageReady()) {
    notify('قريباً — وادي الموت قيد الإعداد', '#ffd060');
    return;
  }
  persistFullCityState();
  GameState.save('completedCity', true);
  GameState.setCurrentMap('deathValley');
  navigateToScene('deathValley', { skipPrereq: true, save: () => GameState.autoSave(true) });
}
```

## Verification & Acceptance Criteria
- [x] Forest ↔ city round trip works with fade
- [x] Inventory / HP / `maps.city` persist across trips
- [x] South gate locked message until TASK_016 quest complete
- [x] Portal debounce prevents double navigation
- [x] `SaveManager.mapUrlFor('deathValley')` points at death-valley page path
- [ ] **City → forest (north) always open** — no quest lock; no «وادي الموت» gate on that portal
- [ ] Arrive in city from forest → spawn near **north** gate (not south)
- [ ] Unlocked south gate: if DV page missing → «قريباً» (no broken navigation); north→forest still works
- [ ] Unlocked south gate: when DV page exists → navigate to `game/death-valley/index.html`
- [ ] Forest→city portal blocked while enemies within ~200px (Arabic notify)
- [ ] `completedCity` set on city completion / DV departure and persists
- [ ] Completing city quests does **not** change north portal availability
