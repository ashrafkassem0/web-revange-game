'use strict';
// =========================================================
//  FOREST BUILD — وضع البناء: كوخ، سياج، بوابة، موقد
// =========================================================

// تعريفات المباني القابلة للإنشاء
const BUILDABLES = {
    fenceWall: { name: 'سياج',  emoji: '🪵', cost: { stick: 3 },                     r: 19, hp: 140, solid: true },
    gate:      { name: 'بوابة', emoji: '🚪', cost: { stick: 4 },                     r: 19, hp: 110, solid: true, gate: true },
    campfire:  { name: 'موقد',  emoji: '🔥', cost: { stick: 5, stone: 3 },           r: 16, hp: 80,  solid: false, light: true },
    hut:       { name: 'كوخ',   emoji: '🏠', cost: { stick: 12, leather: 4, stone: 4 }, r: 44, hp: 500, solid: true, big: true },
};
const BUILD_ORDER = ['fenceWall', 'gate', 'campfire', 'hut'];

let structures = [];
let selectedBuildIdx = 0;
let _structUid = 1;
let _siegeTimer = 0;

function selectedBuildable() { return BUILD_ORDER[selectedBuildIdx]; }

// ===== MODE =====
function toggleBuildMode() { buildMode ? exitBuildMode() : enterBuildMode(); }

function enterBuildMode() {
    if (typeof craftMenuOpen !== 'undefined' && craftMenuOpen) closeCraftingMenu();
    if (typeof backpackOpen !== 'undefined' && backpackOpen) closeBackpack();
    if (typeof campfireMenuOpen !== 'undefined' && campfireMenuOpen) closeCampfireMenu();
    if (typeof sleepMenuOpen !== 'undefined' && sleepMenuOpen) closeSleepMenu();
    buildMode = true;
    // وضع البناء يوقف القتال/الحركة (soft-pause عبر gameLoop) مع بقاء الرسم
    const bar = document.getElementById('buildBar');
    if (bar) bar.style.display = 'flex';
    updateBuildBar();
    notify('🔨 وضع البناء: انقر للوضع · يمين للإزالة · عجلة للتبديل · B/Esc للخروج', '#ffd060');
}

function exitBuildMode() {
    buildMode = false;
    const bar = document.getElementById('buildBar');
    if (bar) bar.style.display = 'none';
}

function cycleBuildable(dir) {
    selectedBuildIdx = (selectedBuildIdx + dir + BUILD_ORDER.length) % BUILD_ORDER.length;
    updateBuildBar();
}

function selectBuildable(id) {
    const i = BUILD_ORDER.indexOf(id);
    if (i >= 0) { selectedBuildIdx = i; updateBuildBar(); }
}

// ===== PLACEMENT =====
function _snap(v) { return Math.floor(v / CFG.TILE_SIZE) * CFG.TILE_SIZE + CFG.TILE_SIZE / 2; }

function _canAfford(def) {
    for (const [k, v] of Object.entries(def.cost)) if ((player.inventory[k] || 0) < v) return false;
    return true;
}
function _missingText(def) {
    const miss = [];
    for (const [k, v] of Object.entries(def.cost)) {
        const have = player.inventory[k] || 0;
        if (have < v) miss.push(`${v - have} ${ITEM_NAMES[k] || k}`);
    }
    return miss.join('، ');
}

const PLACE_REASON_AR = {
    water: 'فوق الماء',
    rock: 'على الصخر',
    reach: 'خارج مدى البناء',
    tree: 'يتداخل مع شجرة',
    overlap: 'يتداخل مع مبنى آخر'
};

function canPlaceAt(def, x, y) {
    if (isWater(x, y)) return { ok: false, reason: 'water' };
    const tile = getTile(Math.floor(x / CFG.TILE_SIZE), Math.floor(y / CFG.TILE_SIZE));
    if (tile === T.ROCK) return { ok: false, reason: 'rock' };
    if (Math.hypot(x - player.x, y - player.y) > CFG.BUILD_REACH) return { ok: false, reason: 'reach' };
    for (const t of trees) {
        if (t.chopped) continue;
        if (Math.hypot(t.x - x, t.y - y) < t.r + def.r) return { ok: false, reason: 'tree' };
    }
    for (const s of structures) {
        const sd = BUILDABLES[s.type];
        if (Math.hypot(s.x - x, s.y - y) < (sd ? sd.r : 18) + def.r - 6) return { ok: false, reason: 'overlap' };
    }
    return { ok: true };
}

