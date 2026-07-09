# TASK_004 — CROSS_SCENE_INVENTORY

## Objective
Ensure inventory, equipment, tools, and hero stats persist seamlessly across all scenes with proper serialization, UI rendering, and Pixi.js-based inventory screen.

## Detailed Mechanics & User Stories

### Unified Inventory Schema
```javascript
{
  resources: {
    stick: 0, stone: 0, meat: 0, cookedMeat: 0, horn: 0, teeth: 0,
    leather: 0, fish: 0, cookedFish: 0, herb: 0, mineral: 0,
    flower: 0, honey: 0, venomSac: 0, shadowEssence: 0, nightCrystal: 0
  },
  equipment: {
    weapon: null,      // 'sword' | 'ironSword' | 'hornSpear' | 'scorpionDagger' | 'shadowSword' | 'terrorKingSword'
    armor: null,        // 'leatherArmor' | 'ironArmor' | 'shadowCloak'
    accessory: null     // 'executionerHood' | 'shadowAmulet' | 'ringOfProtection'
  },
  tools: {
    axe: false, fishingRod: false, pickaxe: false, campKit: false
  },
  questItems: [],
  coins: 0
}
```

### Equipment Slots
- **Weapon:** Sword, bow, spear, dagger. Only one equipped at a time.
- **Armor:** Chest armor. Only one equipped.
- **Accessory:** Ring, amulet, hood. Only one equipped.
- Equipment bonuses: `totalAttack = baseAttack + weapon.attackBonus + absorbedAttack`

### Stack Limits
- arrows: max 999
- Resources: max 99 per type
- Quest items: max 1 (unique)

### Inventory UI (Pixi.js)
- Press `I` or `Tab` → PIXI container overlay with grid layout
- 4 columns × 8 rows of item slots rendered as `PIXI.Sprite` (item icon) + `PIXI.Text` (count)
- Right-click on item: context menu via `PIXI.Container` with "Use", "Equip", "Drop", "Examine" options
- Drag-and-drop reordering: `PIXI.InteractionManager` events (`pointerdown`, `pointermove`, `pointerup`)
- Tooltip on hover: `PIXI.Container` with item name, description, and stats
- Equipment slot display at top of inventory showing currently equipped items

### Quickbar
- 6 slots at bottom of HUD (PIXI.Container with PIXI.Sprite slots)
- Drag items from inventory to quickbar slots
- Keys 1-6 select quickbar slot
- Active item highlighted with yellow border (PIXI.Graphics rectangle)

### Auto-Sort
- Button in inventory UI: groups by category (resources → tools → equipment → quest)
- Within category: sort alphabetically by Arabic name

### Edge Cases
- **Full Inventory:** If inventory is full and player picks up an item, item stays on ground. Toast: "المخزون ممتلئ!"
- **Equipment Durability:** Each weapon and armor has `durability` (max 100). Attacks reduce durability. At 0, item breaks (removed from slot, toast "تلف السلاح!"). Repaired at city blacksmith.
- **Empty Slot:** Clicking empty slot does nothing. No error.
- **Item Not Found:** If a recipe requires items not in inventory, crafting button is grayed out.

## Pixi.js Technical Implementation Hints
```javascript
class InventoryUI {
  constructor() {
    this.container = new PIXI.Container();
    this.container.visible = false;
    LAYERS.ui.addChild(this.container);
    this.slots = [];
    this.gridWidth = 4;
    this.gridHeight = 8;
  }

  open() { ... }    // Populate slots, show container
  close() { ... }   // Hide container
  addItem(itemId, count) { ... }  // Update UI + data
  removeItem(itemId, count) { ... }
  renderSlots() { ... }  // Draw grid of PIXI.Sprite + PIXI.Text
  showTooltip(slot) { ... }  // PIXI.Container with text
  handleDrop(dragSlot, targetSlot) { ... }  // Reorder items
}
```

- Item icons: Pre-render emoji to `PIXI.Texture` using `PIXI.Text` + `generateCanvasTexture()`
- Or use a spritesheet with all item icons as individual frames
- Inventory state: always synced to `SaveManager`. On save, serialize `InventoryManager.serialize()`.

## Verification & Acceptance Criteria
- [ ] Inventory persists across forest ↔ city ↔ death valley ↔ dark kingdom
- [ ] Equipment correctly calculates stat bonuses (attack, defense)
- [ ] Stack limits enforced (cannot exceed 99 for resources)
- [ ] Drop item on ground creates a `PIXI.Sprite` entity in current scene at player position
- [ ] Quickbar works with keys 1-6
- [ ] Auto-sort groups by category
- [ ] Full inventory prevents pickup with toast
- [ ] Durability decreases on attack, item breaks at 0 with toast
- [ ] Inventory UI renders correctly over Pixi.js canvas
