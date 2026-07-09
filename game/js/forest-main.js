'use strict';
// =========================================================
//  FOREST MAIN — حلقة اللعبة والمدخلات وتدفق اللعب
// =========================================================

// ===== GAME STATE GLOBALS =====
let mouseWorldX = 0, mouseWorldY = 0;
let lockedTarget = null;
let camera = { x: 1100, y: 2350 };
let enemies = [];
let arrows  = [];
let resources = [];
let trees = [];
let droppedItems = [];

let gameRunning   = false;
let gamePaused    = false;
let gameCompleted = false;
let craftMenuOpen = false;
let backpackOpen  = false;
let buildMode     = false;
let lastTime = 0;
let canvas, ctx, minimapCanvas, minimapCtx;
let waveTime = 0;

// Intro typing state
let introIdx = 0;
let typingInterval = null;

// ===== CAMERA =====
function updateCamera() {
    const VW = canvas.width / ZOOM;
    const VH = canvas.height / ZOOM;
    camera.x = Math.max(0, Math.min(CFG.WORLD_W - VW, player.x - VW / 2));
    camera.y = Math.max(0, Math.min(CFG.WORLD_H - VH, player.y - VH / 2));
    if (player.nauseous) {
        const t = Date.now() * 0.008;
        camera.x += Math.sin(t) * 3.2;
        camera.y += Math.cos(t * 1.3) * 3.2;
    }
    if (typeof applyWeatherCameraShake === 'function') applyWeatherCameraShake();
}

// ===== CITY PORTAL =====
function isNearCityPortal() {
    return Math.hypot(player.x - CITY_PORTAL.x, player.y - CITY_PORTAL.y) < CITY_PORTAL.radius;
}

let _portalPanelVisible = false;
let _portalPanelDismissed = false;
let _portalPanelTimer = null;

function refreshPortalPanelCopy() {
    const panel = document.getElementById('cityPortalPanel');
    const hint = document.getElementById('cppHint');
    const go = document.getElementById('cppGoBtn');
    if (!panel || !hint) return;
    if (gameCompleted) {
        panel.classList.add('complete');
        hint.innerHTML =
            'أكملت تدريب الغابة! المدينة بانتظارك لرحلة <span>الانتقام</span>.<br>' +
            'يمكنك العودة للغابة من البوابة الشمالية في أي وقت.';
        if (go) go.textContent = 'متابعة إلى المدينة ←';
    } else {
        panel.classList.remove('complete');
        hint.innerHTML =
            '<span>تدريبك لم يكتمل بعد</span> — يُفضّل إنهاء القتلى والمسافة والتحديات أولاً.<br>' +
            'يمكنك المغادرة مبكراً، ولن يُسجَّل إكمال الغابة. يمكنك العودة لاحقاً.';
        if (go) go.textContent = 'مغادرة مبكرة إلى المدينة ←';
    }
}

function updatePortalPanel() {
    const panel = document.getElementById('cityPortalPanel');
    if (!panel) return;
    const near = gameRunning && isNearCityPortal();
    if (near && !_portalPanelDismissed && !_portalPanelVisible) {
        refreshPortalPanelCopy();
        panel.style.display = 'block';
        _portalPanelVisible = true;
        // يختفي التنبيه تلقائياً بعد 10 ثوانٍ
        if (_portalPanelTimer) clearTimeout(_portalPanelTimer);
        _portalPanelTimer = setTimeout(() => {
            if (_portalPanelVisible) dismissPortalPanel();
        }, 10000);
    } else if (!near) {
        if (_portalPanelVisible) {
            panel.style.display = 'none';
            _portalPanelVisible = false;
        }
        _portalPanelDismissed = false; // إعادة الضبط عند الابتعاد ليظهر مجدداً عند العودة
        if (_portalPanelTimer) { clearTimeout(_portalPanelTimer); _portalPanelTimer = null; }
    } else if (near && _portalPanelVisible) {
        refreshPortalPanelCopy();
    }
}

function dismissPortalPanel() {
    const panel = document.getElementById('cityPortalPanel');
    if (panel) panel.style.display = 'none';
    _portalPanelVisible = false;
    _portalPanelDismissed = true;
}

function enterCity() {
    if (typeof stopWeatherAudio === 'function') stopWeatherAudio();
    if (gameCompleted) {
        finishForest();     // يحفظ الإنجاز + لقطة الغابة ثم المدينة
    } else {
        // مغادرة مبكرة — لا تُعلّم completedForest
        if (_forestRafId) { cancelAnimationFrame(_forestRafId); _forestRafId = 0; }
        GameState.save('fromCity', false);
        navigateToScene('city', {
            skipPrereq: true,
            save: () => saveForestProgress({ force: true })
        });
    }
}

