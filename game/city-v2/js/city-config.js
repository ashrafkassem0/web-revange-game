'use strict';

// =========================================================
//  CITY CONFIG — ثوابت وإعدادات مرحلة المدينة المطورة (v2)
// =========================================================

const ZOOM = 1.0;

const CityConfig = {
    // ===== أبعاد الشاشة والشبكة =====
    TILE_SIZE: 48,
    COLS: 22,
    ROWS: 18,
    
    // الأبعاد الكلية للعالم بالبكسل
    get WORLD_W() { return this.COLS * this.TILE_SIZE; }, // 1056
    get WORLD_H() { return this.ROWS * this.TILE_SIZE; }, // 864

    // ===== سرعة اللاعب واستجابته =====
    PLAYER_SPEED: 2.8,
    PLAYER_INTERACTION_RANGE: 55,

    // ===== دورة اليوم والليل (Day/Night Cycle) =====
    // دقيقة لعبة واحدة = ثانية حقيقية واحدة (24 دقيقة حقيقية لليوم الكامل)
    GAME_MIN_PER_REAL_SEC: 1,
    CLOCK_START_MIN: 8 * 60, // يبدأ اللعب عند الساعة 08:00 صباحاً
    
    // حدود الفترات الزمنية (بالدقائق من بداية اليوم 0-1440)
    DAWN_START:  5 * 60,  // 05:00 بداية الفجر
    DAY_START:   7 * 60,  // 07:00 النهار الكامل
    DUSK_START:  17 * 60, // 17:00 بداية الغسق (Sunset)
    NIGHT_START: 19 * 60, // 19:00 الليل الكامل
    NIGHT_END:   5 * 60,  // 05:00 انتهاء الليل

    // قيم تعتيم طبقة الليل
    NIGHT_MAX_DARKNESS: 0.76,
    DUSK_MAX_DARKNESS: 0.35,
    DAWN_MAX_DARKNESS: 0.25,

    // ألوان الإضاءة المحيطة لكل فترة زمنية
    AMBIENT_LIGHTS: {
        day:   'rgba(255, 255, 255, 0)',
        dawn:  'rgba(240, 150, 100, 0.25)',
        dusk:  'rgba(220, 110, 170, 0.35)',
        night: 'rgba(15, 20, 42, 0.76)'
    },

    // ===== الطقس اللطيف والشتوي (Cozy Weather) =====
    WEATHER_TYPES: {
        CLEAR: 'clear',
        SUN_SHOWER: 'sunShower',
        AUTUMN_BREEZE: 'autumnBreeze',
        SNOWY: 'snowy',
        FOG: 'fog'
    },

    // ميزانية جزيئات الطقس (القطرات، الأوراق، الثلج)
    WEATHER_PARTICLE_MAX: 120,
    WEATHER_PARTICLE_MIN: 40,

    // ===== البوابات والمنافذ (Portals) =====
    // بوابة الشمال المؤدية للغابة (في منتصف الصف العلوي تقريباً)
    get FOREST_PORTAL() {
        return {
            x: (this.COLS * this.TILE_SIZE) / 2, // 528
            y: this.TILE_SIZE * 1.5,             // 72
            radius: 52
        };
    },

    // البوابة الجنوبية المؤدية للغابة الجنوبية (في منتصف الصف السفلي تقريباً)
    get SOUTH_GATE() {
        return {
            x: (this.COLS * this.TILE_SIZE) / 2, // 528
            y: (this.ROWS * this.TILE_SIZE) - (this.TILE_SIZE * 1.5), // 792
            radius: 52
        };
    },

    // ===== معالم و props تفاعلية =====
    // البئر الزخرفي في منتصف المدينة
    get WELL() {
        return {
            x: (this.COLS * this.TILE_SIZE) / 2,
            y: this.TILE_SIZE * 8.5
        };
    },

    // نافورة الأمنيات في الساحة المركزية
    get FOUNTAIN() {
        return {
            x: (this.COLS * this.TILE_SIZE) / 2,
            y: this.TILE_SIZE * 10.0,
            radius: 40,
            wishCoinCost: 1, // تكلفة رمي قطعة نقدية واحدة للأمنيات
            effectDurationMs: 4000 // مدة بقاء الهالة السحرية حول اللاعب
        };
    },

    // ===== شبكة تصادم الخريطة الافتراضية =====
    // أنواع البلاط (Tile Types)
    TILE_TYPES: {
        STONE: 0,
        ROAD: 1,
        BUILDING: 2,
        GRASS: 3,
        WATER: 4,
        SAND: 5
    }
};

// تثبيت الإعدادات للتأكد من عدم تعديلها أثناء التشغيل
Object.freeze(CityConfig);
Object.freeze(CityConfig.AMBIENT_LIGHTS);
Object.freeze(CityConfig.WEATHER_TYPES);
Object.freeze(CityConfig.TILE_TYPES);

// تصدير الكائن إلى النطاق العام (Global Scope) ليتوافق مع هيكلية اللعبة المتصفحية
if (typeof window !== 'undefined') {
    window.ZOOM = ZOOM;
    window.CityConfig = CityConfig;
}
