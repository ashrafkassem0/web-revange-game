# TASK_013 — NPC_SYSTEM

## Objective
Create an interactive NPC system with dialogue trees, quest givers, and reputation tracking, using HTML/CSS overlay panels (same modal pattern as `game/city/index.html`) and Canvas 2D for in-world NPC drawing.

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

### Dialogue System (HTML Overlay)
- Press `E` near NPC (within 60px) → dialogue panel opens
- Panel: bottom 1/3 of screen, fixed HTML `#dialoguePanel` with semi-transparent black background
- Left: NPC emoji (large, 48px) + name
- Right: Dialogue text with typewriter effect (update `textContent` every 30ms/char)
- Player options: numbered HTML buttons; click or number keys 1–4 to select
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
Quest tracking HUD: press J → HTML overlay with active quest list

### Edge Cases
- **NPC Blocking Path:** If NPC stands in player's way for > 5s, NPC steps aside ("اعذرني" speech bubble drawn with `ctx.fillText` above NPC for 2s)
- **Multiple NPCs Near:** Cycle through with TAB when pressing E: "اضغط TAB للتحدث مع [Name]"
- **NPC at Night:** Some NPCs despawn at night (go home). Others sleep (draw sleeping pose, no interaction).

## Canvas 2D Implementation Hints
```html
<!-- Dialogue panel — HTML overlay like city #modal -->
<div id="dialoguePanel" class="hidden">
  <div class="dialogue-portrait" id="dlgPortrait"></div>
  <div class="dialogue-name" id="dlgName"></div>
  <div class="dialogue-text" id="dlgText"></div>
  <div class="dialogue-options" id="dlgOptions"></div>
</div>
```

```javascript
class NPCDialogue {
  constructor() {
    this.panel = document.getElementById('dialoguePanel');
    this.portrait = document.getElementById('dlgPortrait');
    this.nameEl = document.getElementById('dlgName');
    this.textEl = document.getElementById('dlgText');
    this.optionsEl = document.getElementById('dlgOptions');
    this.currentNpc = null;
    this.typeTimer = null;
  }

  open(npc, dialogueId) {
    this.panel.classList.remove('hidden');
    this.currentNpc = npc;
    this.portrait.textContent = npc.emoji;
    this.nameEl.textContent = npc.name;
    this.startDialogue(dialogueId || 'default');
  }

  startDialogue(id) {
    const node = this.currentNpc.dialogues[id];
    if (!node) return;
    this.typewrite(node.text);
    this.renderOptions(node.options);
  }

  renderOptions(options) {
    this.optionsEl.innerHTML = '';
    options.forEach((opt, i) => {
      const btn = document.createElement('button');
      btn.className = 'dialogue-opt';
      btn.textContent = `${i + 1}. ${opt.text}`;
      btn.onclick = () => {
        if (opt.action) opt.action();
        if (opt.nextId) this.startDialogue(opt.nextId);
        else this.close();
      };
      this.optionsEl.appendChild(btn);
    });
  }

  typewrite(text) {
    clearInterval(this.typeTimer);
    this.textEl.textContent = '';
    let i = 0;
    this.typeTimer = setInterval(() => {
      if (i >= text.length) { clearInterval(this.typeTimer); return; }
      this.textEl.textContent += text[i++];
    }, 30);
  }

  close() {
    this.panel.classList.add('hidden');
    clearInterval(this.typeTimer);
    if (window.sceneManager) window.sceneManager.onResume();
  }
}

// In-world NPCs: draw each frame with ctx (emoji + circle), like city drawNPCs()
function drawNPCs(ctx) {
  for (const npc of NPCS) {
    ctx.beginPath();
    ctx.arc(npc.x - camera.x, npc.y - camera.y, 14, 0, Math.PI * 2);
    ctx.fillStyle = npc.color;
    ctx.fill();
    ctx.font = '20px Cairo';
    ctx.textAlign = 'center';
    ctx.fillText(npc.emoji, npc.x - camera.x, npc.y - camera.y + 6);
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
