# TASK_014 — ECONOMY_MERCHANT

## Objective
Implement a full buy/sell/trade economy with 3 merchants, coin currency, dynamic pricing, and an HTML/CSS trade UI (extend the existing city `#modal` / `openMerchant()` pattern).

## Detailed Mechanics & User Stories

### Currency
- `coins` added to inventory schema
- Earned from: quests, selling items, finding in ruins
- Display: top-right HUD corner (HTML span, e.g. `🪙 45`)

### Merchant Types
| Merchant | Location | Buys | Sells |
|----------|----------|------|-------|
| 🧑‍💼 General | Market | Basic resources (stick, stone, meat, leather, teeth, herbs) | Arrows, food, potions |
| ⚔️ Weapons | Market | Weapons, minerals | Iron sword (200🪙), iron arrows |
| 💎 Rare Goods | Market (back room) | Rare items (venomSac, nightCrystal, shadowEssence) | Ring of protection, speed boots |

### Trade UI (HTML Modal Overlay)
- Two panels: Merchant items (left) + Player items (right), scrollable HTML lists inside `#modalBox`
- Each row: item emoji + name + stock/quantity + price per unit (reuse `.trade-row` styles)
- Click item → select quantity via +/- buttons
- Total at bottom updates in real-time
- Buy/Sell button; Confirm/Cancel on transaction

### Dynamic Pricing
```javascript
function calculatePrice(merchant, itemId, action, quantity, reputation) {
  const basePrice = ITEM_PRICES[itemId][action]; // buy or sell
  const repMultiplier = 1.0 - (reputation - 50) / 200; // 0.85–1.15
  const supplyMultiplier = getSupplyMultiplier(merchant.id, itemId); // decreases 10% after 5 sold
  return Math.round(basePrice * repMultiplier * supplyMultiplier);
}
```
- Prices reset toward base after player rests (day change)
- Supply multiplier: tracks how many of each item type the merchant has bought/sold

### Barter Mode
- If player has 0 coins, merchant accepts trade: resource for resource
- Conversion rates defined in `BARTER_RATES`: e.g., 5 stick = 1 arrow

### Merchant Inventory
- Each merchant has 5-8 item slots with stock counts
- Stock refills when player rests (day change)
- Merchants have limited gold: 200 coins each, resets daily

### Edge Cases
- **Insufficient Coins:** Buy button disabled, "ليس لديك نقود كافية" toast (`#notify`)
- **Full Inventory:** Cannot buy, "المخزون ممتلئ" toast
- **Sold Out:** Item shows "نفد من المخزون" text, stock = 0, grayed out (`opacity` / disabled button)

## Canvas 2D Implementation Hints
```javascript
// Extend existing city openModal / tradeRow pattern
function openTradeUI(merchant) {
  const merchantRows = merchant.inventory.map((item, i) => createTradeRowHtml(item, 'buy', i)).join('');
  const playerRows = getSellableItems().map((item, i) => createTradeRowHtml(item, 'sell', i)).join('');

  openModal(`🧑‍💼 ${merchant.name}`, `
    <div class="trade-columns">
      <div class="trade-col">
        <h3>بضاعة التاجر</h3>
        ${merchantRows}
      </div>
      <div class="trade-col">
        <h3>مخزونك</h3>
        ${playerRows}
      </div>
    </div>
    <div class="trade-footer">
      <span id="tradeTotal">الإجمالي: 0 🪙</span>
      <button class="trade-btn" id="confirmTrade" onclick="confirmTrade()">تأكيد</button>
      <button class="trade-btn" onclick="closeModal()">إلغاء</button>
    </div>
  `);
}

function createTradeRowHtml(item, action, index) {
  const price = action === 'buy' ? item.buyPrice : item.sellPrice;
  const soldOut = item.stock === 0;
  return `<div class="trade-row" style="opacity:${soldOut ? 0.4 : 1}">
    <span>${item.emoji} ${item.name}</span>
    <span>${soldOut ? 'نفد من المخزون' : price + ' 🪙'}</span>
    <span>x${item.stock}</span>
    <button class="qty-btn" onclick="adjustQty('${item.id}',-1)" ${soldOut ? 'disabled' : ''}>−</button>
    <span id="qty-${item.id}">0</span>
    <button class="qty-btn" onclick="adjustQty('${item.id}',1)" ${soldOut ? 'disabled' : ''}>+</button>
  </div>`;
}

// HUD coins — HTML element in #hud
function updateCoinsHUD() {
  document.getElementById('coinVal').textContent = `🪙 ${player.inventory.coins || 0}`;
}

function showToast(msg, color) {
  const n = document.getElementById('notify');
  n.textContent = msg;
  n.style.color = color || '#ffd060';
  n.style.display = 'block';
  setTimeout(() => { n.style.display = 'none'; }, 2200);
}
```

## Verification & Acceptance Criteria
- [ ] 3 merchants exist with distinct inventories
- [ ] Buy/sell flow works correctly, coins update in HUD
- [ ] Dynamic pricing responds to reputation and supply
- [ ] Barter mode works when player has 0 coins
- [ ] Insufficient funds shows warning toast
- [ ] Merchant inventory has limited stock, resets after rest
- [ ] Prices recalculate correctly with all multipliers
- [ ] Trade UI renders correctly as HTML overlay over the canvas
