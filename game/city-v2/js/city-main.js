'use strict';

// =========================================================
//  CITY MAIN — نقطة التهيئة الرئيسية وحلقة اللعب (v2)
// =========================================================

(function CityMain() {
    /* ── عناصر الـ Canvas ── */
    let canvas, ctx;

    /* ── حالة وقت الإطار ── */
    let lastTime = 0;
    let rafId    = null;

    /* ── مؤشر قبول الإدخال ── */
    const keys = {};

    /* =====================================================
       التهيئة الرئيسية
       ===================================================== */
    function init() {
        // إظهار شاشة التحميل
        showLoadingScreen(true);
        updateLoadingBar(10);

        // تهيئة Canvas
        canvas = document.getElementById('city-canvas');
        if (!canvas) return console.error('[CityMain] #city-canvas غير موجود!');
        ctx = canvas.getContext('2d');

        // ضبط أبعاد Canvas للشاشة
        resizeCanvas();
        window.addEventListener('resize', resizeCanvas);
        updateLoadingBar(20);

        // تحميل حالة اللاعب من GameState
        loadCityState();

        // تهيئة الحقول المؤقتة الإضافية
        CityState.transient.showMinimap  = true;
        CityState.transient.soundMuted   = false;
        CityState.transient.nearBuilding = null;
        CityState.transient.nearPortal   = null;
        CityState.transient.activeSlot   = 'arrows';
        updateLoadingBar(35);

        // تهيئة الطقس والزمن (لا يحتاج Canvas حتى الآن)
        if (window.CityWeather && typeof CityWeather.init === 'function') {
            CityWeather.init(CityConfig);
        }
        updateLoadingBar(50);

        // تهيئة واجهة المستخدم (DOM)
        CityHUD.init();
        if (window.CityDialogue && typeof CityDialogue.init === 'function') {
            CityDialogue.init();
        }
        updateLoadingBar(65);

        // ربط ملفات الإدخال
        bindInput();
        updateLoadingBar(75);

        // تشغيل موسيقى المدينة المحيطية
        startAmbientAudio();

        // تهيئة خريطة التضاريس (تُحمَّل الأنسجة ثم ترسم مسبقاً)
        // initCityMap يستدعي onReady عند الانتهاء → نبدأ حلقة اللعب هناك
        initCityMap(() => {
            updateLoadingBar(100);
            setTimeout(() => {
                showLoadingScreen(false);
                // بدء حلقة اللعب بعد اكتمال رسم التضاريس
                lastTime = performance.now();
                rafId = requestAnimationFrame(gameLoop);
            }, 400);
        });
    }

    /* =====================================================
       حلقة اللعب الرئيسية
       ===================================================== */
    function gameLoop(timestamp) {
        const dt = Math.min((timestamp - lastTime) / 1000, 0.05);
        lastTime = timestamp;

        // تحديث اللاعب (CityPlayer.update accepts dt + keys only)
        if (window.CityPlayer && typeof CityPlayer.update === 'function') {
            CityPlayer.update(dt, CityState.transient.keys || {});
        }

        // تحديث الطقس والوقت
        if (window.CityWeather && typeof CityWeather.update === 'function') {
            CityWeather.update(dt);
        }

        // تحديث الشخصيات المتجولين (BaseNPCManager.update accepts dt)
        if (window.CityNPCs && typeof CityNPCs.update === 'function') {
            CityNPCs.update(dt);
        }

        // تحديث هروب الحمام عند اقتراب اللاعب
        if (typeof updatePigeonsFlight === 'function') {
            updatePigeonsFlight(CityState.player.x, CityState.player.y);
        }

        // كشف التفاعل التلقائي مع المباني عند الاقتراب
        checkProximityPrompts();

        // رسم المشهد بالكامل
        CityRenderer.renderAll(ctx);

        // رسم الخريطة المصغرة
        if (window.CityMinimap && CityState.transient.showMinimap) {
            CityMinimap.draw(ctx, canvas.width, canvas.height);
        }

        // تحديث عناصر الـ HUD
        CityHUD.update();

        rafId = requestAnimationFrame(gameLoop);
    }

    /* =====================================================
       كشف الاقتراب من المباني والنقاط التفاعلية
       ===================================================== */
    function checkProximityPrompts() {
        const player = CityState.player;
        const buildings = CityConfig.BUILDINGS || [];

        let promptShown = false;
        for (const b of buildings) {
            const dist = Math.hypot(player.x - (b.x + b.w / 2), player.y - (b.y + b.h / 2));
            if (dist < (b.interactRadius || 72)) {
                CityState.transient.nearBuilding = b.id;
                promptShown = true;
                break;
            }
        }
        if (!promptShown) {
            CityState.transient.nearBuilding = null;
        }

        // التحقق من البوابتين
        if (CityConfig.FOREST_PORTAL && CityPortals.isNearPortal(CityConfig.FOREST_PORTAL)) {
            CityState.transient.nearPortal = 'forest';
        } else if (CityConfig.SOUTH_GATE && CityPortals.isNearPortal(CityConfig.SOUTH_GATE)) {
            CityState.transient.nearPortal = 'south';
        } else {
            CityState.transient.nearPortal = null;
        }
    }

    /* =====================================================
       ربط الإدخال (لوحة المفاتيح + اللمس + الماوس)
       ===================================================== */
    function bindInput() {
        // ـ لوحة المفاتيح ـ
        window.addEventListener('keydown', e => {
            keys[e.code] = true;
            CityState.transient.keys[e.code] = true;
            handleKeyPress(e.code, e);
        });
        window.addEventListener('keyup', e => {
            keys[e.code] = false;
            CityState.transient.keys[e.code] = false;
        });

        // ـ نقرات الماوس (للخريطة المصغرة والمودال) ـ
        canvas.addEventListener('click', e => {
            const rect = canvas.getBoundingClientRect();
            const mx = e.clientX - rect.left;
            const my = e.clientY - rect.top;
            if (window.CityMinimap) {
                CityMinimap.handleClick(mx, my);
            }
        });

        // ـ أزرار اللمس المتنقلة ـ
        setupTouchControls();
    }

    /**
     * معالجة ضغطات المفاتيح الوظيفية
     */
    function handleKeyPress(code, e) {
        switch (code) {
            // تفاعل مع المبنى أو البوابة القريبة
            case 'KeyE':
                if (CityState.transient.nearPortal) {
                    CityPortals.handleInteract();
                } else if (CityState.transient.nearBuilding) {
                    handleBuildingInteract(CityState.transient.nearBuilding);
                } else {
                    // تحقق إذا كان اللاعب قريباً من شخصية NPC ثابتة
                    if (window.CityNPCs && CityNPCs.npcs) {
                        const px = CityState.player.x, py = CityState.player.y;
                        const nearby = CityNPCs.npcs.find(n =>
                            Math.hypot(px - n.x, py - n.y) < 70
                        );
                        if (nearby && typeof nearby.onInteract === 'function') {
                            nearby.onInteract();
                        }
                    }
                }
                break;

            // إغلاق المودال المفتوح
            case 'Escape':
                if (window.CityDialogue) CityDialogue.closeModal();
                break;

            // تبديل الخريطة المصغرة
            case 'KeyM':
                if (window.CityMinimap) CityMinimap.toggle();
                break;

            // فتح حقيبة الأدوات
            case 'KeyI':
                if (window.CityDialogue) CityDialogue.openInventory();
                break;

            // أرقام الحزام السريع
            case 'Digit1': CityHUD.selectSlot('arrows');    break;
            case 'Digit2': CityHUD.selectSlot('meat');       break;
            case 'Digit3': CityHUD.selectSlot('fish');       break;
            case 'Digit4': CityHUD.selectSlot('berryTart'); break;
            case 'Digit5': CityHUD.selectSlot('honeyCake'); break;
        }
    }

    /**
     * تشغيل نافذة الخدمة المناسبة حسب معرف المبنى
     * @param {string} buildingId
     */
    function handleBuildingInteract(buildingId) {
        if (!window.CityDialogue) return;

        switch (buildingId) {
            case 'merchant':    CityDialogue.openMerchant();    break;
            case 'blacksmith':  CityDialogue.openBlacksmith();  break;
            case 'healer':      CityDialogue.openHealer();      break;
            case 'bakery':      CityDialogue.openBakery();      break;
            case 'bookstore':   CityDialogue.openBookstore();   break;
            case 'rangers':     CityDialogue.openRangers();     break;
            case 'fountain':    CityDialogue.openFountain();    break;
            case 'well':        CityDialogue.openWell();        break;
            default: break;
        }
    }

    /* =====================================================
       أزرار اللمس للهاتف المتنقل
       ===================================================== */
    function setupTouchControls() {
        const touchMap = {
            'btn-up':    'ArrowUp',
            'btn-down':  'ArrowDown',
            'btn-left':  'ArrowLeft',
            'btn-right': 'ArrowRight',
            'btn-action': 'KeyE',
        };

        Object.entries(touchMap).forEach(([btnId, code]) => {
            const btn = document.getElementById(btnId);
            if (!btn) return;

            btn.addEventListener('touchstart', e => {
                e.preventDefault();
                keys[code] = true;
            }, { passive: false });

            btn.addEventListener('touchend', e => {
                e.preventDefault();
                keys[code] = false;
            }, { passive: false });
        });
    }

    /* =====================================================
       ضبط حجم الـ Canvas حسب حجم النافذة
       ===================================================== */
    function resizeCanvas() {
        if (!canvas) return;
        const config = window.CityConfig;
        if (!config) return;

        const worldW = config.WORLD_W;
        const worldH = config.WORLD_H;
        const scaleW = window.innerWidth  / worldW;
        const scaleH = window.innerHeight / worldH;
        const scale  = Math.min(scaleW, scaleH, 1); // لا تكبر عن الحجم الطبيعي

        canvas.width  = Math.round(worldW * scale);
        canvas.height = Math.round(worldH * scale);
        canvas.style.width  = canvas.width  + 'px';
        canvas.style.height = canvas.height + 'px';

        if (ctx) {
            ctx.scale(scale, scale);
        }
    }

    /* =====================================================
       تشغيل موسيقى الخلفية المحيطية للمدينة
       ===================================================== */
    function startAmbientAudio() {
        if (CityState.transient.soundMuted) return;
        
        const audio = document.getElementById('city-ambient');

        // تعريف دوال التحكم بالصوت للنطاق العام (حتى لو لم يتوفر الملف)
        window.setCityAmbientVolume = (vol) => {
            if (audio) audio.volume = vol;
        };
        window.stopCityAmbient = () => {
            if (audio) { audio.pause(); audio.currentTime = 0; }
        };

        if (!audio) return;

        audio.volume = 0.32;
        audio.loop   = true;

        // محاولة التشغيل الفوري ثم الانتظار لأول إيماءة مستخدم
        audio.play().catch(() => {
            window.addEventListener('pointerdown', () => {
                audio.play().catch(() => {}); // صمت كامل إذا لم يتوفر الملف
            }, { once: true });
        });
    }

    /* =====================================================
       شاشة التحميل
       ===================================================== */
    function showLoadingScreen(show) {
        const el = document.getElementById('loading-screen');
        if (!el) return;
        if (show) {
            el.classList.remove('hidden');
        } else {
            el.classList.add('hidden');
        }
    }

    function updateLoadingBar(pct) {
        const bar = document.getElementById('loading-bar');
        if (bar) bar.style.width = `${pct}%`;
    }

    /* =====================================================
       حفظ الحالة عند الإغلاق / التغيير
       ===================================================== */
    window.saveCityState = function () {
        CityState.saveToGameState();
    };

    window.addEventListener('beforeunload', () => {
        CityState.saveToGameState();
    });

    document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
            CityState.saveToGameState();
        }
    });

    /* =====================================================
       نقطة البدء — تشغيل بعد اكتمال تحميل الصفحة
       ===================================================== */
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