function tryPlaceBuild(wx, wy) {
    const id = selectedBuildable();
    const def = BUILDABLES[id];
    if (!def) return;
    const x = _snap(wx), y = _snap(wy);
    if (!_canAfford(def)) {
        notify(`المواد غير كافية: ${_missingText(def)}`, '#e74c3c');
        return;
    }
    const chk = canPlaceAt(def, x, y);
    if (!chk.ok) {
        const why = PLACE_REASON_AR[chk.reason] || chk.reason;
        if (chk.reason === 'reach') notify(`⛔ خارج مدى البناء — اقترب أكثر`, '#e74c3c');
        else notify(`⛔ لا يمكن الوضع هنا (${why})`, '#e74c3c');
        return;
    }

    for (const [k, v] of Object.entries(def.cost)) player.inventory[k] -= v;
    structures.push({
        type: id, x, y, r: def.r, hp: def.hp, maxHp: def.hp,
        open: false, lit: !!def.light, gate: !!def.gate, uid: _structUid++
    });
    if (typeof SFX !== 'undefined' && SFX.xp) SFX.xp();
    notify(`${def.emoji} تم بناء ${def.name}!`, '#2ecc71');
    updateHUD();
    updateBuildBar();
    if (typeof saveForestProgress === 'function') saveForestProgress();
}

function tryRemoveBuild(wx, wy) {
    let best = null, bestD = Infinity;
    for (const s of structures) {
        const d = Math.hypot(s.x - wx, s.y - wy);
        if (d < (s.r + 6) && d < bestD) { bestD = d; best = s; }
    }
    if (!best) return;
    const def = BUILDABLES[best.type];
    // استرداد نصف المواد
    if (def) for (const [k, v] of Object.entries(def.cost)) {
        const back = Math.floor(v / 2);
        if (back > 0) player.inventory[k] = (player.inventory[k] || 0) + back;
    }
    structures = structures.filter(s => s !== best);
    if (typeof SFX !== 'undefined' && SFX.hit) SFX.hit();
    notify(`↩️ أُزيل ${def ? def.name : 'مبنى'} (استُرد نصف المواد)`, '#f0c040');
    updateHUD();
    if (typeof saveForestProgress === 'function') saveForestProgress();
}

// ===== COLLISION (يُستدعى من اللاعب والأعداء) =====
function resolveStructureCollision(x, y, radius, isEnemy) {
    for (const s of structures) {
        const def = BUILDABLES[s.type];
        if (!def || !def.solid) continue;
        // البوابة: البطل يعبر دائماً، الحيوانات لا تعبر
        if (def.gate && !isEnemy) continue;
        if (def.gate && s.open) continue;
        const dx = x - s.x, dy = y - s.y;
        const d = Math.hypot(dx, dy);
        const minD = s.r + radius;
        if (d < minD) {
            const a = (d > 0.0001) ? Math.atan2(dy, dx) : Math.random() * Math.PI * 2;
            x = s.x + Math.cos(a) * minD;
            y = s.y + Math.sin(a) * minD;
        }
    }
    return { x, y };
}

// ===== SIEGE: المفترسات الليلية تكسر الجدران =====
let _structDmgNotifyCd = 0;

function updateStructures(dt) {
    if (typeof updateCampfireWeather === 'function') updateCampfireWeather(dt);
    if (_structDmgNotifyCd > 0) _structDmgNotifyCd -= dt;
    // ومضة الموقد (لا حاجة لحالة، الرسم يستخدم Date.now)
    _siegeTimer += dt;
    if (_siegeTimer < 700) return;
    _siegeTimer = 0;
    if (!structures.length || typeof enemies === 'undefined') return;

    let damaged = null;
    for (const s of structures) {
        const def = BUILDABLES[s.type];
        if (!def || !def.solid) continue;
        for (const e of enemies) {
            if (e.isDead || !e.nocturnal || e.behavior !== 'aggressive') continue;
            if (Math.hypot(e.x - s.x, e.y - s.y) < s.r + e.radius + 8) {
                const dmg = Math.max(4, Math.floor((e.attackDmg || 10) * 0.5));
                s.hp -= dmg;
                s.shakeTimer = 260;
                damaged = s;
                if (typeof SFX !== 'undefined' && SFX.hit) SFX.hit();
                break;
            }
        }
    }
    if (damaged && _structDmgNotifyCd <= 0) {
        const def = BUILDABLES[damaged.type];
        const pct = Math.max(0, Math.floor((damaged.hp / damaged.maxHp) * 100));
        notify(`💥 ${def ? def.name : 'مبنى'} تحت الهجوم! (${pct}%)`, '#e74c3c',
            damaged.x, damaged.y - damaged.r - 10);
        _structDmgNotifyCd = 1800;
    }
    const before = structures.length;
    structures = structures.filter(s => s.hp > 0);
    if (structures.length < before) notify('💥 تحطّم أحد المباني!', '#e74c3c');
}

// ===== LIGHT SOURCES (للطبقة الليلية) =====
function getLightSources() {
    const out = [];
    for (const s of structures) {
        if (s.type === 'campfire' && s.lit) out.push({ x: s.x, y: s.y, radius: 150, intensity: 0.95, warm: true });
        else if (s.type === 'hut')          out.push({ x: s.x, y: s.y, radius: 100, intensity: 0.6, warm: false });
    }
    // مشعل اللاعب ليلاً (نصف قطر ثابت — بدون وقود)
    if (typeof player !== 'undefined' && typeof computeDarkness === 'function'
        && typeof gameClock !== 'undefined') {
        const d = computeDarkness(gameClock.minutes);
        if (d > 0.05) {
            out.push({
                x: player.x,
                y: player.y,
                radius: CFG.PLAYER_TORCH_RADIUS || 88,
                intensity: CFG.PLAYER_TORCH_INTENSITY || 0.78,
                warm: true
            });
        }
    }
    return out;
}

