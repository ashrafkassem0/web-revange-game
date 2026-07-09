# TASK_008 — ADVANCED_RESOURCES

## Objective
Expand forest resources with herbs, minerals, flowers, honey, and a pickaxe tool, all rendered as Pixi.js sprites with interaction.

## Detailed Mechanics & User Stories

### New Resources
| Resource | Emoji | Spawn Biome | Count | Tool Needed | Respawns |
|----------|-------|-------------|-------|-------------|----------|
| `herb` | 🌿 | Grass | 20 | None (pick E) | 3 min in-game |
| `mineral` | 💎 | Rock (east) | 10 | Pickaxe | Never |
| `flower` | 🌸 | Dark forest | 5 | None | 5 min in-game |
| `honey` | 🍯 | Central trees (beehives) | 3 | Shoot with arrow | Never |

### Visual Rendering (Pixi.js)
- Each resource is a `PIXI.Sprite` with emoji rendered to texture
- Minerals have sparkle: `PIXI.AnimatedSprite` overlay with star frames, loops continuously
- Beehives: `PIXI.Sprite` hanging from tree sprites, bee particles circling (3 small yellow sprites in orbit)
- Herbs/flowers: gently sway via `sprite.rotation = Math.sin(time + offset) * 0.1`

### Pickaxe Tool
- Crafted: 2 stone + 2 stick
- `tools.pickaxe = true` in inventory
- Enables `[E] Mine` interaction on mineral sprites
- Mining animation: 3 hits via E, each hit shakes the mineral sprite (position offset oscillate)

### New Crafting Recipes
| Item | Materials | Effect |
|------|-----------|--------|
| 🧪 Health Potion | 3 herb | Restores 30 HP instantly |
| 💊 Antidote | 2 flower | Cures poison debuff |
| 🏹 Stone Arrow (5) | 1 stone + 1 stick | +5 damage vs rock enemies |

### Interaction Flow
1. Player walks near resource → "اضغط E" prompt (PIXI.Text)
2. Press E → check tool requirement → if met, collect animation (sprite shrinks + flies to player)
3. Resource sprite destroyed, item added to inventory
4. Toast: "+1 🌿 حصلت على أعشاب"

### Edge Cases
- **Tool Missing:** Mineral without pickaxe → "تحتاج فأس حجرية" tooltip
- **Inventory Full:** Resource stays on ground. Toast: "المخزون ممتلئ!"
- **Resource Overlap:** If enemy stands on resource, resource sprite is hidden but collision still works. Player can collect by pressing E at correct position.

## Pixi.js Technical Implementation Hints
```javascript
class Resource extends PIXI.Container {
  constructor(type, x, y) {
    super();
    this.type = type; // 'herb' | 'mineral' | 'flower' | 'honey'
    this.x = x; this.y = y;
    this.collected = false;

    const textures = {
      herb: '🌿', mineral: '💎', flower: '🌸', honey: '🍯'
    };
    const sprite = new PIXI.Text(textures[type], { fontSize: 20 });
    sprite.anchor.set(0.5);
    this.addChild(sprite);

    if (type === 'mineral') {
      // Sparkle overlay
      this.sparkle = new PIXI.AnimatedSprite(sparkleFrames);
      this.sparkle.anchor.set(0.5);
      this.sparkle.animationSpeed = 0.1;
      this.sparkle.play();
      this.addChild(this.sparkle);
    }
  }

  collect() {
    this.collected = true;
    // Animate: scale to 0, then destroy
    gsap.to(this.scale, { x: 0, y: 0, duration: 0.3, onComplete: () => this.destroy() });
  }
}
```

### Generating Textures from Emoji
```javascript
function emojiToTexture(emoji, size = 32) {
  const canvas = document.createElement('canvas');
  canvas.width = size; canvas.height = size;
  const ctx = canvas.getContext('2d');
  ctx.font = `${size * 0.8}px serif`;
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(emoji, size/2, size/2);
  return PIXI.Texture.from(canvas);
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
