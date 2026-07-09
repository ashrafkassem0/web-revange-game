# TASK_015 — HEALER_AND_UPGRADES

## Objective
Polish the existing healer and blacksmith services in `game/city/index.html` (`openHealer`, `openBlacksmith`, `heal` / `healFish` / `rest`, craft checklist). Small upgrades only — **no** durability system, reputation discounts, or large weapon shop.

## Current Baseline

### Healer
| Action | Cost | Effect |
|--------|------|--------|
| علاج | 2 meat | Full HP |
| علاج جزئي | 2 fish | +50% max HP |
| استراح | free | +20 HP |

### Blacksmith
- Checklist grid of crafted flags from `GameState.getCraftedItems()`: axe, fishingRod, hornSpear, hornSword, leatherArmor.
- Note: night recipes `nightBlade` / `shadowArmor` already exist in `game/js/crafting.js` (crafted in forest via F menu) — city should **display** them if crafted, not re-implement a full forge.

## Detailed Mechanics & User Stories

### Healer polish
- Show current HP in modal (already present).
- Persist HP to `GameState` hero stats on heal/rest (and on city exit — already partly done in `saveAndExit`).
- Optional small additions (pick ≤2):
  - Rest once per city visit (flag in memory / `maps.city`), then button disabled: «استرحت مسبقاً».
  - Cure poison if forest poison flag exists on hero (remove debuff + short Arabic confirm).
- Keep Arabic strings: «استعدت صحتك كاملة!», «تعافيت جزئياً!», «استرحت!».

### Blacksmith polish
- Extend checklist to include `nightBlade` and `shadowArmor` when present in crafted/inventory state.
- Optional **one** small paid upgrade via materials already in inventory, e.g.:
  - «شحذ السلاح» — spend 2 `stone` + 1 `horn` → +5 `absorbedAttack` (once), tracked in `maps.city` or crafted flag.
- Do **not** add iron sword / steel spear / shadow cloak shop tables or 0–3 star upgrade trees.
- Keep tip: «اضغط F في الغابة لفتح قائمة الصناعة».

### Edge Cases
- Insufficient materials → Arabic `#notify`, modal stays open or refreshes.
- Already at full HP → rest/heal can no-op with «صحتك كاملة».
- Missing crafted item → show ✘ لم يُصنع (existing `craftItem` style).

### Out of scope
- Equipment durability bars / item break
- Coin-priced revive / multi-tier armor forge
- Reputation-based discounts

## Canvas 2D / HTML Implementation Hints
```javascript
function openHealer() {
  openModal('🧑‍⚕️ المعالج', `
    <p style="margin-bottom:12px;color:#ccc">الصحة الحالية: ❤️ ${Math.ceil(player.hp)}/${player.maxHp}</p>
    <div class="trade-row">… علاج / علاج جزئي / استراح …</div>
  `);
}

function openBlacksmith() {
  openModal('⚒️ الحداد', `
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">
      ${craftItem('🪓','الفأس','axe')}
      ${craftItem('🛡️','درع الظلال','shadowArmor')}
      ${craftItem('🗡️','نصل الليل','nightBlade')}
      <!-- existing + optional one upgrade row -->
    </div>
  `);
}

function persistHp() {
  const stats = GameState.getHeroStats();
  stats.hp = player.hp;
  GameState.save('heroStats', stats);
}
```

## Verification & Acceptance Criteria
- [ ] Healer full / partial / rest still work with Arabic feedback
- [ ] HP persists through `GameState` after heal and when leaving city
- [ ] Blacksmith checklist shows forest crafts including nightBlade / shadowArmor when owned
- [ ] At most one small material upgrade (if added); no durability / rep systems
- [ ] UI remains `#modal` + `.trade-row` / craft grid — Canvas 2D world unchanged
