# TASK_020 — ELITE_ENEMIES

## Objective
Add **2–3** elite enemy types to Death Valley by extending `ENEMY_TEMPLATES` in `game/js/characters.js` and spawn/update/draw patterns from `forest-entities.js` / forest combat — not five boss-tier encounters.

## Current Baseline
- Forest enemies: plain objects from `ENEMY_TEMPLATES` (hp, attackDmg, aggroRange, drops, emoji, nocturnal flags).
- Save: `maps.deathValley.eliteEnemiesKilled: []`, `trialsCompleted: 0`.
- Night loot already exists: `venomSac`, `nightCrystal`, `shadowEssence`, `beastHide`.

## Detailed Mechanics & User Stories

### Elite set (pick 2–3)
Implement these (recommended trio; drop one if timeboxed):

#### 1. عقرب الرمال `dvScorpion` 🦂
| Stat | Value |
|------|-------|
| HP | ~90–120 |
| Attack | ~14–18 |
| Speed | moderate |
| Habitat | sand |

**Behavior:** burrow (low `drawAlpha` / sand puffs) → emerge within ~100px → chase + optional poison tick (reuse spider-style `poisonDamage` if present).  
**Loot:** `venomSac`, new `scorpionShell` (add to `DEFAULT_INVENTORY` / `ITEM_NAMES`).

#### 2. نسر الجيف `dvVulture` 🦅
| Stat | Value |
|------|-------|
| HP | ~50–70 |
| Attack | ~10–14 |
| Speed | fast |

**Behavior:** orbit player with sine offset → short **dash** toward player (top-down burst), not flying-Z physics.  
**Loot:** `vultureFeather`.

#### 3. سحلية الحمم `dvLavaLizard` 🦎 (optional third)
| Stat | Value |
|------|-------|
| HP | ~160–220 |
| Attack | ~20–26 |
| Habitat | near lava |

**Behavior:** telegraph (orange pulse) → cone/breath area in front for 0.4s (rectangle or triangle hit check on plane).  
**Loot:** `lavaCrystal`, `fireGland`.

### Shared elite rules
- 1 spawn of each type per DV run (fixed camps).
- On death: push id into `maps.deathValley.eliteEnemiesKilled`.
- When all implemented elites killed once: `trialsCompleted = Math.max(trialsCompleted, 1)` (south Dark Kingdom gate can require more trials later).
- Territory hint: soft red `strokeRect` / circle pulse around camp.
- Respawn: only after leaving DV and returning (or explicit rest) — keep simple.

### Integration
- Draw/update beside normal DV enemies in the rAF loop (same as forest).
- Drops go through existing inventory grant helpers; Arabic names in `ITEM_NAMES` / `ITEM_EMOJIS`.

### Out of scope
- Sand wraith teleport boss + stone golem 500 HP dual-phase
- “Kill all 5 = trial” requirement
- Double-tap dodge-only counters

## Canvas 2D Implementation Hints
```javascript
// characters.js
ENEMY_TEMPLATES.dvScorpion = {
  id: 'dvScorpion',
  name: 'عقرب الرمال',
  emoji: '🦂',
  hp: 100,
  attackDmg: 16,
  aggroRange: 120,
  attackRange: 28,
  speed: 2.4,
  behavior: 'aggressive',
  drops: { venomSac: { chance: 0.8, amount: 1 }, scorpionShell: { chance: 0.5, amount: 1 } }
};

function updateScorpion(e, dt, player) {
  if (e.state === 'burrowed' && dist(e, player) < 100) {
    e.state = 'emerge'; e.drawAlpha = 1;
  }
  // then chase like forest aggressive AI
}
```

## Verification & Acceptance Criteria
- [ ] 2–3 elite templates in `characters.js` with Arabic names
- [ ] Elites spawn in DV, chase/attack with distinct tells (burrow / dash / breath)
- [ ] Kills recorded in `maps.deathValley.eliteEnemiesKilled`
- [ ] Loot drops include at least one new DV item id wired into inventory/names
- [ ] No Pixi; patterns match forest entity objects + Canvas draw
- [ ] Not five boss-tier enemies
