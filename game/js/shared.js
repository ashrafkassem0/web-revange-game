'use strict';
// =========================================================
//  SAVE MANAGER + GAME STATE — نظام الحفظ والحالة
//  Backward-compatible: existing GameState.save/load APIs still work.
// =========================================================

const CURRENT_VERSION = 2;
const SAVE_SLOTS = ['auto', 'slot1', 'slot2'];
const LEGACY_PREFIX = 'revenge_';
const ACTIVE_SLOT_KEY = 'revenge_active_slot';
const LAST_LOAD_KEY = 'revenge_last_load_at';
const SAVE_SCUM_MS = 10000;
const AUTO_SAVE_DEBOUNCE_MS = 5000;

const DEFAULT_HERO_STATS = {
    hp: 100, maxHp: 100,
    attack: 25, defense: 5,
    skills: { sword: 1, bow: 1, swimming: 1, woodcutting: 0, fishing: 0 },
    absorbedAttack: 0,
    absorbedDefense: 0,
    level: 1,
    xp: 0
};

const DEFAULT_INVENTORY = {
    stick: 0, stone: 0, meat: 0, horn: 0, teeth: 0, leather: 0, fish: 0, arrows: 15,
    rawMeat: 0, cookedMeat: 0, rawFish: 0, cookedFish: 0,
    beastHide: 0, nightCrystal: 0, venomSac: 0, shadowEssence: 0,
    herb: 0, honey: 0, herbSalve: 0, revitalTonic: 0
};

const DEFAULT_CRAFTED = {
    axe: false, pickaxe: false, fishingRod: false, hornSpear: false, hornSword: false,
    leatherArmor: false, shadowArmor: false
};

/** يضمن حقول مهام الغابة على كائن maps.forest (هجرة آمنة للحفظات القديمة) */
function ensureForestQuestFields(forest) {
    if (!forest || typeof forest !== 'object') return forest;
    if (!Array.isArray(forest.activeQuests)) forest.activeQuests = [];
    if (!Array.isArray(forest.completedQuests)) forest.completedQuests = [];
    if (!Array.isArray(forest.spokenToNpcs)) forest.spokenToNpcs = [];
    if (!forest.huntBoard || typeof forest.huntBoard !== 'object') {
        forest.huntBoard = { activeId: null, completedIds: [] };
    } else {
        if (!Array.isArray(forest.huntBoard.completedIds)) forest.huntBoard.completedIds = [];
        if (forest.huntBoard.activeId === undefined) forest.huntBoard.activeId = null;
    }
    if (!forest.radiant || typeof forest.radiant !== 'object') {
        forest.radiant = {
            lastId: null, lastDayIndex: null, activeId: null,
            lastPeriod: null, totalCompleted: 0, offerDef: null
        };
    } else {
        if (forest.radiant.lastId === undefined) forest.radiant.lastId = null;
        if (forest.radiant.lastDayIndex === undefined) forest.radiant.lastDayIndex = null;
        if (forest.radiant.activeId === undefined) forest.radiant.activeId = null;
        if (forest.radiant.lastPeriod === undefined) forest.radiant.lastPeriod = null;
        if (typeof forest.radiant.totalCompleted !== 'number') forest.radiant.totalCompleted = 0;
        if (forest.radiant.offerDef === undefined) forest.radiant.offerDef = null;
    }
    return forest;
}

const DEFAULT_MAPS = {
    forest: {
        position: null,
        choppedTrees: [],
        deadEnemies: [],
        collectedResources: [],
        campStructures: [],
        // Full forest snapshot (compat with forest-save.js)
        snapshot: null,
        // مهام الغابة (TASK_041) — منفصلة عن maps.city.completedQuests
        activeQuests: [],
        completedQuests: [],
        spokenToNpcs: [],
        huntBoard: {
            activeId: null,
            completedIds: []
        },
        radiant: {
            lastId: null,
            lastDayIndex: null,
            activeId: null,
            lastPeriod: null,
            totalCompleted: 0,
            offerDef: null
        }
    },
    city: {
        completedQuests: [],
        spokenToNpcs: [],
        boughtItems: []
    },
    deathValley: {
        trialsCompleted: 0,
        eliteEnemiesKilled: []
    },
    darkKingdom: {
        gatekeepersDefeated: [],
        bossPhase: 0,
        bossCheckpointHp: null
    }
};

/** Map id → path relative to game/ root. Single source for SaveManager.mapUrlFor + SCENES. */
const MAP_URLS = {
    intro: 'start/index.html',
    forest: 'forest/index.html',
    city: 'city/index.html',
    deathValley: 'forest/index.html', // stub until Death Valley page exists
    darkKingdom: 'forest/index.html'  // stub until Dark Kingdom page exists
};

