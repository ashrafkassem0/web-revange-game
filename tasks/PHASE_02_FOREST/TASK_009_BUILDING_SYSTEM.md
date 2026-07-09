# TASK_009 — BUILDING_SYSTEM

## Objective
Implement a base-camp building system using a Canvas 2D grid overlay and placeable structure entities (extend `forest-build.js` patterns).

## Detailed Mechanics & User Stories

### Camp Location
- Fixed clearing in center-west of forest map (x:800, y:1600)
- Flat grassy area with "build zone" indicator (`ctx` dashed rectangle via `setLineDash`)

### Build Mode
- Press `B` to toggle
- Enter: combat pauses (enemies frozen), grid overlay drawn on canvas
- Grid: 8×8 cells, each 64×64 px, green/red tint for valid/invalid placement

### Build Menu
HTML panel (city-modal style) or tab panel with categories:
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
3. Click to place → if materials sufficient → progress bar (3s, HTML or `ctx` bar) → structure appears in world
4. Materials deducted from inventory

### Workbench Upgrade
- Tier 2: 5 minerals + 2 horn → unlocks Advanced Crafting (Tier 3 recipes from TASK_021)
- Upgrade UI: click workbench → HTML "تطوير" button + cost + progress bar

### NPC Visitors
- After workbench built: 10% chance per minute a traveling merchant NPC appears at camp
- NPC entity walks to camp center, stays for 30 seconds, offers random trade (HTML modal like city merchant)

### Structure Rendering (Canvas 2D)
- Each structure is a JS object with `type, x, y, hp` drawn in the world pass (see existing `forest-build.js`)
- Tent: triangle / polygon shapes with `ctx`
- Workbench: rectangles
- Wall: horizontal/vertical segment rects
- All structures cast shadows (dark semi-transparent ellipse at base)

### Edge Cases
- **Insufficient Materials:** Build button grayed out, tooltip "تحتاج: 3 🪵 إضافية"
- **Grid Full:** "ليس هناك مساحة كافية" toast
- **Enemy Attack Event:** Rare (5%/night) — wolves attack camp. If walls exist, block first wave. Player must defend.
- **Save State:** Structures saved in `maps.forest.campStructures` array. Restored on scene load.

## Canvas 2D Implementation Hints
```javascript
class BuildSystem {
  constructor() {
    this.grid = Array.from({ length: 8 }, () => Array(8).fill(null));
    this.mode = false;
    this.menuEl = document.getElementById('build-menu'); // HTML overlay
  }

  enterMode() {
    this.mode = true;
    if (this.menuEl) this.menuEl.hidden = false;
    enemies.forEach(e => e.frozen = true);
  }

  drawGrid(ctx, originX, originY, camera, ZOOM) {
    for (let gy = 0; gy < 8; gy++) {
      for (let gx = 0; gx < 8; gx++) {
        const wx = originX + gx * 64;
        const wy = originY + gy * 64;
        const sx = (wx - camera.x) * ZOOM;
        const sy = (wy - camera.y) * ZOOM;
        const valid = this.canPlace(gx, gy, selectedStructure);
        ctx.strokeStyle = valid ? 'rgba(0,255,0,0.5)' : 'rgba(255,0,0,0.5)';
        ctx.fillStyle = valid ? 'rgba(0,255,0,0.1)' : 'rgba(255,0,0,0.1)';
        ctx.fillRect(sx, sy, 64 * ZOOM, 64 * ZOOM);
        ctx.strokeRect(sx, sy, 64 * ZOOM, 64 * ZOOM);
      }
    }
  }

  placeStructure(type, gx, gy) {
    if (!this.canPlace(gx, gy, type)) return;
    const cost = STRUCTURES[type].cost;
    if (!InventoryManager.hasItems(cost)) { showToast('المواد غير كافية'); return; }
    InventoryManager.removeItems(cost);
    this.grid[gy][gx] = type;
    // push into campStructures array; forest-build draw handles visuals
  }
}

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
