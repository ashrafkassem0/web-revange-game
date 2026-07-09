'use strict';
// =========================================================
//  FOREST TIME — دورة اليوم/الليل وطبقة الظلام والحيوانات حسب الوقت
// =========================================================

// الساعة داخل اللعبة (بالدقائق، 0..1440)
let gameClock = { minutes: CFG.CLOCK_START_MIN };
let dayNightPhase = 'day';   // dawn | day | dusk | night
let _prevPhase = 'day';
let dayCount = 1;
let isNight = false;         // مبسّط للتحكم بظهور الحيوانات (يشمل الغسق)

function getPhaseFor(min) {
    if (min >= CFG.DAY_START && min < CFG.DUSK_START)   return 'day';
    if (min >= CFG.DAWN_START && min < CFG.DAY_START)   return 'dawn';
    if (min >= CFG.DUSK_START && min < CFG.NIGHT_START) return 'dusk';
    return 'night';
}

// عامل الظلام 0 (نهار مشرق) .. 1 (ليل عميق) بتدرّج ناعم (fade in/out)
function computeDarkness(min) {
    if (min >= CFG.DAY_START && min < CFG.DUSK_START) return 0;
    if (min >= CFG.DAWN_START && min < CFG.DAY_START)
        return 1 - (min - CFG.DAWN_START) / (CFG.DAY_START - CFG.DAWN_START);
    if (min >= CFG.DUSK_START && min < CFG.NIGHT_START)
        return (min - CFG.DUSK_START) / (CFG.NIGHT_START - CFG.DUSK_START);
    return 1; // ليل كامل
}

// ===== UPDATE =====
function updateDayNight(dt) {
    gameClock.minutes += (dt / 1000) * CFG.GAME_MIN_PER_REAL_SEC;
    while (gameClock.minutes >= 1440) { gameClock.minutes -= 1440; dayCount++; }

    const p = getPhaseFor(gameClock.minutes);
    if (p !== dayNightPhase) {
        _prevPhase = dayNightPhase;
        dayNightPhase = p;
        if (typeof onDayNightPhaseChange === 'function') onDayNightPhaseChange(_prevPhase, p);
    }
    isNight = (p === 'night' || p === 'dusk');
    updateClockHUD();
}

// ===== NIGHT OVERLAY (طبقة ظلام + ثقوب إضاءة) =====
let _nightCanvas = null, _nightCtx = null;

function drawNightOverlay() {
    const dark = computeDarkness(gameClock.minutes) * CFG.NIGHT_MAX_DARKNESS;
    if (dark <= 0.012) return;

    const W = canvas.width, H = canvas.height;
    if (!_nightCanvas) {
        _nightCanvas = document.createElement('canvas');
        _nightCtx = _nightCanvas.getContext('2d');
    }
    if (_nightCanvas.width !== W || _nightCanvas.height !== H) {
        _nightCanvas.width = W; _nightCanvas.height = H;
    }

    // لون حسب الطور (مسحة دافئة عند الفجر/الغسق)
    let col = '16,24,58';
    if (dayNightPhase === 'dusk')      col = '58,28,46';
    else if (dayNightPhase === 'dawn') col = '46,38,68';

    const nc = _nightCtx;
    nc.clearRect(0, 0, W, H);
    nc.fillStyle = `rgba(${col},${dark})`;
    nc.fillRect(0, 0, W, H);

    // ثقوب إضاءة (المواقد/الكوخ) على الطبقة المنفصلة
    const lights = (typeof getLightSources === 'function') ? getLightSources() : null;
    if (lights && lights.length) {
        nc.globalCompositeOperation = 'destination-out';
        for (const L of lights) {
            const sx = (L.x - camera.x) * ZOOM;
            const sy = (L.y - camera.y) * ZOOM;
            const rad = (L.radius || 90) * ZOOM;
            const g = nc.createRadialGradient(sx, sy, rad * 0.12, sx, sy, rad);
            g.addColorStop(0, `rgba(0,0,0,${Math.min(1, L.intensity != null ? L.intensity : 0.95)})`);
            g.addColorStop(0.7, 'rgba(0,0,0,0.35)');
            g.addColorStop(1, 'rgba(0,0,0,0)');
            nc.fillStyle = g;
            nc.beginPath(); nc.arc(sx, sy, rad, 0, Math.PI * 2); nc.fill();
        }
        nc.globalCompositeOperation = 'source-over';
    }

    ctx.drawImage(_nightCanvas, 0, 0);

    // توهّج دافئ حول النيران فوق كل شيء
    if (lights && lights.length) {
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        for (const L of lights) {
            if (!L.warm) continue;
            const sx = (L.x - camera.x) * ZOOM;
            const sy = (L.y - camera.y) * ZOOM;
            const rad = (L.radius || 90) * ZOOM * 0.8;
            const flick = 0.7 + Math.sin(Date.now() * 0.012 + L.x) * 0.15;
            const g = ctx.createRadialGradient(sx, sy, 2, sx, sy, rad);
            g.addColorStop(0, `rgba(255,170,60,${0.28 * dark * flick})`);
            g.addColorStop(1, 'rgba(255,150,40,0)');
            ctx.fillStyle = g;
            ctx.beginPath(); ctx.arc(sx, sy, rad, 0, Math.PI * 2); ctx.fill();
        }
        ctx.restore();
    }
}