const MIGRATIONS = {
    // v0 / missing version → v1: ensure profile exists
    1: (data) => {
        data.profile = data.profile || {
            name: 'أشرف',
            totalPlayMs: 0,
            totalDistance: 0,
            totalKills: 0,
            createdAt: Date.now()
        };
        if (data.profile.createdAt == null) data.profile.createdAt = Date.now();
        return data;
    },
    // v1 → v2: nest map states + slot metadata
    2: (data) => {
        data.maps = data.maps || JSON.parse(JSON.stringify(DEFAULT_MAPS));
        if (!data.maps.forest) data.maps.forest = JSON.parse(JSON.stringify(DEFAULT_MAPS.forest));
        if (!data.maps.city) data.maps.city = JSON.parse(JSON.stringify(DEFAULT_MAPS.city));
        if (!data.maps.deathValley) data.maps.deathValley = JSON.parse(JSON.stringify(DEFAULT_MAPS.deathValley));
        if (!data.maps.darkKingdom) data.maps.darkKingdom = JSON.parse(JSON.stringify(DEFAULT_MAPS.darkKingdom));

        // Lift legacy forestState into maps.forest
        if (data.forestState && !data.maps.forest.snapshot) {
            const fs = data.forestState;
            data.maps.forest.snapshot = fs;
            data.maps.forest.position = { x: fs.x, y: fs.y };
            data.maps.forest.choppedTrees = fs.choppedTrees || [];
            data.maps.forest.collectedResources = fs.collectedResources || [];
            data.maps.forest.campStructures = fs.structures || [];
            if (Array.isArray(fs.enemies)) {
                data.maps.forest.deadEnemies = [];
            }
            delete data.forestState;
        }

        data.meta = data.meta || {};
        if (data.meta.currentMap == null) {
            data.meta.currentMap = inferCurrentMap(data);
        }
        if (data.meta.level == null) {
            data.meta.level = (data.heroStats && data.heroStats.level) || 1;
        }
        if (data.meta.playTime == null) {
            data.meta.playTime = (data.profile && data.profile.totalPlayMs) || 0;
        }
        if (data.meta.timestamp == null) data.meta.timestamp = Date.now();
        return data;
    }
};

function inferCurrentMap(data) {
    const p = (data && data.progress) || {};
    if (!p.completedIntro) return 'intro';
    if (!p.completedForest) return 'forest';
    if (!p.completedCity) return 'city';
    if (!p.completedDeathValley) return 'deathValley';
    return 'darkKingdom';
}

function deepClone(obj) {
    return JSON.parse(JSON.stringify(obj));
}

function createDefaultSave() {
    return {
        version: CURRENT_VERSION,
        profile: {
            name: 'أشرف',
            totalPlayMs: 0,
            totalDistance: 0,
            totalKills: 0,
            createdAt: Date.now()
        },
        progress: {
            completedIntro: false,
            completedForest: false,
            completedCity: false,
            completedDeathValley: false
        },
        heroStats: deepClone(DEFAULT_HERO_STATS),
        inventory: deepClone(DEFAULT_INVENTORY),
        craftedItems: deepClone(DEFAULT_CRAFTED),
        maps: deepClone(DEFAULT_MAPS),
        flags: {},
        meta: {
            currentMap: 'intro',
            level: 1,
            playTime: 0,
            timestamp: Date.now(),
            lastCampfire: null,
            savedDuringCombat: false
        }
    };
}

function showSaveToast(message, color) {
    if (typeof document === 'undefined' || !document.body) return;
    try {
        const el = document.createElement('div');
        el.setAttribute('data-save-toast', '1');
        el.style.cssText = [
            'position:fixed', 'bottom:70px', 'left:50%', 'transform:translateX(-50%)',
            'background:rgba(0,0,0,0.82)', `color:${color || '#f0c040'}`,
            'font-family:Cairo,Tahoma,sans-serif', 'font-size:0.85rem', 'font-weight:700',
            'padding:8px 18px', 'border-radius:20px', 'pointer-events:none', 'z-index:9999',
            'transition:opacity 1.2s', 'border:1px solid rgba(240,192,64,0.35)',
            'max-width:90vw', 'text-align:center', 'direction:rtl'
        ].join(';');
        el.textContent = message;
        document.body.appendChild(el);
        setTimeout(() => { el.style.opacity = '0'; }, 2800);
        setTimeout(() => { if (el.parentNode) el.remove(); }, 4200);
    } catch (_) { /* ignore DOM errors */ }
}

function notifySave(message, color) {
    if (typeof notify === 'function') {
        try { notify(message, color || '#f0c040'); return; } catch (_) {}
    }
    showSaveToast(message, color);
}

// =========================================================
//  SaveManager
// =========================================================
class SaveManager {
    static STORAGE_KEY = 'revenge_save_v2';
    static CURRENT_VERSION = CURRENT_VERSION;
    static SLOTS = SAVE_SLOTS;

    static _lastWriteAt = 0;
    static _pendingDebounce = null;
    static _corruptSlots = new Set();

    static slotKey(slot) {
        return `${this.STORAGE_KEY}_${slot || 'auto'}`;
    }

    static getActiveSlot() {
        try {
            const s = localStorage.getItem(ACTIVE_SLOT_KEY);
            if (SAVE_SLOTS.includes(s)) return s;
        } catch (_) {}
        return 'auto';
    }

    static setActiveSlot(slot) {
        if (!SAVE_SLOTS.includes(slot)) slot = 'auto';
        try { localStorage.setItem(ACTIVE_SLOT_KEY, slot); } catch (_) {}
        return slot;
    }

    static validate(data) {
        if (!data || typeof data !== 'object') return false;
        if (typeof data.version !== 'number' && data.version != null) return false;
        return true;
    }

