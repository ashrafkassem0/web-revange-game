# TASK_028 — SKILL_TREE (LEVEL-UP PICKS)

## Objective
On level-up, show a **simple HTML upgrade panel** with **3 choices** that buff existing `heroStats.skills` / combat stats. This is **not** a 15-node skill tree and **not** Pixi.

## Architecture (must follow)
- Existing XP/level already live on the player / `GameState.heroStats` (`xp`, `level`, `skills.sword|bow|...`) — see `forest-player.js`, `forest-entities.js`, `shared.js`
- UI: HTML/CSS modal overlay on forest (and later maps), paused while open
- Persist chosen upgrades in save (`heroStats` or `meta.upgrades[]`)
- **No Pixi**, no graph of 15 nodes

## Detailed Mechanics & User Stories

### Level-up trigger
- When `player.level` increases (forest curve from TASK_040: rising thresholds, **max level 100**), pause and open the panel
- Do **not** offer upgrades when already at level 100 / no further level-ups
- Toast: «لقد رفعت مستواك! — اختر تحسينًا»
- Player **must pick one** of three options (reroll not required)

### The 3 choices (example pool — rotate or fixed)
Offer any 3 from a small pool each level, e.g.:
| ID | Label | Effect |
|----|-------|--------|
| `sword_up` | قوة السيف | `skills.sword += 1` (feeds `CharacterRules.playerSwordDamage`) |
| `bow_up` | دقة القوس | `skills.bow += 1` |
| `vitality` | صلابة | `maxHp += 10`, heal that amount |
| `attack_up` | ضربة أقوى | small flat attack bonus on heroStats |
| `defense_up` | درع | reduce incoming damage slightly / +def if you have a field |

Keep effects tied to **existing** stats — do not invent a parallel skill-point economy with prerequisites.

### Optional: revisit
- Press `K` opens a **read-only** summary of upgrades taken (not a full tree editor)
- No respec required

### Edge cases
- Multiple levels in one kill: show panel once per level (queue)
- Save immediately after pick
- Works offline / local save only for this task

## Implementation Hints
```html
<div id="levelup-panel" class="hidden">
  <h2>اختيار تحسين</h2>
  <div class="levelup-choices">
    <button data-upgrade="sword_up">⚔️ قوة السيف</button>
    <button data-upgrade="bow_up">🏹 دقة القوس</button>
    <button data-upgrade="vitality">❤️ صلابة</button>
  </div>
</div>
```

```javascript
function onLevelUp(newLevel) {
  gamePaused = true;
  showLevelUpPanel(pickThreeUpgrades());
}
function applyUpgrade(id) {
  // mutate player.skills / heroStats, GameState.saveHeroStats, hide panel
}
```

## Verification & Acceptance Criteria
- [ ] Level-up opens HTML panel with exactly 3 choices
- [ ] Picking one applies a real buff via existing `skills` / heroStats
- [ ] Choice persists across save/load
- [ ] No 15-node tree UI
- [ ] Zero Pixi
- [ ] Game unpauses after selection