function isNearLitCampfire() {
    return !!findNearbyCampfire(true);
}

function findNearbyCampfire(litOnly) {
    const range = (CFG && CFG.CAMPFIRE_INTERACT_RANGE) || 70;
    let best = null, bestD = Infinity;
    for (const s of structures) {
        if (s.type !== 'campfire') continue;
        if (litOnly && !s.lit) continue;
        const d = Math.hypot(s.x - player.x, s.y - player.y);
        if (d < range && d < bestD) { bestD = d; best = s; }
    }
    return best;
}

function campfireHostileNearby(fire) {
    if (!fire || typeof enemies === 'undefined') return false;
    const block = (CFG && CFG.CAMPFIRE_ENEMY_BLOCK) || 200;
    for (const e of enemies) {
        if (e.isDead || e.behavior !== 'aggressive') continue;
        if (Math.hypot(e.x - fire.x, e.y - fire.y) < block) return true;
    }
    return false;
}

function countRawFood() {
    let n = 0;
    const raws = (typeof RAW_FOODS !== 'undefined') ? Object.keys(RAW_FOODS) : ['rawMeat', 'rawFish', 'meat', 'fish'];
    for (const k of raws) n += (player.inventory[k] || 0);
    return n;
}

// ===== CAMPFIRE MENU =====
let campfireMenuOpen = false;
let _campfireTarget = null;
let _campfireExtinguishAcc = 0;

function openCampfireMenu(fire) {
    if (campfireMenuOpen) return;
    const target = fire || findNearbyCampfire(false);
    if (!target) return;
    if (typeof craftMenuOpen !== 'undefined' && craftMenuOpen) return;
    if (typeof backpackOpen !== 'undefined' && backpackOpen) return;
    if (typeof buildMode !== 'undefined' && buildMode) return;
    if (typeof sleepMenuOpen !== 'undefined' && sleepMenuOpen) return;

    _campfireTarget = target;
    campfireMenuOpen = true;
    gamePaused = true;
    const panel = document.getElementById('campfirePanel');
    if (panel) panel.style.display = 'flex';
    updateCampfireMenuUI();
}

function closeCampfireMenu() {
    campfireMenuOpen = false;
    _campfireTarget = null;
    gamePaused = false;
    const panel = document.getElementById('campfirePanel');
    if (panel) panel.style.display = 'none';
}

function updateCampfireMenuUI() {
    const fire = _campfireTarget;
    if (!fire) return;
    const warn = document.getElementById('campfireWarn');
    const sub = document.getElementById('campfireSub');
    const btnLight = document.getElementById('cfBtnLight');
    const btnSave = document.getElementById('cfBtnSave');
    const btnRest = document.getElementById('cfBtnRest');
    const btnCook = document.getElementById('cfBtnCook');

    const hostile = campfireHostileNearby(fire);
    const lit = !!fire.lit;
    const rawN = countRawFood();
    const cost = (CFG && CFG.CAMPFIRE_LIGHT_COST) || { stick: 2 };
    const stickNeed = cost.stick || 2;
    const canLight = !lit && (player.inventory.stick || 0) >= stickNeed;

    if (sub) {
        sub.textContent = lit
            ? 'نقطة راحة وحفظ وطهي'
            : `الموقد مطفأ — أضرمه بـ ${stickNeed} عود`;
    }
    if (warn) {
        warn.textContent = hostile
            ? 'لا يمكن الاسترخاء مع وجود أعداء قريبين'
            : '';
    }
    if (btnLight) {
        btnLight.style.display = lit ? 'none' : 'block';
        btnLight.disabled = !canLight;
        btnLight.textContent = canLight
            ? `🪵 أضرم النار (${stickNeed} عود)`
            : `🪵 أضرم النار (تحتاج ${stickNeed} عود)`;
    }
    if (btnSave) {
        btnSave.style.display = lit ? 'block' : 'none';
        btnSave.disabled = hostile;
    }
    if (btnRest) {
        btnRest.style.display = lit ? 'block' : 'none';
        btnRest.disabled = hostile;
    }
    if (btnCook) {
        btnCook.style.display = lit ? 'block' : 'none';
        btnCook.disabled = !lit || rawN <= 0;
        btnCook.textContent = rawN > 0 ? `🍳 طبخ (${rawN})` : '🍳 طبخ — لا يوجد طعام نيء';
    }
}