// ===== GAME FLOW =====
function killPlayer() {
    gameRunning = false;
    resetInputState();
    // Save on death (trigger)
    if (typeof saveForestProgress === 'function') {
        saveForestProgress({ force: true });
    }
    SFX.defeat();
    setTimeout(() => {
        document.getElementById('deathOverlay').style.display = 'flex';
    }, 600);
}

function respawn() {
    document.getElementById('deathOverlay').style.display = 'none';
    resetInputState();
    player.hp = Math.floor(player.maxHp * 0.6);
    player.x = 1600; player.y = 2800;
    for (const k of Object.keys(player.inventory)) player.inventory[k] = Math.floor(player.inventory[k] / 2);
    droppedItems = droppedItems.filter(i => Math.hypot(i.x - player.x, i.y - player.y) > 600);
    const nearDead = enemies.filter(e => e.isDead && Math.hypot(e.x - player.x, e.y - player.y) > 400);
    for (const e of nearDead.slice(0, 5)) {
        e.isDead = false;
        e.hp = e.maxHp;
        e.deathTimer = 0;
    }
    updateHUD();
    gameRunning = true;
    lastTime = performance.now();
    if (typeof focusGameCanvas === 'function') focusGameCanvas();
    _forestRafId = requestAnimationFrame(gameLoop);
    saveForestProgress();
}

function goToMenu() {
    if (_forestRafId) { cancelAnimationFrame(_forestRafId); _forestRafId = 0; }
    if (typeof stopWeatherAudio === 'function') stopWeatherAudio();
    navigateToScene('menu', {
        skipPrereq: true,
        save: () => saveProgress()
    });
}

function checkCompletion() {
    if (gameCompleted) return;
    // إن كان التقدم محفوظاً مسبقاً — لا تُعد عرض بانر النصر
    if (typeof GameState !== 'undefined' && GameState.load) {
        const prog = GameState.load('completedForest', false);
        if (prog) { gameCompleted = true; return; }
    }
    const kills = player.killCount >= CFG.KILLS_NEEDED;
    const dist  = player.distanceTraveled >= CFG.DIST_NEEDED;
    const chals = (player.craftedItems.axe ? 1 : 0) + (player.craftedItems.fishingRod ? 1 : 0) >= CFG.CHALLENGES_NEEDED;
    if (kills && dist && chals) {
        gameCompleted = true;
        setTimeout(showCompletion, 1500);
    }
}

function showCompletion() {
    // اللعبة تستمر — لا نوقفها، فقط نُظهر إشعاراً وشريطاً يختفي بعد 5 ثوانٍ
    if (typeof SFX !== 'undefined' && SFX.victory) SFX.victory();
    notify('🏆 أكملت تدريب الغابة! توجّه إلى بوابة المدينة جنوباً 🏙️', '#f0c040');
    setTimeout(() => notify('⬇️ البوابة في الجنوب — ادخلها للمضي نحو الانتقام!', '#2ecc71'), 3000);
    const banner = document.getElementById('completionBanner');
    if (banner) {
        banner.style.display = 'flex';
        banner.style.opacity = '1';
        banner.style.transition = 'opacity 0.6s';
        setTimeout(() => {
            banner.style.opacity = '0';
            setTimeout(() => {
                banner.style.display = 'none';
                banner.style.opacity = '1';
            }, 600);
        }, 5000);
    }
    if (_portalPanelVisible) refreshPortalPanelCopy();
}

const GRADUATION_LINES = [
    'تدرب أشرف في الغابة لأيام...',
    'تعلّم الصيد والصناعة والقتال...',
    'حان الوقت لمواصلة الرحلة نحو الانتقام...'
];

function playGraduationThen(goCity) {
    const ov = document.getElementById('graduationOverlay');
    const el = document.getElementById('graduationText');
    if (!ov || !el) { goCity(); return; }

    gameRunning = false;
    if (_forestRafId) { cancelAnimationFrame(_forestRafId); _forestRafId = 0; }
    ov.classList.add('show');
    el.innerHTML = '';

    let lineIdx = 0;
    let charIdx = 0;
    let full = '';

    function typeNext() {
        if (lineIdx >= GRADUATION_LINES.length) {
            setTimeout(goCity, 900);
            return;
        }
        const line = GRADUATION_LINES[lineIdx];
        if (charIdx <= line.length) {
            el.innerHTML = full + line.slice(0, charIdx) + '<span class="grad-cursor">|</span>';
            charIdx++;
            setTimeout(typeNext, 38);
        } else {
            full += line + '<br>';
            el.innerHTML = full;
            lineIdx++;
            charIdx = 0;
            setTimeout(typeNext, 420);
        }
    }
    typeNext();
}

