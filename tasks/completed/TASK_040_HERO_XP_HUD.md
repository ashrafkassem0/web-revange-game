# TASK_040 — HERO_XP_HUD

## Objective
Make hero progression readable and fair: **XP from kills + quests** feeds a **content-calibrated rising curve** with **max hero level 100**, plus a **persistent level + XP bar** in the forest HUD. Do not build the level-up upgrade panel (that is TASK_028).

## Depends on
- TASK_039 (enemy levels)

## Current Baseline
- Kill path in [`game/js/forest-entities.js`](../../game/js/forest-entities.js): `player.xp += enemy.xp`; `player.level = 1 + Math.floor(xp / 100)` — **replace**
- Enemy base XP (templates) after TASK_039 scaling ≈:

| Enemy | Base XP | Typical level | Approx grant |
|-------|---------|---------------|--------------|
| أرنب | 5 | 1 | **5** |
| ثعلب | 8 | 2 | **~9** |
| غزال | 10 | 2–3 | **~11–12** |
| أفعى | 12 | 3–5 | **~15–19** |
| خنزير | 25 | 4–6 | **~32–40** |
| ذئب | 20 | 5–10 | **~30–42** |
| دب | 50 | 8–12 | **~78–116** |
| ذئب مرعب | 90 | 10–14 | **~187–230** |

- Quest rewards: TASK_042 / 043 / 044 (must stay in sync with this curve — see «Quest XP rule» below)
- TASK_028 later shows upgrade picks on level-up

## Detailed Mechanics & User Stories

### Kill XP grant
Use instance XP from TASK_039 (already scaled by enemy level). Do **not** double-scale.

```text
grantedXp = max(1, round(enemy.xp))
```

Optional soft penalty: if `enemy.level < player.level - 3` → `×0.5` (CFG flag).  
At hero level **100**: no further level-ups; bar shows «الحد الأقصى».

### Quest XP rule (keep 042–044 aligned)
Quest **bonus** XP (on turn-in) should be roughly **0.7–1.0×** the expected kill XP of the objectives — a completion bonus, not a second full clear:

```text
questRewardXp ≈ round(0.8 * expectedKillXpOfObjectives)
```

Canonical forest values (update quest tasks if these change):

| Quest | Objectives (kill XP) | Turn-in bonus |
|-------|----------------------|---------------|
| Chain Q1 أرانب | 5×5 = 25 | **20** |
| Chain Q2 ثعالب | 3×9 ≈ 27 | **25** |
| Chain Q3 ذئب | 1×32 ≈ 32 | **35** |
| Board أرانب | 8×5 = 40 | **30** |
| Board ثعالب | 4×9 ≈ 36 | **30** |
| Board ذئاب | 3×32 ≈ 96 | **75** |
| Board دب | 1×90 ≈ 90 | **80** |
| Board ليلي | 2×200 ≈ 400 | **150** |
| Radiant (day small) | varies | **15–35** |
| Radiant (night) | varies | **40–80** |

Total for story chain path (kills + turn-ins) ≈ 25+20 + 27+25 + 32+35 ≈ **164 XP** toward early levels.

### Level curve (required) — calibrated to content

**Max level:** `CFG.MAX_HERO_LEVEL = 100`

**XP to go from level `L` → `L+1`:**

```text
xpToNext(L) = round(18 + 22 * L)     // L = 1 .. 99
```

| From → To | XP needed | Rough content feel |
|-----------|-----------|--------------------|
| 1 → 2 | **40** | ~8 أرانب، أو Q1 (25 قتل + 20 مكافأة) |
| 2 → 3 | **62** | ~7 ثعالب، أو Q2 + قليل صيد |
| 3 → 4 | **84** | أفاعي / خنازير خفيفة |
| 4 → 5 | **106** | قرب سلسلة الصياد كاملة |
| 5 → 6 | **128** | ذئب أو اثنين |
| 9 → 10 | **216** | لوحة ذئاب / دب |
| 14 → 15 | **326** | ليلي / دببة |
| 19 → 20 | **436** | منتصف الغابة المتقدم |
| 49 → 50 | **1096** | تقدم بطيء (خرائط لاحقة) |
| 99 → 100 | **2196** | سقف اللعبة |