function campfireLight() {
    const fire = _campfireTarget || findNearbyCampfire(false);
    if (!fire || fire.lit) return;
    const cost = (CFG && CFG.CAMPFIRE_LIGHT_COST) || { stick: 2 };
    for (const [k, v] of Object.entries(cost)) {
        if ((player.inventory[k] || 0) < v) {
            const name = (typeof ITEM_NAMES !== 'undefined' && ITEM_NAMES[k]) || k;
            notify(`تحتاج ${v} ${name} لإضرام النار!`, '#e74c3c');
            updateCampfireMenuUI();
            return;
        }
    }
    for (const [k, v] of Object.entries(cost)) player.inventory[k] -= v;
    fire.lit = true;
    fire.extinguishTimer = 0;
    _campfireExtinguishAcc = 0;
    if (typeof SFX !== 'undefined' && SFX.xp) SFX.xp();
    notify('🔥 اشتعل الموقد!', '#ff8040');
    updateHUD();
    updateCampfireMenuUI();
    if (typeof saveForestProgress === 'function') saveForestProgress({ debounce: true });
}

function campfireSave() {
    const fire = _campfireTarget;
    if (!fire || !fire.lit) return;
    if (campfireHostileNearby(fire)) {
        notify('لا يمكن الاسترخاء مع وجود أعداء قريبين', '#e74c3c');
        updateCampfireMenuUI();
        return;
    }
    const camp = { x: Math.round(fire.x), y: Math.round(fire.y) };
    if (typeof GameState !== 'undefined') {
        const doc = GameState._ensure();
        doc.meta.lastCampfire = camp;
    }
    let ok = false;
    if (typeof saveForestProgress === 'function') {
        ok = saveForestProgress({ force: true, manual: true, campfire: camp });
    } else if (typeof GameState !== 'undefined' && GameState.autoSave) {
        ok = GameState.autoSave(true);
    }
    if (typeof SFX !== 'undefined' && SFX.click) SFX.click();
    notify(ok !== false ? 'تم الحفظ!' : 'تعذّر الحفظ', ok !== false ? '#2ecc71' : '#e74c3c');
}

function campfireRest() {
    const fire = _campfireTarget;
    if (!fire || !fire.lit) return;
    if (campfireHostileNearby(fire)) {
        notify('لا يمكن الاسترخاء مع وجود أعداء قريبين', '#e74c3c');
        updateCampfireMenuUI();
        return;
    }
    const hpGain = Math.min(
        player.maxHp - player.hp,
        (CFG && CFG.CAMPFIRE_REST_HP) || 22
    );
    const stamGain = Math.min(
        CFG.STAMINA_MAX - player.stamina,
        (CFG && CFG.CAMPFIRE_REST_STAMINA) || 40
    );
    player.hp = Math.min(player.maxHp, player.hp + hpGain);
    player.stamina = Math.min(CFG.STAMINA_MAX, player.stamina + stamGain);

    // تقدّم خفيف للساعة (أخف من نوم الكوخ)
    const hours = (CFG && CFG.CAMPFIRE_REST_HOURS) || 1.5;
    if (typeof gameClock !== 'undefined') {
        gameClock.minutes += hours * 60;
        while (gameClock.minutes >= 1440) {
            gameClock.minutes -= 1440;
            if (typeof dayCount !== 'undefined') dayCount++;
        }
        if (typeof getPhaseFor === 'function') {
            const p = getPhaseFor(gameClock.minutes);
            if (p !== dayNightPhase) {
                const prev = dayNightPhase;
                dayNightPhase = p;
                if (typeof onDayNightPhaseChange === 'function') onDayNightPhaseChange(prev, p);
            }
            isNight = (p === 'night' || p === 'dusk');
        }
        if (typeof updateClockHUD === 'function') updateClockHUD();
    }

    if (typeof SFX !== 'undefined' && SFX.xp) SFX.xp();
    notify(`😌 استرحت عند الموقد — +${Math.floor(hpGain)}❤️ +${Math.floor(stamGain)}⚡`, '#4caf70');
    updateHUD();
    closeCampfireMenu();
    if (typeof saveForestProgress === 'function') saveForestProgress({ debounce: true });
}

function campfireCook() {
    const fire = _campfireTarget;
    if (!fire || !fire.lit) {
        notify('🔥 الموقد مطفأ!', '#ff8040');
        return;
    }
    if (countRawFood() <= 0) {
        notify('لا يوجد طعام نيء', '#e74c3c');
        updateCampfireMenuUI();
        return;
    }
    // طهي أول صنف نيء متاح عبر cookFood الموجود
    const order = ['rawMeat', 'rawFish', 'meat', 'fish'];
    let cooked = false;
    for (const type of order) {
        if ((player.inventory[type] || 0) > 0 && typeof cookFood === 'function') {
            cooked = cookFood(type);
            if (cooked) break;
        }
    }
    if (!cooked) notify('لا يوجد طعام نيء', '#e74c3c');
    updateCampfireMenuUI();
}

function updateCampfireHint() {
    const el = document.getElementById('campfireHint');
    if (!el) return;
    if (!gameRunning || campfireMenuOpen || sleepMenuOpen
        || (typeof craftMenuOpen !== 'undefined' && craftMenuOpen)
        || (typeof backpackOpen !== 'undefined' && backpackOpen)
        || (typeof buildMode !== 'undefined' && buildMode)) {
        el.style.display = 'none';
        return;
    }
    const fire = findNearbyCampfire(false);
    if (!fire) { el.style.display = 'none'; return; }
    el.textContent = fire.lit ? 'اضغط E عند الموقد' : 'اضغط E — أضرم الموقد';
    el.style.display = 'block';
}

