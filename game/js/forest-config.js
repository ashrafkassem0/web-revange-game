'use strict';
// =========================================================
//  FOREST CONFIG — ثوابت وإعدادات مرحلة الغابة
// =========================================================

const ZOOM = 1.5;

const CFG = {
    WORLD_W: 3200, WORLD_H: 3200,
    TILE_SIZE: 40,
    WORLD_COLS: 80, WORLD_ROWS: 80,
    PLAYER_SPEED: 2.6,
    SPRINT_SPEED: 4.6,
    STAMINA_MAX: 150,
    STAMINA_DRAIN: 1.5,
    STAMINA_REGEN: 0.6,
    SWORD_RANGE: 58,
    BOW_RANGE: 320,
    ARROW_SPEED: 10,
    ATTACK_CD: 700,
    KILLS_NEEDED: 10,
    DIST_NEEDED: 3000,
    CHALLENGES_NEEDED: 2,
    MEAT_HEAL: { default: 10, deer: 15 },
    ITEM_PICKUP_RANGE: 52,

    // ===== دورة اليوم/الليل =====
    // المطلوب: "الدقيقة = ثانية" → 1 ثانية حقيقية = 1 دقيقة لعبة (يوم كامل = 24 دقيقة حقيقية)
    GAME_MIN_PER_REAL_SEC: 1,
    CLOCK_START_MIN: 8 * 60,    // يبدأ عند 08:00
    // حدود الأطوار (بالدقائق ضمن يوم 1440):
    DAWN_START: 5 * 60,     // 05:00 بداية الفجر
    DAY_START:  7 * 60,     // 07:00 نهار كامل
    DUSK_START: 18 * 60,    // 18:00 بداية الغسق
    NIGHT_START: 20 * 60,   // 20:00 ليل كامل
    NIGHT_END:   5 * 60,    // 05:00 ينتهي الليل
    NIGHT_MAX_DARKNESS: 0.72,
    // مشعل اللاعب (نصف قطر ثابت — بدون اقتصاد وقود)
    PLAYER_TORCH_RADIUS: 88,
    PLAYER_TORCH_INTENSITY: 0.78,
    // نجوم رخيصة على طبقة الظلام
    STAR_COUNT: 48,
    // تخفيف الظلام داخل/قرب الكوخ
    INDOOR_DARKNESS_SCALE: 0.32,

    // ===== الطقس =====
    // ميزانية القطرات تُضبط ديناميكياً في forest-weather.js (~50–150)
    WEATHER_PARTICLE_MAX: 150,
    WEATHER_PARTICLE_MIN: 50,

    // ===== الغثيان (طعام نيء) =====
    NAUSEA_DURATION: 8000,
    NAUSEA_TICK_DMG: 2,

    // ===== البناء =====
    BUILD_REACH: 260,       // أقصى مسافة لوضع مبنى من اللاعب

    // ===== الموقد =====
    CAMPFIRE_INTERACT_RANGE: 70,
    CAMPFIRE_ENEMY_BLOCK: 200,
    CAMPFIRE_REPEL_RANGE: 170,
    CAMPFIRE_LIGHT_COST: { stick: 2 },
    CAMPFIRE_REST_HP: 22,
    CAMPFIRE_REST_STAMINA: 40,
    CAMPFIRE_REST_HOURS: 1.5,
    CAMPFIRE_RAIN_EXTINGUISH_MS: 45000,  // مطر غزير/عاصفة تُطفئ بعد تأخير

    // ===== تقدم البطل (TASK_040) — xp = مجموع مدى الحياة =====
    // xpToNext(L) = round(XP_BASE + XP_PER_LEVEL_STEP * L)  → 1→2=40، 2→3=62، …
    MAX_HERO_LEVEL: 100,
    XP_BASE: 18,
    XP_PER_LEVEL_STEP: 22,
    XP_LEVEL_DIFF_PENALTY: true,  // عدو أضعف بـ 3+ مستويات → نصف XP

    // نمو الإحصائيات مع كل مستوى (فوق المستوى 1)
    HERO_BASE_ATTACK: 25,
    HERO_BASE_DEFENSE: 5,
    HERO_ATK_PER_LEVEL: 3,   // +3 هجوم لكل مستوى بعد الأول
    HERO_DEF_PER_LEVEL: 2    // +2 دفاع لكل مستوى بعد الأول
};

/** XP المطلوب للانتقال من level → level+1 (0 عند السقف) */
function xpToNextLevel(level) {
    const max = (typeof CFG !== 'undefined' && CFG.MAX_HERO_LEVEL) || 100;
    if (level >= max) return 0;
    const base = (CFG && CFG.XP_BASE != null) ? CFG.XP_BASE : 18;
    const step = (CFG && CFG.XP_PER_LEVEL_STEP != null) ? CFG.XP_PER_LEVEL_STEP : 22;
    return Math.round(base + step * level);
}

