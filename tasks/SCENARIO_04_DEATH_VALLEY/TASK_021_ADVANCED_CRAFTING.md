# TASK_021 — ADVANCED_CRAFTING

## Objective
Expand the crafting system with Death Valley-specific recipes using elite loot, tiered equipment, and recipe discovery, all via Pixi.js crafting UI.

## Detailed Mechanics & User Stories

### Advanced Workbench
- Found in Death Valley ruins (pre-placed, not player-built)
- Must be repaired: 5 stone + 3 minerals
- Once repaired: unlocks Tier 3 recipes in crafting menu

### Tier 3 Recipes
| Item | Materials | Effect |
|------|-----------|--------|
| 🏹 Fire Arrows (10) | 2 stick + 1 fireGland | +15 damage, burn DoT 3 HP/s × 3s |
| 🗡️ Scorpion Dagger | 1 scorpionShell + 2 mineral | +30 attack, poison on hit (30%) |
| 🛡️ Lava Shield | 1 lavaCrystal + 5 mineral + 3 leather | +25 defense, fire resistance |
| 🦅 Eagle Bow | 1 vultureFeather + 3 horn + 2 leather | +40 attack, +30% range |
| 🧪 Wraith Cloak | 2 shadowEssence + 3 leather + 1 wraithCloak | +20 defense, 15% dodge |
| ⚔️ Golem Greatsword | 1 golemHeart + 10 mineral + 5 leather | +60 attack, durability 500 |

### Fire Arrows Mechanic
- On hit: enemy takes initial damage + burn DoT (3 HP/s for 3s)
- Stackable up to 2 stacks
- Visual: enemy sprite tinted orange, flame particles (PIXI.ParticleContainer)

### Poison Mechanic (Scorpion Dagger)
- On melee hit: 30% chance to poison (2 HP/s for 5s)
- Visual: enemy sprite tinted green

### Recipe Discovery
- Some recipes are "locked" until player finds recipe scroll
- Scrolls: lootable sprites in ruins (PIXI.Sprite scroll icon)
- On pickup: toast "📜 وصفة جديدة: Wraith Cloak!"
- Recipes stored in `GameState.load('discoveredRecipes', [])`

### Tool Upgrades
| Tool | Cost | Effect |
|------|------|--------|
| ⛏️ Iron Pickaxe | 5 mineral + 2 stick | Mines 2x faster |
| 🪓 Battle Axe | 3 mineral + 3 stick | +15 attack, still chops trees |

### Edge Cases
- **Missing Recipe:** Recipe grayed out in crafting UI, tooltip: "تحتاج إلى وصفة — ابحث في الأطلال"
- **Crafting Interrupted:** Crafting takes 5s (PIXI.Graphics progress bar). If hit by enemy, craft fails, 80% materials refunded.
- **Workbench Not Repaired:** Tier 3 recipes hidden, toast: "صلح طاولة العمل أولاً"

## Pixi.js Technical Implementation Hints
```javascript
// Extended crafting UI with tier filtering
class AdvancedCraftingUI extends PIXI.Container {
  constructor() {
    super();
    this.visible = false;

    // Tab buttons: Basic / Advanced
    this.tabBasic = new PIXI.Text('أساسي', { fontSize: 20, fill: 0xFFFFFF });
    this.tabBasic.interactive = true;
    this.tabBasic.on('pointerdown', () => this.setTab('basic'));

    this.tabAdvanced = new PIXI.Text('متقدم', { fontSize: 20, fill: 0x888888 });
    this.tabAdvanced.interactive = true;
    this.tabAdvanced.on('pointerdown', () => this.setTab('advanced'));
  }

  setTab(tab) {
    this.currentTab = tab;
    this.renderRecipes();
  }

  renderRecipes() {
    this.recipeList.removeChildren();
    const recipes = this.currentTab === 'basic'
      ? CRAFTING_RECIPES.filter(r => r.tier < 3)
      : CRAFTING_RECIPES.filter(r => r.tier === 3 && this.isDiscovered(r));

    recipes.forEach((recipe, i) => {
      const card = this.createRecipeCard(recipe, i);
      this.recipeList.addChild(card);
    });
  }

  createRecipeCard(recipe, index) {
    const card = new PIXI.Container();
    card.x = 50 + (index % 3) * 280;
    card.y = 100 + Math.floor(index / 3) * 160;

    // Check if can afford
    const canAfford = Object.entries(recipe.requires).every(
      ([item, count]) => InventoryManager.count(item) >= count
    );

    const bg = new PIXI.Graphics();
    bg.beginFill(recipe.tier === 3 ? 0x2a1a3e : 0x1a2a2e, 0.9);
    bg.drawRoundedRect(0, 0, 260, 140, 8);
    bg.endFill();
    card.addChild(bg);

    const name = new PIXI.Text(`${recipe.emoji} ${recipe.name}`, {
      fontSize: 20, fill: recipe.tier === 3 ? 0xFF88FF : 0xFFD700
    });
    name.x = 10; name.y = 10;
    card.addChild(name);

    const desc = new PIXI.Text(recipe.description, { fontSize: 14, fill: 0xCCCCCC });
    desc.x = 10; desc.y = 40;
    card.addChild(desc);

    // Materials
    let my = 65;
    for (const [item, count] of Object.entries(recipe.requires)) {
      const has = InventoryManager.count(item);
      const color = has >= count ? 0x44FF44 : 0xFF4444;
      const t = new PIXI.Text(`${ITEM_EMOJIS[item]} ${has}/${count}`, { fontSize: 14, fill: color });
      t.x = 10; t.y = my; my += 20;
      card.addChild(t);
    }

    // Craft button
    const btn = new PIXI.Graphics();
    btn.beginFill(canAfford ? 0x660066 : 0x444444);
    btn.drawRoundedRect(170, 90, 80, 35, 6);
    btn.endFill();
    if (canAfford) {
      btn.interactive = true;
      btn.on('pointerdown', () => this.startCrafting(recipe));
    }
    const btnText = new PIXI.Text('تصنيع', { fontSize: 16, fill: 0xFFFFFF });
    btnText.anchor.set(0.5);
    btnText.x = 210; btnText.y = 107;
    card.addChild(btn, btnText);

    return card;
  }
}
```

## Verification & Acceptance Criteria
- [ ] Advanced Workbench found in ruins, repairable with 5 stone + 3 minerals
- [ ] Tier 3 recipes require discovered recipe scrolls
- [ ] Fire arrows burn enemies (orange tint + DoT)
- [ ] Scorpion Dagger poisons on hit (green tint)
- [ ] Recipe scrolls findable in ruins as loot sprites
- [ ] Missing recipe shows hint with location
- [ ] Crafting takes 5s with cancelable progress bar
- [ ] Crafting interrupted by enemy refunds 80% materials
- [ ] Tool upgrades (Iron Pickaxe, Battle Axe) function