// ===== HUD CLOCK =====
function formatClock(min) {
    const h = Math.floor(min / 60) % 24;
    const m = Math.floor(min % 60);
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}
function phaseLabel(p) {
    return p === 'day' ? 'نهار' : p === 'dawn' ? 'فجر' : p === 'dusk' ? 'غسق' : 'ليل';
}
function phaseIcon(p) {
    return p === 'day' ? '☀️' : p === 'dawn' ? '🌅' : p === 'dusk' ? '🌇' : '🌙';
}
function updateClockHUD() {
    const time = document.getElementById('clockTime');
    const ph   = document.getElementById('clockPhase');
    const icon = document.getElementById('clockIcon');
    if (time) time.textContent = formatClock(gameClock.minutes);
    if (ph)   ph.textContent   = phaseLabel(dayNightPhase);
    if (icon) icon.textContent = phaseIcon(dayNightPhase);
}

// =========================================================
//  WILDLIFE MANAGER — الحيوانات حسب الوقت
// =========================================================
const NIGHT_SPAWNS = [
    { type: 'direWolf',     count: 4 },
    { type: 'nightPanther', count: 3 },
    { type: 'giantSpider',  count: 3 },
    { type: 'shadowBeast',  count: 1 },
];

let _nightPredatorsActive = false;

function _aliveCount(pred) {
    let n = 0;
    for (const e of enemies) if (!e.isDead && pred(e)) n++;
    return n;
}

function _spawnAtValidTile(type, minDistFromPlayer) {
    // توليد داخل منطقة الحيوان المفضّلة (وليس عشوائياً على كل الخريطة)
    if (typeof spawnEnemyInHabitat === 'function') {
        return spawnEnemyInHabitat(type, { minDistFromPlayer: minDistFromPlayer || 0 });
    }
    const tmpl = ENEMY_TEMPLATES[type];
    if (!tmpl) return null;
    for (let tries = 0; tries < 45; tries++) {
        const x = 220 + Math.random() * (CFG.WORLD_W - 440);
        const y = 220 + Math.random() * (CFG.WORLD_H - 440);
        if (isWater(x, y)) continue;
        if (Math.hypot(x - player.x, y - player.y) < minDistFromPlayer) continue;
        if (typeof _isBlockedByStructure === 'function' && _isBlockedByStructure(x, y, tmpl.radius || 16)) continue;
        const e = new Enemy(tmpl, x, y);
        e.homeX = x; e.homeY = y; e.leashRadius = 400;
        enemies.push(e);
        return e;
    }
    return null;
}

function spawnNightPredators() {
    if (_nightPredatorsActive) return;
    _nightPredatorsActive = true;
    for (const s of NIGHT_SPAWNS)
        for (let i = 0; i < s.count; i++) _spawnAtValidTile(s.type, 520);
    if (typeof notify === 'function') notify('🌙 حلّ الظلام... تظهر مفترسات خطيرة!', '#a06cff');
    if (typeof SFX !== 'undefined' && SFX.bossAppear) SFX.bossAppear();
}

function despawnNightPredators() {
    _nightPredatorsActive = false;
    for (const e of enemies) {
        if (e.nocturnal && !e.isDead) { e.isDead = true; e.deathTimer = 450; }
    }
    if (typeof notify === 'function') notify('🌅 أشرق النهار... انسحبت الوحوش الليلية', '#f0c040');
}

// تقليل الحيوانات النهارية (الطرائد) لتبدو الغابة أهدأ نهاراً
function cullDiurnalAnimals(keepFraction) {
    const prey = enemies.filter(e => !e.nocturnal && !e.isDead && e.behavior === 'flee');
    const removeCount = Math.floor(prey.length * (1 - keepFraction));
    let removed = 0;
    for (const e of prey) {
        if (removed >= removeCount) break;
        if (Math.hypot(e.x - player.x, e.y - player.y) > 360) {
            e.isDead = true; e.deathTimer = 500;
            removed++;
        }
    }
}

// إعادة ملء الطرائد ليلاً حتى هدف معيّن
function spawnNightPrey() {
    const target = 22;
    const types = ['deer', 'wildRabbit', 'wildBoar', 'fox'];
    let alive = _aliveCount(e => !e.nocturnal && e.behavior === 'flee');
    let ti = 0;
    while (alive < target && ti < 50) {
        _spawnAtValidTile(types[ti % types.length], 320);
        ti++; alive++;
    }
}

// يُستدعى عند تغيّر الطور (من forest-time.updateDayNight)
function onDayNightPhaseChange(prev, next) {
    const wasNight = (prev === 'night' || prev === 'dusk');
    const nowNight = (next === 'night' || next === 'dusk');
    if (nowNight && !wasNight) {
        spawnNightPredators();
        spawnNightPrey();
    } else if (!nowNight && wasNight) {
        despawnNightPredators();
        cullDiurnalAnimals(0.4);
    }
}

// ضبط البداية حسب الطور الحالي (يُستدعى بعد spawnEnemies)
function initWildlife() {
    const p = getPhaseFor(gameClock.minutes);
    dayNightPhase = p;
    isNight = (p === 'night' || p === 'dusk');
    if (isNight) { spawnNightPredators(); spawnNightPrey(); }
    else cullDiurnalAnimals(0.45);
    updateClockHUD();
}

// خطاف اختياري لكل إطار (لا يفعل شيئاً ثقيلاً حالياً)
function updateWildlife(_dt) { /* reserved */ }