/** مجموع XP مدى الحياة للوصول إلى بداية المستوى N (من 1) */
function totalXpToReach(level) {
    const max = (typeof CFG !== 'undefined' && CFG.MAX_HERO_LEVEL) || 100;
    const n = Math.min(max, Math.max(1, level | 0));
    let sum = 0;
    for (let L = 1; L < n; L++) sum += xpToNextLevel(L);
    return sum;
}

/**
 * اشتقاق المستوى من XP مدى الحياة (الخيار B في TASK_040).
 * @returns {{ level:number, xpIntoLevel:number, xpNeeded:number }}
 */
function levelFromTotalXp(totalXp) {
    const max = (typeof CFG !== 'undefined' && CFG.MAX_HERO_LEVEL) || 100;
    let level = 1;
    let remaining = Math.max(0, totalXp | 0);
    while (level < max) {
        const need = xpToNextLevel(level);
        if (remaining < need) break;
        remaining -= need;
        level++;
    }
    const xpNeeded = xpToNextLevel(level) || 1;
    return { level, xpIntoLevel: remaining, xpNeeded };
}

/**
 * مكافآت تسليم مهام الغابة (TASK_042–044) — ~0.8× XP القتل المتوقع.
 * تُستخدم لاحقاً عند بناء المهام؛ القيم هنا هي المرجع الرسمي.
 */
const FOREST_QUEST_XP_REWARDS = {
    chain_q1_rabbits: 20,
    chain_q2_foxes: 25,
    chain_q3_wolf: 35,
    board_rabbits: 30,
    board_foxes: 30,
    board_wolves: 75,
    board_bear: 80,
    board_night: 150,
    radiant_day_min: 15,
    radiant_day_max: 35,
    radiant_night_min: 40,
    radiant_night_max: 80
};

/**
 * منح XP للبطل (مجموع مدى الحياة). يدعم ارتقاء متعدد المستويات حتى السقف 100.
 * @returns {{ leveled:boolean, prevLevel:number, level:number, gained:number }}
 */
function grantXp(p, amount) {
    p = p || (typeof player !== 'undefined' ? player : null);
    if (!p) return { leveled: false, prevLevel: 1, level: 1, gained: 0 };
    const max = (CFG && CFG.MAX_HERO_LEVEL) || 100;
    const prev = p.level || 1;
    if (prev >= max) {
        p.level = max;
        if (typeof updateXpHud === 'function') updateXpHud(p);
        return { leveled: false, prevLevel: prev, level: max, gained: 0 };
    }
    const gained = Math.max(0, Math.round(Number(amount) || 0));
    if (gained <= 0) {
        if (typeof updateXpHud === 'function') updateXpHud(p);
        return { leveled: false, prevLevel: prev, level: prev, gained: 0 };
    }
    p.xp = (p.xp || 0) + gained;
    const info = levelFromTotalXp(p.xp);
    p.level = info.level;
    if (p.level > prev) {
        applyHeroLevelUpStats(p, prev, p.level);
        if (typeof notify === 'function') {
            const gainedLevels = p.level - prev;
            const atkGain = gainedLevels * ((CFG && CFG.HERO_ATK_PER_LEVEL) || 3);
            const defGain = gainedLevels * ((CFG && CFG.HERO_DEF_PER_LEVEL) || 2);
            notify(`⭐ ارتقيت للمستوى ${p.level}!  (+${atkGain}⚔️ +${defGain}🛡️)`, '#f0c040');
        }
        // TASK_028 hook — لوحة اختيار ترقية المهارات (لاحقاً)
    }
    if (typeof updateXpHud === 'function') updateXpHud(p);
    if (typeof updateHUD === 'function') updateHUD();
    return { leveled: p.level > prev, prevLevel: prev, level: p.level, gained };
}

/** تطبيق نمو الهجوم/الدفاع عند الارتقاء (أو مزامنة كاملة من المستوى) */
function applyHeroLevelUpStats(p, fromLevel, toLevel) {
    p = p || (typeof player !== 'undefined' ? player : null);
    if (!p) return;
    if (typeof CharacterRules !== 'undefined' && CharacterRules.syncHeroCombatStats) {
        CharacterRules.syncHeroCombatStats(p);
        return;
    }
    const atkPer = (CFG && CFG.HERO_ATK_PER_LEVEL) || 3;
    const defPer = (CFG && CFG.HERO_DEF_PER_LEVEL) || 2;
    const steps = Math.max(0, (toLevel || p.level || 1) - (fromLevel || 1));
    if (steps > 0) {
        p.attack = (p.attack || 25) + steps * atkPer;
        p.defense = (p.defense || 5) + steps * defPer;
    }
}

/** XP قتل: يستخدم XP النسخة من TASK_039 بدون تحجيم مزدوج */
function grantKillXp(p, enemy) {
    p = p || (typeof player !== 'undefined' ? player : null);
    if (!p || !enemy) return { leveled: false, prevLevel: 1, level: 1, gained: 0 };
    let xp = Math.max(1, Math.round(enemy.xp || 0));
    const pLv = p.level || 1;
    const eLv = enemy.level || 1;
    if (CFG && CFG.XP_LEVEL_DIFF_PENALTY && eLv < pLv - 3) {
        xp = Math.max(1, Math.floor(xp * 0.5));
    }
    return grantXp(p, xp);
}

