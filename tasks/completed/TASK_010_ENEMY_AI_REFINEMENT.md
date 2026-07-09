# TASK_010 — ENEMY_AI_REFINEMENT

## Objective
Polish existing enemy AI in `forest-entities.js` / `characters.js` (wander, leash, aggro, flee, provoked) — close real gaps only. Do **not** rewrite into a heavy pack/territory/bat framework unless a tiny incremental win.

## Status
**Done.** Stuck recovery + smoke, stronger provoked visuals, alert `!` + same-type walk-in, light wolf pack cue, modest aggroRange / night multiplier tunes. No new species.

## Detailed Mechanics & User Stories

### Keep / verify
- Leash return toward home when player leaves aggro
- Flee animals become dangerous when provoked
- Aggressive retreat-after-hit cadence
- Night predators via wildlife manager

### Gaps closed
1. **Stuck recovery** — ~3s no movement while chasing → nudge/teleport + smoke puffs
2. **Provoked readability** — red pulse ring + tint while `provoked`
3. **Aggro fairness** — tuned wolf/snake/boar/bear/night ranges; night ×1.12
4. **Pack cue** — nearby wolves/direWolves get brief alert toward player once
5. **Alert `!`** — on hit, `!` + same-type walk toward point ~2–3s
6. No new Bat / territory rewrite

### Edge Cases
- Dead enemies stay dead via snapshot
- Provoked clears on death; restored via `applyProvokedStats()` on load

## Verification & Acceptance Criteria
- [x] Enemies still wander, leash, chase, and attack without regressions
- [x] Provoked flee animals show a clear visual and remain threatening
- [x] Stuck enemies eventually free themselves (if stuck fix implemented)
- [x] Optional pack/alert polish does not tank performance on full forest spawns
- [x] Night predator spawn/despawn still works
- [x] No mandatory new enemy species or full pack/territory rewrite