    static migrate(data) {
        if (!data || typeof data !== 'object') return createDefaultSave();
        let version = typeof data.version === 'number' ? data.version : 0;
        // Treat missing version as v0
        while (version < CURRENT_VERSION) {
            const next = version + 1;
            const migrator = MIGRATIONS[next];
            if (typeof migrator === 'function') {
                data = migrator(data) || data;
            }
            version = next;
            data.version = version;
        }
        data.version = CURRENT_VERSION;
        // Ensure required top-level keys
        if (!data.profile) data = MIGRATIONS[1](data);
        if (!data.maps || !data.meta) data = MIGRATIONS[2](data);
        if (!data.progress) {
            data.progress = {
                completedIntro: false,
                completedForest: false,
                completedCity: false,
                completedDeathValley: false
            };
        }
        if (!data.heroStats) data.heroStats = deepClone(DEFAULT_HERO_STATS);
        if (!data.inventory) data.inventory = deepClone(DEFAULT_INVENTORY);
        if (!data.craftedItems) data.craftedItems = deepClone(DEFAULT_CRAFTED);
        if (!data.flags) data.flags = {};
        // مهام الغابة: حقول فارغة للحفظات القديمة (بدون رفع إصدار إجباري)
        if (data.maps && data.maps.forest) {
            ensureForestQuestFields(data.maps.forest);
        }
        return data;
    }

    static _safeParse(raw, slot) {
        if (raw == null) return null;
        try {
            const data = JSON.parse(raw);
            if (!this.validate(data)) throw new Error('invalid shape');
            return data;
        } catch (err) {
            this._corruptSlots.add(slot);
            try { localStorage.removeItem(this.slotKey(slot)); } catch (_) {}
            notifySave('بيانات الحفظ تالفة. بدء من جديد.', '#e74c3c');
            return null;
        }
    }

    static _readRaw(slot) {
        try {
            return localStorage.getItem(this.slotKey(slot));
        } catch (_) {
            return null;
        }
    }

    static _writeRaw(slot, data) {
        const key = this.slotKey(slot);
        try {
            localStorage.setItem(key, JSON.stringify(data));
            this._lastWriteAt = Date.now();
            this._corruptSlots.delete(slot);
            return true;
        } catch (err) {
            const isQuota = err && (err.name === 'QuotaExceededError' ||
                err.code === 22 || err.code === 1014 ||
                /quota|storage/i.test(String(err.message || '')));
            if (isQuota) {
                notifySave('مساحة التخزين ممتلئة. احذف بعض الحفظات القديمة.', '#e74c3c');
            } else {
                notifySave('تعذّر حفظ اللعبة.', '#e74c3c');
            }
            return false;
        }
    }

    /** Import flat revenge_* keys into a v2 document (one-time). */
    static importLegacyFlat() {
        const doc = createDefaultSave();
        const read = (k, def) => {
            try {
                const raw = localStorage.getItem(LEGACY_PREFIX + k);
                if (raw == null) return def;
                return JSON.parse(raw);
            } catch (_) {
                return def;
            }
        };

        let found = false;
        const progressKeys = ['completedIntro', 'completedForest', 'completedCity', 'completedDeathValley'];
        for (const k of progressKeys) {
            const v = read(k, null);
            if (v != null) { doc.progress[k] = !!v; found = true; }
        }

        const hero = read('heroStats', null);
        if (hero) { doc.heroStats = Object.assign({}, DEFAULT_HERO_STATS, hero); found = true; }

        const inv = read('inventory', null);
        if (inv) { doc.inventory = Object.assign({}, DEFAULT_INVENTORY, inv); found = true; }

        const craft = read('craftedItems', null);
        if (craft) { doc.craftedItems = Object.assign({}, DEFAULT_CRAFTED, craft); found = true; }

        const forest = read('forestState', null);
        if (forest) {
            found = true;
            doc.maps.forest.snapshot = forest;
            doc.maps.forest.position = { x: forest.x, y: forest.y };
            doc.maps.forest.choppedTrees = forest.choppedTrees || [];
            doc.maps.forest.collectedResources = forest.collectedResources || [];
            doc.maps.forest.campStructures = forest.structures || [];
            if (forest.killCount != null) doc.profile.totalKills = forest.killCount;
            if (forest.distanceTraveled != null) doc.profile.totalDistance = forest.distanceTraveled;
        }

        const fromCity = read('fromCity', null);
        if (fromCity != null) { doc.flags.fromCity = !!fromCity; found = true; }
        const skip = read('skipForestIntro', null);
        if (skip != null) { doc.flags.skipForestIntro = !!skip; found = true; }

        if (!found) return null;

        doc.meta.currentMap = inferCurrentMap(doc);
        doc.meta.timestamp = Date.now();
        doc.version = 0; // run full migration chain
        return this.migrate(doc);
    }

    static ensureMigratedFromLegacy() {
        // If any v2 slot exists, skip
        for (const slot of SAVE_SLOTS) {
            if (this._readRaw(slot)) return;
        }
        const imported = this.importLegacyFlat();
        if (imported) {
            this._writeRaw('auto', imported);
            this.setActiveSlot('auto');
        }
    }

    static load(slot) {
        slot = slot || this.getActiveSlot();
        this.ensureMigratedFromLegacy();
        const raw = this._readRaw(slot);
        if (raw == null) return null;
        const parsed = this._safeParse(raw, slot);
        if (!parsed) return null;
        const migrated = this.migrate(parsed);
        // Persist migration upgrade if version changed
        if (parsed.version !== CURRENT_VERSION || migrated.version === CURRENT_VERSION) {
            if (JSON.stringify(parsed) !== JSON.stringify(migrated)) {
                this._writeRaw(slot, migrated);
            }
        }
        return migrated;
    }