function finishForest() {
    if (typeof stopWeatherAudio === 'function') stopWeatherAudio();
    // احفظ لقطة الغابة (لا تمسحها) حتى تبقى العودة من المدينة ممكنة
    if (typeof saveForestProgress === 'function') {
        saveForestProgress({ force: true });
    } else {
        GameState.save('inventory', player.inventory);
        GameState.save('craftedItems', player.craftedItems);
        GameState.save('heroStats', {
            hp: player.hp, maxHp: player.maxHp,
            attack: player.attack, defense: player.defense,
            skills: player.skills,
            absorbedAttack: player.absorbedAttack,
            absorbedDefense: player.absorbedDefense,
            xp: player.xp || 0, level: player.level || 1
        });
    }
    GameState.save('completedForest', true);
    if (typeof GameState.setCurrentMap === 'function') GameState.setCurrentMap('city');
    if (typeof SFX !== 'undefined' && SFX.click) SFX.click();

    playGraduationThen(() => {
        if (_forestRafId) { cancelAnimationFrame(_forestRafId); _forestRafId = 0; }
        navigateToScene('city', {
            skipPrereq: true,
            save: () => GameState.autoSave(true)
        });
    });
}

// ===== INTRO STORY =====
function showIntroScene(idx) {
    const scene = INTRO_SCENES[idx];
    const bg    = document.getElementById('introSceneBg');
    const img   = document.getElementById('introSceneImg');
    const step  = document.getElementById('introStep');
    const btn   = document.getElementById('introBtn');
    const hint  = document.getElementById('introHintBox');

    step.textContent   = `${idx + 1} / ${INTRO_SCENES.length}`;
    btn.style.display  = 'none';
    hint.style.display = 'none';

    if (scene.img) {
        img.src = scene.img;
        bg.classList.add('show');
    } else {
        bg.classList.remove('show');
    }

    typeText(scene.text, () => {
        if (idx < INTRO_SCENES.length - 1) {
            setTimeout(() => showIntroScene(idx + 1), 2800);
        } else {
            if (scene.showHints) hint.style.display = 'block';
            btn.style.display = 'inline-block';
        }
    });
}

function typeText(html, onDone) {
    const el = document.getElementById('introText');
    el.innerHTML = '';
    if (typingInterval) clearInterval(typingInterval);
    let i = 0;
    typingInterval = setInterval(() => {
        if (i >= html.length) {
            clearInterval(typingInterval);
            el.innerHTML = html;
            if (onDone) onDone();
            return;
        }
        if (html[i] === '<') {
            const end = html.indexOf('>', i);
            if (end !== -1) { i = end + 1; }
        }
        i++;
        el.innerHTML = html.substring(0, i) + '<span style="color:#e74c3c">|</span>';
    }, 42);
}

function startGame() {
    if (typingInterval) clearInterval(typingInterval);
    const ov = document.getElementById('introOverlay');
    ov.style.opacity    = '0';
    ov.style.transition = 'opacity 0.8s';
    setTimeout(() => {
        ov.style.display = 'none';
        gameRunning = true;
        lastTime = performance.now();
        updateHUD();
        focusGameCanvas();
        if (typeof initWildlife === 'function') initWildlife();
        if (typeof initWeather === 'function') initWeather(null);
        _forestRafId = requestAnimationFrame(gameLoop);
        setTimeout(() => notify('💡 اضغط F للصناعة، Q للأكل', '#f0c040'), 2000);
        setTimeout(() => notify('🏹 اضغط 2 للقوس — انقر لإطلاق السهم', '#c8a040'), 5000);
        setTimeout(() => notify('⬇️ اقترب من الغنائم واضغط E لالتقاطها', '#2ecc71'), 8000);
    }, 850);
}

// ===== IDLE POEM SYSTEM =====
let poemsData       = null; // null = loading, [] = failed, [...] = ready
let idleTime        = 0;
let poemActive      = false;
let poemVerses      = [];
let poemVerseIdx    = 0;
const _poemTimers   = new Set(); // جميع timers النشطة
const POEM_IDLE_MS     = 10000;
const POEM_VERSES_SHOW = 7;

