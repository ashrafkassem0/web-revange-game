'use strict';

// =========================================================
//  CITY PORTALS — الانتقال بين الغابة والمراحل (v2)
// =========================================================

const CityPortals = {
    /**
     * التحقق مما إذا كان اللاعب يقف في نطاق البوابة
     * @param {Object} portal - إحداثيات ونصف قطر البوابة من التكوين
     */
    isNearPortal(portal) {
        const player = CityState.player;
        return Math.hypot(player.x - portal.x, player.y - portal.y) < portal.radius;
    },

    /**
     * تفاعل اللاعب بالضغط على زر E عند البوابات والمنافذ الحضرية
     */
    handleInteract() {
        const now = Date.now();
        if (now < CityState.transient.portalCooldownUntil) return;

        const config = window.CityConfig;
        if (!config) return;

        // 1. بوابة الشمال (العودة للغابة الأساسية)
        if (this.isNearPortal(config.FOREST_PORTAL)) {
            CityState.transient.portalCooldownUntil = now + 1000;
            
            if (window.CityDialogue && typeof window.CityDialogue.openModal === 'function') {
                window.CityDialogue.openModal('🌲 العودة للغابة الأساسية', `
                    <p style="margin-bottom:14px; color:#ccc; line-height:1.8">هل ترغب في العودة للغابة الآن؟ يمكنك إكمال مهام جمع الموارد والصناعة هناك.</p>
                    <div style="display:flex; justify-content:center; gap:8px">
                        <button class="trade-btn" onclick="CityDialogue.closeModal(); CityPortals.saveAndExit();">نعم، مغادرة</button>
                        <button class="trade-btn" onclick="CityDialogue.closeModal();">لا، البقاء بالمدينة</button>
                    </div>
                `);
            }
            return;
        }

        // 2. البوابة الجنوبية (طريق الوادي إلى غابة الجنوب)
        if (this.isNearPortal(config.SOUTH_GATE)) {
            CityState.transient.portalCooldownUntil = now + 1000;
            
            if (!window.CityQuests.isSouthGateUnlocked()) {
                if (typeof window.notify === 'function') {
                    window.notify('🚧 البوابة الجنوبية مغلقة! أكمل شروط الحداد لفتح طريق الوادي أولاً', '#e74c3c', 3500);
                }
            } else {
                if (window.CityDialogue && typeof window.CityDialogue.openModal === 'function') {
                    window.CityDialogue.openModal('🚪 بوابة الغابة الجنوبية', `
                        <p style="margin-bottom:14px; color:#ccc; line-height:1.8">طريق الوادي مفتوح! هل أنت مستعد للذهاب إلى الغابة الجنوبية للمغامرة الكبرى؟</p>
                        <div style="display:flex; justify-content:center; gap:8px">
                            <button class="trade-btn" onclick="CityDialogue.closeModal(); CityPortals.saveAndGoSouthForest();">🗡️ اذهب للغابة الجنوبية</button>
                            <button class="trade-btn" onclick="CityDialogue.closeModal()">إلغاء</button>
                        </div>
                    `);
                }
            }
            return;
        }
    },

    /**
     * حفظ تقدم المدينة والعودة للغابة الشمالية
     */
    saveAndExit() {
        if (typeof SFX !== 'undefined' && SFX.portalWhoosh) {
            SFX.portalWhoosh();
        }
        
        // إيقاف أصوات المدينة
        if (typeof window.stopCityAmbient === 'function') {
            window.stopCityAmbient();
        }

        // حفظ الحالة محلياً وقومياً
        if (typeof window.saveCityState === 'function') {
            window.saveCityState();
        }

        if (typeof GameState !== 'undefined') {
            // مزامنة حالة المعدات
            if (typeof GameState.getCraftedItems === 'function') {
                GameState.save('craftedItems', GameState.getCraftedItems());
            }
            
            // تحديد بوابة القدوم القادمة للغابة
            GameState.save('fromCity', true);
            if (typeof GameState.setCurrentMap === 'function') {
                GameState.setCurrentMap('forest');
            }

            // الانتقال الفعلي للمشهد الأساسي
            if (typeof navigateToScene === 'function') {
                navigateToScene('forest', {
                    skipPrereq: true,
                    save: () => GameState.autoSave(true)
                });
                return;
            }
        }

        // إعادة التوجيه الافتراضية في حال عدم توفر دالة التصفح المخصصة
        if (typeof navigateTo === 'function') {
            navigateTo('../forest/index.html');
        } else {
            window.location.href = '../forest/index.html';
        }
    },

    /**
     * حفظ تقدم المدينة والانطلاق للغابة الجنوبية الجديدة
     */
    saveAndGoSouthForest() {
        if (typeof SFX !== 'undefined' && SFX.portalWhoosh) {
            SFX.portalWhoosh();
        }

        if (typeof window.stopCityAmbient === 'function') {
            window.stopCityAmbient();
        }

        if (typeof window.saveCityState === 'function') {
            window.saveCityState();
        }

        if (typeof GameState !== 'undefined') {
            // تثبيت اكتمال المدينة للتقدم
            GameState.save('completedCity', true);
            
            // تهيئة معالم الخريطة القادمة
            if (typeof GameState.setCurrentMap === 'function') {
                GameState.setCurrentMap('forest');
            }

            if (typeof navigateToScene === 'function') {
                navigateToScene('forest', {
                    skipPrereq: true,
                    save: () => GameState.autoSave(true)
                });
                return;
            }
        }

        if (typeof navigateTo === 'function') {
            navigateTo('../forest/index.html');
        } else {
            window.location.href = '../forest/index.html';
        }
    }
};

// تصدير الكائن للنطاق العام
if (typeof window !== 'undefined') {
    window.CityPortals = CityPortals;
}
