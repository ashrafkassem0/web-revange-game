'use strict';

// =========================================================
//  CITY STATE — إدارة حالة المرحلة ورسميات الحفظ والاسترجاع (v2)
// =========================================================

// كائن الحالة العامة لتشغيل المدينة
const CityState = {
    // بيانت اللاعب والمهارات وحقيبة الموارد الحالية
    player: {
        x: 0,
        y: 0,
        hp: 100,
        maxHp: 100,
        attack: 25,
        defense: 5,
        level: 1,
        facing: 'down',
        isMoving: false,
        walkTimer: 0,
        
        // تأثير نافورة الأمنيات المؤقت
        fountainBuffActive: false,
        fountainBuffUntil: 0,
        
        // حقيبة الموارد الكاملة
        inventory: {
            coins: 0,
            stick: 0,
            stone: 0,
            meat: 0,
            horn: 0,
            teeth: 0,
            leather: 0,
            beastHide: 0,
            venomSac: 0,
            arrows: 15,
            herb: 0,
            honey: 0,
            fish: 0,
            // المنتجات المخبوزة
            berryTart: 0,
            honeyCake: 0,
            sweetMuffin: 0,
            // الأدوية والمراهم
            herbSalve: 0,
            revitalTonic: 0,
            // اللحوم والأسماك المطبوخة والنيئة للتوافق مع الغابة
            rawMeat: 0,
            cookedMeat: 0,
            rawFish: 0,
            cookedFish: 0
        }
    },

    // حالة دورة الوقت (بالدقائق 0 - 1440)
    timeOfDayMinutes: 8 * 60, // يبدأ الساعة 08:00 صباحاً
    timeOfDayRatio: 0.0,      // نسبة الظلام (0: نهار كامل، 1: ليل كامل)

    // حالة الطقس الحالية
    weather: {
        current: 'clear',
        target: 'clear',
        remainingMs: 0,
        fade: 1.0,
        particles: [] // قطرات أو أوراق أو ثلج
    },

    // حالة المدينة المحفوظة (المهام المنجزة، الشخصيات التي تحدثنا معها، الشارات)
    mapState: {
        completedQuests: [],
        spokenToNpcs: [],
        boughtItems: [],
        earnedBadges: [],
        readBooks: [],
        restedOnce: false,
        weaponUpgraded: false
    },

    // المتغيرات المؤقتة للواجهة وحركات اللعبة
    transient: {
        keys: {},
        portalCooldownUntil: 0,
        activeDialogueNpcId: null,
        modalOpen: false,
        cityPaused: false,
        lastLoopTime: 0,
        notification: {
            text: '',
            color: '#ffd060',
            visible: false,
            timeoutId: null
        }
    }
};

/**
 * دالة استعادة وحساب كميات الأطعمة المتوافقة مع نظام الغابة الأساسي
 */
function getFoodCount(inventory, kind) {
    if (typeof GameState !== 'undefined' && GameState.countFood) {
        return GameState.countFood(inventory, kind);
    }
    const inv = inventory || CityState.player.inventory;
    if (kind === 'fish') {
        return (inv.fish || 0) + (inv.rawFish || 0) + (inv.cookedFish || 0);
    }
    return (inv.meat || 0) + (inv.rawMeat || 0) + (inv.cookedMeat || 0);
}

/**
 * دالة سحب الأطعمة المتوافقة مع نظام الغابة الأساسي
 */
function takeFoodItems(inventory, kind, amount) {
    const inv = inventory || CityState.player.inventory;
    if (typeof GameState !== 'undefined' && GameState.takeFood) {
        return GameState.takeFood(inv, kind, amount);
    }
    let remaining = amount;
    if (kind === 'fish') {
        const types = ['fish', 'cookedFish', 'rawFish'];
        for (const t of types) {
            if (inv[t] && inv[t] > 0) {
                const take = Math.min(inv[t], remaining);
                inv[t] -= take;
                remaining -= take;
                if (remaining <= 0) break;
            }
        }
    } else {
        const types = ['meat', 'cookedMeat', 'rawMeat'];
        for (const t of types) {
            if (inv[t] && inv[t] > 0) {
                const take = Math.min(inv[t], remaining);
                inv[t] -= take;
                remaining -= take;
                if (remaining <= 0) break;
            }
        }
    }
}

/**
 * تحميل حالة المدينة من نظام التخزين العام GameState
 */
