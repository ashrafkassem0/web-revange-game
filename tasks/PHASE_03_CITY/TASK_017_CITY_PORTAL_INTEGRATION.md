# TASK_017 — CITY_PORTAL_INTEGRATION

## Objective
Polish bidirectional forest ↔ city travel and wire the city south gate to Death Valley when `game/death-valley/index.html` exists. Reuse `navigateTo` + CSS `.fade-overlay` from `game/js/shared.js`, city `drawPortal` / `saveAndExit`, and forest city-portal navigation. Add combat block + early-exit warning.

## Current Baseline
- City north: `FOREST_PORTAL` → `saveAndExit()` saves inventory/HP, `GameState.setCurrentMap('forest')`, `navigateTo('../forest/index.html')`.
- Forest: navigates to `../city/index.html` (see `forest-main.js`).
- `SaveManager.mapUrlFor('deathValley')` currently falls back to forest — update when DV page exists (TASK_018).
- `navigateTo(page)` in `shared.js` uses fade overlay (~800ms).

## Detailed Mechanics & User Stories

### Forest → City
- Keep glowing arch / particles on forest side; E confirms travel.
- On arrive in city: spawn near north gate (not south), load inventory from `GameState`.
- Optional confirm modal: «اذهب إلى المدينة» / «البقاء في الغابة».

### City → Forest (north gate)
- Polish `drawPortal` (already has pillars, glow, Arabic sign «العودة للغابة»).
- E → save city map state (`maps.city`) + inventory/HP → forest.
- Optional early-exit warning if Quest B incomplete: «لم تفتح طريق وادي الموت بعد — أتريد العودة للغابة؟» with نعم/لا (never block forest return).

### City → Death Valley (south gate)
- Locked: draw chains + red pulse; E → «الطريق إلى وادي الموت مغلق — أكمل مهام المدينة أولاً» (TASK_016).
- Unlocked: E → confirm «اذهب إلى وادي الموت» → save → `navigateTo('../death-valley/index.html')`.
- Update `SaveManager.mapUrlFor`:
```javascript
case 'deathValley': return 'death-valley/index.html';
```

### Combat / interaction guards
- If city later has hostiles, or when leaving forest portal: if enemies within ~200px of player, block with «لا يمكنك المغادرة أثناء المعركة!».
- Debounce portal E (~1s) to prevent double `navigateTo`.
- Modal open → ignore portal E (existing city guard).

### State handoff
```javascript
// City → Forest
GameState.save('inventory', player.inventory);
GameState.save('heroStats', { ...stats, hp: player.hp });
persist maps.city (completedQuests, spokenToNpcs, boughtItems, southGateUnlocked);
GameState.setCurrentMap('forest');
navigateTo('../forest/index.html');

// City → Death Valley
GameState.setCurrentMap('deathValley');
navigateTo('../death-valley/index.html');
```

### Edge Cases
- DV page missing → keep locked message or toast «قريباً» rather than navigating to forest by mistake.
- Round-trip forest↔city preserves inventory and `maps.city` quest flags.
- Player agency: never auto-teleport without E + confirm where confirm is used.

## Canvas 2D Implementation Hints
```javascript
const SOUTH_GATE = { x: W / 2, y: H - CFG.TILE * 1.5, radius: 52 };

function drawSouthGate() {
  // pillars + red glow; if (!isSouthGateUnlocked()) draw chain strokes
}

function tryPortal(portal, goFn) {
  if (Date.now() < portalCooldownUntil) return;
  if (enemiesNearby(200)) { notify('لا يمكنك المغادرة أثناء المعركة!', '#e74c3c'); return; }
  portalCooldownUntil = Date.now() + 1000;
  goFn();
}
```

## Verification & Acceptance Criteria
- [ ] Forest ↔ city round trip works with fade + correct spawn near north gate
- [ ] Inventory / HP / `maps.city` persist across trips
- [ ] South gate locked message until TASK_016 quest complete
- [ ] Unlocked south gate navigates to `game/death-valley/index.html` (when present)
- [ ] `SaveManager.mapUrlFor('deathValley')` points at death-valley page
- [ ] Combat proximity blocks portal use with Arabic notify
- [ ] Portal debounce prevents double navigation
- [ ] Early-exit warning optional for incomplete city quests; forest return always allowed