// قصائد احتياطية فورية (لا تحتاج ملفاً)
const FALLBACK_POEMS = [
    { poem: ["أَلا لَيتَ الشَّبابَ يَعودُ يَوماً", "فَأُخبِرَهُ بِما فَعَلَ المَشيبُ"], verses: 2 },
    { poem: ["إِذا كُنتَ في كُلِّ الأُمورِ مُعاتِباً صَديقَكَ",
             "لَم تَلقَ الَّذي لا تُعاتِبُه",
             "فَعِش واحِداً أَو صِل أَخاكَ فَإِنَّهُ",
             "مُقارِفُ ذَنبٍ مَرَّةً وَمُجانِبُه"], verses: 4 },
    { poem: ["وَإِذَا كَانَتِ النُّفُوسُ كِبَاراً تَعِبَت في مُرَادِهَا الأَجسَامُ",
             "فَاطلُب العِزَّ في لَظَى الحَربِ وَاصبِر",
             "إِنَّمَا يُدرَكُ العُلَا الصَبَّارُ"], verses: 3 },
    { poem: ["أَخِي لَن تَنَالَ العِلمَ إِلَّا بِسِتَّةٍ",
             "سَأُنبِيكَ عَن تَفصِيلِهَا بِبَيَانِ",
             "ذَكَاءٌ وَحِرصٌ وَاجتِهَادٌ وَبُلغَةٌ",
             "وَصُحبَةُ أُستَاذٍ وَطُولُ زَمَانِ"], verses: 4 },
    { poem: ["لِكُلِّ شَيءٍ إِذَا مَا تَمَّ نُقصَانُ",
             "فَلَا يُغَرَّ بِطِيبِ العَيشِ إِنسَانُ",
             "هِيَ الأُمُورُ كَمَا شَاهَدتُهَا دُوَلٌ",
             "مَن سَرَّهُ زَمَنٌ سَاءَتهُ أَزمَانُ"], verses: 4 },
];

// تحميل القصائد: يقرأ أول 80 قصيدة فقط لتفادي تجميد الصفحة (الملف 20MB)
function _parseFirstNPoems(text, n) {
    const result = [];
    let i = (text.indexOf('[') + 1) || 0;
    let depth = 0, objStart = -1, inStr = false, esc = false;
    while (i < text.length && result.length < n) {
        const c = text[i];
        if (esc)            { esc = false; i++; continue; }
        if (c === '\\' && inStr) { esc = true;  i++; continue; }
        if (c === '"')      { inStr = !inStr; i++; continue; }
        if (!inStr) {
            if (c === '{') { if (depth === 0) objStart = i; depth++; }
            else if (c === '}') {
                depth--;
                if (depth === 0 && objStart !== -1) {
                    try { result.push(JSON.parse(text.slice(objStart, i + 1))); }
                    catch (_) {}
                    objStart = -1;
                }
            }
        }
        i++;
    }
    return result;
}

function loadPoems() {
    poemsData = FALLBACK_POEMS; // متاح فوراً
    // تحميل الملف الحقيقي بعد 4 ثوانٍ لعدم التأثير على بدء اللعبة
    setTimeout(() => {
        const xhr = new XMLHttpRequest();
        xhr.open('GET', '../data/arabic_poems.json', true);
        xhr.timeout = 12000;
        xhr.onload = function () {
            if (xhr.status === 200 || xhr.status === 0) {
                try {
                    const parsed = _parseFirstNPoems(xhr.responseText, 80);
                    if (parsed.length) poemsData = parsed;
                } catch (_) {}
            }
        };
        xhr.onerror = xhr.ontimeout = function () {}; // يبقى على الاحتياطي
        xhr.send();
    }, 4000);
}

// مساعدة: setTimeout مع تتبع الـ timers لإيقافها بأمان
function _poemTimeout(fn, ms) {
    const id = setTimeout(() => { _poemTimers.delete(id); fn(); }, ms);
    _poemTimers.add(id);
    return id;
}

function extractVerses(poem) {
    const all = Array.isArray(poem.poem)
        ? poem.poem.filter(v => v && v.trim())
        : String(poem.poem).split(/\n|\s{3,}/).filter(Boolean);
    const count    = Math.min(POEM_VERSES_SHOW, all.length);
    const maxStart = Math.max(0, all.length - count);
    const start    = Math.floor(Math.random() * (maxStart + 1));
    return all.slice(start, start + count);
}

function startIdlePoem() {
    if (!poemsData || !poemsData.length || poemActive || !gameRunning) return;
    poemActive   = true;
    idleTime     = 0;
    const poem   = poemsData[Math.floor(Math.random() * poemsData.length)];
    poemVerses   = extractVerses(poem);
    poemVerseIdx = 0;

    const overlay = document.getElementById('poemOverlay');
    const linesEl = document.getElementById('poemLines');
    if (!overlay || !linesEl) { poemActive = false; return; }

    linesEl.innerHTML = '';
    overlay.style.display = 'block';
    requestAnimationFrame(() => overlay.classList.add('visible'));
    typeNextVerse();
}

