'use strict';
// =========================================================
//  FOREST WEATHER — حالات الطقس، قطرات المطر، ضباب، عاصفة
// =========================================================

const WEATHER = {
    CLEAR: 'clear',
    LIGHT_RAIN: 'lightRain',
    HEAVY_RAIN: 'heavyRain',
    FOG: 'fog',
    STORM: 'storm'
};

const WEATHER_DEFS = {
    clear: {
        icon: '☀️',
        label: 'صافٍ',
        minMs: 3 * 60 * 1000,
        maxMs: 8 * 60 * 1000,
        drops: 0,
        speedMul: 1,
        rainSfx: false,
        fog: 0
    },
    lightRain: {
        icon: '🌧️',
        label: 'مطر خفيف',
        minMs: 2 * 60 * 1000,
        maxMs: 4 * 60 * 1000,
        drops: 65,
        speedMul: 0.95,
        rainSfx: true,
        fog: 0
    },
    heavyRain: {
        icon: '🌧️',
        label: 'مطر غزير',
        minMs: 1 * 60 * 1000,
        maxMs: 3 * 60 * 1000,
        drops: 130,
        speedMul: 0.90,
        rainSfx: true,
        fog: 0.08
    },
    fog: {
        icon: '🌫️',
        label: 'ضباب',
        minMs: 1 * 60 * 1000,
        maxMs: 3 * 60 * 1000,
        drops: 0,
        speedMul: 1,
        rainSfx: false,
        fog: 0.42
    },
    storm: {
        icon: '⛈️',
        label: 'عاصفة',
        minMs: 30 * 1000,
        maxMs: 90 * 1000,
        drops: 140,
        speedMul: 0.90,
        rainSfx: true,
        fog: 0.12
    }
};

// أوزان الانتقال بعد الصحو (ثم حالات أخرى تفضّل العودة للصحو)
const WEATHER_WEIGHTS = {
    clear:     [['lightRain', 35], ['fog', 25], ['heavyRain', 25], ['storm', 15]],
    lightRain: [['clear', 40], ['heavyRain', 30], ['fog', 20], ['storm', 10]],
    heavyRain: [['clear', 35], ['lightRain', 25], ['storm', 25], ['fog', 15]],
    fog:       [['clear', 50], ['lightRain', 30], ['heavyRain', 15], ['storm', 5]],
    storm:     [['heavyRain', 40], ['clear', 35], ['lightRain', 15], ['fog', 10]]
};

let weatherState = WEATHER.CLEAR;
let weatherRemainingMs = 0;
let weatherFade = 1;          // 0..1 قوة التأثير البصري الحالي
let weatherFadeTarget = 1;
let weatherParticles = [];
let weatherTargetDrops = 0;
let weatherFogAlpha = 0;
let weatherFogTarget = 0;
let weatherFlash = 0;         // 0..1 وميض البرق
let weatherShakeMs = 0;
let weatherShakeAmp = 0;
let weatherThunderAt = 0;     // performance.now() موعد الرعد
let weatherRainSfxOn = false;
let weatherHudIcon = '☀️';
let _weatherLastTs = 0;
let _weatherFpsEma = 60;
let _weatherParticleBudget = (typeof CFG !== 'undefined' && CFG.WEATHER_PARTICLE_MAX) || 150;

function _weatherRandRange(a, b) {
    return a + Math.random() * (b - a);
}

function _weatherPickNext(from) {
    const table = WEATHER_WEIGHTS[from] || WEATHER_WEIGHTS.clear;
    let total = 0;
    for (const [, w] of table) total += w;
    let r = Math.random() * total;
    for (const [state, w] of table) {
        r -= w;
        if (r <= 0) return state;
    }
    return WEATHER.CLEAR;
}

function _weatherDurationFor(state) {
    const d = WEATHER_DEFS[state] || WEATHER_DEFS.clear;
    return _weatherRandRange(d.minMs, d.maxMs);
}

function _weatherIsPaused() {
    if (typeof gamePaused !== 'undefined' && gamePaused) return true;
    if (typeof craftMenuOpen !== 'undefined' && craftMenuOpen) return true;
    if (typeof backpackOpen !== 'undefined' && backpackOpen) return true;
    if (typeof sleepMenuOpen !== 'undefined' && sleepMenuOpen) return true;
    if (typeof campfireMenuOpen !== 'undefined' && campfireMenuOpen) return true;
    if (typeof buildMode !== 'undefined' && buildMode) return true;
    return false;
}

function _makeRainDrop(W, H, fromTop) {
    return {
        x: Math.random() * (W + 40) - 20,
        y: fromTop ? (Math.random() * -H * 0.35) : Math.random() * H,
        vx: -1.2 - Math.random() * 1.4,
        vy: 9 + Math.random() * 7,
        len: 8 + Math.random() * 10
    };
}

function _rebuildRainParticles(count) {
    weatherParticles.length = 0;
    if (!count || !canvas) return;
    const W = canvas.width, H = canvas.height;
    for (let i = 0; i < count; i++) {
        weatherParticles.push(_makeRainDrop(W, H, false));
    }
}

