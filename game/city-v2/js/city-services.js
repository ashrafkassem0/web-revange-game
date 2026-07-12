'use strict';

// =========================================================
//  CITY SERVICES — خدمات العلاج، شحذ الأسلحة، والاستراحة (v2)
// =========================================================

const CityServices = {
    /**
     * شحذ السلاح لزيادة هجوم البطل بمقدار +5 نقاط بشكل دائم
     */
    weaponSharpen() {
        const db = (typeof CityData !== 'undefined') ? CityData.BLACKSMITH.SHARPEN : { stoneCost: 2, hornCost: 1, attackBoost: 5 };
        const inv = CityState.player.inventory;

        if (CityState.mapState.weaponUpgraded) {
            if (typeof window.notify === 'function') {
                window.notify('✅ لقد قمت بشحذ سلاحك وتطويره مسبقاً!', '#aaddff');
            }
            if (window.CityDialogue && typeof window.CityDialogue.closeModal === 'function') {
                window.CityDialogue.closeModal();
            }
            return;
        }

        if ((inv.stone || 0) < db.stoneCost || (inv.horn || 0) < db.hornCost) {
            if (typeof window.notify === 'function') {
                window.notify('❌ لا تملك ما يكفي من أحجار الشحذ أو القرون المتينة', '#e74c3c');
            }
            return;
        }

        // خصم المكونات وتعديل هجوم البطل
        inv.stone -= db.stoneCost;
        inv.horn -= db.hornCost;
        
        CityState.mapState.weaponUpgraded = true;

        if (typeof GameState !== 'undefined') {
            const stats = GameState.getHeroStats() || {};
            stats.absorbedAttack = (stats.absorbedAttack || 0) + db.attackBoost;
            // تحديث الهجوم الكلي
            const baseAtk = stats.level ? (25 + (stats.level - 1) * 3) : 25;
            stats.attack = baseAtk + stats.absorbedAttack;
            GameState.save('heroStats', stats);
        }

        // تحديث هجوم كائن اللاعب الحالي لتطابق الفوري
        CityState.player.attack = (CityState.player.attack || 25) + db.attackBoost;

        if (typeof window.notify === 'function') {
            window.notify(`🗡️ شحذت سلاحك بنجاح! هجوم البطل زاد بمقدار +${db.attackBoost} ⚔️`, '#ffd060', 3500);
        }

        // تشغيل نغمة الحداد عند الطرق
        if (typeof SFX !== 'undefined' && SFX.cityChime) {
            SFX.cityChime();
        }

        // شارات الأكاديمية (شارة السلاح اللامع)
        CityQuests.checkEarnedBadges();

        // حفظ الحالة
        if (typeof window.saveCityState === 'function') {
            window.saveCityState();
        }
        if (window.CityDialogue && typeof window.CityDialogue.closeModal === 'function') {
            window.CityDialogue.closeModal();
        }
    },

    /**
     * مداواة جراح اللاعب باستخدام اللحوم أو الأسماك المطهوة والنيئة
     * @param {string} foodType - نوع الطعام المستخدم (meat أو fish)
     */
    healPlayer(foodType) {
        const inv = CityState.player.inventory;
        const player = CityState.player;

        if (player.hp >= player.maxHp) {
            if (typeof window.notify === 'function') {
                window.notify('❤️ صحتك ممتلئة تماماً بالفعل!', '#6ddc6d');
            }
            if (window.CityDialogue && typeof window.CityDialogue.closeModal === 'function') {
                window.CityDialogue.closeModal();
            }
            return;
        }

        const cost = 2; // كمية الطعام المطلوبة
        const hasFood = getFoodCount(inv, foodType);

        if (hasFood < cost) {
            if (typeof window.notify === 'function') {
                window.notify(`❌ تحتاج إلى قطعتين من ${foodType === 'meat' ? 'اللحم' : 'السمك'} للمداواة`, '#e74c3c');
            }
            return;
        }

        // خصم الطعام وإجراء الاستعادة
        takeFoodItems(inv, foodType, cost);

        if (foodType === 'meat') {
            player.hp = player.maxHp; // شفاء كامل باللحم
            if (typeof window.notify === 'function') {
                window.notify('❤️ استعدت صحتك بالكامل بفضل اللحوم المغذية!', '#2ecc71', 3000);
            }
        } else {
            // شفاء نصف الصحة بالسمك
            player.hp = Math.min(player.maxHp, player.hp + Math.floor(player.maxHp / 2));
            if (typeof window.notify === 'function') {
                window.notify('❤️ تعافيت جزئياً بفضل السمك الطازج!', '#5dade2', 3000);
            }
        }

        // حفظ وتحديث
        if (typeof window.saveCityState === 'function') {
            window.saveCityState();
        }
        if (window.CityDialogue && typeof window.CityDialogue.closeModal === 'function') {
            window.CityDialogue.closeModal();
        }
    },

    /**
     * أخذ قسط من الراحة والنوم المجاني بالمدينة لاستعادة الصحة
     */
    restPlayer() {
        const player = CityState.player;

        if (player.hp >= player.maxHp) {
            if (typeof window.notify === 'function') {
                window.notify('❤️ صحتك ممتلئة تماماً بالفعل!', '#6ddc6d');
            }
            if (window.CityDialogue && typeof window.CityDialogue.closeModal === 'function') {
                window.CityDialogue.closeModal();
            }
            return;
        }

        if (CityState.mapState.restedOnce) {
            if (typeof window.notify === 'function') {
                window.notify('💤 لقد نمت واسترحت مسبقاً اليوم، عد لاحقاً!', '#aaddff');
            }
            if (window.CityDialogue && typeof window.CityDialogue.closeModal === 'function') {
                window.CityDialogue.closeModal();
            }
            return;
        }

        // استعادة 20 نقطة صحة وتفعيل علامة الاستراحة
        const before = player.hp;
        player.hp = Math.min(player.maxHp, player.hp + 20);
        CityState.mapState.restedOnce = true;

        if (typeof window.notify === 'function') {
            window.notify(`💤 استرخيت ونمت بهدوء! استعدت +${Math.round(player.hp - before)}❤️ صحة`, '#aaddff', 3500);
        }

        // حفظ وتحديث
        if (typeof window.saveCityState === 'function') {
            window.saveCityState();
        }
        if (window.CityDialogue && typeof window.CityDialogue.closeModal === 'function') {
            window.CityDialogue.closeModal();
        }
    },

    /**
     * تناول الحلويات المصنوعة بالمخبز لزيادة الصحة والطاقة بشكل فوري
     * @param {string} itemId - معرف الحلوى (berryTart, honeyCake, sweetMuffin)
     * @param {number} healAmt - قيمة استعادة الصحة
     */
    eatSweet(itemId, healAmt) {
        const inv = CityState.player.inventory;
        const player = CityState.player;
        const count = inv[itemId] || 0;

        if (count <= 0) {
            if (typeof window.notify === 'function') {
                window.notify('❌ لا تملك هذه الحلوى بحقيبتك، اذهب لخبزها!', '#e74c3c');
            }
            return;
        }

        if (player.hp >= player.maxHp) {
            if (typeof window.notify === 'function') {
                window.notify('❤️ صحتك ممتلئة تماماً بالفعل!', '#6ddc6d');
            }
            return;
        }

        // خصم الحلوى وإضافة نقاط الصحة
        inv[itemId] = count - 1;
        const before = player.hp;
        player.hp = Math.min(player.maxHp, player.hp + healAmt);

        if (typeof window.notify === 'function') {
            window.notify(`🍴 تناولت تورتة الحلوى! استعدت +${Math.round(player.hp - before)}❤️ صحة ونشاط!`, '#6ddc6d', 3000);
        }

        // حفظ وتحديث
        if (typeof window.saveCityState === 'function') {
            window.saveCityState();
        }
        if (window.CityDialogue && typeof window.CityDialogue.closeModal === 'function') {
            window.CityDialogue.closeModal();
        }
    }
};

// تصدير كائن الخدمات للنطاق العام
if (typeof window !== 'undefined') {
    window.CityServices = CityServices;
}