    static save(slot, data) {
        slot = slot || this.getActiveSlot();
        if (!SAVE_SLOTS.includes(slot)) slot = 'auto';
        const base = data ? deepClone(data) : (this.load(slot) || createDefaultSave());
        const doc = this.migrate(base);
        doc.version = CURRENT_VERSION;
        doc.meta = doc.meta || {};
        doc.meta.timestamp = Date.now();
        if (doc.meta.currentMap == null) doc.meta.currentMap = inferCurrentMap(doc);
        if (doc.profile) {
            doc.meta.playTime = doc.profile.totalPlayMs || doc.meta.playTime || 0;
        }
        if (doc.heroStats && doc.heroStats.level != null) {
            doc.meta.level = doc.heroStats.level;
        }
        return this._writeRaw(slot, doc);
    }

    /** Debounced write — max once per AUTO_SAVE_DEBOUNCE_MS. */
    static saveDebounced(slot, data, force) {
        if (force) {
            if (this._pendingDebounce) {
                clearTimeout(this._pendingDebounce);
                this._pendingDebounce = null;
            }
            return this.save(slot, data);
        }
        const now = Date.now();
        const elapsed = now - this._lastWriteAt;
        if (elapsed >= AUTO_SAVE_DEBOUNCE_MS) {
            return this.save(slot, data);
        }
        if (this._pendingDebounce) clearTimeout(this._pendingDebounce);
        const wait = AUTO_SAVE_DEBOUNCE_MS - elapsed;
        this._pendingDebounce = setTimeout(() => {
            this._pendingDebounce = null;
            this.save(slot, data);
        }, wait);
        return true;
    }

    static deleteSlot(slot) {
        try {
            localStorage.removeItem(this.slotKey(slot));
            this._corruptSlots.delete(slot);
            return true;
        } catch (_) {
            return false;
        }
    }

    static listSlots() {
        this.ensureMigratedFromLegacy();
        return SAVE_SLOTS.map((slot) => {
            const data = this.load(slot);
            if (!data) {
                return { slot, empty: true, level: null, currentMap: null, playTime: 0, timestamp: null };
            }
            return {
                slot,
                empty: false,
                level: (data.meta && data.meta.level) || (data.heroStats && data.heroStats.level) || 1,
                currentMap: (data.meta && data.meta.currentMap) || inferCurrentMap(data),
                playTime: (data.meta && data.meta.playTime) || (data.profile && data.profile.totalPlayMs) || 0,
                timestamp: (data.meta && data.meta.timestamp) || null,
                profileName: (data.profile && data.profile.name) || 'أشرف'
            };
        });
    }

    static getAutoSave() {
        return this.load('auto');
    }

    static setAutoSave(data) {
        return this.save('auto', data);
    }

    static getAllSaves() {
        this.ensureMigratedFromLegacy();
        const out = {};
        for (const slot of SAVE_SLOTS) {
            const data = this.load(slot);
            if (data) out[slot] = data;
        }
        return out;
    }

    static hasAnySave() {
        this.ensureMigratedFromLegacy();
        for (const slot of SAVE_SLOTS) {
            if (this._readRaw(slot)) return true;
        }
        // Legacy flat keys
        try {
            for (let i = 0; i < localStorage.length; i++) {
                const k = localStorage.key(i);
                if (k && k.startsWith(LEGACY_PREFIX) && k !== ACTIVE_SLOT_KEY && k !== LAST_LOAD_KEY) {
                    return true;
                }
            }
        } catch (_) {}
        return false;
    }

    static allSlotsCorrupt() {
        return this._corruptSlots.size >= SAVE_SLOTS.length;
    }

    static clearAllSaves() {
        for (const slot of SAVE_SLOTS) this.deleteSlot(slot);
        this._corruptSlots.clear();
        // Also clear legacy flat keys
        try {
            const toRemove = [];
            for (let i = 0; i < localStorage.length; i++) {
                const k = localStorage.key(i);
                if (k && k.startsWith(LEGACY_PREFIX)) toRemove.push(k);
            }
            toRemove.forEach((k) => localStorage.removeItem(k));
        } catch (_) {}
        try {
            localStorage.removeItem(ACTIVE_SLOT_KEY);
            sessionStorage.removeItem(LAST_LOAD_KEY);
        } catch (_) {}
    }

    static markLoadTime() {
        try {
            const prev = Number(sessionStorage.getItem(LAST_LOAD_KEY) || 0);
            const now = Date.now();
            sessionStorage.setItem(LAST_LOAD_KEY, String(now));
            if (prev && (now - prev) < SAVE_SCUM_MS) {
                notifySave('إعادة التحميل المتكرر قد يسبب مشاكل في التقدم.', '#f0c040');
                return true;
            }
        } catch (_) {}
        return false;
    }

    static applyCombatLoadRules(forestSnapshot, saveDoc) {
        if (!forestSnapshot || !saveDoc) return forestSnapshot;
        const combat = !!(saveDoc.meta && saveDoc.meta.savedDuringCombat);
        const lowHp = (forestSnapshot.hp != null && forestSnapshot.hp < 20) ||
            (saveDoc.heroStats && saveDoc.heroStats.hp < 20);
        if (!combat && !lowHp) return forestSnapshot;

        const out = Object.assign({}, forestSnapshot);
        const camp = (saveDoc.meta && saveDoc.meta.lastCampfire) || null;
        if (camp && typeof camp.x === 'number' && typeof camp.y === 'number') {
            out.x = camp.x;
            out.y = camp.y;
        } else {
            // Default forest spawn near starting camp area
            out.x = 1600;
            out.y = 2800;
        }
        const maxHp = out.maxHp || (saveDoc.heroStats && saveDoc.heroStats.maxHp) || 100;
        out.maxHp = maxHp;
        out.hp = Math.max(1, Math.floor(maxHp * 0.5));
        // Clear combat flag so the next normal save is clean
        if (saveDoc.meta) saveDoc.meta.savedDuringCombat = false;
        if (saveDoc.heroStats) saveDoc.heroStats.hp = out.hp;
        out._combatRespawn = true;
        return out;
    }