function _syncRainSfx(want) {
    if (want === weatherRainSfxOn) return;
    weatherRainSfxOn = want;
    if (typeof SFX === 'undefined') return;
    if (want && SFX.startRain) SFX.startRain();
    else if (!want && SFX.stopRain) SFX.stopRain();
}

function _applyWeatherVisualTargets(state) {
    const d = WEATHER_DEFS[state] || WEATHER_DEFS.clear;
    weatherFogTarget = d.fog || 0;
    weatherTargetDrops = d.drops || 0;
    weatherHudIcon = d.icon || '☀️';
    _syncRainSfx(!!d.rainSfx);
    updateWeatherHUD();
}

function setWeather(state, remainingMs, opts) {
    opts = opts || {};
    if (!WEATHER_DEFS[state]) state = WEATHER.CLEAR;
    const prev = weatherState;
    weatherState = state;
    weatherRemainingMs = (typeof remainingMs === 'number' && remainingMs > 0)
        ? remainingMs
        : _weatherDurationFor(state);

    if (!opts.instant && prev !== state) {
        weatherFade = 0.15;
        weatherFadeTarget = 1;
    } else {
        weatherFade = 1;
        weatherFadeTarget = 1;
    }

    _applyWeatherVisualTargets(state);

    const budget = Math.min(weatherTargetDrops, _weatherParticleBudget);
    if (budget !== weatherParticles.length) {
        _rebuildRainParticles(budget);
    }

    if (state === WEATHER.STORM && !opts.silent && prev !== WEATHER.STORM) {
        _scheduleStormBurst(true);
    }
}

function _scheduleStormBurst(immediate) {
    // وميض + رعد متأخر + اهتزاز خفيف
    const delay = immediate ? 200 + Math.random() * 800 : 400 + Math.random() * 1800;
    setTimeout(() => {
        if (typeof gameRunning !== 'undefined' && !gameRunning) return;
        if (weatherState !== WEATHER.STORM) return;
        if (_weatherIsPaused()) return;
        weatherFlash = 0.85 + Math.random() * 0.15;
        weatherShakeMs = 280 + Math.random() * 180;
        weatherShakeAmp = 2.5 + Math.random() * 2;
        const thunderDelay = Math.random() * 2000;
        weatherThunderAt = performance.now() + thunderDelay;
    }, delay);
}

function rollNextWeather() {
    const next = _weatherPickNext(weatherState);
    setWeather(next);
    if (next === WEATHER.STORM) {
        // عاصفة: ومضات إضافية أثناء المدة
        const bursts = 1 + Math.floor(Math.random() * 2);
        for (let i = 0; i < bursts; i++) {
            setTimeout(() => {
                if (weatherState === WEATHER.STORM && !_weatherIsPaused()) _scheduleStormBurst(false);
            }, 8000 + i * 12000 + Math.random() * 6000);
        }
    }
}

function getWeatherSpeedMul() {
    const d = WEATHER_DEFS[weatherState] || WEATHER_DEFS.clear;
    const mul = d.speedMul != null ? d.speedMul : 1;
    // طبّق التباطؤ بنسبة fade حتى لا يقفز فجأة
    return 1 - (1 - mul) * weatherFade;
}

function getWeatherFogBoost() {
    return weatherFogAlpha;
}

function serializeWeather() {
    return {
        state: weatherState,
        remainingMs: Math.max(0, Math.round(weatherRemainingMs))
    };
}

function restoreWeather(data) {
    if (!data || typeof data !== 'object') {
        setWeather(WEATHER.CLEAR, _weatherDurationFor(WEATHER.CLEAR), { instant: true, silent: true });
        return;
    }
    const st = data.state && WEATHER_DEFS[data.state] ? data.state : WEATHER.CLEAR;
    const rem = typeof data.remainingMs === 'number' ? data.remainingMs : _weatherDurationFor(st);
    setWeather(st, rem, { instant: true, silent: true });
}

function initWeather(saved) {
    if (saved) restoreWeather(saved);
    else setWeather(WEATHER.CLEAR, _weatherDurationFor(WEATHER.CLEAR), { instant: true, silent: true });
    updateWeatherHUD();
}

function updateWeatherHUD() {
    const el = document.getElementById('weatherIcon');
    if (!el) return;
    const d = WEATHER_DEFS[weatherState] || WEATHER_DEFS.clear;
    el.textContent = d.icon;
    el.title = d.label || '';
}

