# TASK_028 — SKILL_TREE_LEVEL_UP

## Objective
Implement a full skill tree and level-up system with 3 branches (Strength, Precision, Endurance) using an HTML/CSS interactive tree UI overlay.

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

### Skill UI (HTML/CSS overlay)
- Press `K` → overlay with 3 columns
- Each column: 5 skill nodes connected by CSS lines (or SVG connectors)
- Unlocked: gold border + colored icon
- Available: pulsing blue border (can afford)
- Locked: gray, locked icon overlay
- Hover tooltip: name + description + cost
- Click to learn (if enough points)
- No respec (permanent choices)

### Level Up Notification
- Screen flash via brief white `rgba` canvas overlay or CSS brightness flash (500ms)
- "لقد رفعت مستواك! أصبحت الآن المستوى X" (HTML toast, 3s)
- Particle celebration: 30 golden spark particles burst from center (JS particle array on canvas)

## Implementation Hints
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
    const branchPoints = this.getBranchPoints(skill.branch);
    const tier = this.skills[skill.branch].indexOf(skill) + 1;
    return branchPoints >= (tier - 1) * 2;
  }

  learn(skill) {
    if (!this.canLearn(skill)) return false;
    this.learned.push(skill.id);
    this.availablePoints -= skill.cost;
    this.applyEffect(skill);
    return true;
  }

  applyEffect(skill) {
    switch (skill.id) {
      case 'heavySwing': Player.bonuses.swordMultiplier = 1.5; break;
      case 'toughSkin': Player.maxHp += 10; break;
      // ...
    }
  }
}
```

```html
<div id="skill-tree-overlay" class="hidden">
  <h2>🌳 شجرة المهارات</h2>
  <p id="skill-points">النقاط: 0</p>
  <div class="skill-branches">
    <div class="branch" data-branch="strength">
      <h3>القوة ⚔️</h3>
      <!-- skill nodes as buttons -->
    </div>
    <div class="branch" data-branch="precision">
      <h3>الدقة 🏹</h3>
    </div>
    <div class="branch" data-branch="endurance">
      <h3>التحمل 🛡️</h3>
    </div>
  </div>
</div>
```

```javascript
class SkillTreeUI {
  constructor(skillTree) {
    this.el = document.getElementById('skill-tree-overlay');
    this.skillTree = skillTree;
    this.render();
  }

  toggle() {
    this.el.classList.toggle('hidden');
    if (!this.el.classList.contains('hidden')) this.refresh();
  }

  createSkillNode(skill, branch) {
    const btn = document.createElement('button');
    btn.className = 'skill-node';
    const learned = this.skillTree.learned.includes(skill.id);
    const available = this.skillTree.canLearn({ ...skill, branch });
    btn.classList.add(learned ? 'learned' : available ? 'available' : 'locked');
    btn.innerHTML = `<span class="icon">${skill.icon}</span>
      <span class="name">${skill.name}</span>
      <span class="cost">${skill.cost} نقطة</span>`;
    btn.title = `${skill.desc}`;
    if (available) {
      btn.addEventListener('click', () => {
        if (this.skillTree.learn({ ...skill, branch })) this.refresh();
      });
    }
    return btn;
  }

  refresh() {
    document.getElementById('skill-points').textContent =
      `النقاط: ${this.skillTree.availablePoints}`;
    // Re-render nodes with updated states
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
- [ ] Skill tree UI renders as HTML/CSS overlay with interactive nodes