/** مطر غزير/عاصفة تُطفئ المواقد بعد تأخير */
function updateCampfireWeather(dt) {
    if (typeof weatherState === 'undefined') return;
    const wet = (weatherState === 'heavyRain' || weatherState === 'storm');
    if (!wet) {
        _campfireExtinguishAcc = 0;
        return;
    }
    _campfireExtinguishAcc += dt;
    const need = (CFG && CFG.CAMPFIRE_RAIN_EXTINGUISH_MS) || 45000;
    if (_campfireExtinguishAcc < need) return;
    _campfireExtinguishAcc = 0;
    let any = false;
    for (const s of structures) {
        if (s.type === 'campfire' && s.lit) {
            s.lit = false;
            any = true;
        }
    }
    if (any) notify('🌧️ أخمد المطر المواقد!', '#7f9bb8');
}

// ===== REPAIR FENCE / GATE =====
const REPAIRABLE = { fenceWall: true, gate: true, hut: true };
const REPAIR_COST = { stick: 1 };      // تكلفة كل ضربة إصلاح
const REPAIR_HEAL = 45;                // نقاط صحة تُستعاد لكل إصلاح
const REPAIR_RANGE = 72;

function findNearbyDamagedStructure() {
    let best = null, bestD = Infinity;
    for (const s of structures) {
        if (!REPAIRABLE[s.type]) continue;
        if (s.hp >= s.maxHp) continue;
        const d = Math.hypot(s.x - player.x, s.y - player.y);
        if (d < s.r + REPAIR_RANGE && d < bestD) { bestD = d; best = s; }
    }
    return best;
}

function tryRepairStructure() {
    const s = findNearbyDamagedStructure();
    if (!s) return false;
    if ((player.repairCd || 0) > 0) return true; // قريب لكن على تهدئة

    for (const [k, v] of Object.entries(REPAIR_COST)) {
        if ((player.inventory[k] || 0) < v) {
            const name = (typeof ITEM_NAMES !== 'undefined' && ITEM_NAMES[k]) || k;
            notify(`🔒 تحتاج ${v} ${name} للإصلاح!`, '#e74c3c');
            return true;
        }
    }
    for (const [k, v] of Object.entries(REPAIR_COST)) player.inventory[k] -= v;

    const before = s.hp;
    s.hp = Math.min(s.maxHp, s.hp + REPAIR_HEAL);
    player.repairCd = 450;
    s.shakeTimer = 180;

    const def = BUILDABLES[s.type];
    const healed = Math.floor(s.hp - before);
    if (typeof SFX !== 'undefined' && SFX.xp) SFX.xp();
    if (s.hp >= s.maxHp) {
        notify(`🔧 تم إصلاح ${def ? def.name : 'المبنى'} بالكامل!`, '#2ecc71', s.x, s.y - s.r - 12);
    } else {
        notify(`🔧 إصلاح +${healed} (${Math.floor(s.hp)}/${s.maxHp})`, '#f0c040', s.x, s.y - s.r - 12);
    }
    updateHUD();
    if (typeof saveForestProgress === 'function') saveForestProgress();
    return true;
}

// ===== SLEEP IN HUT =====
let sleepMenuOpen = false;
let _sleepHours = 4;

function findNearbyHut() {
    let best = null, bestD = Infinity;
    for (const s of structures) {
        if (s.type !== 'hut') continue;
        const d = Math.hypot(s.x - player.x, s.y - player.y);
        if (d < s.r + 36 && d < bestD) { bestD = d; best = s; }
    }
    return best;
}

function findNearbyGate() {
    let best = null, bestD = Infinity;
    for (const s of structures) {
        if (s.type !== 'gate') continue;
        const d = Math.hypot(s.x - player.x, s.y - player.y);
        if (d < s.r + 40 && d < bestD) { bestD = d; best = s; }
    }
    return best;
}

function toggleNearbyGate(gate) {
    const g = gate || findNearbyGate();
    if (!g) return false;
    g.open = !g.open;
    if (typeof SFX !== 'undefined' && SFX.click) SFX.click();
    notify(g.open ? '🚪 فُتحت البوابة' : '🚪 أُغلقت البوابة', '#ffd060', g.x, g.y - g.r - 8);
    if (typeof saveForestProgress === 'function') saveForestProgress({ debounce: true });
    return true;
}

function openSleepMenu() {
    if (sleepMenuOpen || !findNearbyHut()) return;
    if (typeof craftMenuOpen !== 'undefined' && craftMenuOpen) closeCraftingMenu();
    if (typeof backpackOpen !== 'undefined' && backpackOpen) closeBackpack();
    if (typeof buildMode !== 'undefined' && buildMode) exitBuildMode();
    if (typeof campfireMenuOpen !== 'undefined' && campfireMenuOpen) closeCampfireMenu();
    sleepMenuOpen = true;
    gamePaused = true;
    _sleepHours = 4;
    const panel = document.getElementById('sleepPanel');
    if (panel) panel.style.display = 'flex';
    updateSleepHoursUI();
}

