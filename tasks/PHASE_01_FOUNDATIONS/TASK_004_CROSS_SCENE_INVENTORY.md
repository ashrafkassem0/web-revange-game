# TASK_004 — CROSS_SCENE_INVENTORY

## Objective
Ensure inventory, equipment, tools, and hero stats persist seamlessly across all scenes with proper serialization and an HTML/CSS inventory screen (matching forest HUD / city modal patterns).

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

### Inventory UI (HTML/CSS overlay)
- Press `I` or `Tab` → show HTML panel over the canvas (like city `#modal` / forest HUD panels)
- 4 columns × 8 rows of item slots: icon (emoji or `<img>`) + count badge
- Right-click on item: HTML context menu with "Use", "Equip", "Drop", "Examine"
- Drag-and-drop reordering via pointer events on slot elements
- Tooltip on hover: HTML tooltip with item name, description, and stats
- Equipment slot display at top of inventory showing currently equipped items

### Quickbar
- 6 slots at bottom of HUD (HTML elements in forest HUD, or canvas-drawn bar if already part of HUD draw)
- Drag items from inventory to quickbar slots
- Keys 1-6 select quickbar slot
- Active item highlighted with yellow border (CSS class)

### Auto-Sort
- Button in inventory UI: groups by category (resources → tools → equipment → quest)
- Within category: sort alphabetically by Arabic name

### Edge Cases
- **Full Inventory:** If inventory is full and player picks up an item, item stays on ground. Toast: "المخزون ممتلئ!"
- **Equipment Durability:** Each weapon and armor has `durability` (max 100). Attacks reduce durability. At 0, item breaks (removed from slot, toast "تلف السلاح!"). Repaired at city blacksmith.
- **Empty Slot:** Clicking empty slot does nothing. No error.
- **Item Not Found:** If a recipe requires items not in inventory, crafting button is grayed out.

## Canvas 2D Implementation Hints
```javascript
class InventoryUI {
  constructor() {
    this.el = document.getElementById('inventory-panel'); // HTML overlay
    this.slots = [];
    this.gridWidth = 4;
    this.gridHeight = 8;
    this.el.hidden = true;
  }

  open() { ... }    // Populate slots via DOM, show panel
  close() { ... }   // Hide panel
  addItem(itemId, count) { ... }  // Update data + refresh DOM
  removeItem(itemId, count) { ... }
  renderSlots() { ... }  // Rebuild slot grid HTML
  showTooltip(slot) { ... }  // Position HTML tooltip
  handleDrop(dragSlot, targetSlot) { ... }  // Reorder items
}
```

- Item icons: emoji in slot cells, or small canvas/offscreen-drawn icons as data URLs
- Dropped items in-world: plain JS objects `{ type, x, y }` drawn with `ctx.fillText` / `ctx.drawImage` in the entity pass (same style as forest resources)
- Inventory state: always synced to `SaveManager`. On save, serialize `InventoryManager.serialize()`.

## Verification & Acceptance Criteria
- [ ] Inventory persists across forest ↔ city ↔ death valley ↔ dark kingdom
- [ ] Equipment correctly calculates stat bonuses (attack, defense)
- [ ] Stack limits enforced (cannot exceed 99 for resources)
- [ ] Drop item on ground creates a world pickup entity at player position (drawn with Canvas 2D)
- [ ] Quickbar works with keys 1-6
- [ ] Auto-sort groups by category
- [ ] Full inventory prevents pickup with toast
- [ ] Durability decreases on attack, item breaks at 0 with toast
- [ ] Inventory UI renders correctly as HTML overlay over the game canvas
