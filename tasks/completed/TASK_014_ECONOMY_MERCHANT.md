# TASK_014 — ECONOMY_MERCHANT

## Status
**Done.** Expanded barter table (`beastHide`, `venomSac` + existing rows), simple `coins` HUD + sell/buy rows, `maps.city.boughtItems` tracking via `recordBought`. Single merchant `#modal` only.

## Objective
Expand the **single** merchant barter UI in `game/city/index.html` (`openMerchant`, `.trade-row`, `trade()`). Keep HTML trade rows over Canvas — **no** three-merchant dynamic economy, reputation pricing, or stock simulation.

## Current Baseline
- `openMerchant()` offers resource → arrows barters (`leather`, `meat`, `fish`, `teeth`, `stick`).
- `window.trade(fromItem, fromAmt, toItem, toAmt)` mutates `player.inventory`, `GameState.save('inventory', …)`, refreshes modal, `#notify` on failure.
- Save already has `maps.city.boughtItems: []` for tracking purchases/trades.

## Detailed Mechanics & User Stories

### Expand barter table
Add a few more rows using existing inventory keys from `DEFAULT_INVENTORY` / night loot:

| Give | Get | Notes |
|------|-----|-------|
| 2 🧥 جلد → 8 🏹 | existing | keep |
| 3 🥩 لحم → 6 🏹 | existing | keep |
| 2 🐟 سمكة → 5 🏹 | existing | keep |
| 1 🦷 أسنان → 10 🏹 | existing | keep |
| 5 🪵 عصا → 3 🏹 | existing | keep |
| 1 🐺 جلد وحشي → 15 🏹 | new | `beastHide` |
| 1 🧪 كيس سم → 12 🏹 | new | `venomSac` (optional) |

Keep Arabic labels in the modal body.

### Optional simple coins (lightweight)
If adding currency, keep it minimal:
- Add `coins` to inventory defaults in `shared.js` + city HUD chip (`🪙 N`).
- 1–2 rows: sell surplus for coins **or** buy a small pack of arrows with coins.
- Do **not** build supply multipliers, daily gold pools, or reputation discounts.

### Track trades
```javascript
function recordBought(itemId) {
  const city = getCityMapState();
  city.boughtItems.push({ id: itemId, at: Date.now() });
  // persist maps.city
}
```
Use for quests / achievements later; not for dynamic pricing.

### UI rules
- Stay inside `#modal` / `#modalBox` with `.trade-row` + `.trade-btn`.
- Insufficient resources → `#notify` with Arabic message (existing pattern: `❌ لا يكفي …`).
- After trade, refresh `openMerchant()` and `updateHUD()`.

### Out of scope
- Separate General / Weapons / Rare Goods merchants
- Two-column buy/sell quantity pickers
- Dynamic price formulas, stock refill on day change
- Full inventory capacity checks beyond “not enough resource”

## Canvas 2D / HTML Implementation Hints
```javascript
function openMerchant() {
  openModal('🧑‍💼 التاجر', `
    <p style="margin-bottom:12px;color:#ccc">بادل مواردك بالسهام:</p>
    ${tradeRow('جلد', 2, '🧥', 8, '🏹', 'trade("leather",2,"arrows",8)')}
    ${tradeRow('جلد وحشي', 1, '🐺', 15, '🏹', 'trade("beastHide",1,"arrows",15)')}
    <!-- … -->
  `);
}

window.trade = function(fromItem, fromAmt, toItem, toAmt) {
  if ((player.inventory[fromItem] || 0) < fromAmt) {
    notify('❌ لا يكفي', '#e74c3c'); return;
  }
  player.inventory[fromItem] -= fromAmt;
  player.inventory[toItem] = (player.inventory[toItem] || 0) + toAmt;
  recordBought(toItem);
  GameState.save('inventory', player.inventory);
  notify('✅ تم التبادل', '#6ddc6d');
  openMerchant();
};
```

## Verification & Acceptance Criteria
- [x] Still **one** merchant NPC; HTML `.trade-row` UI only
- [x] Expanded barter table includes at least 2 new trades (e.g. night loot)
- [x] Failed trades show Arabic `#notify`; successful trades update inventory + HUD
- [x] `maps.city.boughtItems` records trades (or documented equivalent)
- [x] Optional coins (if added) are simple HUD + 1–2 rows — no dynamic economy
- [x] No Pixi; no 3-merchant market
