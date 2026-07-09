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
    CAMPFIRE_RAIN_EXTINGUISH_MS: 45000   // مطر غزير/عاصفة تُطفئ بعد تأخير
};

// Tile type IDs
const T = { GRASS: 0, DEEP: 1, WATER: 2, ROCK: 3, DARK: 4, SAND: 5 };
const TILE_COLOR = ['#3d8a35','#2a6b22','#1560a8','#787868','#1a4a14','#c4a857'];

// City portal — south-center of the map (tile col 40, row 77)
const CITY_PORTAL = {
    x: 40 * 40,   // world x = 1600
    y: 77 * 40,   // world y = 3080
    radius: 55,
};

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
