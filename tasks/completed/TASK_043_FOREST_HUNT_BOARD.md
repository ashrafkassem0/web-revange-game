# TASK_043 — FOREST_HUNT_BOARD (Type B)

## Objective
Add a **wooden hunt board** near the camp (Monster Hunter style): player opens a list of optional hunts, accepts one, completes objectives in the world, returns to the board to turn in. Uses TASK_041 foundation; independent from the story chain (TASK_042) except for the shared concurrency rule.

## Depends on
- TASK_041 (forest quest foundation)

## Current Baseline
- Camp structures / campfire from TASK_007 / TASK_009 — place board as a **world interactable** (not a full building recipe unless convenient)
- Modal shell from TASK_041
- Enemy levels + regions from TASK_039 / `ANIMAL_ZONES`

## Detailed Mechanics & User Stories

### Board prop — «لوحة الصيد» (`hunt_board`)
| Field | Value |
|-------|-------|
| Position | Beside campfire / hunter (if 042 placed); fixed coords |
| Draw | Canvas: brown plank rect + post; label «لوحة الصيد» |
| Interact | `E` within ~50px → open board modal (even with no NPC) |
| Persist | No `spokenToNpcs` required; use `maps.forest.huntBoard` |

### Board modal UI
Arabic list of **3–5** available hunts. Each row:
- Title + short objective
- Suggested region (e.g. «مراعي الوسط» / «جبال الشرق»)
- Reward summary (XP + item)
- Button «قبول» if eligible

Rules:
- **One board hunt active** at a time (`huntBoard.activeId` / foundation active with `source: 'board'`).
- Accepting another while one is active: either block or offer «استبدال المهمة؟» (prefer **block** for v1).
- Completed one-shot board hunts go to `huntBoard.completedIds` and/or `completedQuests`.
- Hunts with unmet level suggestion: still allow accept, but show warning «موصى به: مستوى لاعب ≥ N» (soft gate, not hard lock).

### Sample hunt definitions (`source: 'board'`)

Turn-in XP ≈ **0.8×** expected kill XP (TASK_040 quest rule). Player also earns kill XP while hunting.

| ID | Title | Objective | Kill XP (approx) | Turn-in | Region |
|----|-------|-----------|------------------|---------|--------|
| `fq_board_rabbits` | صيد الأرانب | Kill 8 `wildRabbit` | 40 | **30 XP** | مراعي الوسط |
| `fq_board_foxes` | مطاردة الثعالب | Kill 4 `fox` | ~36 | **30 XP** + teeth | مراعي الوسط |
| `fq_board_wolves` | ذئاب الجبال | Kill 3 `wolf` `minLevel: 5` | ~96 | **75 XP** | جبال الشرق |
| `fq_board_bear` | دب الجبل | Kill 1 `bear` `minLevel: 8` | ~90 | **80 XP** + leather | جبال الشرق |
| `fq_board_night` | خطر ليلي | Kill 2 nocturnal (`direWolf` / `nightPanther`) | ~400 | **150 XP** | غابة الغرب |

Mark `fq_board_bear` / night as one-shot; low hunts may be one-shot too for v1 (radiant covers repeats in 044).

### Flow
1. `E` on board → list modal.
2. Accept → `ForestQuests.accept(id, 'board')` → close modal → HUD hint updates.
3. Progress via kill events (foundation).
4. When complete → board shows `?` marker (same glyph style as NPC) → `E` → «تسليم» → rewards.
5. Optional: while active, board modal shows current hunt progress instead of full list.

### Edge cases
- Conflict with giver/radiant active: Arabic refuse per TASK_041 rule.
- Board must remain usable if hunter NPC (042) is not yet implemented (coords independent).
- Do not require reading a quest log elsewhere.

### Out of scope
- Procedural infinite board generation (044)
- Multi-player / party hunts
- Capturing monsters alive

## Canvas 2D / HTML Implementation Hints
```javascript
const HUNT_BOARD = { id: 'hunt_board', x, y, r: 22 };

function drawHuntBoard(ctx) {
  // plank + text «لوحة الصيد»
  // marker ! if any available & no active; ? if ready to turn in
}

function openHuntBoardModal() {
  // render list from ForestQuests.defs filtered source==='board'
  // hide completed one-shots
}
```

Files: prop in `forest-entities.js` / `forest-build.js`; defs in `forest-quests.js`; modal list UI in `forest/index.html` + CSS.

## Verification & Acceptance Criteria
- [x] Board visible near camp; `E` opens Arabic hunt list
- [x] Can accept one board hunt; HUD tracks progress
- [x] Turn-in at board grants rewards and marks complete
- [x] Level-gated objectives (`minLevel`) count correctly
- [x] Cannot accept second board hunt while one active (v1)
- [x] Respects global concurrency with giver/radiant
- [x] Persist `huntBoard` / active quest across reload
- [x] No Pixi; works without city systems

> **Placement:** `HUNT_BOARD` at ~(1520, 2740) near starting camp / south approach — independent of gate guard.
