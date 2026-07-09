# TASK_025 — TERROR_KING_BOSS

## Objective
Implement the final boss **Terror King (ملك الرعب)** on a dedicated arena page with **1–2 phases**, HP scaled like a strong forest elite (~300–500), extending existing combat patterns. Not a 1000-HP three-phase spectacle.

## Architecture (must follow)
- New page: `game/boss/index.html` (preferred) — mirror `game/forest/` / `game/start/` structure
  - Alternate: `game/dark-kingdom/boss.html` if you keep one folder; still a **separate HTML page**
- Canvas 2D fight + HTML/CSS HUD (boss HP bar, warnings)
- Reuse player movement/combat ideas from forest (`forest-combat.js`, `forest-player.js` patterns)
- On victory → navigate to `game/ending/index.html` (TASK_027)
- Update `SaveManager.mapUrlFor` if needed (`boss` / stay on darkKingdom until fight starts)
- **No Pixi**

## Detailed Mechanics & User Stories

### Arena
- Compact room ~800–1000 px (square or circle floor)
- Black marble + subtle pulsing red rune strokes (`ctx`)
- Invisible walls at edges; toast: «لا مفر من المواجهة!»
- Optional: 2 cover pillars (simple rects) — nice-to-have, not required for v1

### Terror King stats
| Property | Value |
|----------|-------|
| HP | **300–500** (pick one number in range) |
| Phases | **1 or 2** (phase 2 at ≤50% HP) |
| Speed | Moderate; slightly faster in phase 2 |
| Attacks | 2–3 readable patterns (extend forest melee / projectile ideas) |

### Phase 1 — «المقدمة»
Loop a small set of telegraphed attacks, e.g.:
1. **Sword slash** — wind-up ring → arc damage ~25–35
2. **Dark bolt** — slow projectile (`ctx` orb), dodgeable, ~20 dmg
3. Optional **ground wave** — linear telegraph, jump/sidestep

Intro line (HTML or toast): «لقد عدتَ... أيها الطفل الأحمق!»

### Phase 2 — «الغضب» (if shipping 2 phases)
- Same attacks, faster cooldown
- One extra trick only, e.g. brief clone decoy **or** short AoE circle with warning — not both clones + orbs + meteors
- Dialogue toast on transition

### Boss UI (HTML preferred)
- Top bar: «ملك الرعب» + HP fill
- Phase pip(s) if 2 phases
- Warning text for big attacks (`#boss-warning`)

### Rewards
- Solid XP (enough to matter for level-up / skill pick TASK_028)
- Flag `defeatedTerrorKing` / `completedGame` prep for ending
- Optional trophy item in inventory (sword or crown as quest item)

### Edge cases
- Death → HTML retry / menu; boss HP full (or phase-start if 2 phases — keep simple: **full reset**)
- Player can use items if forest already supports it; no need for heal-interrupt complexity
- Victory: short pause → fade → ending page

## Canvas 2D / Implementation Hints
```
game/boss/index.html
game/js/boss-main.js   — loop, TerrorKing class, arena draw
```

```javascript
class TerrorKing {
  constructor(x, y) {
    this.x = x; this.y = y;
    this.hp = 400; this.maxHp = 400;
    this.phase = 1;
    this.state = 'idle'; // idle | windup | attack | recovery
  }
  // update/draw like forest Enemy + wind-up telegraph
}
```

SFX: reuse `sounds.js` tones for hit / roar cues (TASK_026 adds polish).

## Verification & Acceptance Criteria
- [ ] Boss page exists and loads independently
- [ ] Terror King HP in ~300–500 range; 1–2 phases only
- [ ] At least 2 telegraphed attacks readable in play
- [ ] HTML boss HP bar works
- [ ] Death offers retry; victory routes to ending page
- [ ] Combat drawn with Canvas 2D / existing patterns — zero Pixi
- [ ] Difficulty feels like a climax elite, not a raid boss
