# TASK_010 — ENEMY_AI_REFINEMENT

## Objective
Polish existing enemy AI in `forest-entities.js` / `characters.js` (wander, leash, aggro, flee, provoked) — close real gaps only. Do **not** rewrite into a heavy pack/territory/bat framework unless a tiny incremental win.

## Status
**Largely done.** `Enemy` has `homeX/homeY`, `leashRadius`, wander, aggressive chase/attack with retreat, flee + **provoked** charge, water avoidance, death loot. Templates and night spawns live in `characters.js` / `forest-time.js`.

## Detailed Mechanics & User Stories

### Keep / verify
- Leash return toward home when player leaves aggro
- Flee animals become dangerous when provoked (bow harassment)
- Aggressive retreat-after-hit cadence
- Night predators via wildlife manager

### Gaps to close (pick what is actually missing)
1. **Stuck recovery** — if position barely changes for ~3s while chasing, nudge angle or short teleport toward open tile + tiny smoke puffs (`ctx` circles).
2. **Provoked readability** — stronger red tint / pulse while `provoked` (draw path in `Enemy.draw`).
3. **Aggro fairness** — tune `aggroRange` / night multipliers on existing templates rather than new species.
4. **Optional light pack cue** — if two wolves share nearby homes, when one aggros, nudge the other’s aggro once (simple distance check) — no full flanking FSM.
5. **Alert “!” (optional)** — on hit, brief `ctx.fillText('!')` and nearby same-type enemies walk toward point for ~2–3s.
6. **Do not require** new Bat enemy, crocodile swim redesign, 30-enemy hard cap system, or minimap territory rings unless trivial.

### Edge Cases
- Dead enemies stay dead via snapshot / `deadEnemies` as already saved
- Provoked state clears on death

## Canvas 2D Implementation Hints
- AI + draw: `game/js/forest-entities.js`
- Stats/loot templates: `game/js/characters.js`
- Spawns: `forest-world.js` / `forest-time.js` wildlife
- Integrate campfire flee (TASK_007) with a small distance check in `update` if desired

## Verification & Acceptance Criteria
- [ ] Enemies still wander, leash, chase, and attack without regressions
- [ ] Provoked flee animals show a clear visual and remain threatening
- [ ] Stuck enemies eventually free themselves (if stuck fix implemented)
- [ ] Optional pack/alert polish does not tank performance on full forest spawns
- [ ] Night predator spawn/despawn still works
- [ ] No mandatory new enemy species or full pack/territory rewrite
