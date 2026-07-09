# TASK_044 — FOREST_RADIANT_QUESTS (Type C)

## Objective
Add **repeatable day/night radiant hunts** (Skyrim / light MMO style): the hunter NPC and/or hunt board offers a **fresh small hunt** each game day (or each day↔night transition), with modest rewards. Builds on TASK_041–043; does not replace the story chain or one-shot board list.

## Depends on
- TASK_042 (quest giver — preferred offer surface)
- TASK_043 (hunt board — alternate / additional offer surface)

## Current Baseline
- Day/night cycle: [`game/js/forest-time.js`](../../game/js/forest-time.js) (TASK_005)
- Weather optional flavor: [`forest-weather.js`](../../game/js/forest-weather.js)
- `maps.forest.radiant` fields from TASK_041: `lastId`, `lastDayIndex`, `activeId`
- Story chain and board one-shots already defined

## Detailed Mechanics & User Stories

### What is a radiant quest?
A **template-filled** short hunt, not a unique story id forever:
- Pattern: «اقتل **X** من **Y** في **Z**»
- `repeatable: true`, `source: 'radiant'`
- Completing grants reward but **does not** permanently remove the template; a new roll appears next period

### Offer surfaces
1. **Hunter (preferred)** — after chain Q1 started or after greeting: button «مهمة اليوم» when radiant available.
2. **Hunt board** — section «صيد اليوم» at top of list (distinct from one-shot rows).

Either surface can accept/turn in the **same** `radiant.activeId`. Do not spawn two different radiants at once.

### Schedule
- Use forest **day index** (increment on dawn, or existing day counter in time system).
- On new day (or on dusk for night-themed roll):
  - If no radiant active → roll new template → set `radiant.lastDayIndex`, clear previous `lastId` offer.
  - If radiant still active from previous day → keep it until turn-in or abandon (no auto-fail required for v1).
- Night roll bias: if `isNight`, prefer nocturnal enemy ids; if day, prefer day prey/predators.

### Template pool (examples)

Turn-in ≈ **0.8×** kill XP of the rolled count (TASK_040). Keep bands modest so radiants pace mid/late levels without skipping.

| Template key | Day/Night | Roll params | Kill XP (approx) | Turn-in band |
|--------------|-----------|-------------|------------------|--------------|
| `rad_kill_rabbits` | day | count 4–6, `wildRabbit` | 20–30 | **15–25 XP** |
| `rad_kill_fox` | day | count 2–3, `fox` | 18–27 | **15–25 XP** |
| `rad_kill_wolf` | day | count 1–2, `wolf`, minLevel 5 | 30–84 | **25–65 XP** |
| `rad_kill_snake` | day | count 2–3, `snake` | 30–57 | **25–45 XP** |
| `rad_night_dire` | night | count 1, `direWolf` | ~190–230 | **50–80 XP** |
| `rad_night_spider` | night | count 1–2, `giantSpider` | ~100–220 | **40–80 XP** |

On roll, instantiate a concrete quest id like `fq_radiant_<dayIndex>_<templateKey>` **or** reuse a stable id `fq_radiant_current` and overwrite definition in memory + save progress fields. Prefer **stable id** `fq_radiant_current` to avoid bloating `completedQuests` — track completions via counter `radiant.totalCompleted` instead of pushing every id.

### Abandon / replace
- Allow abandon from modal («إلغاء مهمة اليوم») → clear active; next roll only on next day (no instant re-roll exploit).
- Do not allow stacking with giver/board if TASK_041 is one-active-total.

### Rewards
- Always XP (modest).
- 30–50% chance of a small item (`rawMeat`, `teeth`, `leather`).
- No unique story items.

### Edge cases
- Player offline across many days: on load, if `lastDayIndex < currentDay` and no active → roll once (not once per missed day).
- Weather storm: optional flavor text only («العاصفة أجفلت الفرائس») — no hard requirement.
- Story chain Q3 active: radiant button hidden or disabled with reason.

### Out of scope
- Full procedural planner / STRIPS
- Reputation / NPC friendship meters
- Radiant fetch quests across city
- Forced fail on day timeout

## Canvas 2D / HTML Implementation Hints
```javascript
function getForestDayIndex() {
  // from forest-time.js — expose a counter if missing
}

function rollRadiantQuest(dayIndex, isNight) {
  const pool = isNight ? NIGHT_RADIANT_POOL : DAY_RADIANT_POOL;
  const t = pool[Math.floor(Math.random() * pool.length)];
  const count = randInt(t.countMin, t.countMax);
  return {
    id: 'fq_radiant_current',
    title: t.titleFn(count),
    source: 'radiant',
    repeatable: true,
    objectives: [{ type: 'kill', enemyId: t.enemyId, count, minLevel: t.minLevel || 1 }],
    rewards: { xp: t.xpBase + count * t.xpPer }
  };
}

function ensureRadiantOffer() {
  const st = ForestQuests.getState().radiant;
  const day = getForestDayIndex();
  if (st.activeId) return;
  if (st.lastDayIndex === day && st.lastId) return; // already offered today
  const def = rollRadiantQuest(day, isNight());
  ForestQuests.defs[def.id] = def;
  st.lastId = def.id;
  st.lastDayIndex = day;
  persist();
}
```

Call `ensureRadiantOffer` on dawn/dusk and when opening hunter/board modal.

## Verification & Acceptance Criteria
- [x] Each new forest day (or dusk) can offer a new radiant when none active
- [x] Accept / progress / turn-in works via hunter and/or board
- [x] Night offers bias nocturnal targets; day biases day fauna
- [x] Completing radiant grants XP (and sometimes items); can repeat on later days
- [x] No exploit: abandon does not instantly re-roll same day
- [x] Missed days on load → at most one new roll
- [x] Respects concurrency with story + board hunts
- [x] `radiant` state persists; Arabic UI; no Pixi
- [x] Does not break TASK_042 chain or TASK_043 one-shots

> **Implementation:** stable id `fq_radiant_current`; period key `dayIndex_day|night`; completions via `radiant.totalCompleted` (not `completedQuests`).