    /** Map id → URL under game/ (single source; SCENES reads the same table). */
    static mapUrlFor(currentMap) {
        return MAP_URLS[currentMap] || MAP_URLS.forest;
    }
}

// =========================================================
//  GameState — facade over SaveManager (keeps game running)
// =========================================================
const GameState = {
    _cache: null,
    _slot: null,

    _ensure() {
        if (this._cache && this._slot === SaveManager.getActiveSlot()) return this._cache;
        this._slot = SaveManager.getActiveSlot();
        this._cache = SaveManager.load(this._slot) || createDefaultSave();
        return this._cache;
    },

    _persist(opts) {
        opts = opts || {};
        const doc = this._ensure();
        doc.meta = doc.meta || {};
        doc.meta.timestamp = Date.now();
        doc.meta.currentMap = doc.meta.currentMap || inferCurrentMap(doc);
        if (opts.debounce) {
            return SaveManager.saveDebounced(this._slot || 'auto', doc, !!opts.force);
        }
        return SaveManager.save(this._slot || 'auto', doc);
    },

    /** Invalidate in-memory cache (e.g. after slot switch / reset). */
    invalidate() {
        this._cache = null;
        this._slot = null;
    },

    // ---- Legacy key API (used across forest / city / start) ----
    save(key, value) {
        const doc = this._ensure();
        switch (key) {
            case 'completedIntro':
            case 'completedForest':
            case 'completedCity':
            case 'completedDeathValley':
                doc.progress[key] = value;
                doc.meta.currentMap = inferCurrentMap(doc);
                break;
            case 'heroStats':
                doc.heroStats = Object.assign({}, DEFAULT_HERO_STATS, value || {});
                if (value && value.level != null) doc.meta.level = value.level;
                break;
            case 'inventory':
                doc.inventory = this.normalizeInventory(value);
                break;
            case 'craftedItems':
                doc.craftedItems = Object.assign({}, DEFAULT_CRAFTED, value || {});
                break;
            case 'forestState':
                this._writeForestMap(value);
                break;
            case 'fromCity':
            case 'skipForestIntro':
                doc.flags[key] = value;
                break;
            default:
                doc.flags[key] = value;
                break;
        }
        this._persist();
    },

    load(key, defaultValue) {
        if (defaultValue === undefined) defaultValue = null;
        const doc = this._ensure();
        switch (key) {
            case 'completedIntro':
            case 'completedForest':
            case 'completedCity':
            case 'completedDeathValley':
                return doc.progress[key] != null ? doc.progress[key] : defaultValue;
            case 'heroStats':
                return doc.heroStats ? deepClone(doc.heroStats) : defaultValue;
            case 'inventory':
                return doc.inventory ? deepClone(doc.inventory) : defaultValue;
            case 'craftedItems':
                return doc.craftedItems ? deepClone(doc.craftedItems) : defaultValue;
            case 'forestState':
                return this.loadForestState() || defaultValue;
            case 'fromCity':
            case 'skipForestIntro':
                return doc.flags[key] != null ? doc.flags[key] : defaultValue;
            default:
                return doc.flags[key] != null ? doc.flags[key] : defaultValue;
        }
    },

    _writeForestMap(state) {
        const doc = this._ensure();
        if (!doc.maps.forest) doc.maps.forest = deepClone(DEFAULT_MAPS.forest);
        ensureForestQuestFields(doc.maps.forest);
        if (state == null) {
            // إعادة ضبط اللقطة فقط — الإبقاء على تقدم المهام
            const questKeep = {
                activeQuests: doc.maps.forest.activeQuests,
                completedQuests: doc.maps.forest.completedQuests,
                spokenToNpcs: doc.maps.forest.spokenToNpcs,
                huntBoard: doc.maps.forest.huntBoard,
                radiant: doc.maps.forest.radiant
            };
            doc.maps.forest = Object.assign(deepClone(DEFAULT_MAPS.forest), questKeep);
            return;
        }
        doc.maps.forest.snapshot = state;
        doc.maps.forest.position = { x: state.x, y: state.y };
        doc.maps.forest.choppedTrees = state.choppedTrees || [];
        doc.maps.forest.collectedResources = state.collectedResources || [];
        doc.maps.forest.campStructures = state.structures || [];
        ensureForestQuestFields(doc.maps.forest);

        // Profile aggregates
        if (state.killCount != null) doc.profile.totalKills = Math.max(doc.profile.totalKills || 0, state.killCount);
        if (state.distanceTraveled != null) {
            doc.profile.totalDistance = Math.max(doc.profile.totalDistance || 0, state.distanceTraveled);
        }

        // Combat / campfire metadata
        if (state.hp != null && state.hp < 20) {
            doc.meta.savedDuringCombat = true;
        } else {
            doc.meta.savedDuringCombat = false;
        }
        if (state.lastCampfire) {
            doc.meta.lastCampfire = state.lastCampfire;
        } else if (Array.isArray(state.structures)) {
            const fires = state.structures.filter((s) => s && s.type === 'campfire');
            if (fires.length) {
                // Prefer lit campfire closest to player
                let best = fires[0];
                let bestD = Infinity;
                for (const f of fires) {
                    const d = Math.hypot((f.x || 0) - (state.x || 0), (f.y || 0) - (state.y || 0));
                    if (f.lit) {
                        if (d < bestD) { best = f; bestD = d; }
                    }
                }
                doc.meta.lastCampfire = { x: best.x, y: best.y };
            }
        }

        doc.meta.currentMap = 'forest';
        if (state.xp != null && doc.heroStats) doc.heroStats.xp = state.xp;
    },

    getProgress() {
        const doc = this._ensure();
        return {
            completedIntro: !!doc.progress.completedIntro,
            completedForest: !!doc.progress.completedForest,
            completedCity: !!doc.progress.completedCity,
            completedDeathValley: !!doc.progress.completedDeathValley
        };
    },

    saveForestState(state) {
        this._writeForestMap(state);
        this._persist({ debounce: false });
    },

    loadForestState() {
        const doc = this._ensure();
        const forest = doc.maps && doc.maps.forest;
        if (!forest) return null;
        let snap = forest.snapshot ? deepClone(forest.snapshot) : null;
        if (!snap && forest.position) {
            snap = {
                x: forest.position.x,
                y: forest.position.y,
                choppedTrees: forest.choppedTrees || [],
                collectedResources: forest.collectedResources || [],
                structures: forest.campStructures || [],
                seenIntro: true
            };
        }
        if (!snap) return null;
        const applied = SaveManager.applyCombatLoadRules(snap, doc);
        if (applied && applied._combatRespawn) {
            // Persist cleared combat flag + adjusted HP so reload is stable
            if (doc.maps.forest.snapshot) {
                doc.maps.forest.snapshot.hp = applied.hp;
                doc.maps.forest.snapshot.x = applied.x;
                doc.maps.forest.snapshot.y = applied.y;
            }
            this._persist({ force: true });
            delete applied._combatRespawn;
        }
        return applied;
    },

    getHeroStats() {
        const doc = this._ensure();
        return Object.assign({}, DEFAULT_HERO_STATS, deepClone(doc.heroStats || {}));
    },

    saveHeroStats(stats) {
        const doc = this._ensure();
        doc.heroStats = Object.assign({}, DEFAULT_HERO_STATS, stats || {});
        if (stats && stats.level != null) doc.meta.level = stats.level;
        if (stats && stats.hp != null && stats.hp < 20) doc.meta.savedDuringCombat = true;
        this._persist();
    },

    /** Merge any partial bag onto DEFAULT_INVENTORY (canonical schema). */
    normalizeInventory(inv) {
        const out = Object.assign({}, DEFAULT_INVENTORY);
        if (!inv || typeof inv !== 'object') return out;
        // انسخ فقط مفاتيح العناصر المعروفة — تجاهل مفاتيح دخيلة مثل maxSlots
        for (const k of Object.keys(DEFAULT_INVENTORY)) {
            if (inv[k] != null && typeof inv[k] === 'number') out[k] = inv[k];
            else if (inv[k] != null && typeof inv[k] !== 'object') {
                const n = Number(inv[k]);
                if (!Number.isNaN(n)) out[k] = n;
            }
        }
        return out;
    },

    /**
     * Total food units for city/forest HUD & barter (raw + cooked + legacy).
     * @param {object} inv
     * @param {'meat'|'fish'} kind
     */
    countFood(inv, kind) {
        inv = inv || {};
        if (kind === 'fish') {
            return (inv.fish || 0) + (inv.rawFish || 0) + (inv.cookedFish || 0);
        }
        return (inv.meat || 0) + (inv.rawMeat || 0) + (inv.cookedMeat || 0);
    },

    /**
     * Consume food preferring cooked → legacy → raw. Mutates inv.
     * @returns {boolean} true if enough was taken
     */
    takeFood(inv, kind, amount) {
        amount = Math.max(0, amount | 0);
        if (!amount) return true;
        if (this.countFood(inv, kind) < amount) return false;
        const keys = kind === 'fish'
            ? ['cookedFish', 'fish', 'rawFish']
            : ['cookedMeat', 'meat', 'rawMeat'];
        let left = amount;
        for (const k of keys) {
            if (left <= 0) break;
            const have = inv[k] || 0;
            if (have <= 0) continue;
            const use = Math.min(have, left);
            inv[k] = have - use;
            left -= use;
        }
        return left === 0;
    },

    getInventory() {
        const doc = this._ensure();
        return this.normalizeInventory(deepClone(doc.inventory || {}));
    },

    saveInventory(inv) {
        const doc = this._ensure();
        doc.inventory = this.normalizeInventory(inv);
        this._persist();
    },

    getCraftedItems() {
        const doc = this._ensure();
        return Object.assign({}, DEFAULT_CRAFTED, deepClone(doc.craftedItems || {}));
    },

    saveCraftedItems(items) {
        const doc = this._ensure();
        doc.craftedItems = Object.assign({}, DEFAULT_CRAFTED, items || {});
        this._persist();
    },

    getCurrentStage() {
        return inferCurrentMap({ progress: this.getProgress() });
    },

    getProfile() {
        return deepClone(this._ensure().profile);
    },

    getMapState(sceneId) {
        const doc = this._ensure();
        return deepClone((doc.maps && doc.maps[sceneId]) || null);
    },

    setMapState(sceneId, state) {
        const doc = this._ensure();
        if (!doc.maps) doc.maps = deepClone(DEFAULT_MAPS);
        doc.maps[sceneId] = state;
        doc.meta.currentMap = sceneId;
        this._persist();
    },

    setCurrentMap(mapId) {
        const doc = this._ensure();
        doc.meta.currentMap = mapId;
        this._persist();
    },

    /** Manual save into slot1 / slot2 (or auto). */
    saveToSlot(slot) {
        const doc = this._ensure();
        return SaveManager.save(slot || 'slot1', doc);
    },

    loadFromSlot(slot) {
        SaveManager.setActiveSlot(slot || 'auto');
        this.invalidate();
        SaveManager.markLoadTime();
        return this._ensure();
    },

    /** Triggered auto-save with 5s debounce. */
    autoSave(force) {
        return this._persist({ debounce: true, force: !!force });
    },

    reset() {
        SaveManager.clearAllSaves();
        this.invalidate();
        this._cache = createDefaultSave();
        this._slot = 'auto';
        SaveManager.setActiveSlot('auto');
        SaveManager.save('auto', this._cache);
    },

    /** Prompt if every slot is corrupt. */
    handleTotalCorruption() {
        if (!SaveManager.allSlotsCorrupt()) return false;
        const ok = (typeof window !== 'undefined' && window.confirm)
            ? window.confirm('حذف جميع البيانات والبدء من جديد؟')
            : true;
        if (ok) this.reset();
        return true;
    }
};