function updateWeather(dt) {
    if (!canvas) return;

    // تقدير FPS لخفض عدد القطرات عند التباطؤ
    if (_weatherLastTs > 0) {
        const frameMs = Math.max(1, dt);
        const fps = 1000 / frameMs;
        _weatherFpsEma = _weatherFpsEma * 0.9 + fps * 0.1;
        const pMin = (CFG && CFG.WEATHER_PARTICLE_MIN) || 50;
        const pMax = (CFG && CFG.WEATHER_PARTICLE_MAX) || 150;
        if (_weatherFpsEma < 40) _weatherParticleBudget = pMin;
        else if (_weatherFpsEma < 50) _weatherParticleBudget = Math.round((pMin + pMax) * 0.5);
        else _weatherParticleBudget = pMax;
    }
    _weatherLastTs = performance.now();

    const paused = _weatherIsPaused();

    // تلاشي التأثيرات البصرية يستمر بلطف حتى عند الإيقاف القصير
    const fadeSpeed = 1 / 1400;
    if (weatherFade < weatherFadeTarget) {
        weatherFade = Math.min(weatherFadeTarget, weatherFade + dt * fadeSpeed);
    } else if (weatherFade > weatherFadeTarget) {
        weatherFade = Math.max(weatherFadeTarget, weatherFade - dt * fadeSpeed);
    }

    const def = WEATHER_DEFS[weatherState] || WEATHER_DEFS.clear;
    weatherFogTarget = (def.fog || 0);
    const fogGoal = weatherFogTarget * weatherFade;
    const fogLerp = Math.min(1, dt / 900);
    weatherFogAlpha += (fogGoal - weatherFogAlpha) * fogLerp;

    if (!paused) {
        weatherRemainingMs -= dt;
        if (weatherRemainingMs <= 0) rollNextWeather();

        // عاصفة: ومضات متفرقة
        if (weatherState === WEATHER.STORM && weatherFlash <= 0 && Math.random() < 0.0009 * dt) {
            _scheduleStormBurst(true);
        }
    }

    if (weatherThunderAt && performance.now() >= weatherThunderAt) {
        weatherThunderAt = 0;
        if (typeof SFX !== 'undefined' && SFX.thunder && !paused) SFX.thunder();
    }

    if (weatherFlash > 0) {
        weatherFlash = Math.max(0, weatherFlash - dt / 220);
    }
    if (weatherShakeMs > 0) {
        weatherShakeMs = Math.max(0, weatherShakeMs - dt);
    }

    // مزامنة عدد القطرات مع الميزانية والحالة
    const want = Math.min(weatherTargetDrops, _weatherParticleBudget);
    if (want > weatherParticles.length) {
        const W = canvas.width, H = canvas.height;
        while (weatherParticles.length < want) {
            weatherParticles.push(_makeRainDrop(W, H, true));
        }
    } else if (want < weatherParticles.length) {
        weatherParticles.length = want;
    }

    if (!paused && weatherParticles.length) {
        const W = canvas.width, H = canvas.height;
        const wind = weatherState === WEATHER.STORM ? 1.35 : 1;
        for (const p of weatherParticles) {
            p.x += p.vx * wind * (dt / 16.67);
            p.y += p.vy * (dt / 16.67);
            if (p.y > H + 20 || p.x < -40) {
                p.x = Math.random() * (W + 40) - 20;
                p.y = -10 - Math.random() * 40;
                p.vx = -1.2 - Math.random() * 1.4;
                p.vy = 9 + Math.random() * 7;
                p.len = 8 + Math.random() * 10;
            }
        }
    }
}

function applyWeatherCameraShake() {
    if (weatherShakeMs <= 0 || !camera) return;
    const t = performance.now() * 0.05;
    const a = weatherShakeAmp * (weatherShakeMs / 400);
    camera.x += Math.sin(t * 2.1) * a;
    camera.y += Math.cos(t * 1.7) * a * 0.85;
}

function drawWeather() {
    if (!ctx || !canvas) return;
    const W = canvas.width, H = canvas.height;

    // مطر (بعد العالم / طبقة الليل)
    if (weatherParticles.length && weatherFade > 0.05) {
        const alpha = (weatherState === WEATHER.STORM ? 0.55 : 0.42) * weatherFade;
        ctx.save();
        ctx.strokeStyle = `rgba(180,210,255,${alpha})`;
        ctx.lineWidth = weatherState === WEATHER.STORM || weatherState === WEATHER.HEAVY_RAIN ? 1.35 : 1;
        ctx.beginPath();
        for (const p of weatherParticles) {
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p.x + p.vx * 0.9, p.y + p.len);
        }
        ctx.stroke();
        ctx.restore();
    }

    // ضباب — يزيد التعتيم فوق الليل قليلاً
    if (weatherFogAlpha > 0.01) {
        ctx.save();
        ctx.fillStyle = `rgba(120,130,145,${weatherFogAlpha * 0.55})`;
        ctx.fillRect(0, 0, W, H);
        // طبقة ثانية أغمق عند الحواف لتقليل التباين
        const g = ctx.createRadialGradient(W * 0.5, H * 0.45, Math.min(W, H) * 0.2,
            W * 0.5, H * 0.5, Math.max(W, H) * 0.72);
        g.addColorStop(0, 'rgba(40,48,58,0)');
        g.addColorStop(1, `rgba(30,36,48,${weatherFogAlpha * 0.5})`);
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, W, H);
        ctx.restore();
    }

    // وميض البرق أخيراً
    if (weatherFlash > 0.01) {
        ctx.save();
        ctx.fillStyle = `rgba(255,255,255,${weatherFlash * 0.72})`;
        ctx.fillRect(0, 0, W, H);
        ctx.restore();
    }
}

function stopWeatherAudio() {
    _syncRainSfx(false);
}