**Pacing targets (design intent):**
- بعد سلسلة الصياد (Q1–Q3) + قتل الأهداف ≈ الوصول قرب **المستوى 4–5**
- بعد عدة مهام لوحة + ذئاب/خنازير ≈ **المستوى 8–12**
- مفترسات ليلية متكررة ≈ **15+**
- المستويات **20–100** تعتمد على تكرار radiant + خرائط لاحقة (مدينة / وادي / مملكة) — الغابة وحدها لا يُفترض أن تملأ 100 بسرعة

**Cumulative XP to reach level N** (from 1):

```text
totalXpToReach(N) = sum_{L=1}^{N-1} round(18 + 22*L)
```

Approx: level 5 ≈ **292**; level 10 ≈ **1152**; level 20 ≈ **~5200**.

### Storage
Prefer **B:** `player.xp` = lifetime total; derive level via walking thresholds.  
Or **A:** XP-into-level + `level`. Document choice in code.

```javascript
// forest-config.js
MAX_HERO_LEVEL: 100,
XP_BASE: 18,
XP_PER_LEVEL_STEP: 22, // xpToNext(L) = round(XP_BASE + XP_PER_LEVEL_STEP * L)

function xpToNextLevel(level) {
  if (level >= CFG.MAX_HERO_LEVEL) return 0;
  return Math.round(CFG.XP_BASE + CFG.XP_PER_LEVEL_STEP * level);
}

function levelFromTotalXp(totalXp) {
  let level = 1;
  let remaining = Math.max(0, totalXp | 0);
  while (level < CFG.MAX_HERO_LEVEL) {
    const need = xpToNextLevel(level);
    if (remaining < need) break;
    remaining -= need;
    level++;
  }
  return {
    level,
    xpIntoLevel: remaining,
    xpNeeded: xpToNextLevel(level) || 1
  };
}
```

### HUD
- Label: `المستوى N` + fill `xpIntoLevel / xpNeeded`
- Level 100: full bar + «الحد الأقصى»
- Toast on level-up; no TASK_028 panel here (hook/comment only)

### Edge cases
- Multi-level from one kill: loop thresholds until capped at 100
- Old `floor(xp/100)` saves: migrate using stored `level` as truth + `xpIntoLevel = 0`, or recompute if lifetime XP exists
- Quest turn-in and kill grants both call the same `grantXp(amount)` helper

### Out of scope
- TASK_028 upgrade picks
- Achievements (TASK_031)
- Prestige past 100

## Canvas 2D / HTML Implementation Hints
```html
<div id="xp-bar" class="hud-xp">
  <span id="xp-level">المستوى 1</span>
  <div class="xp-track"><div id="xp-fill" class="xp-fill"></div></div>
  <span id="xp-text">0 / 40</span>
</div>
```

```javascript
function grantXp(player, amount) {
  if ((player.level || 1) >= CFG.MAX_HERO_LEVEL) {
    updateXpHud(player);
    return;
  }
  const prev = player.level || 1;
  player.xp = (player.xp || 0) + Math.max(0, amount | 0);
  const info = levelFromTotalXp(player.xp);
  player.level = info.level;
  updateXpHud(player);
  if (player.level > prev) {
    notify(`⭐ ارتقيت للمستوى ${player.level}!`, '#f0c040');
    // TASK_028 hook
  }
}

function grantKillXp(player, enemy) {
  let xp = Math.max(1, Math.round(enemy.xp));
  if (CFG.XP_LEVEL_DIFF_PENALTY && enemy.level < player.level - 3) {
    xp = Math.max(1, Math.floor(xp * 0.5));
  }
  grantXp(player, xp);
}
```

Files: `forest-config.js`, `forest-entities.js`, `forest-hud.js`, `forest/index.html`, `forest-main.js` / `forest-save.js` (remove `floor(xp/100)`).

## Verification & Acceptance Criteria
- [x] `xpToNext(1) === 40`, `xpToNext(2) === 62`, `xpToNext(5) === 128`
- [x] Hero level never exceeds **100**
- [x] Completing chain Q1 kills+reward moves the bar meaningfully toward level 2 (not a full dump to level 10)
- [x] A single rabbit kill is a small slice of 1→2 (~5/40); a wolf kill is meaningful at mid levels
- [x] Quest turn-in bonuses match the table above (or stay within 0.7–1.0× objective kill XP)
- [x] HUD shows level + progress (or max-level state)
- [x] Reload restores xp/level correctly
- [x] Arabic HUD labels; old `/100` math gone from forest path