/**
 * مزامنة xp/level من الحفظ.
 * يحافظ على منحنى TASK_040؛ يهاجر حفظات floor(xp/100) القديمة عبر المستوى المخزّن.
 */
function syncHeroProgressFromSave(p, savedXp, savedLevel) {
    p = p || (typeof player !== 'undefined' ? player : null);
    if (!p) return;
    const max = (CFG && CFG.MAX_HERO_LEVEL) || 100;
    let xp = Math.max(0, savedXp | 0);
    let level = Math.max(1, Math.min(max, (savedLevel | 0) || 1));
    const derived = levelFromTotalXp(xp);
    const oldStyleLevel = 1 + Math.floor(xp / 100);
    const looksLikeOldFlat =
        level > 1 &&
        (oldStyleLevel === level || (derived.level !== level && xp < totalXpToReach(level)));
    if (looksLikeOldFlat) {
        p.level = level;
        p.xp = totalXpToReach(level);
    } else {
        p.xp = xp;
        p.level = derived.level;
    }
    if (typeof CharacterRules !== 'undefined' && CharacterRules.syncHeroCombatStats) {
        CharacterRules.syncHeroCombatStats(p);
    }
}

if (typeof window !== 'undefined') {
    window.xpToNextLevel = xpToNextLevel;
    window.totalXpToReach = totalXpToReach;
    window.levelFromTotalXp = levelFromTotalXp;
    window.grantXp = grantXp;
    window.grantKillXp = grantKillXp;
    window.syncHeroProgressFromSave = syncHeroProgressFromSave;
    window.applyHeroLevelUpStats = applyHeroLevelUpStats;
    window.FOREST_QUEST_XP_REWARDS = FOREST_QUEST_XP_REWARDS;
}

// Tile type IDs
const T = { GRASS: 0, DEEP: 1, WATER: 2, ROCK: 3, DARK: 4, SAND: 5 };
const TILE_COLOR = ['#3d8a35','#2a6b22','#1560a8','#787868','#1a4a14','#c4a857'];

// City portal — south-center of the map (tile col 40, row 77)
const CITY_PORTAL = {
    x: 40 * 40,   // world x = 1600
    y: 77 * 40,   // world y = 3080
    radius: 55,
    // منطقة آمنة: لا توليد ولا دخول للوحوش/الحيوانات
    safeRadius: 220
};

/** هل النقطة داخل منطقة بوابة المدينة الآمنة؟ */
function isInCityPortalSafeZone(x, y, padding) {
    if (typeof CITY_PORTAL === 'undefined' || !CITY_PORTAL) return false;
    const r = (CITY_PORTAL.safeRadius || 220) + (padding || 0);
    return Math.hypot(x - CITY_PORTAL.x, y - CITY_PORTAL.y) < r;
}

/** قوة دفع بعيداً عن بوابة المدينة (للأعداء داخل المنطقة الآمنة) */
function cityPortalRepelForce(x, y, speed) {
    if (typeof CITY_PORTAL === 'undefined' || !CITY_PORTAL) return { x: 0, y: 0 };
    const r = CITY_PORTAL.safeRadius || 220;
    const dx = x - CITY_PORTAL.x;
    const dy = y - CITY_PORTAL.y;
    const d = Math.hypot(dx, dy);
    if (d >= r || d < 0.1) return { x: 0, y: 0 };
    const push = (1 - d / r) * (speed || 2.5) * 1.35;
    return { x: (dx / d) * push, y: (dy / d) * push };
}

if (typeof window !== 'undefined') {
    window.CITY_PORTAL = CITY_PORTAL;
    window.isInCityPortalSafeZone = isInCityPortalSafeZone;
    window.cityPortalRepelForce = cityPortalRepelForce;
}

// Intro — شاشة التحكم فقط (بدون مشاهد القصة)
const INTRO_SCENES = [
    {
        img: null,
        text: 'اقتل الوحوش... اجمع الموارد... <span class="hl2">اصنع أسلحتك</span>... وكن مستعداً للانتقام!',
        showHints: true
    }
];

// roundRect polyfill for older browsers
(function() {
    const p = CanvasRenderingContext2D.prototype;
    if (p.roundRect) return;
    p.roundRect = function(x, y, w, h, radii) {
        let r = Array.isArray(radii) ? (radii[0] || 0) : (radii || 0);
        r = Math.min(r, w / 2, h / 2);
        this.moveTo(x + r, y);
        this.lineTo(x + w - r, y);
        this.quadraticCurveTo(x + w, y, x + w, y + r);
        this.lineTo(x + w, y + h - r);
        this.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
        this.lineTo(x + r, y + h);
        this.quadraticCurveTo(x, y + h, x, y + h - r);
        this.lineTo(x, y + r);
        this.quadraticCurveTo(x, y, x + r, y);
        this.closePath();
    };
})();
