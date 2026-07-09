# TASK_009 — BUILDING_SYSTEM

## Objective
Implement a base-camp building system using Pixi.js grid overlay and placeable structure sprites.

## Detailed Mechanics & User Stories

### Camp Location
- Fixed clearing in center-west of forest map (x:800, y:1600)
- Flat grassy area with "build zone" indicator (PIXI.Graphics dashed rectangle)

### Build Mode
- Press `B` to toggle
- Enter: combat pauses (enemies frozen), PIXI grid overlay appears
- Grid: 8×8 cells, each 64×64 px, green/red tint for valid/invalid placement

### Build Menu
PIXI.Container radial menu or tab panel with categories:
| Structure | Material Cost | Effect |
|-----------|--------------|--------|
| 🏕️ Tent | 10 stick + 5 leather | Save point, basic shelter |
| 🪚 Workbench | 8 stick + 4 stone | Unlocks advanced craft recipes |
| 📦 Storage Chest | 6 stick + 2 leather | +16 extra inventory slots |
| 🧱 Wall | 5 stick + 2 stone/segment | Blocks enemy path |
| 🛏️ Bed | 8 stick + 4 leather | Full heal on rest |
| 🎯 Training Dummy | 4 stick + 2 leather | Practice combat (no damage) |

### Building Process
1. Select structure from menu
2. Grid cells highlight green (valid) / red (invalid/occupied)
3. Click to place → if materials sufficient → progress bar (3s, PIXI.Graphics bar) → structure sprite appears
4. Materials deducted from inventory

### Workbench Upgrade
- Tier 2: 5 minerals + 2 horn → unlocks Advanced Crafting (Tier 3 recipes from TASK_021)
- Upgrade UI: click workbench → "تطوير" button + cost + progress bar

### NPC Visitors
- After workbench built: 10% chance per minute a traveling merchant NPC appears at camp
- NPC sprite (PIXI.Sprite) walks to camp center, stays for 30 seconds, offers random trade

### Structure Rendering (Pixi.js)
- Each structure is a `PIXI.Container` with sprite + optional animation
- Tent: triangle shape (PIXI.Graphics), flaps blow in wind
- Workbench: rectangle + smaller rectangles
- Wall: horizontal/vertical segment sprite
- All structures cast shadows (dark semi-transparent ellipse at base)

### Edge Cases
- **Insufficient Materials:** Build button grayed out, tooltip "تحتاج: 3 🪵 إضافية"
- **Grid Full:** "ليس هناك مساحة كافية" toast
- **Enemy Attack Event:** Rare (5%/night) — wolves attack camp. If walls exist, block first wave. Player must defend.
- **Save State:** Structures saved in `maps.forest.campStructures` array. Restored on scene load.

## Pixi.js Technical Implementation Hints
```javascript
class BuildSystem {
  constructor() {
    this.grid = Array.from({ length: 8 }, () => Array(8).fill(null));
    this.mode = false;
    this.container = new PIXI.Container();
    this.container.visible = false;
    LAYERS.ui.addChild(this.container);
  }

  enterMode() {
    this.mode = true;
    this.container.visible = true;
    this.drawGrid();
    // Freeze enemies
    enemies.forEach(e => e.frozen = true);
  }

  drawGrid() {
    for (let gy = 0; gy < 8; gy++) {
      for (let gx = 0; gx < 8; gx++) {
        const cell = new PIXI.Graphics();
        const valid = this.canPlace(gx, gy, selectedStructure);
        cell.lineStyle(1, valid ? 0x00FF00 : 0xFF0000, 0.5);
        cell.beginFill(valid ? 0x00FF00 : 0xFF0000, 0.1);
        cell.drawRect(gx * 64, gy * 64, 64, 64);
        cell.endFill();
        this.container.addChild(cell);
      }
    }
  }

  placeStructure(type, gx, gy) {
    if (!this.canPlace(gx, gy, type)) return;
    const cost = STRUCTURES[type].cost;
    if (!InventoryManager.hasItems(cost)) { showToast('المواد غير كافية'); return; }
    InventoryManager.removeItems(cost);
    this.grid[gy][gx] = type;
    const sprite = this.createStructureSprite(type, gx, gy);
    this.container.addChild(sprite);
  }
}

// Structure definitions
const STRUCTURES = {
  tent: { cost: { stick: 10, leather: 5 }, health: 50 },
  workbench: { cost: { stick: 8, stone: 4 }, health: 80 },
  chest: { cost: { stick: 6, leather: 2 }, health: 40, extraSlots: 16 },
  wall: { cost: { stick: 5, stone: 2 }, health: 60 },
  bed: { cost: { stick: 8, leather: 4 }, health: 30 },
  trainingDummy: { cost: { stick: 4, leather: 2 }, health: 20 }
};
```

## Verification & Acceptance Criteria
- [ ] Build mode toggles with B key, shows grid overlay
- [ ] Grid cells show green/red for valid/invalid placement
- [ ] All structure types placeable with correct material cost
- [ ] Workbench built → advanced recipes unlock in crafting UI
- [ ] Storage chest adds +16 inventory slots
- [ ] Bed provides full heal on rest
- [ ] Training dummy allows practice swings (no damage dealt)
- [ ] NPC merchant visits after workbench built (10%/min chance)
- [ ] Enemy attack event triggers at camp (5%/night)
- [ ] Build state saves/loads correctly across scene transitions
