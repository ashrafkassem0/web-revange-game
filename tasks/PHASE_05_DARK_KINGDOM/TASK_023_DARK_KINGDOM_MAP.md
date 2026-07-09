# TASK_023 — DARK_KINGDOM_MAP

## Objective
Add a **Dark Kingdom** fortress map as a new multi-page scene (`game/dark-kingdom/index.html`), similar complexity to a **smaller forest** — gothic tiles, a Canvas 2D lighting overlay, and damage pits. Not a Metroidvania.

## Architecture (must follow)
- **Stack:** HTML5 Canvas 2D + HTML/CSS HUD overlays (same pattern as `game/forest/index.html`)
- **No Pixi** — draw tiles/entities with `ctx`; UI with HTML/CSS
- **Navigation:** extend `SaveManager.mapUrlFor('darkKingdom')` → `dark-kingdom/index.html` (today it stubs to forest)
- **Shared:** reuse `../js/shared.js`, `../js/sounds.js`, `../css/shared.css`, and forest-style entity drawing patterns from `characters.js` / `forest-entities.js`
- Entry from Death Valley (or city portal once DV exists); one-way warning before enter

## Detailed Mechanics & User Stories

### Map size (smaller than full forest)
- World ≈ **1600 × 1600** px (40 × 40 tiles × 40px) — enough for courtyard → hall → throne gate
- Camera follow + zoom ~1.4–1.5 like forest

### Tile types (keep simple)
| Type | Description | Passable |
|------|-------------|----------|
| `DARK_GROUND` | Black stone floor | Yes |
| `DARK_WALL` | Fortress wall | No |
| `BLOOD_TILE` | Red-tinged floor (visual) | Yes |
| `TORCH` | Wall torch light source | No (wall) |
| `PIT` | Damage / death pit | Hazard (see below) |
| `GATE_ENTRY` | Entry from previous stage | Yes |
| `THRONE_DOOR` | Locked door to boss arena page | Locked until gatekeepers done (TASK_024) |

### Layout (one fortress, not nested megadungeon)
```
Outer wall
  └─ Courtyard (patrols / gatekeeper 1)
       └─ Great Hall (traps + gatekeeper 2 optional)
            └─ Throne Door → navigates to boss page (TASK_025)
```
Optional small **prison alcove** (2–3 lootable skeleton props) — not a full wing.

### Lighting (Canvas 2D overlay)
- After entities: full-screen darkness `rgba(0,0,0,0.75–0.85)` on an offscreen buffer
- Punch light holes with `destination-out` + radial gradients:
  - Player torch ~100–120px
  - Lit wall torches ~70–90px
- Press **E** near a torch to extinguish (`lit = false`) — fewer lights, slightly harder navigation (stealth flavor, not a full stealth sim)
- Pre-bake static ground into an offscreen terrain canvas (forest-world style); only lighting + entities redraw each frame

### Pits (damage tiles — not instant Metroidvania voids)
- Standing on `PIT`: **DoT** (e.g. 15–25 HP/s) + brief screen flash via existing `flashScreen`-style helper
- Optional: if HP hits 0 from pit → death / respawn at `GATE_ENTRY` with ~50% HP (reuse forest death flow)
- Visual: dark fill + a few rising ash particles (plain JS array, `ctx.arc`)

### Light traps (1–2 types only)
| Type | Effect | Visual |
|------|--------|--------|
| Flame grate | ~15–20 DMG when active, 3s on / 3s off | Orange flicker from floor |
| Spear slot | 20–25 DMG on trigger, short cooldown | Grey rect extends then retracts |

### Atmosphere
- Palette: black / dark red / grey
- Ash ember particles (cap low — see TASK_032)
- Ambient cues via existing `SFX` (`sounds.js`) — low tones / noise; no separate audio engine required

### Edge cases
- **One-way entry:** HTML confirm dialog (“لن تستطيع العودة بسهولة”) + `GameState` auto-save before navigate
- **Save:** persist dark-kingdom position / flags in save doc (mirror forest save patterns in `forest-save.js`)
- **Throne door:** locked until TASK_024 keys/flags; on unlock, fade → `game/boss/index.html` (or `dark-kingdom` sub-route — prefer separate boss page)

## Canvas 2D / Implementation Hints
```
game/dark-kingdom/index.html   — canvas + HUD (copy forest shell, strip unused panels)
game/js/dark-kingdom-*.js      — world bake, lighting, traps (or one main file if small)
SaveManager.mapUrlFor('darkKingdom') → 'dark-kingdom/index.html'
```

```javascript
// Lighting sketch — same idea as forest day/night overlays
function drawDarkness(ctx, camera, player, torches) {
  const buf = lightCanvas;
  const lctx = buf.getContext('2d');
  lctx.clearRect(0, 0, buf.width, buf.height);
  lctx.fillStyle = 'rgba(0,0,0,0.8)';
  lctx.fillRect(0, 0, buf.width, buf.height);
  lctx.globalCompositeOperation = 'destination-out';
  // radial holes for player + lit torches (screen-space)
  lctx.globalCompositeOperation = 'source-over';
  ctx.drawImage(buf, 0, 0);
}
```

## Verification & Acceptance Criteria
- [ ] `game/dark-kingdom/index.html` loads as its own page (Canvas 2D + HTML HUD)
- [ ] `SaveManager.mapUrlFor('darkKingdom')` points at the new page (not forest stub)
- [ ] Map renders gothic tiles at ~1600×1600 with camera follow
- [ ] Darkness overlay + torch / player light holes work
- [ ] Torches extinguishable with E
- [ ] PIT tiles deal damage; death respawns at entry
- [ ] At least one trap type deals damage on a cycle / trigger
- [ ] One-way entry warning + auto-save
- [ ] Throne door locked until gatekeeper progress (TASK_024)
- [ ] Zero Pixi; patterns match forest (offscreen terrain + `ctx` entities)
