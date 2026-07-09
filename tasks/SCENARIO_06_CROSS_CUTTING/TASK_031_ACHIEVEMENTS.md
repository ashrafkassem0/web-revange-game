# TASK_031 — ACHIEVEMENTS

## Objective
Create an achievement/badge system with 16 achievements, Pixi.js popup notifications, progress tracking, and XP rewards.

## Detailed Mechanics & User Stories

### Achievement List
| ID | Name | Condition | XP |
|----|------|-----------|-----|
| `first_kill` | القاتل المبتدئ | Kill first enemy | 50 |
| `wolf_hunter` | صياد الذئاب | Kill 10 wolves | 100 |
| `rabbit_slayer` | لا ترحم | Kill 20 rabbits | 100 |
| `fisherman` | الصياد الماهر | Catch 10 fish | 50 |
| `crafter` | الحرفي | Craft 10 items | 100 |
| `explorer_forest` | مستكشف الغابة | Walk 10km in forest | 150 |
| `campsite` | مخيمك الخاص | Build all camp structures | 200 |
| `merchant` | التاجر | Buy 5 items from merchant | 50 |
| `quest_complete` | بطل المدينة | Complete all city quests | 200 |
| `valley_survivor` | الناجي | Survive 3 sandstorms | 150 |
| `elite_hunter` | صياد النخبة | Kill all 5 DV elites | 300 |
| `gatekeeper_slayer` | كاسر الأبواب | Defeat all 3 gatekeepers | 500 |
| `revenge` | الانتقام | Defeat Terror King | 1000 |
| `no_death` | الأسطورة الحية | Complete game without dying (Secret) | 2000 |
| `collector` | الجامع | Collect 50 of every resource | 300 |
| `max_level` | القوي | Reach level 20 | 500 |

### Achievement Popup (Pixi.js)
- Gold badge sprite + name + "+XXX XP" text
- Slides in from right (PIXI.Container, gsap x animation)
- Duration: 3 seconds, then slides out
- Queue system: if multiple achievements unlock at once, show sequentially

### Achievement Screen
- Accessible from main menu "الإنجازات" button and in-game pause
- Grid of 16 cards (PIXI.Container grid)
- Unlocked: gold border + emoji visible + checkmark
- Locked: gray, name shown but emoji hidden (or "???" for secret)
- Progress bar on hover for tracked achievements (e.g., "7/10 ذئاب")

### XP Reward
- Achievement XP added on top of earned XP
- Can trigger level-up
- Notification if level-up occurs: chained achievement popup → level-up popup

### Edge Cases
- **Already Earned:** Check `achievements.includes(id)` before granting
- **Secret Achievements:** `no_death` shows "???" name and "??? وصف" until unlocked
- **Offline:** Achievements saved locally, sync to server via SyncService

## Pixi.js Technical Implementation Hints
```javascript
class AchievementManager {
  constructor() {
    this.achievements = new Map();
    this.unlocked = GameState.load('achievements', []);
    this.initDefinitions();
  }

  initDefinitions() {
    const defs = [
      { id: 'first_kill', name: 'القاتل المبتدئ', desc: 'اقتل أول عدو', secret: false, condition: { type: 'kill_count', target: 'any', count: 1 }, xp: 50 },
      { id: 'no_death', name: 'الأسطورة الحية', desc: 'أكمل اللعبة دون موت', secret: true, condition: { type: 'no_deaths' }, xp: 2000 },
      // ... 14 more
    ];
    defs.forEach(d => this.achievements.set(d.id, d));
  }

  check(type, data) {
    for (const [id, def] of this.achievements) {
      if (this.unlocked.includes(id)) continue;
      if (this.evaluateCondition(def.condition, type, data)) {
        this.unlock(id);
      }
    }
  }

  evaluateCondition(condition, type, data) {
    if (condition.type !== type) return false;
    switch (type) {
      case 'kill_count':
        return killCounts[condition.target] >= condition.count;
      case 'no_deaths':
        return GameState.load('totalDeaths', 0) === 0;
      // ...
    }
  }

  unlock(id) {
    this.unlocked.push(id);
    GameState.save('achievements', this.unlocked);
    const def = this.achievements.get(id);
    // Grant XP
    Player.addXp(def.xp);
    // Show notification
    AchievementUI.showNotification(def);
  }
}

class AchievementUI {
  static showNotification(def) {
    const container = new PIXI.Container();
    container.x = App.screen.width; // Start off-screen right
    container.y = 100;

    const bg = new PIXI.Graphics();
    bg.beginFill(0x1a1a2e, 0.95);
    bg.drawRoundedRect(0, 0, 300, 80, 8);
    bg.endFill();
    bg.lineStyle(2, 0xFFD700);
    bg.drawRoundedRect(0, 0, 300, 80, 8);
    container.addChild(bg);

    const icon = new PIXI.Text('🏆', { fontSize: 36 });
    icon.x = 15; icon.y = 22;
    container.addChild(icon);

    const name = new PIXI.Text(def.name, { fontSize: 18, fill: 0xFFD700, fontWeight: 'bold' });
    name.x = 65; name.y = 15;
    container.addChild(name);

    const xpText = new PIXI.Text(`+${def.xp} XP`, { fontSize: 14, fill: 0x88CCFF });
    xpText.x = 65; xpText.y = 42;
    container.addChild(xpText);

    LAYERS.overlay.addChild(container);

    // Slide in
    gsap.to(container, { x: App.screen.width - 320, duration: 0.5, ease: 'back.out' });
    // Wait + slide out
    gsap.to(container, { x: App.screen.width + 20, duration: 0.5, delay: 3, ease: 'power2.in', onComplete: () => container.destroy() });
  }

  static showScreen() {
    const container = new PIXI.Container();
    // Grid layout of all 16 achievements
    // ... (similar to skill tree grid but with progress indicators)
  }
}
```

## Verification & Acceptance Criteria
- [ ] All 16 achievements tracked correctly
- [ ] Achievement popup slides in from right with gold border
- [ ] Queue system: sequential popups for multiple unlocks
- [ ] Achievement screen shows grid of cards with correct state
- [ ] Progress bars visible on hover (e.g., "7/10 ذئاب")
- [ ] Secret achievements hidden until unlocked
- [ ] No duplicate unlocks (already-earned check)
- [ ] XP reward adds to player XP, can trigger level-up
- [ ] Achievements persist across sessions and sync to backend
