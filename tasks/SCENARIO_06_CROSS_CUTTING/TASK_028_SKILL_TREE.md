# TASK_028 — SKILL_TREE_LEVEL_UP

## Objective
Implement a full skill tree and level-up system with 3 branches (Strength, Precision, Endurance) using a Pixi.js interactive tree UI.

## Detailed Mechanics & User Stories

### Experience System
| Level | XP Needed | Cumulative | Bonus |
|-------|-----------|------------|-------|
| 1→2 | 100 | 100 | +10 HP, +2 ATK, +1 DEF, +1 skill point |
| 2→3 | 250 | 350 | +10 HP, +2 ATK, +1 DEF, +1 skill point |
| 3→4 | 500 | 850 | ... |
| ... | ×1.5 each | ... | ... |
| 20 | 50000 | ~100k | Max level |

### XP Sources
- Kill enemy: 5-50 XP (based on enemy type)
- Complete quest: 50-500 XP
- Discover location: 10 XP
- Craft item: 15 XP
- Catch fish: 5 XP

### Skill Tree (3 Branches × 5 Tiers = 15 skills)

**🌳 القوة (Strength) — Combat**
| Tier | Skill | Cost | Effect |
|------|-------|------|--------|
| 1 | Heavy Swing | 1 | Sword 1.5x damage |
| 2 | Combo Strike | 2 | 3rd consecutive hit 2x damage |
| 3 | Whirlwind | 3 | Spin attack, all enemies in 60px |
| 4 | Berserker | 4 | When HP < 20%, 2x damage |
| 5 | Execute | 5 | Attacks kill enemies with HP < 20% |

**🏹 الدقة (Precision) — Ranged**
| Tier | Skill | Cost | Effect |
|------|-------|------|--------|
| 1 | Steady Aim | 1 | Bow accuracy +20% |
| 2 | Piercing Shot | 2 | Arrow passes through 1 enemy |
| 3 | Rapid Fire | 3 | Fire 3 arrows in succession |
| 4 | Sniper | 4 | +50% damage beyond 200px |
| 5 | Hail of Arrows | 5 | Rain 10 arrows over area (3s channel) |

**🛡️ التحمل (Endurance) — Survival**
| Tier | Skill | Cost | Effect |
|------|-------|------|--------|
| 1 | Tough Skin | 1 | +10 max HP |
| 2 | Regeneration | 2 | 1 HP/5s out of combat |
| 3 | Iron Will | 3 | Poison/fire DoT -50% |
| 4 | Second Wind | 4 | Revive once per fight with 30% HP |
| 5 | Immortal | 5 | All healing doubled |

### Skill UI (Pixi.js)
- Press `K` → overlay with 3 columns
- Each column: 5 skill nodes connected by lines (PIXI.Graphics lines)
- Unlocked: gold border + colored icon
- Available: pulsing blue border (can afford)
- Locked: gray, locked icon overlay
- Hover tooltip: name + description + cost
- Click to learn (if enough points)
- No respec (permanent choices)

### Level Up Notification
- Screen flash via PIXI.AlphaFilter (brightness spike for 500ms)
- "لقد رفعت مستواك! أصبحت الآن المستوى X" (PIXI.Text, 3s toast)
- Particle celebration: 30 golden spark particles burst from center

