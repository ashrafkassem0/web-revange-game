# TASK_021 — ADVANCED_CRAFTING

## Objective
Extend `game/js/crafting.js` (`CRAFTING_RECIPES` + `Crafting.craft`) with a few Death Valley recipes that consume existing night loot plus new DV drops. Use the forest craft UI (`forest-hud.js` F menu) and/or city blacksmith checklist — **no** separate ruins workbench engine, recipe-scroll discovery system, or 5s interruptible craft minigame.

## Current Baseline
- Recipes already include `nightBlade` (`nightCrystal` + `beastHide` + `stick`) and `shadowArmor` (`shadowEssence` + `beastHide` + `leather`).
- `Crafting.craft` deducts mats, applies attack/defense bonuses, unique flags, `givesItem`.
- Inventory defaults in `shared.js`; names/emojis in `characters.js`.

## Detailed Mechanics & User Stories

### Add DV recipes (3–5 max)
Examples (tune costs to drops from TASK_020):

| id | Name | Requires | Effect |
|----|------|----------|--------|
| `fireArrows` | سهام نارية | `stick:2`, `fireGland:1` | `givesItem: { fireArrows: 10 }` or convert `arrows` |
| `scorpionDagger` | خنجر العقرب | `scorpionShell:1`, `stone:2`, `stick:1` | `attackBonus: ~25`, optional poison flag |
| `lavaShield` | درع الحمم | `lavaCrystal:1`, `stone:5`, `leather:2` | `defenseBonus: ~20`, unique |
| `desertCloak` | عباءة الصحراء | `shadowEssence:1`, `vultureFeather:1`, `leather:2` | `defenseBonus: ~15` + heat resist flag for TASK_022 |

Reuse night loot freely (`venomSac`, `beastHide`, etc.) so forest progress matters in DV.

### Where to craft
- **Preferred:** show new recipes in existing forest `recipesList` when `GameState` current map is DV **or** always visible once mats exist.
- **Optional:** city blacksmith shows ✔/✘ for new unique crafts (like current checklist).
- Do **not** require repairing a ruins workbench with stone/minerals to unlock a second UI.

### Combat hooks (lightweight)
- Fire arrows: on hit, set `enemy.burning` timer; draw orange tint + few flame particles; DoT ~3 HP/s for 2–3s.
- Poison dagger: reuse spider-style poison fields if available.
- Keep implementation in DV/forest combat update — small flags, not a new status-engine file unless needed.

### Data wiring
1. Add item keys to `DEFAULT_INVENTORY` in `shared.js`.
2. Add Arabic `ITEM_NAMES` / `ITEM_EMOJIS`.
3. Add recipe objects to `CRAFTING_RECIPES`.
4. Extend `DEFAULT_CRAFTED` for unique recipes.

### Out of scope
- Tier-3 tab + locked recipe scrolls
- Workbench repair gate
- Craft progress bar cancelled by damage / 80% refund
- Golem greatsword / full legendary set

## Canvas 2D / HTML Implementation Hints
```javascript
// crafting.js
{
  id: 'lavaShield',
  name: 'درع الحمم',
  emoji: '🛡️',
  description: '+20 دفاع — مقاومة حرارة خفيفة',
  requires: { lavaCrystal: 1, stone: 5, leather: 2 },
  isUnique: true,
  defenseBonus: 20
}

// forest-hud.js — existing loop over CRAFTING_RECIPES already picks up new entries
```

## Verification & Acceptance Criteria
- [ ] 3–5 new recipes in `crafting.js` using night loot + DV drops
- [ ] New items named in Arabic in `ITEM_NAMES` / inventory defaults updated
- [ ] Crafting succeeds via existing F-menu (or documented city entry) with mat checks
- [ ] At least one recipe applies attack or defense bonus through existing `Crafting.craft` paths
- [ ] Optional fire/poison-on-hit works in DV combat without a separate workbench scene
- [ ] No Pixi; no ruins workbench minigame