function loadCityState() {
    if (typeof GameState === 'undefined') {
        console.warn('GameState غير متوفر، تم تحميل الحالة الافتراضية للمدينة.');
        resetTransientCityState();
        return;
    }

    const savedInv = GameState.getInventory() || {};
    const savedStats = GameState.getHeroStats() || {};
    const fromForest = GameState.load('fromCity') === false;

    // تهيئة موضع اللاعب بناءً على بوابة القدوم
    const config = window.CityConfig || { WORLD_W: 1056, WORLD_H: 864, TILE_SIZE: 48 };
    const forestPortal = config.FOREST_PORTAL;
    const southGate = config.SOUTH_GATE;

    if (fromForest) {
        CityState.player.x = forestPortal.x;
        CityState.player.y = forestPortal.y + 64;
        GameState.save('fromCity', null); // إفراغ العلامة المؤقتة
    } else {
        CityState.player.x = (config.WORLD_W) / 2;
        CityState.player.y = (config.WORLD_H) - (config.TILE_SIZE * 2.5);
    }

    // مزامنة حالة حقيبة اللاعب مع الحفاظ على البنية المدمجة
    const baseInv = CityState.player.inventory;
    const normInv = (typeof GameState.normalizeInventory === 'function')
        ? GameState.normalizeInventory(savedInv)
        : savedInv;

    for (const key in baseInv) {
        if (normInv[key] !== undefined) {
            baseInv[key] = Number(normInv[key]) || 0;
        } else {
            baseInv[key] = 0;
        }
    }

    // مزامنة صحة وإحصائيات البطل
    CityState.player.hp = Math.min(savedStats.hp || 100, savedStats.maxHp || 100);
    CityState.player.maxHp = savedStats.maxHp || 100;
    CityState.player.attack = (savedStats.attack || 25) + (savedStats.absorbedAttack || 0);
    CityState.player.defense = (savedStats.defense || 5) + (savedStats.absorbedDefense || 0);
    CityState.player.level = savedStats.level || 1;

    // استعادة حالة الخريطة الخاصة بالمدينة
    const savedMap = GameState.getMapState('city') || {};
    CityState.mapState.completedQuests = Array.isArray(savedMap.completedQuests) ? savedMap.completedQuests : [];
    CityState.mapState.spokenToNpcs = Array.isArray(savedMap.spokenToNpcs) ? savedMap.spokenToNpcs : [];
    CityState.mapState.boughtItems = Array.isArray(savedMap.boughtItems) ? savedMap.boughtItems : [];
    CityState.mapState.earnedBadges = Array.isArray(savedMap.earnedBadges) ? savedMap.earnedBadges : [];
    CityState.mapState.readBooks = Array.isArray(savedMap.readBooks) ? savedMap.readBooks : [];
    CityState.mapState.restedOnce = !!savedMap.restedOnce;
    CityState.mapState.weaponUpgraded = !!savedMap.weaponUpgraded;

    // استعادة بيانات الوقت إن وجدت في الحفظ
    if (typeof savedMap.timeOfDayMinutes === 'number') {
        CityState.timeOfDayMinutes = savedMap.timeOfDayMinutes;
    } else {
        const startMin = (window.CityConfig && window.CityConfig.CLOCK_START_MIN) || 8 * 60;
        CityState.timeOfDayMinutes = startMin;
    }

    // استعادة حالة الطقس المخزنة
    if (savedMap.weather && savedMap.weather.current) {
        CityState.weather.current = savedMap.weather.current;
        CityState.weather.target = savedMap.weather.target || savedMap.weather.current;
        CityState.weather.remainingMs = Number(savedMap.weather.remainingMs) || 5 * 60 * 1000;
    } else {
        CityState.weather.current = 'clear';
        CityState.weather.target = 'clear';
        CityState.weather.remainingMs = 6 * 60 * 1000;
    }
    CityState.weather.fade = 1.0;
    CityState.weather.particles = [];
}

/**
 * حفظ حالة المدينة واللاعب الحالية إلى نظام التخزين العام GameState
 */
function saveCityState() {
    if (typeof GameState === 'undefined') {
        console.warn('GameState غير متوفر، فشل حفظ حالة المدينة.');
        return;
    }

    // 1. حفظ محتويات الحقيبة
    GameState.save('inventory', CityState.player.inventory);

    // 2. تحديث إحصائيات بطل الغابة والمدينة وحفظها
    const savedStats = GameState.getHeroStats() || {};
    savedStats.hp = CityState.player.hp;
    savedStats.maxHp = CityState.player.maxHp;
    
    // حساب الهجوم المكتسب من شحذ السلاح تفادياً للمضاعفات
    const baseAtk = savedStats.level ? (25 + (savedStats.level - 1) * 3) : 25;
    const upgradesAtk = CityState.mapState.weaponUpgraded ? 5 : 0;
    savedStats.absorbedAttack = upgradesAtk;
    savedStats.attack = baseAtk + upgradesAtk;

    GameState.save('heroStats', savedStats);

    // 3. تخزين حالة الخريطة وعناصر التقدم للمدينة
    const stateToSave = {
        completedQuests: CityState.mapState.completedQuests,
        spokenToNpcs: CityState.mapState.spokenToNpcs,
        boughtItems: CityState.mapState.boughtItems,
        earnedBadges: CityState.mapState.earnedBadges,
        readBooks: CityState.mapState.readBooks,
        restedOnce: CityState.mapState.restedOnce,
        weaponUpgraded: CityState.mapState.weaponUpgraded,
        timeOfDayMinutes: CityState.timeOfDayMinutes,
        weather: {
            current: CityState.weather.current,
            target: CityState.weather.target,
            remainingMs: CityState.weather.remainingMs
        }
    };
    GameState.setMapState('city', stateToSave);
}

/**
 * إعادة تهيئة الحالات المؤقتة والعابرة في الذاكرة لتجنب التكرار
 */
function resetTransientCityState() {
    CityState.transient.keys = {};
    CityState.transient.portalCooldownUntil = 0;
    CityState.transient.activeDialogueNpcId = null;
    CityState.transient.modalOpen = false;
    CityState.transient.cityPaused = false;
    CityState.transient.lastLoopTime = performance.now();
    
    if (CityState.transient.notification.timeoutId) {
        clearTimeout(CityState.transient.notification.timeoutId);
    }
    CityState.transient.notification = {
        text: '',
        color: '#ffd060',
        visible: false,
        timeoutId: null
    };

    CityState.player.facing = 'down';
    CityState.player.isMoving = false;
    CityState.player.walkTimer = 0;
    CityState.player.fountainBuffActive = false;
    CityState.player.fountainBuffUntil = 0;
}

// تصدير الكائن والدوال للنطاق العام
if (typeof window !== 'undefined') {
    window.CityState = CityState;
    window.getFoodCount = getFoodCount;
    window.takeFoodItems = takeFoodItems;
    window.loadCityState = loadCityState;
    window.saveCityState = saveCityState;
    window.resetTransientCityState = resetTransientCityState;
}
