# TASK_026 — BOSS_FIGHT_REFINEMENT

## Objective
**Light polish** on the Terror King fight (TASK_025): screen shake, hit flash, and a music/SFX cue. Keep this task **small** — fold spectacle into the existing boss page, do not rebuild the fight.

## Architecture (must follow)
- Same `game/boss/index.html` Canvas 2D page
- Prefer existing helpers (`flashScreen`, canvas CSS filter, `SFX` in `sounds.js`)
- HTML overlays for death / victory text (like forest / start)
- **No Pixi**, no multi-track orchestral engine

## Detailed Mechanics & User Stories

### Must-have polish (ship these)
1. **Screen shake** — on phase change and/or heavy boss hits (offset camera draw 5–12px for 200–400ms)
2. **Flash** — brief red/white overlay on player hurt and boss phase transition (reuse forest flash)
3. **SFX cue** — distinct `SFX` tone / noise burst on phase 2 start and on boss death (Web Audio via `sounds.js`)

### Nice-to-have (only if time)
- Short intro: camera lerp toward boss + one dialogue line (skippable with Space)
- Kill beat: `timeScale = 0.4` for ~1s + particle burst, then «لقد انتصرت!» HTML overlay
- Death overlay: grayscale canvas + Retry / Main menu buttons

### Explicitly out of scope
- Three dynamic music stems with crossfade
- Easy mode after 5 deaths
- Heal-interrupt systems
- Disconnect / checkpoint phase HP recovery beyond normal `GameState` save

## Implementation Hints
```javascript
let shake = 0;
function addShake(amount) { shake = Math.max(shake, amount); }
// in draw: ctx.translate((Math.random()-0.5)*shake, ...); shake *= 0.9;

// Phase transition
flashScreen();
SFX.bossRoar?.() || SFX.playerHurt(); // or add SFX.bossPhase() in sounds.js
```

Death/victory: HTML `#boss-death-overlay` / `#boss-victory-overlay` with buttons → reload boss or `../index.html` / ending.

## Verification & Acceptance Criteria
- [ ] Shake triggers on at least one boss event (phase or big hit)
- [ ] Flash visible on hurt and/or phase change
- [ ] Distinct SFX on phase change or kill
- [ ] Death/retry UI works if implemented (or deferred cleanly to 025 minimum)
- [ ] No new rendering engine; changes stay on boss page + `sounds.js`
- [ ] Task remains small relative to 025