function closeSleepMenu() {
    sleepMenuOpen = false;
    gamePaused = false;
    const panel = document.getElementById('sleepPanel');
    if (panel) panel.style.display = 'none';
}

function adjustSleepHours(delta) {
    _sleepHours = Math.max(1, Math.min(12, _sleepHours + delta));
    updateSleepHoursUI();
}

function updateSleepHoursUI() {
    const el = document.getElementById('sleepHoursVal');
    if (el) el.textContent = String(_sleepHours);
    const hint = document.getElementById('sleepHint');
    if (hint && typeof gameClock !== 'undefined') {
        const wake = (gameClock.minutes + _sleepHours * 60) % 1440;
        const h = Math.floor(wake / 60) % 24;
        const m = Math.floor(wake % 60);
        hint.textContent = `تستيقظ عند ${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
    }
}

function confirmSleep() {
    if (!sleepMenuOpen || !findNearbyHut()) { closeSleepMenu(); return; }
    const hours = _sleepHours;
    // تقدّم الساعة بعدد الساعات المختارة
    if (typeof gameClock !== 'undefined') {
        gameClock.minutes += hours * 60;
        while (gameClock.minutes >= 1440) {
            gameClock.minutes -= 1440;
            if (typeof dayCount !== 'undefined') dayCount++;
        }
        if (typeof getPhaseFor === 'function') {
            const p = getPhaseFor(gameClock.minutes);
            if (p !== dayNightPhase) {
                const prev = dayNightPhase;
                dayNightPhase = p;
                if (typeof onDayNightPhaseChange === 'function') onDayNightPhaseChange(prev, p);
            }
            isNight = (p === 'night' || p === 'dusk');
        }
        if (typeof updateClockHUD === 'function') updateClockHUD();
    }
    // شفاء حسب ساعات النوم
    const heal = Math.min(player.maxHp - player.hp, hours * 8);
    const stam = Math.min(CFG.STAMINA_MAX - player.stamina, hours * 12);
    player.hp = Math.min(player.maxHp, player.hp + heal);
    player.stamina = Math.min(CFG.STAMINA_MAX, player.stamina + stam);
    player.poisoned = false;
    player.poisonTimer = 0;
    player.nauseous = false;
    player.nauseaTimer = 0;
    const indP = document.getElementById('poisonIndicator');
    const indN = document.getElementById('nauseaIndicator');
    if (indP) indP.style.display = 'none';
    if (indN) indN.style.display = 'none';
    closeSleepMenu();
    notify(`😴 نمت ${hours} ساعة — +${heal}❤️ +${Math.floor(stam)}⚡`, '#5dade2');
    if (typeof SFX !== 'undefined' && SFX.xp) SFX.xp();
    updateHUD();
    if (typeof saveForestProgress === 'function') saveForestProgress();
}

// ===== DRAW =====
function drawStructuresBehind(camX, camY) {
    for (const s of structures) if (s.y <= player.y) drawStructure(s, camX, camY);
}
function drawStructuresFront(camX, camY) {
    for (const s of structures) if (s.y > player.y) drawStructure(s, camX, camY);
}

function drawStructure(s, camX, camY) {
    const sx = s.x - camX, sy = s.y - camY;
    const VW = canvas.width / ZOOM, VH = canvas.height / ZOOM;
    if (sx < -80 || sx > VW + 80 || sy < -80 || sy > VH + 80) return;
    const shake = (s.shakeTimer > 0) ? Math.sin(Date.now() * 0.05) * 2 : 0;
    if (s.shakeTimer > 0) s.shakeTimer -= 16;

    ctx.save();
    ctx.translate(sx + shake, sy);

    // ظل
    ctx.beginPath(); ctx.ellipse(0, s.r * 0.5, s.r * 0.9, s.r * 0.3, 0, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.fill();

    if (s.type === 'fenceWall' || s.type === 'gate') {
        const open = s.type === 'gate' && s.open;
        ctx.fillStyle = '#6a4020';
        ctx.strokeStyle = '#3a2410'; ctx.lineWidth = 1.5;
        // عمودان
        for (const px of [-14, 14]) {
            ctx.fillRect(px - 3, -22, 6, 34);
            ctx.strokeRect(px - 3, -22, 6, 34);
        }
        if (!open) {
            // ألواح أفقية
            ctx.fillStyle = s.type === 'gate' ? '#8a5a2a' : '#7a4c22';
            ctx.fillRect(-16, -14, 32, 6);
            ctx.fillRect(-16, -2, 32, 6);
            ctx.strokeRect(-16, -14, 32, 6);
            ctx.strokeRect(-16, -2, 32, 6);
        }
        if (s.type === 'gate') {
            ctx.font = '10px Cairo'; ctx.textAlign = 'center'; ctx.fillStyle = '#ffd060';
            ctx.fillText(open ? 'مفتوحة' : 'مغلقة', 0, -26);
            if (typeof player !== 'undefined' &&
                Math.hypot(s.x - player.x, s.y - player.y) < s.r + 40 &&
                !(typeof buildMode !== 'undefined' && buildMode)) {
                ctx.font = 'bold 11px Cairo';
                ctx.strokeStyle = 'rgba(0,0,0,0.85)';
                ctx.lineWidth = 3;
                const tip = open ? '[E] أغلق' : '[E] افتح';
                ctx.strokeText(tip, 0, -40);
                ctx.fillStyle = '#ffd060';
                ctx.fillText(tip, 0, -40);
            }
        }
    } else if (s.type === 'campfire') {
        // حجارة
        ctx.fillStyle = '#5a5248';
        for (let i = 0; i < 6; i++) {
            const a = (i / 6) * Math.PI * 2;
            ctx.beginPath(); ctx.arc(Math.cos(a) * 14, Math.sin(a) * 9 + 4, 4.5, 0, Math.PI * 2); ctx.fill();
        }
        // حطب
        ctx.strokeStyle = '#4a2c10'; ctx.lineWidth = 3; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(-8, 6); ctx.lineTo(8, 0); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(-8, 0); ctx.lineTo(8, 6); ctx.stroke();
        if (s.lit) {
            const t = Date.now() * 0.012;
            const fh = 16 + Math.sin(t) * 4;
            const grd = ctx.createLinearGradient(0, -fh, 0, 4);
            grd.addColorStop(0, 'rgba(255,230,120,0.95)');
            grd.addColorStop(0.5, 'rgba(255,140,30,0.95)');
            grd.addColorStop(1, 'rgba(200,40,10,0.7)');
            ctx.fillStyle = grd;
            ctx.beginPath();
            ctx.moveTo(-8, 2);
            ctx.quadraticCurveTo(-6, -fh * 0.5, 0, -fh);
            ctx.quadraticCurveTo(6, -fh * 0.5, 8, 2);
            ctx.closePath(); ctx.fill();
            ctx.fillStyle = 'rgba(255,240,160,0.9)';
            ctx.beginPath();
            ctx.moveTo(-3, 2);
            ctx.quadraticCurveTo(-2, -fh * 0.35, 0, -fh * 0.6);
            ctx.quadraticCurveTo(2, -fh * 0.35, 3, 2);
            ctx.closePath(); ctx.fill();
        }
    } else if (s.type === 'hut') {
        // جدار
        ctx.fillStyle = '#8a6038';
        ctx.fillRect(-34, -20, 68, 44);
        ctx.strokeStyle = '#4a3018'; ctx.lineWidth = 2;
        ctx.strokeRect(-34, -20, 68, 44);
        // ألواح خشبية
        ctx.strokeStyle = 'rgba(60,40,20,0.5)'; ctx.lineWidth = 1;
        for (let i = -14; i < 24; i += 10) { ctx.beginPath(); ctx.moveTo(-34, i); ctx.lineTo(34, i); ctx.stroke(); }
        // سقف
        ctx.fillStyle = '#5a3418';
        ctx.beginPath();
        ctx.moveTo(-40, -20); ctx.lineTo(0, -46); ctx.lineTo(40, -20); ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = '#3a2010'; ctx.lineWidth = 2; ctx.stroke();
        // باب
        ctx.fillStyle = '#3a2410';
        ctx.fillRect(-9, 2, 18, 22);
        ctx.fillStyle = '#f0c040';
        ctx.beginPath(); ctx.arc(5, 13, 1.6, 0, Math.PI * 2); ctx.fill();
        // تلميح النوم (الإصلاح يُرسم لاحقاً فوق شريط الصحة)
        if (s.hp >= s.maxHp && typeof player !== 'undefined' &&
            Math.hypot(s.x - player.x, s.y - player.y) < s.r + 36) {
            ctx.font = 'bold 11px Cairo';
            ctx.textAlign = 'center';
            ctx.strokeStyle = 'rgba(0,0,0,0.85)';
            ctx.lineWidth = 3;
            ctx.strokeText('[E] 😴 نم', 0, -54);
            ctx.fillStyle = '#5dade2';
            ctx.fillText('[E] 😴 نم', 0, -54);
        }
    }

    // شريط صحة عند التضرر
    if (s.hp < s.maxHp) {
        const bw = s.r * 2, bh = 4;
        ctx.fillStyle = '#333'; ctx.fillRect(-bw / 2, -s.r - 14, bw, bh);
        ctx.fillStyle = s.hp / s.maxHp > 0.4 ? '#2ecc71' : '#e74c3c';
        ctx.fillRect(-bw / 2, -s.r - 14, bw * (s.hp / s.maxHp), bh);
    }

    // تلميح الإصلاح — فوق شريط الصحة حتى يظهر بوضوح
    if (REPAIRABLE[s.type] && s.hp < s.maxHp && typeof player !== 'undefined' &&
        Math.hypot(s.x - player.x, s.y - player.y) < s.r + REPAIR_RANGE) {
        ctx.font = 'bold 12px Cairo';
        ctx.textAlign = 'center';
        ctx.strokeStyle = 'rgba(0,0,0,0.9)';
        ctx.lineWidth = 4;
        const labelY = -s.r - 28;
        ctx.strokeText('[E] 🔧 إصلاح', 0, labelY);
        ctx.fillStyle = '#f0c040';
        ctx.fillText('[E] 🔧 إصلاح', 0, labelY);
    }
    ctx.restore();
}

// ===== BUILD GHOST =====
function drawBuildGhost(camX, camY) {
    if (!buildMode) return;
    const def = BUILDABLES[selectedBuildable()];
    if (!def) return;
    const gx = _snap(mouseWorldX), gy = _snap(mouseWorldY);
    const chk = canPlaceAt(def, gx, gy);
    const afford = _canAfford(def);
    const ok = chk.ok && afford;
    const sx = gx - camX, sy = gy - camY;

    ctx.save();
    ctx.globalAlpha = 0.55;
    // دائرة موقع
    ctx.beginPath(); ctx.arc(sx, sy, def.r, 0, Math.PI * 2);
    ctx.fillStyle = ok ? 'rgba(46,204,113,0.28)' : 'rgba(231,76,60,0.28)';
    ctx.fill();
    ctx.strokeStyle = ok ? '#2ecc71' : '#e74c3c';
    ctx.lineWidth = 2; ctx.stroke();
    // شبح المبنى
    ctx.globalAlpha = 0.7;
    const ghost = { type: selectedBuildable(), x: gx, y: gy, r: def.r, hp: def.hp, maxHp: def.hp, lit: !!def.light, open: false, shakeTimer: 0 };
    drawStructure(ghost, camX, camY);
    ctx.globalAlpha = 1;
    // نص
    ctx.font = 'bold 11px Cairo'; ctx.textAlign = 'center';
    ctx.fillStyle = ok ? '#2ecc71' : '#e74c3c';
    ctx.strokeStyle = 'rgba(0,0,0,0.8)'; ctx.lineWidth = 3;
    let label;
    if (!afford) label = `المواد غير كافية: ${_missingText(def)}`;
    else if (!chk.ok) label = `⛔ ${PLACE_REASON_AR[chk.reason] || chk.reason}`;
    else label = `${def.emoji} ${def.name}`;
    ctx.strokeText(label, sx, sy - def.r - 10);
    ctx.fillText(label, sx, sy - def.r - 10);
    ctx.restore();

    // دائرة المدى
    ctx.save();
    ctx.globalAlpha = 0.2;
    ctx.strokeStyle = '#ffd060'; ctx.lineWidth = 1.5; ctx.setLineDash([6, 8]);
    ctx.beginPath(); ctx.arc(player.x - camX, player.y - camY, CFG.BUILD_REACH, 0, Math.PI * 2); ctx.stroke();
    ctx.restore();
}

// ===== BUILD BAR (DOM) =====
function updateBuildBar() {
    const bar = document.getElementById('buildBar');
    if (!bar) return;
    bar.innerHTML = '';
    BUILD_ORDER.forEach((id, i) => {
        const def = BUILDABLES[id];
        const afford = _canAfford(def);
        const cost = Object.entries(def.cost)
            .map(([k, v]) => `${(ITEM_EMOJIS[k] || k)}${v}`).join(' ');
        const item = document.createElement('div');
        item.className = 'build-item' + (i === selectedBuildIdx ? ' active' : '') + (afford ? '' : ' poor');
        item.innerHTML =
            `<div class="bi-emoji">${def.emoji}</div>` +
            `<div class="bi-name">${def.name}</div>` +
            `<div class="bi-cost">${cost}</div>`;
        item.onclick = () => { selectedBuildIdx = i; updateBuildBar(); };
        bar.appendChild(item);
    });
}

// ===== SAVE / RESTORE =====
function serializeStructures() {
    return structures.map(s => ({
        type: s.type,
        x: s.x,
        y: s.y,
        hp: s.hp,
        maxHp: s.maxHp != null ? s.maxHp : (BUILDABLES[s.type] ? BUILDABLES[s.type].hp : s.hp),
        open: !!s.open,
        lit: !!s.lit,
        uid: s.uid || 0
    }));
}
function restoreStructures(arr) {
    structures = [];
    _structUid = 1;
    let maxUid = 0;
    for (const s of arr) {
        const def = BUILDABLES[s.type];
        if (!def) continue;
        const uid = (typeof s.uid === 'number' && s.uid > 0) ? s.uid : _structUid++;
        if (uid > maxUid) maxUid = uid;
        structures.push({
            type: s.type, x: s.x, y: s.y, r: def.r,
            hp: (typeof s.hp === 'number') ? s.hp : def.hp,
            maxHp: (typeof s.maxHp === 'number' && s.maxHp > 0) ? s.maxHp : def.hp,
            open: !!s.open,
            lit: (s.lit != null) ? !!s.lit : !!def.light,
            gate: !!def.gate,
            uid: uid,
            shakeTimer: 0
        });
    }
    _structUid = Math.max(_structUid, maxUid + 1);
}
