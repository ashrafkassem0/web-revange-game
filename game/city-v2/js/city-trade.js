'use strict';

// =========================================================
//  CITY TRADE — محرك الصفقات والمقايضة ودمج الحلويات (v2)
// =========================================================

const CityTrade = {
    /**
     * دالة المقايضة المباشرة لمادة بمادة أخرى (مثال: جلد مقابل سهام)
     * @param {string} fromItem - المادة المدفوعة
     * @param {number} fromAmt - الكمية المدفوعة
     * @param {string} toItem - المادة المستلمة
     * @param {number} toAmt - الكمية المستلمة
     */
    barterItem(fromItem, fromAmt, toItem, toAmt) {
        const inv = CityState.player.inventory;
        const currentHas = inv[fromItem] || 0;

        if (currentHas < fromAmt) {
            if (typeof window.notify === 'function') {
                window.notify(`❌ لا تملك ما يكفي من ${CityData.ITEM_NAMES[fromItem] || fromItem}`, '#e74c3c');
            }
            return;
        }

        // خصم وإضافة للمستودع الحركي
        inv[fromItem] = currentHas - fromAmt;
        inv[toItem] = (inv[toItem] || 0) + toAmt;

        // تسجيل العملية في قائمة مقايضات المدينة لحساب إنجاز مهمة المقايضة
        this.recordPurchase(toItem);

        if (typeof window.notify === 'function') {
            window.notify(`✅ قايضت بنجاح وحصلت على ${toAmt} ${CityData.ITEM_NAMES[toItem] || toItem}`, '#6ddc6d');
        }

        // حفظ الحالة وتحديث الشاشات
        if (typeof window.saveCityState === 'function') {
            window.saveCityState();
        }
        if (typeof window.updateHUD === 'function') {
            window.updateHUD();
        }
        
        // إعادة تحميل شاشة التاجر لتحديث الأزرار المفعلة
        if (window.CityDialogue && typeof window.CityDialogue.openMerchant === 'function') {
            window.CityDialogue.openMerchant();
        }
    },

    /**
     * بيع الموارد الفائضة للتاجر مقابل دنانير ذهبية (🪙)
     * @param {string} item - المادة المبيعة
     * @param {number} qty - الكمية المبيعة
     * @param {number} coinAmt - عدد الدنانير المستلمة
     * @param {string} refreshShop - اسم الدالة المنعشة للمحل (openMerchant أو openBlacksmith)
     */
    sellForCoins(item, qty, coinAmt, refreshShop) {
        const inv = CityState.player.inventory;
        const currentHas = inv[item] || 0;

        if (currentHas < qty) {
            if (typeof window.notify === 'function') {
                window.notify(`❌ ليس لديك ما يكفي من ${CityData.ITEM_NAMES[item] || item}`, '#e74c3c');
            }
            return;
        }

        // خصم المادة وإضافة الذهب
        inv[item] = currentHas - qty;
        inv.coins = (inv.coins || 0) + coinAmt;

        if (typeof window.notify === 'function') {
            window.notify(`💰 بعت ${qty} ${CityData.ITEM_NAMES[item] || item} مقابل ${coinAmt} دنانير`, '#ffd060');
        }

        // حفظ الحالة وتحديث الشاشات
        if (typeof window.saveCityState === 'function') {
            window.saveCityState();
        }
        if (typeof window.updateHUD === 'function') {
            window.updateHUD();
        }

        // إنعاش المتجر المفتوح حالياً
        this.refreshActiveShop(refreshShop);
    },

    /**
     * شراء المواد والذخيرة من التجار باستخدام الدنانير الذهبية (🪙)
     * @param {string} item - المادة المشتراة
     * @param {number} qty - الكمية المشتراة
     * @param {number} coinAmt - التكلفة بالذهب
     * @param {string} refreshShop - اسم الدالة المنعشة للمحل
     */
    buyWithCoins(item, qty, coinAmt, refreshShop) {
        const inv = CityState.player.inventory;
        const coins = inv.coins || 0;

        if (coins < coinAmt) {
            if (typeof window.notify === 'function') {
                window.notify('❌ لا تملك ما يكفي من الدنانير الذهبية', '#e74c3c');
            }
            return;
        }

        // خصم الذهب وإضافة المادة
        inv.coins = coins - coinAmt;
        inv[item] = (inv[item] || 0) + qty;

        if (typeof window.notify === 'function') {
            window.notify(`🛒 اشتريت ${qty} ${CityData.ITEM_NAMES[item] || item} بنجاح`, '#6ddc6d');
        }

        // حفظ الحالة وتحديث الشاشات
        if (typeof window.saveCityState === 'function') {
            window.saveCityState();
        }
        if (typeof window.updateHUD === 'function') {
            window.updateHUD();
        }

        this.refreshActiveShop(refreshShop);
    },

    /**
     * دمج وخبز الحلويات اللذيذة بالمطبخ الكوزي
     * @param {string} recipeId - معرف الوصفة المطلوب دمجها
     */
    cookSweet(recipeId) {
        const db = (typeof CityData !== 'undefined') ? CityData.BAKERY.SWEETS_RECIPES : [];
        const recipe = db.find(r => r.id === recipeId);
        if (!recipe) return;

        const inv = CityState.player.inventory;

        // 1. تحقق مزدوج من المكونات
        let hasAll = true;
        for (const ing in recipe.ingredients) {
            const req = recipe.ingredients[ing];
            const has = inv[ing] || 0;
            if (has < req) hasAll = false;
        }

        if (!hasAll) {
            if (typeof window.notify === 'function') {
                window.notify('❌ لا تملك كافة المواد الخام المطلوبة للوصفة', '#e74c3c');
            }
            return;
        }

        // 2. خصم المكونات وإضافة الحلوى المخبوزة للحقيبة
        for (const ing in recipe.ingredients) {
            inv[ing] -= recipe.ingredients[ing];
        }
        inv[recipe.result] = (inv[recipe.result] || 0) + recipe.qty;

        if (typeof window.notify === 'function') {
            window.notify(`🧁 خبزت ${recipe.qty} ${CityData.ITEM_NAMES[recipe.result]}! الرائحة شهية!`, '#6ddc6d');
        }

        // تشغيل صوت رنين طباخ المطبخ اللطيف
        if (typeof SFX !== 'undefined' && SFX.cityChime) {
            SFX.cityChime();
        }

        // تحقق شارات الأكاديمية (شارة خبز الحلوى)
        CityQuests.checkEarnedBadges();

        // حفظ وتحديث
        if (typeof window.saveCityState === 'function') {
            window.saveCityState();
        }
        if (typeof window.updateHUD === 'function') {
            window.updateHUD();
        }

        // إنعاش شاشة المخبز المفتوحة
        if (window.CityDialogue && typeof window.CityDialogue.openBakery === 'function') {
            window.CityDialogue.openBakery();
        }
    },

    /**
     * تسجيل الصفقات وعمليات المقايضة لحساب تقدم المهمة
     */
    recordPurchase(itemId) {
        const st = CityState.mapState;
        if (!Array.isArray(st.boughtItems)) st.boughtItems = [];
        st.boughtItems.push({ id: itemId, at: Date.now() });
    },

    /**
     * إنعاش شاشات المحلات لتفادي الجمود بالواجهات
     */
    refreshActiveShop(refreshShop) {
        if (!window.CityDialogue) return;
        if (refreshShop === 'openBlacksmith' && typeof window.CityDialogue.openBlacksmith === 'function') {
            window.CityDialogue.openBlacksmith();
        } else if (refreshShop === 'openMerchant' && typeof window.CityDialogue.openMerchant === 'function') {
            window.CityDialogue.openMerchant();
        } else if (refreshShop === 'openBakery' && typeof window.CityDialogue.openBakery === 'function') {
            window.CityDialogue.openBakery();
        }
    }
};

// تصدير الكائن للنطاق العام
if (typeof window !== 'undefined') {
    window.CityTrade = CityTrade;
}
