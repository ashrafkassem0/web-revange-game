# TASK_013 — NPC_SYSTEM

## Objective
Create an interactive NPC system with dialogue trees, quest givers, and reputation tracking, all rendered via Pixi.js containers and text.

## Detailed Mechanics & User Stories

### NPC Data Model
```javascript
{
  id: 'npc_tavern_keeper',
  name: 'صاحب الحانة',
  title: 'حارس البوابة الجنوبية سابقاً',
  emoji: '🧑‍🍳',
  position: { x: 500, y: 700 },
  building: 'tavern',
  dialogues: {
    default: { text: 'أهلاً بك أيها المسافر...', options: [...] },
    quest_active: { text: 'هل تقدمت في مهمة الجرذان؟', options: [...] },
    quest_complete: { text: 'شكراً لك أيها البطل!', options: [...] }
  },
  quests: ['quest_rat_infestation'],
  shop: null, // or merchant definition
  type: 'quest_giver' // merchant | healer | blacksmith | quest_giver | lore
}
```

### Dialogue System (Pixi.js UI)
- Press `E` near NPC (within 60px) → dialogue panel opens
- Panel: bottom 1/3 of screen, `PIXI.Graphics` black semi-transparent rect
- Left: NPC emoji sprite (large, 48px) + name (PIXI.Text)
- Right: Dialogue text with typewriter effect (PIXI.Text, 30ms/char)
- Player options: numbered PIXI.Text buttons with `interactive = true`, `pointerdown` to select
- Dialogue tree: `{ text, options: [{ text, nextId, action }] }`
- Close: click outside panel or press Escape

### Reputation System
- Score: 0–100, starts at 50
- Increases: complete quest (+10), donate items (+1/item), buy from merchant (+1/purchase)
- Decreases: steal (pickpocket minigame, -15), attack NPC (-20)
- Rep > 80: 10% discount at all merchants
- Rep < 20: NPCs refuse dialogue, guards attack on sight

### Quest Giver NPCs
3 quest-giving NPCs (tavern keeper, scholar, guard captain)
Quest states: `available → active → completed`
Quest tracking HUD: press J → PIXI overlay with active quest list

### Edge Cases
- **NPC Blocking Path:** If NPC stands in player's way for > 5s, NPC steps aside ("اعذرني" speech bubble via PIXI.Text above sprite for 2s)
- **Multiple NPCs Near:** Cycle through with TAB when pressing E: "اضغط TAB للتحدث مع [Name]"
- **NPC at Night:** Some NPCs despawn at night (go home). Others sleep (show sleeping sprite, no interaction).

## Pixi.js Technical Implementation Hints
```javascript
class NPCDialogue extends PIXI.Container {
  constructor() {
    super();
    this.visible = false;
    this.currentNode = null;

    // Background panel
    const bg = new PIXI.Graphics();
    bg.beginFill(0x000000, 0.85);
    bg.drawRect(0, App.screen.height * 0.66, App.screen.width, App.screen.height * 0.34);
    bg.endFill();
    this.addChild(bg);

    // NPC portrait
    this.portrait = new PIXI.Text('', { fontSize: 48 });
    this.portrait.x = 20; this.portrait.y = App.screen.height * 0.66 + 20;
    this.addChild(this.portrait);

    // NPC name
    this.nameText = new PIXI.Text('', { fontSize: 18, fill: 0xFFD700, fontWeight: 'bold' });
    this.nameText.x = 80; this.nameText.y = App.screen.height * 0.66 + 15;
    this.addChild(this.nameText);

    // Dialogue text (typewriter)
    this.dialogueText = new PIXI.Text('', { fontSize: 20, fill: 0xFFFFFF, wordWrap: true, wordWrapWidth: App.screen.width - 120 });
    this.dialogueText.x = 80; this.dialogueText.y = App.screen.height * 0.66 + 50;
    this.addChild(this.dialogueText);

    // Options container
    this.optionsContainer = new PIXI.Container();
    this.optionsContainer.y = App.screen.height * 0.66 + 120;
    this.addChild(this.optionsContainer);
  }

  open(npc, dialogueId) {
    this.visible = true;
    this.currentNpc = npc;
    this.portrait.text = npc.emoji;
    this.nameText.text = npc.name;
    this.startDialogue(dialogueId || 'default');
  }

  startDialogue(id) {
    const node = this.currentNpc.dialogues[id];
    if (!node) return;
    this.currentNode = node;
    this.typewrite(node.text);
    this.renderOptions(node.options);
  }

  renderOptions(options) {
    this.optionsContainer.removeChildren();
    options.forEach((opt, i) => {
      const text = new PIXI.Text(`${i + 1}. ${opt.text}`, {
        fontSize: 18, fill: 0x88CCFF
      });
      text.y = i * 30;
      text.interactive = true;
      text.cursor = 'pointer';
      text.on('pointerdown', () => {
        if (opt.action) opt.action();
        if (opt.nextId) this.startDialogue(opt.nextId);
        else this.close();
      });
      this.optionsContainer.addChild(text);
    });
  }

  typewrite(text) {
    this.dialogueText.text = '';
    let i = 0;
    const timer = setInterval(() => {
      if (i >= text.length) { clearInterval(timer); return; }
      this.dialogueText.text += text[i++];
    }, 30);
  }

  close() {
    this.visible = false;
    // Resume game
    if (window.sceneManager) window.sceneManager.onResume();
  }
}
```

## Verification & Acceptance Criteria
- [ ] E opens dialogue panel near NPCs
- [ ] Typewriter text effect works (30ms/char)
- [ ] Player response options clickable (mouse + number keys 1-4)
- [ ] Dialogue tree branches correctly
- [ ] Reputation score tracks and affects gameplay (discounts, aggro)
- [ ] Quest from NPC appears in quest log
- [ ] NPC steps aside if blocking for >5s
- [ ] Multiple NPCs show TAB-cycle prompt
- [ ] Nighttime NPC despawn/sleep works
