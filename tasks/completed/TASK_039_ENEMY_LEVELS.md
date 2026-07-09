# TASK_039 — ENEMY_LEVELS

## Objective
Give every forest enemy a **level** (fixed or random within a species range). On spawn, scale **HP / attack / XP** from that level. Show the level near the enemy so the player can judge risk. No new species.

## Depends on
- TASK_011 (forest completion) — done

## Current Baseline
- [`game/js/characters.js`](../../game/js/characters.js) — `ENEMY_TEMPLATES` with flat `hp`, `attackDmg`, `xp` (no `level`)
- [`game/js/forest-entities.js`](../../game/js/forest-entities.js) — `Enemy` clones template; kill grants `enemy.xp`
- [`game/js/forest-world.js`](../../game/js/forest-world.js) — `ANIMAL_ZONES` + `spawnEnemyInHabitat()`
- Player level curve: **max 100**, content-calibrated (`1→2` = 40, `2→3` = 62, … via `18+22*L`) — defined in TASK_040; this task only scales enemy XP grants

## Detailed Mechanics & User Stories

### Level ranges per template
Add `levelMin` and `levelMax` (use equal values for fixed level). Suggested table:

| Template ID | Name | levelMin–levelMax |
|-------------|------|-------------------|
| `wildRabbit` | أرنب بري | 1–1 |
| `fox` | ثعلب | 2–2 |
| `deer` | غزال | 2–3 |
| `eagle` | نسر | 3–4 |
| `snake` | أفعى | 3–5 |
| `wildBoar` | خنزير بري | 4–6 |
| `wolf` | ذئب | 5–10 |
| `gorilla` | غوريلا | 7–11 |
| `bear` | دب | 8–12 |
| `crocodile` | تمساح | 9–13 |
| `direWolf` | ذئب مرعب | 10–14 |
| `nightPanther` | فهد الظلام | 11–15 |
| `giantSpider` | عنكبوت عملاق | 10–14 |
| `shadowBeast` | وحش الظلال | 14–18 |

Tune numbers in one place (templates or a small `ENEMY_LEVEL_TABLE` map) so designers can adjust without hunting spawn code.

### Spawn roll
When creating an `Enemy` instance:
1. `level = randomInt(levelMin, levelMax)` (inclusive).
2. Store `enemy.level`.
3. Scale from template base stats using a simple linear formula, e.g.:
   - `hp = round(baseHp * (1 + 0.08 * (level - levelMin)))`
   - `attackDmg = round(baseAtk * (1 + 0.06 * (level - levelMin)))` (flee animals stay 0)
   - `xp = round(baseXp * (1 + 0.12 * (level - 1)))` — or keep base XP and let TASK_040 recompute grant from level
4. Persist `level` in forest enemy snapshot so reload keeps the same instance level.

### Visual
- Draw a small Arabic label above the enemy when on-screen / within ~200px of the player, e.g. `ذئب · م5` or `Lv.5`.
- Prefer canvas text (same draw path as emoji/body) — not a separate HTML overlay per enemy.
- Optional: tint or size nudge for high-end of range is **out of scope**; level text is enough.

### Edge cases
- Night respawns / despawns must roll level again for new instances; dead enemies stay dead with their recorded level if snapshot includes them.
- Pack / alert AI from TASK_010 must ignore level (no AI rewrite).
- Poison / swim / nocturnal flags unchanged.

### Out of scope
- New enemy types
- Level-gated aggro (player too low → ignore) — optional later, not required
- Elite affixes / named rares

## Canvas 2D / Implementation Hints
```javascript
// characters.js — on each template
levelMin: 5,
levelMax: 10,

// forest-entities.js — Enemy constructor
this.level = rollLevel(template);
const t = (this.level - (template.levelMin || 1));
this.hp = this.maxHp = Math.round(template.hp * (1 + 0.08 * t));
this.attackDmg = Math.round((template.attackDmg || 0) * (1 + 0.06 * t));
this.xp = Math.round(template.xp * (1 + 0.12 * (this.level - 1)));

function rollLevel(t) {
  const lo = t.levelMin ?? 1;
  const hi = t.levelMax ?? lo;
  return lo + Math.floor(Math.random() * (hi - lo + 1));
}

// draw(): if near player
ctx.fillStyle = '#f0e6c8';
ctx.font = '10px Tajawal, sans-serif';
ctx.fillText(`م${this.level}`, this.x, this.y - this.radius - 14);
```

Files likely touched: `characters.js`, `forest-entities.js`, snapshot fields in `forest-save.js` / enemy serialize if present.

## Verification & Acceptance Criteria
- [x] Every `ENEMY_TEMPLATES` entry has `levelMin` / `levelMax`
- [x] Spawned enemies have integer `level` within their range
- [x] Higher level within a species has higher HP (and attack if aggressive) than lower level of same species
- [x] Kill XP uses the instance `xp` (scaled) or is clearly deferred to TASK_040 formula
- [x] Level label visible near enemies in forest
- [x] Reload / campfire load restores enemy levels from snapshot
- [x] No new species; night predators still nocturnal-only
- [x] Arabic-facing strings where player-visible
