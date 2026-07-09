# TASK_024 — ELITE_GUARDS (GATEKEEPERS)

## Objective
Add **1–2 gatekeeper elites** on the Dark Kingdom map who block the throne door. Reuse the existing `Enemy` / `characters.js` + `forest-entities.js` patterns (plain objects drawn with `ctx`). Not three mega-bosses.

## Architecture (must follow)
- Canvas 2D entities in the dark-kingdom page loop (same as forest enemies)
- HTML dialogue / nameplate overlays optional; HP bars can be `ctx` like forest
- Loot / keys stored in `GameState` inventory or quest flags
- **No Pixi**

## Detailed Mechanics & User Stories

### Scope: 1–2 elites (pick both or ship one + stub the second)

#### Gatekeeper A — The Executioner (required)
| Property | Value |
|----------|-------|
| Location | Courtyard |
| HP | ~280–350 (forest-elite scale, not 400+ raid boss) |
| Attack | ~30–40 |
| Pattern | Wind-up (red circle) → 180° axe arc → short recovery (vulnerable tint) |

- Phase 2 optional at <50% HP: slightly faster swing or double swing once
- On death: drop **Throne Key** (or set `gatekeeperADefeated`)
- Short Arabic taunt via HTML toast / dialogue box

#### Gatekeeper B — Shadow Assassin (optional second)
| Property | Value |
|----------|-------|
| Location | Great Hall |
| HP | ~220–280 |
| Pattern | Occasional blink behind player + melee; smoke particles on teleport |

- On death: second key **or** same flag `gatekeepersCleared` if only one key is used
- Keep AI simple — extend `Enemy` with a `behavior: 'elite'` / custom update, do not invent a new engine

### Progression
```
Defeat required gatekeeper(s)
  → unlock THRONE_DOOR
  → interact (E) → fade → game/boss/index.html (TASK_025)
```
If only one gatekeeper ships: one key / one flag is enough.

### Edge cases
- Player death: respawn at Dark Kingdom entry; elite HP resets (or stays damaged — pick one and document; prefer **reset** for fairness)
- Keys / flags are quest progress — cannot be dropped
- Do not isolate the map into un-backtrackable Metroidvania locks beyond the throne door

## Canvas 2D / Implementation Hints
```javascript
// Extend forest Enemy pattern — template + custom update
const EXECUTIONER = {
  name: 'الجلاّد',
  emoji: '🪓',
  hp: 320,
  attack: 35,
  speed: 1.1,
  radius: 22,
  aggroRange: 220,
  attackRange: 70,
  behavior: 'elite_executioner',
  xp: 80
};

// In update: state machine idle → windup → swing → recovery
// Draw wind-up: ctx.strokeStyle red arc under feet
// Draw HP bar above sprite like forest enemies
```

Wire into dark-kingdom entity list; reuse `CharacterRules` damage helpers where applicable.

## Verification & Acceptance Criteria
- [ ] 1–2 elite gatekeepers spawn on Dark Kingdom map
- [ ] Executioner has readable wind-up → swing → recovery
- [ ] Defeat unlocks throne door / sets GameState flag
- [ ] Death of player resets fight fairly
- [ ] Drawn with `ctx` using existing enemy patterns (no Pixi)
- [ ] HP/difficulty in forest-elite ballpark (~220–350 HP)
- [ ] E on unlocked door navigates to boss page