// =========================================================
//  Thin scene router (multi-page — not an SPA SceneManager)
// =========================================================

/** Scene registry (URL + Arabic label + progress prereq). */
const SCENES = {
    menu:   { url: 'index.html',        label: 'القائمة',         prereq: null,               mapId: null },
    start:  { url: MAP_URLS.intro,      label: 'المقدمة',         prereq: null,               mapId: 'intro' },
    forest: { url: MAP_URLS.forest,     label: 'الغابة',          prereq: 'completedIntro',   mapId: 'forest' },
    city:   { url: MAP_URLS.city,       label: 'المدينة',         prereq: 'completedForest',  mapId: 'city' }
    // deathValley / darkKingdom: add when pages exist — mapUrlFor already stubs to forest
};

const LOADING_TIPS = [
    'نصيحة: اقترب من البوابة للانتقال بين المناطق',
    'نصيحة: احفظ تقدمك عند المواقد وفي القائمة',
    'نصيحة: أكمل تحديات الغابة لفتح المدينة',
    'نصيحة: استخدم E للتفاعل مع الشخصيات',
    'نصيحة: القوس يُقفل على الهدف بزر الفأرة الأيمن'
];

const SCENE_HISTORY_KEY = 'revenge_scene_history';
const NAV_DEBOUNCE_MS = 1000;
let _transitioning = false;

