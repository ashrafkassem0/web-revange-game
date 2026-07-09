# TASK_008 — ADVANCED_RESOURCES

## Objective
Expand forest resources with herbs, minerals, flowers, honey, and a pickaxe tool, all represented as plain JS entities drawn with Canvas 2D and collected via existing E-interact flow.

## Detailed Mechanics & User Stories

### New Resources
| Resource | Emoji | Spawn Biome | Count | Tool Needed | Respawns |
|----------|-------|-------------|-------|-------------|----------|
| `herb` | 🌿 | Grass | 20 | None (pick E) | 3 min in-game |
| `mineral` | 💎 | Rock (east) | 10 | Pickaxe | Never |
| `flower` | 🌸 | Dark forest | 5 | None | 5 min in-game |
| `honey` | 🍯 | Central trees (beehives) | 3 | Shoot with arrow | Never |

### Visual Rendering (Canvas 2D)
- Each resource is a JS object `{ type, x, y, collected }` drawn with `ctx.fillText(emoji)` or small shapes
- Minerals have sparkle: overlay stars drawn with `ctx` that pulse alpha/scale over time
- Beehives: drawn hanging from tree trunks; bee particles as 3 small yellow dots orbiting (JS array)
- Herbs/flowers: gently sway via `ctx.save(); ctx.translate; ctx.rotate(Math.sin(time + offset) * 0.1)`

### Pickaxe Tool
- Crafted: 2 stone + 2 stick
- `tools.pickaxe = true` in inventory
- Enables `[E] Mine` interaction on mineral entities
- Mining animation: 3 hits via E, each hit shakes the mineral (temporary position offset)

### New Crafting Recipes
| Item | Materials | Effect |
|------|-----------|--------|
| 🧪 Health Potion | 3 herb | Restores 30 HP instantly |
| 💊 Antidote | 2 flower | Cures poison debuff |
| 🏹 Stone Arrow (5) | 1 stone + 1 stick | +5 damage vs rock enemies |

### Interaction Flow
1. Player walks near resource → "اضغط E" prompt (`ctx.fillText` or HTML prompt like forest)
2. Press E → check tool requirement → if met, collect animation (scale shrink + fly toward player via lerp)
3. Resource marked collected / removed from array, item added to inventory
4. Toast: "+1 🌿 حصلت على أعشاب"

### Edge Cases
- **Tool Missing:** Mineral without pickaxe → "تحتاج فأس حجرية" tooltip
- **Inventory Full:** Resource stays on ground. Toast: "المخزون ممتلئ!"
- **Resource Overlap:** If enemy stands on resource, resource is not drawn but collision still works. Player can collect by pressing E at correct position.

## Canvas 2D Implementation Hints
```javascript
class Resource {
  constructor(type, x, y) {
    this.type = type; // 'herb' | 'mineral' | 'flower' | 'honey'
    this.x = x; this.y = y;
    this.collected = false;
    this.scale = 1;
    this.offset = Math.random() * Math.PI * 2;
  }

  draw(ctx, camera, ZOOM) {
    if (this.collected && this.scale <= 0) return;
    const sx = (this.x - camera.x) * ZOOM;
    const sy = (this.y - camera.y) * ZOOM;
    const emoji = { herb: '🌿', mineral: '💎', flower: '🌸', honey: '🍯' }[this.type];
    ctx.save();
    ctx.translate(sx, sy);
    ctx.rotate(Math.sin(Date.now() * 0.002 + this.offset) * 0.1);
    ctx.scale(this.scale, this.scale);
    ctx.font = '20px serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(emoji, 0, 0);
    if (this.type === 'mineral') {
      const a = 0.4 + Math.sin(Date.now() * 0.008) * 0.3;
      ctx.fillStyle = `rgba(255,255,200,${a})`;
      ctx.fillText('✦', 6, -8);
    }
    ctx.restore();
  }

  collect(onDone) {
    this.collected = true;
    // animate scale → 0 over ~300ms in update(), then onDone()
    this._collecting = true;
  }

  update(dt) {
    if (this._collecting) {
      this.scale -= dt * 3;
      if (this.scale <= 0) { this.scale = 0; this._collecting = false; }
    }
  }
}
```

### Emoji helper (optional offscreen icon)
```javascript
function emojiToImage(emoji, size = 32) {
  const c = document.createElement('canvas');
  c.width = size; c.height = size;
  const cctx = c.getContext('2d');
  cctx.font = `${size * 0.8}px serif`;
  cctx.textAlign = 'center'; cctx.textBaseline = 'middle';
  cctx.fillText(emoji, size / 2, size / 2);
  return c; // draw with ctx.drawImage(c, sx, sy)
}
```

## Verification & Acceptance Criteria
- [ ] Herbs appear in grass areas, collectible with E (no tool needed)
- [ ] Minerals appear in rock areas, need pickaxe to mine
- [ ] Flowers appear in dark forest
- [ ] Beehives on trees, shoot with arrow → honey drops as pickup
- [ ] Pickaxe craftable with 2 stone + 2 stick
- [ ] Health potion craftable with 3 herbs, restores 30 HP
- [ ] Antidote craftable with 2 flowers, cures poison
- [ ] Stone arrows craftable, +5 damage vs rock enemies
- [ ] Herb respawns after 3 min in-game
- [ ] No-tool resources show interaction; tool-required show tooltip