function typeNextVerse() {
    if (!poemActive) return;
    if (poemVerseIdx >= poemVerses.length) {
        _poemTimeout(stopIdlePoem, 10000);
        return;
    }

    const linesEl = document.getElementById('poemLines');
    if (!linesEl) return;

    const verse  = poemVerses[poemVerseIdx];
    const lineEl = document.createElement('div');
    lineEl.className = 'poem-verse active-verse';
    linesEl.appendChild(lineEl);

    while (linesEl.children.length > POEM_VERSES_SHOW)
        linesEl.children[0].remove();

    let charIdx = 0;
    (function tick() {
        if (!poemActive) return;
        if (charIdx < verse.length) {
            lineEl.textContent = verse.substring(0, charIdx + 1);
            charIdx++;
            _poemTimeout(tick, 40);
        } else {
            lineEl.classList.remove('active-verse');
            poemVerseIdx++;
            _poemTimeout(typeNextVerse, 900);
        }
    })();
}

function stopIdlePoem() {
    // إيقاف جميع timers النشطة دفعة واحدة
    _poemTimers.forEach(id => clearTimeout(id));
    _poemTimers.clear();
    poemActive = false;
    idleTime   = 0;
    const overlay = document.getElementById('poemOverlay');
    if (!overlay) return;
    overlay.classList.remove('visible');
    const hideId = setTimeout(() => { if (!poemActive) overlay.style.display = 'none'; }, 700);
    _poemTimers.add(hideId);
}

function updateIdlePoem(dt) {
    if (!poemsData || !gameRunning || gamePaused || craftMenuOpen) return;
    if (player.isMoving) {
        if (poemActive) stopIdlePoem();
        idleTime = 0;
        return;
    }
    if (poemActive) return;
    idleTime += dt;
    if (idleTime >= POEM_IDLE_MS) startIdlePoem();
}

// ===== GAME LOOP =====
let _forestRafId = 0;

function gameLoop(ts) {
    if (!gameRunning) {
        _forestRafId = requestAnimationFrame(gameLoop);
        return;
    }
    _forestRafId = requestAnimationFrame(gameLoop);

    try {
        const dt = Math.min(ts - lastTime, 50);
        lastTime = ts;
        waveTime = ts;

        if (!craftMenuOpen && !backpackOpen
            && !(typeof sleepMenuOpen !== 'undefined' && sleepMenuOpen)
            && !(typeof campfireMenuOpen !== 'undefined' && campfireMenuOpen)) {
            if (!gamePaused && !buildMode) {
                updatePlayer(dt);
                updateEnemies(dt);
                updateArrows();
                updatePoison(dt);
                updateNausea(dt);
                updateDayNight(dt);
                if (typeof updateWildlife === 'function') updateWildlife(dt);
                if (typeof updateStructures === 'function') updateStructures(dt);
                if (typeof updateWeather === 'function') updateWeather(dt);
            } else {
                if (typeof updateDayNight === 'function') updateDayNight(0);
                // الطقس: لا يتقدّم المؤقت أثناء الإيقاف (حارس داخلي) لكن يحدّث التلاشي/الرسم
                if (typeof updateWeather === 'function') updateWeather(dt);
            }
            if (!gamePaused) {
                updateFishing(dt);
                updateDroppedItems(dt);
            }
        } else {
            if (typeof updateDayNight === 'function') updateDayNight(0);
            if (typeof updateWeather === 'function') updateWeather(dt);
        }
        if (typeof updateCampfireHint === 'function') updateCampfireHint();
        updateIdlePoem(dt);
        updateCamera();

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.save();
        ctx.scale(ZOOM, ZOOM);

        drawWorld(camera.x, camera.y);

        for (const r of resources)    r.draw(camera.x, camera.y);
        for (const d of droppedItems) d.draw(camera.x, camera.y);
        if (typeof drawStructuresBehind === 'function') drawStructuresBehind(camera.x, camera.y);
        for (const e of enemies)      e.draw(camera.x, camera.y);
        for (const a of arrows)       a.draw(camera.x, camera.y);

        drawAimReticle(camera.x, camera.y);
        drawCityPortal(camera.x, camera.y);
        drawPlayer(camera.x, camera.y);
        drawFishingLine(camera.x, camera.y);
        drawTreesFront(camera.x, camera.y);
        if (typeof drawStructuresFront === 'function') drawStructuresFront(camera.x, camera.y);
        if (typeof drawBuildGhost === 'function') drawBuildGhost(camera.x, camera.y);

        ctx.restore();
        drawNightOverlay();
        if (typeof drawWeather === 'function') drawWeather();
        drawMinimap();
        updatePortalPanel();
    } catch (err) {
        try { ctx.restore(); } catch(_) {}
        console.error('[gameLoop]', err);
    }
}

// ===== INPUT — e.code (مستقل عن لغة لوحة المفاتيح العربية/الإنجليزية) =====
const keys = { up: false, down: false, left: false, right: false, sprint: false };

const CODE_TO_MOVE = {
    KeyW: 'up', ArrowUp: 'up',
    KeyS: 'down', ArrowDown: 'down',
    KeyA: 'left', ArrowLeft: 'left',
    KeyD: 'right', ArrowRight: 'right',
    ShiftLeft: 'sprint', ShiftRight: 'sprint',
};