function navigateTo(page) {
    if (_transitioning) return;
    _transitioning = true;
    setTimeout(() => { _transitioning = false; }, NAV_DEBOUNCE_MS);

    const overlay = document.querySelector('.fade-overlay');
    if (overlay) {
        overlay.classList.add('active');
        setTimeout(() => {
            window.location.href = page;
        }, 800);
    } else {
        window.location.href = page;
    }
}

/** Resolve a game/-root URL to a href relative to the current HTML page. */
function resolveSceneHref(urlFromGameRoot) {
    if (!urlFromGameRoot) return urlFromGameRoot;
    if (/^https?:\/\//i.test(urlFromGameRoot) || urlFromGameRoot.startsWith('/')) {
        return urlFromGameRoot;
    }
    try {
        const path = (window.location.pathname || '').replace(/\\/g, '/');
        // Pages live in game/<folder>/index.html → need ../
        if (/\/(forest|city|start|boss|ending|dark-kingdom|death-valley)\/[^/]*$/i.test(path)) {
            return '../' + urlFromGameRoot;
        }
    } catch (_) { /* fall through */ }
    return urlFromGameRoot;
}

function pushSceneHistory(sceneId) {
    try {
        let hist = JSON.parse(sessionStorage.getItem(SCENE_HISTORY_KEY) || '[]');
        if (!Array.isArray(hist)) hist = [];
        if (hist[hist.length - 1] !== sceneId) hist.push(sceneId);
        if (hist.length > 3) hist = hist.slice(-3);
        sessionStorage.setItem(SCENE_HISTORY_KEY, JSON.stringify(hist));
    } catch (_) { /* ignore */ }
}

function getSceneHistory() {
    try {
        const hist = JSON.parse(sessionStorage.getItem(SCENE_HISTORY_KEY) || '[]');
        return Array.isArray(hist) ? hist : [];
    } catch (_) {
        return [];
    }
}

function scenePrereqMet(scene) {
    if (!scene || !scene.prereq) return true;
    try {
        const progress = GameState.getProgress();
        return !!progress[scene.prereq];
    } catch (_) {
        return false;
    }
}

/** Soft allow: portal already set meta.currentMap to this scene's mapId. */
function sceneSoftAllowed(scene) {
    if (!scene || !scene.mapId) return false;
    try {
        const doc = GameState._ensure();
        return !!(doc.meta && doc.meta.currentMap === scene.mapId);
    } catch (_) {
        return false;
    }
}

