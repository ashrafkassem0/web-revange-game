# TASK_015 — HEALER_AND_BLACKSMITH

## Objective
Implement full healer and blacksmith NPC services with HTML/CSS UI panels (extend city `openHealer()` / `openBlacksmith()`), upgrade paths, and resource costs.

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

### Upgrade UI (HTML Modal)
- Grid of upgrade cards inside `#modalBox` (CSS grid, like existing blacksmith craft grid):
  - Item emoji + name
  - Stats before/after
  - Material requirements (green = sufficient, red = missing)
  - Upgrade level (0-3 stars)
- Click card → if materials sufficient → HTML progress bar (5s) → item upgraded
- Max upgrade level: 3 per item. "السلاح في أقصى قوته" if maxed

### Equipment Durability UI
- Weapon/armor durability shown in inventory HUD
- CSS bar (green → yellow → red based on %)
- When durability = 0, item breaks: removed from slot, toast "تلف السلاح!"
- Blacksmith repair restores to 100

### Edge Cases
- **Insufficient Materials:** Show missing items in red in cost list
- **Max Upgrade:** Button disabled, tooltip "السلاح في أقصى قوته"
- **No Weapon Equipped:** Repair button shows "لا يوجد سلاح مجهز"
- **Reputation Discount:** Rep > 80 → prices shown with strikethrough + discounted price

## Canvas 2D Implementation Hints
```javascript
// Extend existing openHealer / openBlacksmith modals
function openUpgradeUI() {
  const upgrades = getAvailableUpgrades(InventoryManager.getEquipment());
  const cards = upgrades.map((u, i) => createUpgradeCardHtml(u, i)).join('');
  openModal('⚒️ الحداد — تطوير', `
    <div class="upgrade-grid">${cards}</div>
  `);
}

function createUpgradeCardHtml(upgrade, index) {
  const canAfford = canPay(upgrade.cost);
  const maxed = upgrade.level >= 3;
  const costLines = Object.entries(upgrade.cost).map(([item, count]) => {
    const has = InventoryManager.count(item);
    const color = has >= count ? '#44FF44' : '#FF4444';
    return `<span style="color:${color}">${ITEM_EMOJIS[item]} ${has}/${count}</span>`;
  }).join(' ');

  return `<div class="upgrade-card">
    <div class="upgrade-name">${upgrade.emoji} ${upgrade.name}</div>
    <div class="upgrade-stats">${upgrade.description}</div>
    <div class="upgrade-cost">${costLines}</div>
    <div class="upgrade-stars">${'★'.repeat(upgrade.level)}${'☆'.repeat(3 - upgrade.level)}</div>
    <button class="trade-btn" ${(!canAfford || maxed) ? 'disabled' : ''}
      onclick="performUpgrade('${upgrade.id}')">
      ${maxed ? 'السلاح في أقصى قوته' : 'تطوير'}
    </button>
  </div>`;
}

function performUpgrade(upgradeId) {
  const upgrade = getUpgrade(upgradeId);
  if (!canPay(upgrade.cost) || upgrade.level >= 3) return;
  // Show 5s HTML progress bar, then apply
  showCraftProgress(5000, () => {
    deductCost(upgrade.cost);
    applyUpgrade(upgrade);
    notify('✅ تم التطوير!', '#6ddc6d');
    openUpgradeUI(); // refresh
  });
}

// Durability bar in inventory panel (HTML/CSS)
function updateDurabilityBar(item) {
  const pct = item.durability / item.maxDurability;
  const color = pct > 0.5 ? '#44FF44' : pct > 0.25 ? '#FFAA00' : '#FF4444';
  document.getElementById('durBar').style.width = (pct * 100) + '%';
  document.getElementById('durBar').style.background = color;
  if (item.durability <= 0) {
    unequip(item);
    notify('تلف السلاح!', '#e74c3c');
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
