# TASK_021 — ADVANCED_CRAFTING

## Objective
Expand the crafting system with Death Valley-specific recipes using elite loot, tiered equipment, and recipe discovery, via an HTML/CSS crafting UI (same modal pattern as city blacksmith / forest craft menu).

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
- Visual: enemy tinted orange when drawn, flame particles (plain JS array drawn with `ctx`)

### Poison Mechanic (Scorpion Dagger)
- On melee hit: 30% chance to poison (2 HP/s for 5s)
- Visual: enemy tinted green when drawn

### Recipe Discovery
- Some recipes are "locked" until player finds recipe scroll
- Scrolls: lootable objects in ruins (drawn as scroll emoji on canvas)
- On pickup: toast "📜 وصفة جديدة: Wraith Cloak!"
- Recipes stored in `GameState.load('discoveredRecipes', [])`

### Tool Upgrades
| Tool | Cost | Effect |
|------|------|--------|
| ⛏️ Iron Pickaxe | 5 mineral + 2 stick | Mines 2x faster |
| 🪓 Battle Axe | 3 mineral + 3 stick | +15 attack, still chops trees |

### Edge Cases
- **Missing Recipe:** Recipe grayed out in crafting UI, tooltip: "تحتاج إلى وصفة — ابحث في الأطلال"
- **Crafting Interrupted:** Crafting takes 5s (HTML progress bar). If hit by enemy, craft fails, 80% materials refunded.
- **Workbench Not Repaired:** Tier 3 recipes hidden, toast: "صلح طاولة العمل أولاً"

## Canvas 2D Implementation Hints
```html
<!-- Crafting UI — HTML overlay like city #modal -->
<div id="craftModal" class="hidden">
  <div class="craft-tabs">
    <button id="tabBasic" onclick="setCraftTab('basic')">أساسي</button>
    <button id="tabAdvanced" onclick="setCraftTab('advanced')">متقدم</button>
  </div>
  <div id="recipeGrid" class="upgrade-grid"></div>
  <div id="craftProgress" class="hidden">
    <div class="progress-track"><div id="craftBar"></div></div>
  </div>
</div>
```

```javascript
function setCraftTab(tab) {
  currentCraftTab = tab;
  renderRecipes();
}

function renderRecipes() {
  const grid = document.getElementById('recipeGrid');
  const recipes = currentCraftTab === 'basic'
    ? CRAFTING_RECIPES.filter(r => r.tier < 3)
    : CRAFTING_RECIPES.filter(r => r.tier === 3 && isDiscovered(r));

  grid.innerHTML = recipes.map((recipe, i) => createRecipeCardHtml(recipe, i)).join('');
}

function createRecipeCardHtml(recipe, index) {
  const canAfford = Object.entries(recipe.requires).every(
    ([item, count]) => InventoryManager.count(item) >= count
  );
  const locked = recipe.tier === 3 && !isDiscovered(recipe);
  const mats = Object.entries(recipe.requires).map(([item, count]) => {
    const has = InventoryManager.count(item);
    const color = has >= count ? '#44FF44' : '#FF4444';
    return `<span style="color:${color}">${ITEM_EMOJIS[item]} ${has}/${count}</span>`;
  }).join(' ');

  if (locked) {
    return `<div class="upgrade-card" style="opacity:0.45">
      <div>❓ وصفة غير مكتشفة</div>
      <div style="color:#888">تحتاج إلى وصفة — ابحث في الأطلال</div>
    </div>`;
  }

  return `<div class="upgrade-card" style="background:${recipe.tier === 3 ? '#2a1a3e' : '#1a2a2e'}">
    <div>${recipe.emoji} ${recipe.name}</div>
    <div style="color:#ccc">${recipe.description}</div>
    <div>${mats}</div>
    <button class="trade-btn" ${canAfford ? '' : 'disabled'}
      onclick="startCrafting('${recipe.id}')">تصنيع</button>
  </div>`;
}

function startCrafting(recipeId) {
  const recipe = getRecipe(recipeId);
  if (!canPay(recipe.requires)) return;
  deductCost(recipe.requires);
  const bar = document.getElementById('craftBar');
  document.getElementById('craftProgress').classList.remove('hidden');
  let t = 0;
  const craftInterrupted = () => player.wasHitDuringCraft;
  const iv = setInterval(() => {
    t += 100;
    bar.style.width = (t / 5000 * 100) + '%';
    if (craftInterrupted()) {
      clearInterval(iv);
      refundMaterials(recipe.requires, 0.8);
      notify('⚠️ انقطع التصنيع!', '#e74c3c');
      document.getElementById('craftProgress').classList.add('hidden');
      return;
    }
    if (t >= 5000) {
      clearInterval(iv);
      grantCraftedItem(recipe);
      document.getElementById('craftProgress').classList.add('hidden');
      notify(`✅ صنعت ${recipe.name}!`, '#6ddc6d');
    }
  }, 100);
}

// Status tints on enemies — set flags, apply in drawEnemy:
// if (enemy.burning) draw with orange overlay + flame particles[]
// if (enemy.poisoned) draw with green tint
```

## Verification & Acceptance Criteria
- [ ] Advanced Workbench found in ruins, repairable with 5 stone + 3 minerals
- [ ] Tier 3 recipes require discovered recipe scrolls
- [ ] Fire arrows burn enemies (orange tint + DoT)
- [ ] Scorpion Dagger poisons on hit (green tint)
- [ ] Recipe scrolls findable in ruins as loot objects
- [ ] Missing recipe shows hint with location
- [ ] Crafting takes 5s with cancelable progress bar
- [ ] Crafting interrupted by enemy refunds 80% materials
- [ ] Tool upgrades (Iron Pickaxe, Battle Axe) function