function ensureSceneLockModal() {
    let root = document.getElementById('sceneLockModal');
    if (root) return root;
    root = document.createElement('div');
    root.id = 'sceneLockModal';
    root.setAttribute('dir', 'rtl');
    root.innerHTML =
        '<div class="scene-lock-box">' +
        '<div class="scene-lock-title">غير متاح بعد</div>' +
        '<div class="scene-lock-body" id="sceneLockBody"></div>' +
        '<button type="button" class="scene-lock-btn" id="sceneLockBtn">حسناً</button>' +
        '</div>';
    document.body.appendChild(root);
    return root;
}

function showSceneLocked(scene, onConfirm) {
    const root = ensureSceneLockModal();
    const body = document.getElementById('sceneLockBody');
    const btn = document.getElementById('sceneLockBtn');
    const label = (scene && scene.label) || 'هذا المشهد';
    if (body) {
        body.textContent = label + ' مقفلة حالياً. أكمل المرحلة السابقة أولاً.';
    }
    root.classList.add('open');
    const finish = () => {
        root.classList.remove('open');
        if (typeof onConfirm === 'function') onConfirm();
    };
    if (btn) btn.onclick = finish;
    setTimeout(finish, 2800);
}

/**
 * Boot guard for locked scenes (direct URL).
 * Soft-allows when meta.currentMap already matches (portal / continue flow).
 * @returns {boolean} true if scene may run
 */
function guardSceneAccess(sceneId) {
    const scene = SCENES[sceneId];
    if (!scene) return true;
    if (scenePrereqMet(scene) || sceneSoftAllowed(scene)) {
        pushSceneHistory(sceneId);
        return true;
    }
    showSceneLocked(scene, () => {
        let fallback = 'menu';
        try {
            const p = GameState.getProgress();
            if (p.completedIntro) fallback = 'forest';
        } catch (_) { /* menu */ }
        navigateToScene(fallback, { skipPrereq: true, skipSave: true });
    });
    return false;
}

/**
 * Navigate to a registered scene with fade + optional save + prereq check.
 * @param {string} sceneId
 * @param {{ skipPrereq?: boolean, skipSave?: boolean, save?: function }} [opts]
 */
function navigateToScene(sceneId, opts) {
    opts = opts || {};
    const scene = SCENES[sceneId];
    if (!scene) {
        console.warn('[navigateToScene] unknown scene:', sceneId);
        return false;
    }
    if (_transitioning) return false;

    if (!opts.skipPrereq && !scenePrereqMet(scene) && !sceneSoftAllowed(scene)) {
        showSceneLocked(scene);
        return false;
    }

    if (!opts.skipSave) {
        try {
            if (typeof opts.save === 'function') opts.save();
            else if (typeof GameState.autoSave === 'function') GameState.autoSave(true);
        } catch (_) { /* keep navigating */ }
    }

    if (scene.mapId && typeof GameState.setCurrentMap === 'function') {
        try { GameState.setCurrentMap(scene.mapId); } catch (_) { /* ignore */ }
    }

    pushSceneHistory(sceneId);
    navigateTo(resolveSceneHref(scene.url));
    return true;
}

/** Pick a random Arabic loading tip (RTL). */
function randomLoadingTip() {
    return LOADING_TIPS[Math.floor(Math.random() * LOADING_TIPS.length)];
}

/**
 * Build a lightweight loading overlay (optional tip line).
 * Caller appends to body and removes when ready.
 */
function createLoadingScreen(mainText) {
    const el = document.createElement('div');
    el.id = 'loading-screen';
    el.className = 'loading-screen';
    el.setAttribute('dir', 'rtl');
    el.innerHTML =
        '<div class="loading-screen-inner">' +
        '<div class="loading-screen-title">' + (mainText || 'جاري تحميل الخريطة…') + '</div>' +
        '<div class="loading-screen-tip">' + randomLoadingTip() + '</div>' +
        '</div>';
    return el;
}

function formatPlayTime(ms) {
    const totalSec = Math.floor((ms || 0) / 1000);
    const m = Math.floor(totalSec / 60);
    const s = totalSec % 60;
    if (m >= 60) {
        const h = Math.floor(m / 60);
        return `${h}س ${m % 60}د`;
    }
    return `${m}د ${s}ث`;
}

function mapLabelAr(mapId) {
    switch (mapId) {
        case 'intro': return 'المقدمة';
        case 'forest': return 'الغابة';
        case 'city': return 'المدينة';
        case 'deathValley': return 'وادي الموت';
        case 'darkKingdom': return 'المملكة المظلمة';
        default: return mapId || '—';
    }
}

// Boot: migrate legacy once, warm cache
try {
    SaveManager.ensureMigratedFromLegacy();
    GameState._ensure();
} catch (_) { /* keep game bootable */ }

window.CURRENT_VERSION = CURRENT_VERSION;
window.SaveManager = SaveManager;
window.GameState = GameState;
window.MAP_URLS = MAP_URLS;
window.SCENES = SCENES;
window.navigateTo = navigateTo;
window.navigateToScene = navigateToScene;
window.resolveSceneHref = resolveSceneHref;
window.guardSceneAccess = guardSceneAccess;
window.createLoadingScreen = createLoadingScreen;
window.randomLoadingTip = randomLoadingTip;
window.getSceneHistory = getSceneHistory;
window.formatPlayTime = formatPlayTime;
window.mapLabelAr = mapLabelAr;
window.ensureForestQuestFields = ensureForestQuestFields;
window.DEFAULT_MAPS = DEFAULT_MAPS;
