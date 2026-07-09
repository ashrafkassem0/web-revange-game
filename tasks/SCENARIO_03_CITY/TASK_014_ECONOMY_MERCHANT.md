# TASK_014 — ECONOMY_MERCHANT

## Objective
Implement a full buy/sell/trade economy with 3 merchants, coin currency, dynamic pricing, and a Pixi.js trade UI.

## Detailed Mechanics & User Stories

### Currency
- `coins` added to inventory schema
- Earned from: quests, selling items, finding in ruins
- Display: top-right HUD corner (PIXI.Text "🪙 45")

### Merchant Types
| Merchant | Location | Buys | Sells |
|----------|----------|------|-------|
| 🧑‍💼 General | Market | Basic resources (stick, stone, meat, leather, teeth, herbs) | Arrows, food, potions |
| ⚔️ Weapons | Market | Weapons, minerals | Iron sword (200🪙), iron arrows |
| 💎 Rare Goods | Market (back room) | Rare items (venomSac, nightCrystal, shadowEssence) | Ring of protection, speed boots |

### Trade UI (Pixi.js Container)
- Two panels: Merchant items (left) + Player items (right), each `PIXI.Container` with scrollable list
- Each row: item emoji + name + stock/quantity + price per unit
- Click item → select quantity via +/- buttons (PIXI.Text interactive)
- Total at bottom updates in real-time
- Buy/Sell button (PIXI.Graphics rounded rect)
- Confirm/Cancel on transaction

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
- **Insufficient Coins:** Buy button disabled, "ليس لديك نقود كافية" toast (PIXI.Text popup)
- **Full Inventory:** Cannot buy, "المخزون ممتلئ" toast
- **Sold Out:** Item shows "نفد من المخزون" text, stock = 0, grayed out

## Pixi.js Technical Implementation Hints
```javascript
class TradeUI extends PIXI.Container {
  constructor(merchant) {
    super();
    this.visible = false;
    this.merchant = merchant;

    // Semi-transparent backdrop
    const backdrop = new PIXI.Graphics();
    backdrop.beginFill(0x000000, 0.7);
    backdrop.drawRect(0, 0, App.screen.width, App.screen.height);
    backdrop.endFill();
    backdrop.interactive = true; // block clicks behind
    this.addChild(backdrop);

    // Main panel
    const panel = new PIXI.Graphics();
    panel.beginFill(0x1a1a2e, 0.95);
    panel.drawRoundedRect(100, 50, App.screen.width - 200, App.screen.height - 100, 12);
    panel.endFill();
    this.addChild(panel);

    // Merchant name header
    const header = new PIXI.Text(`🧑‍💼 ${merchant.name}`, { fontSize: 28, fill: 0xFFD700 });
    header.x = 130; header.y = 70;
    this.addChild(header);

    // Two-column layout
    this.merchantList = new PIXI.Container();
    this.merchantList.x = 130; this.merchantList.y = 120;
    this.addChild(this.merchantList);

    this.playerList = new PIXI.Container();
    this.playerList.x = App.screen.width / 2 + 30; this.playerList.y = 120;
    this.addChild(this.playerList);

    // Total + Confirm
    this.totalText = new PIXI.Text('الإجمالي: 0 🪙', { fontSize: 20, fill: 0xFFFFFF });
    this.totalText.x = App.screen.width - 300; this.totalText.y = App.screen.height - 120;
    this.addChild(this.totalText);
  }

  renderMerchantItems() {
    this.merchantList.removeChildren();
    this.merchant.inventory.forEach((item, i) => {
      const row = this.createItemRow(item, 'buy', i);
      this.merchantList.addChild(row);
    });
  }

  createItemRow(item, action, index) {
    const row = new PIXI.Container();
    row.y = index * 45;

    const icon = new PIXI.Text(item.emoji, { fontSize: 22 });
    icon.x = 0;
    row.addChild(icon);

    const name = new PIXI.Text(item.name, { fontSize: 16, fill: 0xFFFFFF });
    name.x = 35;
    row.addChild(name);

    const price = new PIXI.Text(`${action === 'buy' ? item.buyPrice : item.sellPrice} 🪙`, { fontSize: 16, fill: 0x88CCFF });
    price.x = 200;
    row.addChild(price);

    const stock = new PIXI.Text(`x${item.stock}`, { fontSize: 14, fill: 0x888888 });
    stock.x = 300;
    row.addChild(stock);

    // +/- buttons
    const btnMinus = new PIXI.Text('−', { fontSize: 20, fill: 0xFF4444 });
    btnMinus.x = 360; btnMinus.interactive = true;
    btnMinus.on('pointerdown', () => this.adjustQuantity(item, -1));
    row.addChild(btnMinus);

    const qty = new PIXI.Text('0', { fontSize: 18, fill: 0xFFFFFF });
    qty.x = 390;
    row.addChild(qty);

    const btnPlus = new PIXI.Text('+', { fontSize: 20, fill: 0x44FF44 });
    btnPlus.x = 420; btnPlus.interactive = true;
    btnPlus.on('pointerdown', () => this.adjustQuantity(item, 1));
    row.addChild(btnPlus);

    return row;
  }
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
- [ ] Trade UI renders correctly over Pixi.js canvas
