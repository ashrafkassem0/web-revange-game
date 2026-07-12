'use strict';

// =========================================================
//  CITY QUESTS — إدارة مهام وشارات أكاديمية الكشافة (v2)
// =========================================================

const CityQuests = {
    /**
     * التحقق مما إذا كانت المهمة قد اكتملت مسبقاً
     * @param {string} id - معرف المهمة (مثل: quest_traveler_supplies)
     * @returns {boolean}
     */
    isQuestDone(id) {
        return CityState.mapState.completedQuests.includes(id);
    },

    /**
     * إكمال المهمة وتوزيع الجوائز وحفظ التقدم
     * @param {string} id - معرف المهمة
     * @param {Function} [rewardFn] - دالة توزيع المكافأة الاختيارية
     */
    completeQuest(id, rewardFn) {
        if (this.isQuestDone(id)) return;

        CityState.mapState.completedQuests.push(id);
        
        if (rewardFn && typeof rewardFn === 'function') {
            rewardFn();
        }

        // تشغيل صوت رنين اكتمال المهمة
        if (typeof SFX !== 'undefined' && SFX.cityChime) {
            SFX.cityChime();
        }

        // تحقق شارات الأكاديمية تلقائياً
        this.checkEarnedBadges();

        // حفظ الحالة للملف
        if (typeof window.saveCityState === 'function') {
            window.saveCityState();
        }

        if (typeof window.notify === 'function') {
            window.notify(`✔️ اكتملت المهمة بنجاح: ${id === 'quest_valley_path' ? 'طريق الوادي' : 'ذخيرة المسافر'}`, '#6ddc6d', 3500);
        }
    },

    /**
     * التحقق من شروط مهمة "ذخيرة المسافر" وتسليم مكافأتها
     */
    checkTravelerQuest() {
        const questId = 'quest_traveler_supplies';
        
        if (this.isQuestDone(questId)) {
            if (typeof window.notify === 'function') {
                window.notify('✔️ لقد أنجزت مهمة ذخيرة المسافر مسبقاً!', '#6ddc6d');
            }
            return;
        }

        const countBought = CityState.mapState.boughtItems.length;
        const arrowsCount = CityState.player.inventory.arrows || 0;

        // الشرط: إنجاز مقايضتين على الأقل أو امتلاك 20 سهماً بالحقيبة
        if (countBought >= 2 || arrowsCount >= 20) {
            this.completeQuest(questId, () => {
                // المكافأة: +10 أسهم خشبية
                CityState.player.inventory.arrows = (CityState.player.inventory.arrows || 0) + 10;
            });
            
            if (typeof window.updateHUD === 'function') {
                window.updateHUD();
            }
            // إعادة فتح شاشة التاجر لتحديث حالة المهمة
            if (window.CityDialogue && typeof window.CityDialogue.openMerchant === 'function') {
                window.CityDialogue.openMerchant();
            }
        } else {
            const neededBarters = Math.max(0, 2 - countBought);
            const neededArrows = Math.max(0, 20 - arrowsCount);
            if (typeof window.notify === 'function') {
                window.notify(`❌ تحتاج لـ ${neededBarters} مقايضة إضافية أو جمع ${neededArrows} سهماً لتسليم المهمة`, '#e74c3c', 4000);
            }
        }
    },

    /**
     * التحقق من شروط مهمة "طريق الوادي" لتفجير صخور البوابة الجنوبية
     */
    checkValleyQuest() {
        const questId = 'quest_valley_path';

        if (this.isQuestDone(questId)) {
            if (typeof window.notify === 'function') {
                window.notify('✔️ لقد أنجزت طريق الوادي مسبقاً - البوابة الجنوبية مفتوحة!', '#6ddc6d');
            }
            return;
        }

        const inv = CityState.player.inventory;
        const hideCount = inv.beastHide || 0;
        const teethCount = inv.teeth || 0;

        // الشرط: تسليم جلد وحشي واحد و 3 أسنان
        if (hideCount < 1) {
            if (typeof window.notify === 'function') {
                window.notify('❌ تحتاج إلى جلد وحشي واحد (1 🐺) على الأقل', '#e74c3c');
            }
            return;
        }
        if (teethCount < 3) {
            if (typeof window.notify === 'function') {
                window.notify('❌ تحتاج إلى 3 أسنان وحوش (3 🦷) على الأقل', '#e74c3c');
            }
            return;
        }

        // خصم المكونات وإكمال المهمة
        inv.beastHide -= 1;
        inv.teeth -= 3;

        this.completeQuest(questId, () => {
            if (typeof GameState !== 'undefined') {
                GameState.save('completedCity', true);
            }
            if (typeof window.notify === 'function') {
                window.notify('🗺️ البوابة الجنوبية فُتحت بنجاح! يمكنك الآن الانطلاق لغابات الجنوب المغبرة!', '#ffd060', 4500);
            }
        });

        if (typeof window.updateHUD === 'function') {
            window.updateHUD();
        }
        
        // إعادة فتح شاشة الحداد لتحديث حالة المهمة
        if (window.CityDialogue && typeof window.CityDialogue.openBlacksmith === 'function') {
            window.CityDialogue.openBlacksmith();
        }
    },

    /**
     * التحقق التلقائي من معايير شارات البطولة وترقيتها في الأكاديمية
     */
    checkEarnedBadges() {
        const earned = CityState.mapState.earnedBadges;
        const inv = CityState.player.inventory;

        // 1. شارة المقايض الأول (إنجاز صفقة واحدة مع التاجر)
        if (!earned.includes('badge_first_barter') && CityState.mapState.boughtItems.length >= 1) {
            earned.push('badge_first_barter');
            this.notifyBadgeEarned('badge_first_barter');
        }

        // 2. شارة خباز المدينة (دمج أو طبخ حلوى)
        const cookedSweets = (inv.berryTart || 0) + (inv.honeyCake || 0) + (inv.sweetMuffin || 0);
        if (!earned.includes('badge_sweet_tooth') && cookedSweets >= 1) {
            earned.push('badge_sweet_tooth');
            this.notifyBadgeEarned('badge_sweet_tooth');
        }

        // 3. شارة السلاح اللامع (شحذ السيف أو الرمح لدى الحداد)
        if (!earned.includes('badge_sharp_blade') && CityState.mapState.weaponUpgraded) {
            earned.push('badge_sharp_blade');
            this.notifyBadgeEarned('badge_sharp_blade');
        }

        // 4. شارة بطل المدينة (تفجير البوابة الجنوبية)
        if (!earned.includes('badge_forest_hero') && this.isQuestDone('quest_valley_path')) {
            earned.push('badge_forest_hero');
            this.notifyBadgeEarned('badge_forest_hero');
        }
    },

    /**
     * تنبيه بإشعار ذهبي مميز عند كسب شارة كشفية جديدة
     */
    notifyBadgeEarned(badgeId) {
        if (typeof CityData === 'undefined') return;
        const badge = CityData.RANGERS_ACADEMY.BADGES.find(b => b.id === badgeId);
        if (!badge) return;

        if (typeof window.notify === 'function') {
            window.notify(`🏅 نلت شارة جديدة: ${badge.name} ✨`, '#ffd060', 4000);
        }
        
        // تشغيل نغمة الإنجاز اللطيفة
        if (typeof SFX !== 'undefined' && SFX.cityChime) {
            SFX.cityChime();
        }
    },

    /**
     * التحقق مما إذا كانت البوابة الجنوبية مفتوحة للسفر
     * @returns {boolean}
     */
    isSouthGateUnlocked() {
        return this.isQuestDone('quest_valley_path');
    }
};

// تصدير الكائن للنطاق العام
if (typeof window !== 'undefined') {
    window.CityQuests = CityQuests;
}
