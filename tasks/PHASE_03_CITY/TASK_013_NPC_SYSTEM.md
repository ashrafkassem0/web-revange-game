# TASK_013 — NPC_SYSTEM

## Objective
Extend the existing three city NPCs (`merchant`, `healer`, `blacksmith` in `game/city/index.html`) with light Arabic dialogue lines and persistence via `maps.city.spokenToNpcs`. Keep the HTML `#modal` pattern — **no** full reputation RPG, quest-log HUD, or night despawn system.

## Current Baseline
```javascript
const NPCS = [
  { id: 'merchant',   emoji: '🧑‍💼', label: 'التاجر',   onInteract() { openMerchant(); } },
  { id: 'healer',     emoji: '🧑‍⚕️', label: 'المعالج', onInteract() { openHealer(); } },
  { id: 'blacksmith', emoji: '⚒️',   label: 'الحداد',  onInteract() { openBlacksmith(); } },
];
// E within 55px → npc.onInteract(); Escape closes #modal
```
Save schema already has `maps.city.spokenToNpcs: []` in `game/js/shared.js` (`DEFAULT_MAPS.city`).

## Detailed Mechanics & User Stories

### Light dialogue (before service UI)
1. Player presses `E` near an NPC.
2. First open: short greeting modal (1–3 Arabic lines + button «متابعة» / «تحدث»).
3. On continue: existing service UI (`openMerchant` / `openHealer` / `openBlacksmith`).
4. Later visits: shorter line or skip straight to service if already spoken (optional toggle).

Example lines (keep Arabic):
| NPC | First visit | Return |
|-----|-------------|--------|
| التاجر | «أهلاً أيها المسافر… لدي سهام مقابل مواردك.» | «عدت؟ حسناً، لنرَ ما لديك.» |
| المعالج | «الجروح كثيرة في هذه البلاد… هل تحتاج علاجاً؟» | «الصحة أولاً. ماذا تحتاج؟» |
| الحداد | «أرى معداتك… أصنع في الغابة، وأراجع هنا.» | «أظهر لي ما صنعت.» |

### Persistence
```javascript
function markSpoken(npcId) {
  const city = GameState.getMapState?.('city') || GameState.load('maps')?.city
    || { completedQuests: [], spokenToNpcs: [], boughtItems: [] };
  if (!city.spokenToNpcs.includes(npcId)) {
    city.spokenToNpcs.push(npcId);
    // Persist via existing GameState / maps.city write path
  }
}
```
- First greeting only when `!spokenToNpcs.includes(npc.id)`.
- Optional: small checkmark or softer pulse on NPC after spoken (visual only).

### Interaction polish
- Keep proximity hint `[E] للتحدث` from `drawNPCs()`.
- If modal already open, ignore E (existing guard).
- Escape / ✕ closes modal (existing).
- Optional: one extra lore button on blacksmith («عن وادي الموت») that shows a short paragraph then returns — still not a dialogue tree engine.

### Out of scope (do not build)
- Reputation 0–100, discounts, guard aggro
- Typewriter + numbered dialogue trees
- Quest giver NPCs / J quest log (see TASK_016)
- TAB multi-NPC cycle, night despawn/sleep
- Ambient blocking NPCs that step aside

## Canvas 2D / HTML Implementation Hints
```javascript
function openNpcIntro(npc, thenOpenService) {
  const city = getCityMapState();
  const first = !city.spokenToNpcs.includes(npc.id);
  const text = first ? npc.greetFirst : npc.greetReturn;
  openModal(`${npc.emoji} ${npc.label}`, `
    <p style="margin-bottom:14px;color:#ccc">${text}</p>
    <button class="trade-btn" onclick="markSpoken('${npc.id}'); ${thenOpenService}()">متابعة</button>
  `);
}

// Wire NPCS onInteract:
onInteract() { openNpcIntro(this, openMerchant); }
```

## Verification & Acceptance Criteria
- [ ] Still exactly **3** interactive NPCs (merchant, healer, blacksmith)
- [ ] E opens `#modal` with Arabic greeting then existing service UI
- [ ] First visit recorded in `maps.city.spokenToNpcs` and survives save/reload
- [ ] Return visits use shorter line or skip intro
- [ ] Escape / close button still works; no Pixi
- [ ] No reputation system, no dialogue-tree engine, no quest log in this task