function setMoveKey(code, pressed) {
    const dir = CODE_TO_MOVE[code];
    if (dir) keys[dir] = pressed;
}

function resetInputState() {
    clearKeys();
    gamePaused = false;
    craftMenuOpen = false;
    backpackOpen = false;
    buildMode = false;
    if (typeof campfireMenuOpen !== 'undefined' && campfireMenuOpen) closeCampfireMenu();
    if (typeof sleepMenuOpen !== 'undefined' && sleepMenuOpen) closeSleepMenu();
    player.isFishing = false;
    player.fishingBite = false;
    player.fishingTimer = 0;
    player.fishingBiteTimer = 0;
    const craft = document.getElementById('craftingMenu');
    const pack  = document.getElementById('backpackPanel');
    const build = document.getElementById('buildBar');
    const fish  = document.getElementById('fishingStatus');
    if (craft) craft.classList.add('hidden');
    if (pack)  pack.classList.add('hidden');
    if (build) build.style.display = 'none';
    if (fish)  fish.style.display = 'none';
}

function clearKeys() {
    keys.up = keys.down = keys.left = keys.right = keys.sprint = false;
}

function focusGameCanvas() {
    if (canvas && typeof canvas.focus === 'function') canvas.focus({ preventScroll: true });
}

function handleKeyDown(e) {
    if (e.repeat) return;
    const tag = e.target && e.target.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA') return;

    setMoveKey(e.code, true);

    if (poemActive && ['KeyW','KeyA','KeyS','KeyD','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.code))
        stopIdlePoem();

    switch (e.code) {
        case 'KeyF':
            if (gameRunning || craftMenuOpen) openCraftingMenu();
            break;
        case 'KeyQ':
            if (gameRunning && !craftMenuOpen && !backpackOpen) eatMeat();
            break;
        case 'KeyI':
            if (gameRunning || backpackOpen) openBackpack();
            break;
        case 'KeyB':
            if (typeof toggleBuildMode === 'function' && (gameRunning || buildMode)) toggleBuildMode();
            break;
        case 'KeyP':
            // اختصار الحفظ اليدوي
            if (gameRunning && typeof manualSaveGame === 'function') manualSaveGame();
            break;
        case 'KeyM':
            if (typeof toggleMuteKey === 'function') toggleMuteKey();
            break;
        case 'Digit1':
            player.weapon = 'sword'; notify('⚔️ السيف', '#c0c0c0');
            break;
        case 'Digit2':
            player.weapon = 'bow'; notify('🏹 القوس', '#c8a040');
            break;
        case 'KeyR':
            if (gameRunning && !craftMenuOpen && !backpackOpen) startFishing();
            break;
        case 'KeyE':
            if (gameRunning && !craftMenuOpen && !backpackOpen && !buildMode
                && !(typeof sleepMenuOpen !== 'undefined' && sleepMenuOpen)
                && !(typeof campfireMenuOpen !== 'undefined' && campfireMenuOpen)) {
                const nearDamaged = (typeof findNearbyDamagedStructure === 'function') ? findNearbyDamagedStructure() : null;
                const nearGate = (typeof findNearbyGate === 'function') ? findNearbyGate() : null;
                const nearHut = (typeof findNearbyHut === 'function') ? findNearbyHut() : null;
                const nearFire = (typeof findNearbyCampfire === 'function') ? findNearbyCampfire(false) : null;
                const nearDrop = droppedItems.find(i => i.isNearPlayer());
                const nearRes  = resources.find(r => r.isNearPlayer());
                const nearTree = trees.find(t => !t.chopped &&
                    Math.hypot(player.x - t.x, player.y - t.y) < t.r + 32);

                // إصلاح المباني المتضررة أولاً
                if (nearDamaged && typeof tryRepairStructure === 'function') {
                    tryRepairStructure();
                    break;
                }

                // اختر أقرب تفاعل بين بوابة / كوخ / موقد
                const candidates = [];
                if (nearGate) candidates.push({
                    kind: 'gate', d: Math.hypot(player.x - nearGate.x, player.y - nearGate.y), ref: nearGate
                });
                if (nearHut && (!nearHut.hp || nearHut.hp >= nearHut.maxHp)) candidates.push({
                    kind: 'hut', d: Math.hypot(player.x - nearHut.x, player.y - nearHut.y), ref: nearHut
                });
                if (nearFire) candidates.push({
                    kind: 'fire', d: Math.hypot(player.x - nearFire.x, player.y - nearFire.y), ref: nearFire
                });
                candidates.sort((a, b) => a.d - b.d);

                if (candidates.length) {
                    const top = candidates[0];
                    if (top.kind === 'gate' && typeof toggleNearbyGate === 'function') toggleNearbyGate(top.ref);
                    else if (top.kind === 'hut') openSleepMenu();
                    else if (top.kind === 'fire' && typeof openCampfireMenu === 'function') openCampfireMenu(top.ref);
                } else if (nearDrop) nearDrop.pickup();
                else if (nearRes) nearRes.pickup();
                else if (nearTree) chopTree(nearTree);
                else if (player.weapon === 'sword') playerAttack();
            }
            break;
        case 'Space':
            if (gameRunning && !craftMenuOpen && !backpackOpen
                && !(typeof sleepMenuOpen !== 'undefined' && sleepMenuOpen)
                && !(typeof campfireMenuOpen !== 'undefined' && campfireMenuOpen)
                && player.weapon === 'sword') playerAttack();
            break;
        case 'Escape':
            if (typeof audioPanelOpen !== 'undefined' && audioPanelOpen && typeof closeAudioPanel === 'function') closeAudioPanel();
            else if (typeof campfireMenuOpen !== 'undefined' && campfireMenuOpen) closeCampfireMenu();
            else if (typeof sleepMenuOpen !== 'undefined' && sleepMenuOpen) closeSleepMenu();
            else if (craftMenuOpen) closeCraftingMenu();
            else if (backpackOpen) closeBackpack();
            else if (buildMode && typeof exitBuildMode === 'function') exitBuildMode();
            else if (player.isFishing) reelIn();
            break;
    }

    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) e.preventDefault();
}

function handleKeyUp(e) {
    setMoveKey(e.code, false);
}

window.addEventListener('keydown', handleKeyDown, true);
window.addEventListener('keyup', handleKeyUp, true);
window.addEventListener('blur', clearKeys);
document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        clearKeys();
        if (gameRunning) {
            gamePaused = true;
            if (typeof saveForestProgress === 'function') {
                saveForestProgress({ force: true });
            } else if (typeof GameState !== 'undefined' && GameState.autoSave) {
                GameState.autoSave(true);
            }
        }
    } else if (gameRunning && gamePaused) {
        // Resume only if no menu overlay is holding the pause
        const craft = document.getElementById('craftingMenu');
        const pack = document.getElementById('backpackPanel');
        const craftOpen = craft && !craft.classList.contains('hidden');
        const packOpen = pack && !pack.classList.contains('hidden');
        if (!craftOpen && !packOpen
            && !(typeof sleepMenuOpen !== 'undefined' && sleepMenuOpen)
            && !(typeof campfireMenuOpen !== 'undefined' && campfireMenuOpen)) {
            gamePaused = false;
            lastTime = performance.now();
        }
    }
});

