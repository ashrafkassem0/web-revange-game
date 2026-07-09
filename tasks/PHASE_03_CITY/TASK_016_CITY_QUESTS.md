# TASK_016 — CITY_QUESTS

## Objective
Design and implement 3 city quests with an HTML quest log UI, objective tracking, rewards, and Death Valley unlocking. In-world quest markers and cellar combat use Canvas 2D.

## Detailed Mechanics & User Stories

### Quest 1: "مشكلة الجرذان" (Rat Infestation)
| Property | Value |
|----------|-------|
| Giver | Tavern Keeper (tavern) |
| Objective | Kill 5 giant rats in tavern cellar |
| Enemies | Giant rat: HP 25, fast, swarms of 3 |
| Reward | 20 coins, 3 cooked meat, rep +10 |
| Unlocks | Tavern Keeper shares rumor about Terror King |

Cellar: enclosed room (400×400 interior), accessible via tavern door. Rats spawn in waves of 3. After 5 kills, quest completes.

### Quest 2: "الكتاب المفقود" (The Lost Book)
| Property | Value |
|----------|-------|
| Giver | Library Scholar (library) |
| Objective | Find lost book in city well (requires rope) |
| Rope | Buy from general merchant (5 coins) |
| Reward | 35 coins, "لعنات الظلام" lore book, rep +15 |
| Unlocks | Terror King weakness: fire (1.5x damage) |

Well: interactive object near plaza. If player has rope, E to descend → small cave (200×200) with book drawn on canvas. Pick up → quest completes.

### Quest 3: "طريق الوادي" (The Valley Path)
| Property | Value |
|----------|-------|
| Giver | Guard Captain (south gate) |
| Objective | Collect 10 valley herbs (near south gate) + 5 wolf teeth |
| Reward | 50 coins, "ممر آمن" map, rep +20 |
| Unlocks | South gate → Death Valley |

Valley herbs: 10 spawn in garden near south gate. Wolf teeth: check inventory. Turn in → gate unlocked.

### Quest UI (HTML Overlay)
- Press `J` → quest log overlay (`#questLog` panel, same modal style as city)
- Active quests: yellow text with progress "جرذان مقتولة: 3/5"
- Completed quests: green with "✔️" prefix, strikethrough
- Quest markers on minimap: yellow `!` (available), blue `?` (turn-in), green dot (objective location) — drawn with `minimapCtx`

### Quest Tracking
```javascript
class QuestManager {
  constructor() {
    this.quests = {};
    this.active = [];
    this.completed = [];
  }

  addQuest(questId) {
    const quest = QUEST_DEFINITIONS[questId];
    quest.state = 'active';
    quest.progress = {};
    quest.objectives.forEach(obj => { quest.progress[obj.id] = 0; });
    this.active.push(quest);
    showToast(`📜 مهمة جديدة: ${quest.name}`);
  }

  updateProgress(questId, objectiveId, delta = 1) {
    const quest = this.active.find(q => q.id === questId);
    if (!quest) return;
    quest.progress[objectiveId] = Math.min(
      quest.progress[objectiveId] + delta,
      quest.objectives.find(o => o.id === objectiveId).count
    );
    // Check if all objectives complete
    if (quest.objectives.every(o => quest.progress[o.id] >= o.count)) {
      this.completeQuest(questId);
    }
  }

  completeQuest(questId) {
    const quest = this.active.find(q => q.id === questId);
    quest.state = 'completed';
    this.completed.push(quest);
    this.active = this.active.filter(q => q.id !== questId);
    // Grant rewards
    giveRewards(quest.rewards);
    showToast(`✔️ ${quest.name} مكتمل!`);
  }
}
```

### Quest Definitions
```javascript
const QUEST_DEFINITIONS = {
  quest_rat_infestation: {
    id: 'quest_rat_infestation',
    name: 'مشكلة الجرذان',
    description: 'اقتل 5 جرذان في قبو الحانة',
    giver: 'npc_tavern_keeper',
    objectives: [
      { id: 'kill_rats', type: 'kill', target: 'giantRat', count: 5 }
    ],
    rewards: { coins: 20, items: { cookedMeat: 3 }, reputation: 10 },
    unlock: 'terror_king_rumor'
  },
  // ...
};
```

### Edge Cases
- **Already Completed:** NPC shows different dialogue, offers repeatable quest ("جلب 10 أعشاب" for 5 coins)
- **No Rope (Quest 2):** Well interaction shows "تحتاج حبلاً لتنزله" hint with rope purchase tip
- **Multiple Active Quests:** No limit, all shown in quest log
- **Quest Item in Inventory:** Book is `questItems.lostBook`, cannot be dropped or sold

## Canvas 2D Implementation Hints
```html
<div id="questLog" class="hidden">
  <h2>📜 المهام</h2>
  <div id="questList"></div>
  <button onclick="closeQuestLog()">إغلاق</button>
</div>
```

```javascript
function refreshQuestLog() {
  const list = document.getElementById('questList');
  list.innerHTML = '';
  QuestManager.active.forEach(q => {
    const progress = q.objectives.map(o =>
      `${o.id}: ${q.progress[o.id]}/${o.count}`
    ).join(', ');
    const el = document.createElement('div');
    el.className = 'quest-active';
    el.textContent = `${q.name} — ${progress}`;
    list.appendChild(el);
  });
  QuestManager.completed.forEach(q => {
    const el = document.createElement('div');
    el.className = 'quest-done';
    el.textContent = `✔️ ${q.name}`;
    list.appendChild(el);
  });
}

// Rat cellar — Canvas 2D interior + plain JS enemy array
class RatCellar {
  constructor() {
    this.canvas = document.createElement('canvas');
    this.canvas.width = 400;
    this.canvas.height = 400;
    this.ctx = this.canvas.getContext('2d');
    this.rats = [];
    this.killCount = 0;
    this.spawnRats();
  }

  spawnRats() {
    for (let i = 0; i < 3; i++) {
      this.rats.push({
        x: 50 + Math.random() * 300,
        y: 50 + Math.random() * 300,
        hp: 25,
        emoji: '🐀'
      });
    }
  }

  draw() {
    const c = this.ctx;
    c.fillStyle = '#2a2018';
    c.fillRect(0, 0, 400, 400);
    // crates, barrels...
    for (const rat of this.rats) {
      if (rat.hp <= 0) continue;
      c.font = '24px Cairo';
      c.textAlign = 'center';
      c.fillText(rat.emoji, rat.x, rat.y);
    }
  }

  onRatKilled(rat) {
    rat.hp = 0;
    this.killCount++;
    QuestManager.updateProgress('quest_rat_infestation', 'kill_rats');
    if (this.rats.every(r => r.hp <= 0) && this.killCount < 5) {
      setTimeout(() => this.spawnRats(), 1000);
    }
  }
}
```

## Verification & Acceptance Criteria
- [ ] All 3 quests available from respective NPCs
- [ ] Quest objectives track correctly (kill counter, item collection)
- [ ] Quest rewards (coins, items, reputation) granted on completion
- [ ] Quest log (J key) shows active + completed with progress
- [ ] Minimap markers for quest NPCs and objectives
- [ ] Rat cellar loads with 3 rats per wave, kill 5 total
- [ ] Lost book found in well cave with rope item
- [ ] Valley herbs collectible near south gate
- [ ] South gate unlocks after Quest 3 completion
- [ ] Repeatable quests available after completion