## Pixi.js Technical Implementation Hints
```javascript
class SkillTree {
  constructor() {
    this.availablePoints = 0;
    this.learned = [];
    this.skills = {
      strength: [
        { id: 'heavySwing', name: 'ضربة ثقيلة', desc: '1.5x ضرر السيف', cost: 1, prereq: null, icon: '⚔️' },
        { id: 'comboStrike', name: 'ضربة متسلسلة', desc: '2x الضربة الثالثة', cost: 2, prereq: 'heavySwing' },
        { id: 'whirlwind', name: 'زوبعة', desc: 'هجوم دائري 60px', cost: 3, prereq: 'comboStrike' },
        { id: 'berserker', name: 'همجي', desc: '2x ضرر عند HP<20%', cost: 4, prereq: 'whirlwind' },
        { id: 'execute', name: 'إعدام', desc: 'قتل فوري إذا HP<20%', cost: 5, prereq: 'berserker' }
      ],
      precision: [ /* ... */ ],
      endurance: [ /* ... */ ]
    };
  }

  canLearn(skill) {
    if (this.learned.includes(skill.id)) return false;
    if (this.availablePoints < skill.cost) return false;
    if (skill.prereq && !this.learned.includes(skill.prereq)) return false;
    // Check branch total: tier 2 requires 1 point in branch, tier 3 needs 3 total, etc.
    const branchPoints = this.getBranchPoints(skill.branch);
    const tier = this.skills[skill.branch].indexOf(skill) + 1;
    return branchPoints >= (tier - 1) * 2; // Need 0/2/4/6/8 branch points for tiers 1-5
  }

  learn(skill) {
    if (!this.canLearn(skill)) return false;
    this.learned.push(skill.id);
    this.availablePoints -= skill.cost;
    this.applyEffect(skill);
    return true;
  }

  applyEffect(skill) {
    // Apply bonuses to player stats
    switch (skill.id) {
      case 'heavySwing': Player.bonuses.swordMultiplier = 1.5; break;
      case 'toughSkin': Player.maxHp += 10; break;
      // ...
    }
  }
}

class SkillTreeUI extends PIXI.Container {
  constructor(skillTree) {
    super();
    this.visible = false;

    // Background
    const bg = new PIXI.Graphics();
    bg.beginFill(0x0a0a1e, 0.95);
    bg.drawRect(0, 0, App.screen.width, App.screen.height);
    bg.endFill();
    this.addChild(bg);

    // Title
    const title = new PIXI.Text('🌳 شجرة المهارات', { fontSize: 32, fill: 0xFFD700 });
    title.anchor.set(0.5);
    title.x = App.screen.width / 2; title.y = 30;
    this.addChild(title);

    // Points remaining
    this.pointsText = new PIXI.Text('', { fontSize: 20, fill: 0x88CCFF });
    this.pointsText.x = App.screen.width / 2; this.pointsText.y = 75;
    this.addChild(this.pointsText);

    // 3 columns
    const branches = ['strength', 'precision', 'endurance'];
    const branchNames = ['القوة ⚔️', 'الدقة 🏹', 'التحمل 🛡️'];
    const branchColors = [0xFF4444, 0x44FF44, 0x4488FF];

    branches.forEach((branch, bi) => {
      const colX = 80 + bi * (App.screen.width / 3);
      // Branch title
      const bTitle = new PIXI.Text(branchNames[bi], { fontSize: 22, fill: branchColors[bi] });
      bTitle.x = colX; bTitle.y = 120;
      this.addChild(bTitle);

      // Skills
      skillTree.skills[branch].forEach((skill, si) => {
        const sy = 170 + si * 90;
        const node = this.createSkillNode(skill, branchColors[bi], colX, sy);
        this.addChild(node);

        // Connection line to next skill
        if (si < skillTree.skills[branch].length - 1) {
          const line = new PIXI.Graphics();
          line.lineStyle(2, branchColors[bi], 0.3);
          line.moveTo(colX + 80, sy + 40);
          line.lineTo(colX + 80, sy + 90);
          this.addChild(line);
        }
      });
    });
  }

  createSkillNode(skill, color, x, y) {
    const node = new PIXI.Container();
    node.x = x; node.y = y;
    const learned = skillTree.learned.includes(skill.id);
    const available = skillTree.canLearn(skill);

    // Background circle
    const circle = new PIXI.Graphics();
    circle.beginFill(learned ? color : available ? 0x444488 : 0x333333);
    circle.lineStyle(2, learned ? 0xFFD700 : available ? 0x88CCFF : 0x555555);
    circle.drawCircle(40, 20, 30);
    circle.endFill();
    node.addChild(circle);

    // Icon
    const icon = new PIXI.Text(skill.icon, { fontSize: 18 });
    icon.anchor.set(0.5);
    icon.x = 40; icon.y = 20;
    node.addChild(icon);

    // Name
    const nameT = new PIXI.Text(skill.name, { fontSize: 14, fill: learned ? 0xFFD700 : 0xCCCCCC });
    nameT.x = 80; nameT.y = 5;
    node.addChild(nameT);

    // Cost
    const costT = new PIXI.Text(`${skill.cost} نقطة`, { fontSize: 12, fill: 0x888888 });
    costT.x = 80; costT.y = 25;
    node.addChild(costT);

    // Click handler
    if (available) {
      circle.interactive = true;
      circle.cursor = 'pointer';
      circle.on('pointerdown', () => {
        if (skillTree.learn(skill)) this.refresh();
      });
    }

    // Hover tooltip
    circle.interactive = true;
    circle.on('pointerover', () => this.showTooltip(skill, node));
    circle.on('pointerout', () => this.hideTooltip());

    return node;
  }
}
```

## Verification & Acceptance Criteria
- [ ] XP accumulates from kills, quests, discoveries, crafting
- [ ] Level up restores HP fully, grants stat bonuses + skill point
- [ ] 15 skills across 3 branches (5 per branch)
- [ ] Skills learnable with sufficient points and prerequisites met
- [ ] Skill effects apply correctly (damage multipliers, healing bonuses)
- [ ] Prerequisite chain enforced (tier 2 needs tier 1, etc.)
- [ ] Max level 20 achievable
- [ ] Level up notification with particle celebration
- [ ] No respec (permanent choices)
- [ ] Skill tree UI renders via Pixi.js with interactive nodes