// ===== RESIZE =====
function resizeCanvas() {
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;
}
window.addEventListener('resize', resizeCanvas);

// ===== INIT =====
function init() {
    if (typeof guardSceneAccess === 'function' && !guardSceneAccess('forest')) return;
    if (typeof SFX !== 'undefined' && SFX.loadSettings) SFX.loadSettings();
    if (typeof syncAudioPanelUI === 'function') syncAudioPanelUI();

    canvas = document.getElementById('gameCanvas');
    canvas.setAttribute('tabindex', '0');
    canvas.style.outline = 'none';
    resizeCanvas();
    minimapCanvas = document.getElementById('minimap');
    minimapCtx    = minimapCanvas.getContext('2d');
    ctx = canvas.getContext('2d');
    loadPoems(); // تحميل القصائد في الخلفية

    canvas.addEventListener('mousemove', e => {
        const r = canvas.getBoundingClientRect();
        mouseWorldX = (e.clientX - r.left) / ZOOM + camera.x;
        mouseWorldY = (e.clientY - r.top)  / ZOOM + camera.y;
    });
    canvas.addEventListener('mousedown', () => focusGameCanvas());
    canvas.addEventListener('contextmenu', e => {
        e.preventDefault();
        if (!gameRunning || gamePaused) return;
        if (buildMode) {
            const r = canvas.getBoundingClientRect();
            const wx = (e.clientX - r.left) / ZOOM + camera.x;
            const wy = (e.clientY - r.top)  / ZOOM + camera.y;
            if (typeof tryRemoveBuild === 'function') tryRemoveBuild(wx, wy);
            return;
        }
        if (player.weapon !== 'bow') {
            player.weapon = 'bow';
            updateHUD();
        }
        const r = canvas.getBoundingClientRect();
        const mx = (e.clientX - r.left) / ZOOM + camera.x;
        const my = (e.clientY - r.top)  / ZOOM + camera.y;
        let best = null, bestDist = Infinity;
        for (const en of enemies) {
            if (en.isDead) continue;
            const d = Math.hypot(en.x - mx, en.y - my);
            if (d < bestDist) { bestDist = d; best = en; }
        }
        if (best && bestDist < 400) {
            if (lockedTarget === best) {
                lockedTarget = null;
                notify('🎯 إلغاء القفل', '#aaa');
            } else {
                lockedTarget = best;
                notify(`🎯 قفل على ${best.name || 'هدف'}`, '#ff6060');
            }
        } else {
            lockedTarget = null;
            notify('🎯 لا هدف قريب', '#aaa');
        }
    });
    canvas.addEventListener('wheel', e => {
        if (!gameRunning) return;
        e.preventDefault();
        if (buildMode) {
            if (typeof cycleBuildable === 'function') cycleBuildable(e.deltaY > 0 ? 1 : -1);
            return;
        }
        player.weapon = player.weapon === 'sword' ? 'bow' : 'sword';
        notify(player.weapon === 'sword' ? '⚔️ السيف' : '🏹 القوس', '#ffd060');
        updateHUD();
    }, { passive: false });
    canvas.addEventListener('click', e => {
        if (!gameRunning || craftMenuOpen || backpackOpen || (typeof sleepMenuOpen !== 'undefined' && sleepMenuOpen)) return;
        const r = canvas.getBoundingClientRect();
        const wx = (e.clientX - r.left) / ZOOM + camera.x;
        const wy = (e.clientY - r.top)  / ZOOM + camera.y;
        if (buildMode) {
            if (typeof tryPlaceBuild === 'function') tryPlaceBuild(wx, wy);
            return;
        }
        if (gamePaused) return;
        if (player.weapon === 'bow') {
            mouseWorldX = wx;
            mouseWorldY = wy;
            shootArrow();
        } else {
            playerAttack();
        }
    });

    generateWorld();
    spawnEnemies();
    spawnResources();

    const saved      = GameState.getHeroStats();
    player.hp        = saved.hp;
    player.maxHp     = saved.maxHp;
    player.attack    = saved.attack;
    player.defense   = saved.defense;
    player.skills    = saved.skills;
    player.absorbedAttack  = saved.absorbedAttack || 0;
    player.absorbedDefense = saved.absorbedDefense || 0;
    player.xp        = saved.xp || 0;
    player.level     = saved.level || (1 + Math.floor((player.xp || 0) / 100));

    const savedInv = GameState.getInventory();
    player.inventory = (typeof GameState.normalizeInventory === 'function')
        ? GameState.normalizeInventory(savedInv)
        : Object.assign({
            stick: 0, stone: 0, meat: 0, horn: 0, teeth: 0, leather: 0, fish: 0, arrows: 15,
            rawMeat: 0, cookedMeat: 0, rawFish: 0, cookedFish: 0,
            beastHide: 0, nightCrystal: 0, venomSac: 0, shadowEssence: 0,
            herb: 0, honey: 0, herbSalve: 0, revitalTonic: 0
        }, savedInv);

    const savedCraft = GameState.getCraftedItems();
    player.craftedItems = Object.assign(
        { axe: false, fishingRod: false, hornSpear: false, hornSword: false, leatherArmor: false, shadowArmor: false },
        savedCraft
    );

    updateHUD();

    const loadLabel = (typeof createLoadingScreen === 'function')
        ? createLoadingScreen('جاري تحميل الخريطة…')
        : (() => {
            const el = document.createElement('div');
            el.style.cssText = 'position:fixed;inset:0;z-index:200;display:flex;align-items:center;' +
                'justify-content:center;background:#060e04;color:#6fc;font-family:Cairo,sans-serif;' +
                'font-size:1.5rem;font-weight:700;letter-spacing:3px;';
            el.textContent = 'جاري تحميل الخريطة…';
            return el;
        })();
    document.body.appendChild(loadLabel);

    loadTerrainTextures((textures) => {
        prerenderTerrain(textures);
        loadLabel.remove();

        const forestSave       = GameState.loadForestState();
        const fromCity         = GameState.load('fromCity', false);
        const skipForestIntro  = GameState.load('skipForestIntro', false);
        if (skipForestIntro) GameState.save('skipForestIntro', false); // consume the flag

        if (fromCity) {
            GameState.save('fromCity', false);
            if (forestSave) {
                forestSave.x = CITY_PORTAL.x;
                forestSave.y = CITY_PORTAL.y - 80;
            }
            resumeGame(forestSave || { seenIntro: true, x: CITY_PORTAL.x, y: CITY_PORTAL.y - 80 }, { fromCity: true });
        } else if (forestSave && forestSave.seenIntro) {
            resumeGame(forestSave);
        } else if (skipForestIntro) {
            // Came from "Continue Game" in the main menu — jump straight in
            resumeGame(forestSave || { seenIntro: true, x: 1600, y: 2800 });
        } else {
            showIntroScene(0);
        }
    });
}

init();
