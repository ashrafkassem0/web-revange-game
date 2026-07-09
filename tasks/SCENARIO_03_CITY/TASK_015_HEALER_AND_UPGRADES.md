# TASK_015 — HEALER_AND_BLACKSMITH

## Objective
Implement full healer and blacksmith NPC services with Pixi.js UI panels, upgrade paths, and resource costs.

## Detailed Mechanics & User Stories

### Healer Services (Temple District)
| Service | Cost | Effect |
|---------|------|--------|
| 🆓 Rest | Free (+20 HP) | 1x per visit, 5min cooldown |
| 💚 Full Heal | 2 meat + 2 herbs OR 10 coins | Restore all HP |
| 💊 Cure Poison | 1 flower OR 5 coins | Remove poison debuff |
| 🔄 Revive | 20 coins + 5 herbs | Restore death-penalty stats |

### Healer Dialogue
- Default: "أهلاً بك أيها المسافر... هل تحتاج إلى شفاء؟"
- After healing: "لتكن الآلهة معك في رحلتك..."
- Low rep (<20): "لا يمكنني مساعدة مثلك..."

### Blacksmith Services (Market District)
| Service | Material Cost | Coin Cost | Effect |
|---------|---------------|-----------|--------|
| 🔧 Repair | 2 minerals | 10 coins | Restore weapon/armor durability to 100 |
| ⚔️ Iron Sword | 10 minerals + 5 leather | 30 coins | +25 attack, durability 200 |
| 🏹 Reinforced Bow | 8 minerals + 10 stick | 25 coins | +20% range, +10 damage |
| 🗡️ Steel Spear | 12 minerals + 5 horn | 40 coins | +35 attack |
| 🛡️ Iron Armor | 15 minerals + 10 leather | 50 coins | +30 defense |
| 🌑 Shadow Cloak | 5 shadowEssence + 10 leather | 60 coins | +20 defense + poison resist |

### Upgrade UI (Pixi.js)
- Grid of upgrade cards: each card is a PIXI.Container with:
  - Item emoji + name
  - Stats before/after
  - Material requirements (green = sufficient, red = missing)
  - Upgrade level (0-3 stars)
- Click card → if materials sufficient → progress bar (5s) → item upgraded
- Max upgrade level: 3 per item. "السلاح في أقصى قوته" if maxed

### Equipment Durability UI
- Weapon/armor durability shown in inventory
- PIXI.Graphics bar (green → yellow → red based on %)
- When durability = 0, item breaks: removed from slot, toast "تلف السلاح!"
- Blacksmith repair restores to 100

### Edge Cases
- **Insufficient Materials:** Show missing items in red in cost list
- **Max Upgrade:** Button disabled, tooltip "السلاح في أقصى قوته"
- **No Weapon Equipped:** Repair button shows "لا يوجد سلاح مجهز"
- **Reputation Discount:** Rep > 80 → prices shown with strikethrough + discounted price

## Pixi.js Technical Implementation Hints
```javascript
class UpgradeUI extends PIXI.Container {
  constructor(blacksmith) {
    super();
    this.visible = false;
  }

  renderUpgrades() {
    this.removeChildren();
    const upgrades = getAvailableUpgrades(InventoryManager.getEquipment());
    upgrades.forEach((upgrade, i) => {
      const card = this.createUpgradeCard(upgrade, i);
      this.addChild(card);
    });
  }

  createUpgradeCard(upgrade, index) {
    const card = new PIXI.Container();
    card.x = 50 + (index % 3) * 280;
    card.y = 100 + Math.floor(index / 3) * 180;

    // Card background
    const bg = new PIXI.Graphics();
    bg.beginFill(0x2a2a3e, 0.9);
    bg.drawRoundedRect(0, 0, 260, 160, 8);
    bg.endFill();
    card.addChild(bg);

    // Item emoji + name
    const name = new PIXI.Text(`${upgrade.emoji} ${upgrade.name}`, { fontSize: 20, fill: 0xFFD700 });
    name.x = 10; name.y = 10;
    card.addChild(name);

    // Stats
    const stats = new PIXI.Text(upgrade.description, { fontSize: 14, fill: 0xCCCCCC });
    stats.x = 10; stats.y = 45;
    card.addChild(stats);

    // Cost list
    let costY = 75;
    for (const [item, count] of Object.entries(upgrade.cost)) {
      const has = InventoryManager.count(item);
      const color = has >= count ? 0x44FF44 : 0xFF4444;
      const costText = new PIXI.Text(`${ITEM_EMOJIS[item]} ${has}/${count}`, { fontSize: 14, fill: color });
      costText.x = 10; costText.y = costY;
      card.addChild(costText);
      costY += 20;
    }

    // Upgrade button
    const canAfford = canPay(upgrade.cost);
    const btn = new PIXI.Graphics();
    btn.beginFill(canAfford ? 0x006600 : 0x444444);
    btn.drawRoundedRect(160, 110, 90, 35, 6);
    btn.endFill();
    btn.interactive = canAfford;
    if (canAfford) {
      btn.on('pointerdown', () => this.performUpgrade(upgrade));
    }
    const btnText = new PIXI.Text('تطوير', { fontSize: 16, fill: 0xFFFFFF });
    btnText.anchor.set(0.5);
    btnText.x = 205; btnText.y = 127;
    card.addChild(btn, btnText);

    return card;
  }
}
```

## Verification & Acceptance Criteria
- [ ] Healer provides free rest (+20 HP) with 5min cooldown
- [ ] Paid healing works with items or coins
- [ ] Poison cure works, removes debuff
- [ ] Revive restores death penalty stats
- [ ] Blacksmith repairs equipment for cost
- [ ] All weapon/armor upgrades apply correct stat bonuses
- [ ] Max upgrade level enforced (3 per item)
- [ ] Material costs shown with green/red color indicators
- [ ] Equipment durability bar visible in inventory, breaks at 0
- [ ] Reputation discount applies (>80 rep = 10% off)
