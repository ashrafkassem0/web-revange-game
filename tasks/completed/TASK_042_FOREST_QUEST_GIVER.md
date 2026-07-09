# TASK_042 — FOREST_QUEST_GIVER (Type A)

## Objective
Add a **fixed forest hunter/guard NPC** who offers a **2–3 quest story chain** (Witcher / classic MMO style): `!` when a quest is available, `?` when ready to turn in, `E` + modal to accept/turn in. Objectives use enemy levels from TASK_039 and the foundation from TASK_041.

## Depends on
- TASK_041 (forest quest foundation)

## Current Baseline
- No forest NPCs — only city merchant/healer/blacksmith pattern in [`game/city/index.html`](../../game/city/index.html)
- Camp / meadows regions in [`forest-world.js`](../../game/js/forest-world.js) — place NPC near campfire or `centerMeadows` / `southGate` approach
- Interact pattern: distance check + `E` (city uses ~55px)

## Detailed Mechanics & User Stories

### NPC — «الصياد» (`forest_hunter`)
| Field | Value |
|-------|-------|
| Position | Near starting camp / first campfire (fixed world coords) |
| Draw | Canvas: simple body + emoji `🧔` or hooded figure; nameplate «الصياد» |
| Interact | Within ~50–60px → hint `[E] تحدث` |
| Persist | `spokenToNpcs` includes `'forest_hunter'` after first talk |

### Markers (drawn above NPC)
| State | Glyph | Meaning |
|-------|-------|---------|
| Quest available (prereqs met, not active, not done) | `!` yellow | Can accept |
| Active, not complete | none or dim `…` | In progress |
| Objectives done, not turned in | `?` yellow | Turn in |
| Chain finished | none | Idle greeting only |

### Quest chain (recommended)

#### Q1 — «أرانب المراعي» `fq_chain_rabbits`
| Field | Value |
|-------|-------|
| Prereq | none |
| Objective | Kill **5** `wildRabbit` (~25 kill XP) |
| Reward | **+20 XP** turn-in (~0.8× kills) +2 `rawMeat` (or arrows) |
| Toast | «✔️ اكتملت: أرانب المراعي» |
| Note | Align with TASK_040 curve: 1→2 needs 40 XP |

#### Q2 — «أثر الثعلب» `fq_chain_fox`
| Field | Value |
|-------|-------|
| Prereq | `fq_chain_rabbits` completed |
| Objective | Kill **3** `fox` (~27 kill XP) — prefer kill over collect |
| Reward | **+25 XP** turn-in + small leather/teeth |
| Note | 2→3 needs 62 XP |

#### Q3 — «ذئب المراعي» `fq_chain_wolf`
| Field | Value |
|-------|-------|
| Prereq | `fq_chain_fox` completed |
| Objective | Kill **1** `wolf` with `level >= 5` (~30–42 kill XP) |
| Reward | **+35 XP** turn-in +1 `beastHide` or weapon tip |
| Flavor | Hunter warns that wolves start at level 5+ |
| Note | Full chain (kills+rewards) ≈ 164 XP → about hero level **4–5** (TASK_040) |

Register all three in `ForestQuests.defs` with `source: 'giver'`, `repeatable: false`.

### Dialogue flow
1. First `E` → short Arabic greeting + button «هل لديك عمل؟» if next chain quest available.
2. Accept → `ForestQuests.accept(id, 'giver')` → toast «تم قبول المهمة».
3. While active → modal shows progress line from foundation.
4. When ready → `?` → turn-in button → rewards + `completedQuests`.
5. After Q3 → «أحسنت أيها الصياد… الغابة أأمن قليلاً.» No more chain offers (radiant may still use this NPC in TASK_044).

### Edge cases
- Already completed quest → «أنجزت هذا من قبل.»
- Active board/radiant conflict: follow TASK_041 concurrency rule (refuse accept with Arabic reason if one-active-total).
- NPC must not block campfire save / building.
- Dead / combat: NPC is non-combatant (no HP, no aggro).

### Out of scope
- Hunt board UI (043), radiant rotation (044)
- Branching dialogue trees / romance / reputation
- Minimap icons

## Canvas 2D / HTML Implementation Hints
```javascript
const FOREST_HUNTER = {
  id: 'forest_hunter',
  x: /* near camp */, y: /* ... */,
  r: 18,
  name: 'الصياد'
};

function hunterMarker() {
  const next = getNextChainQuest();
  if (isReadyToTurnIn(activeGiverQuest)) return '?';
  if (next && !hasActiveQuest()) return '!';
  return null;
}

// draw NPC + marker; on E open forest-quest-modal
```

Files: new NPC draw/update in `forest-entities.js` or `forest-npcs.js`; defs in `forest-quests.js`; modal buttons in `forest/index.html`.

## Verification & Acceptance Criteria
- [x] Hunter NPC visible and interactable with `E` *(implemented as city-gate guard)*
- [x] `!` / `?` / dim `…` markers match quest state
- [x] Full chain Q1→Q2→Q3 completable; prereqs enforced
- [x] Q3 only counts wolves with `level >= 5`
- [x] Rewards apply and persist; `completedQuests` contains chain ids
- [x] Reload mid-chain restores progress and marker
- [x] Arabic dialogue throughout; no Pixi
- [x] Respects TASK_041 max-active rule

> **Placement note:** NPC is **حارس البوابة** at the south city portal (`forest_gate_guard`), not a meadow hunter — same chain content, better fit for the safe portal zone.
