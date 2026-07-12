'use strict';

// =========================================================
//  CITY DIALOGUE — لوحات ونوافذ الخدمات، المكتبة، والمخبز (v2)
// =========================================================

const CityDialogue = {
    // ─────────────── إدارة النوافذ المنبثقة الأساسية ───────────────
    
    /**
     * فتح نافذة منبثقة عامة بالمدينة مع تجميد اللعب مؤقتاً
     */
    openModal(title, bodyHtml) {
        const modal = document.getElementById('modal');
        const modalTitle = document.getElementById('modalTitle');
        const modalBody = document.getElementById('modalBody');

        if (modal && modalTitle && modalBody) {
            modalTitle.textContent = title;
            modalBody.innerHTML = bodyHtml;
            modal.classList.add('open');
            CityState.transient.modalOpen = true;
        }
    },

    /**
     * إغلاق النافذة المنبثقة النشطة وتحديث واجهة اللعب
     */
    closeModal() {
        const modal = document.getElementById('modal');
        if (modal) {
            modal.classList.remove('open');
            CityState.transient.modalOpen = false;
        }
        if (typeof window.updateHUD === 'function') {
            window.updateHUD();
        }
    },

    // ─────────────── ترحيب الحوارات وتثبيت الزيارات ───────────────

    /**
     * التحقق مما إذا تم الحديث مسبقاً مع الشخصية
     */
    isNpcSpoken(npcId) {
        return CityState.mapState.spokenToNpcs.includes(npcId);
    },

    /**
     * تحديد أن الشخصية تم التحدث معها وحفظ الحالة
     */
    markNpcSpoken(npcId) {
        if (!this.isNpcSpoken(npcId)) {
            CityState.mapState.spokenToNpcs.push(npcId);
            if (typeof window.saveCityState === 'function') {
                window.saveCityState();
            }
        }
    },

    /**
     * فتح حوار ترحيب الشخصية والتمهيد لفتح شاشة الخدمة
     */
    openNpcIntro(npcId, thenOpenService) {
        const db = (typeof CityData !== 'undefined') ? CityData.NPC_DIALOGUES[npcId] : { greetFirst: 'مرحباً!', greetReturn: 'أهلاً بك!' };
        const spoken = this.isNpcSpoken(npcId);
        const greetingText = spoken ? db.greetReturn : db.greetFirst;

        // العثور على أيقونة واسم الشخصية من القائمة العامة للـ NPCs
        const npcData = (window.CityNPCs && window.CityNPCs.npcs) 
            ? window.CityNPCs.npcs.find(n => n.id === npcId) 
            : { emoji: '👤', label: 'صديق' };

        const continueBtn = `<button class="trade-btn" onclick="CityDialogue.closeModal(); CityDialogue.markNpcSpoken('${npcId}'); (${thenOpenService.toString()})();" style="margin-top:10px">متابعة الخدمة</button>`;
        
        let extraBtns = '';
        if (npcId === 'blacksmith') {
            extraBtns = `<button class="trade-btn" onclick="CityDialogue.openSouthLore()" style="margin-top:10px; margin-right:8px">🗺️ عن البوابة الجنوبية</button>`;
        }

        this.openModal(`${npcData.emoji} ${npcData.label}`, `
            <p style="margin-bottom:14px; color:#ccc; line-height:1.8">${greetingText}</p>
            <div style="display:flex; justify-content:center; gap:8px; flex-wrap:wrap">
                ${continueBtn}
                ${extraBtns}
            </div>
        `);
    },

    /**
     * حوار تفصيلي عن البوابة الجنوبية المغلقة
     */
    openSouthLore() {
        this.openModal('🗺️ البوابة الجنوبية المغلقة', `
            <p style="margin-bottom:14px; color:#ccc; line-height:1.8">
                البوابة الجنوبية تقود إلى الغابة الاستوائية الكثيفة... إنها منطقة خطرة للغاية لكنها غنية بالموارد الفريدة. 
                أمر حراس المدينة بإغلاقها لحمايتنا، ولن تفتح إلا لمن يثبت قدرته ويساعد الكشافة ويحصل على الشارات الذهبية.
            </p>
            <div style="display:flex; justify-content:center">
                <button class="trade-btn" onclick="CityDialogue.openNpcIntro('blacksmith', () => CityDialogue.openBlacksmith())">🔙 العودة</button>
            </div>
        `);
    },

    // ─────────────── شاشات الخدمات التجارية والتعديلات ───────────────

    /**
     * فتح متجر التاجر للمقايضة والشراء والبيع
     */
    openMerchant() {
        const db = (typeof CityData !== 'undefined') ? CityData.MERCHANT : { BARTER_RECIPES:[], SELL_OFFERS:[], BUY_OFFERS:[] };
        const inv = CityState.player.inventory;
        const coins = inv.coins || 0;
        
        const questDone = CityState.mapState.completedQuests.includes('quest_traveler_supplies');
        const countBought = CityState.mapState.boughtItems.length;
        const progressStr = questDone ? 'مكتملة ✔' : `المقايضات الحالية: ${countBought}/2`;

        // صياغة صفوف المقايضة
        let barterHtml = '';
        db.BARTER_RECIPES.forEach(r => {
            const hasEnough = (inv[r.fromItem] || 0) >= r.fromAmt;
            barterHtml += `<div class="trade-row">
                <span>${r.icon} ${r.fromAmt} ${CityData.ITEM_NAMES[r.fromItem]}</span>
                <span>← 🏹 +${r.toAmt} سهام</span>
                <button class="trade-btn" onclick="CityTrade.barterItem('${r.fromItem}', ${r.fromAmt}, '${r.toItem}', ${r.toAmt})" ${hasEnough ? '' : 'disabled'}>مبادلة</button>
            </div>`;
        });

        // صفوف البيع
        let sellHtml = '';
        db.SELL_OFFERS.forEach(s => {
            const hasEnough = (inv[s.item] || 0) >= s.qty;
            sellHtml += `<div class="trade-row">
                <span>${s.icon} ${s.qty} ${CityData.ITEM_NAMES[s.item]} → +${s.coinAmt} 🪙</span>
                <button class="trade-btn" onclick="CityTrade.sellForCoins('${s.item}', ${s.qty}, ${s.coinAmt}, 'openMerchant')" ${hasEnough ? '' : 'disabled'}>بيع</button>
            </div>`;
        });

        // صفوف الشراء بالنقود
        let buyHtml = '';
        db.BUY_OFFERS.forEach(b => {
            const hasCoins = coins >= b.coinAmt;
            buyHtml += `<div class="trade-row">
                <span>🪙 ${b.coinAmt} → ${b.icon} +${b.qty} ${CityData.ITEM_NAMES[b.item]}</span>
                <button class="trade-btn" onclick="CityTrade.buyWithCoins('${b.item}', ${b.qty}, ${b.coinAmt}, 'openMerchant')" ${hasCoins ? '' : 'disabled'}>شراء</button>
            </div>`;
        });

        const questRow = questDone 
            ? `<p style="margin-top:14px; color:#6ddc6d; font-size:0.85rem">✔️ مهمة ذخيرة المسافر — مكتملة وتم تسليم الجوائز.</p>`
            : `<div class="trade-row" style="margin-top:14px; background:rgba(255,208,96,0.06)">
                <span>📦 مهمة: ذخيرة المسافر (${progressStr})</span>
                <button class="trade-btn" onclick="CityQuests.checkTravelerQuest()">تسليم المهمة</button>
              </div>`;

        this.openModal('🧑‍💼 متجر المقايضة العام', `
            <div class="shop-balance">💳 رصيدك الحالي: 🪙 ${coins} دينار ذهبي</div>
            <p class="shop-section">بادل مواردك بالسهام الخشبية</p>
            ${barterHtml}
            <p class="shop-section">💰 بيع مواردك واكسب القطع الذهبية</p>
            ${sellHtml}
            <p class="shop-section">🛒 شراء المستلزمات الطبية والأسهم</p>
            ${buyHtml}
            ${questRow}
        `);
    },

    /**
     * فتح ورشة شحذ وتعديل الأسلحة لدى الحداد
     */
    openBlacksmith() {
        const db = (typeof CityData !== 'undefined') ? CityData.BLACKSMITH : { BUY_OFFERS:[], SELL_OFFERS:[] };
        const inv = CityState.player.inventory;
        const coins = inv.coins || 0;
        const upgraded = CityState.mapState.weaponUpgraded;
        const questDone = CityState.mapState.completedQuests.includes('quest_valley_path');

        let upgradesHtml = '';
        if (typeof GameState !== 'undefined') {
            const crafted = GameState.getCraftedItems() || {};
            const items = [
                { emoji: '🪓', name: 'فأس قطع الأشجار', id: 'axe' },
                { emoji: '🎣', name: 'سنارة صيد السمك', id: 'fishingRod' },
                { emoji: '🗡️', name: 'رمح القرون الطويل', id: 'hornSpear' },
                { emoji: '⚔️', name: 'سيف القرون اللامع', id: 'hornSword' },
                { emoji: '🛡️', name: 'الدرع الجلدي المطور', id: 'leatherArmor' },
                { emoji: '🌑', name: 'درع الظلال الداكن', id: 'shadowArmor' }
            ];

            upgradesHtml += '<div style="display:grid; grid-template-columns:1fr 1fr; gap:8px">';
            items.forEach(item => {
                const hasIt = crafted[item.id];
                upgradesHtml += `<div class="trade-row" style="opacity: ${hasIt ? 1 : 0.5}; margin-bottom:0px; padding:6px 8px">
                    <span>${item.emoji} ${item.name}</span>
                    <span style="color: ${hasIt ? '#6ddc6d' : '#888'}">${hasIt ? '✔ جاهز' : '✘ لم يصنع'}</span>
                </div>`;
            });
            upgradesHtml += '</div>';
        }

        // شحذ السلاح لزيادة الهجوم
        const canSharpen = !upgraded && inv.stone >= db.SHARPEN.stoneCost && inv.horn >= db.SHARPEN.hornCost;
        const sharpenHtml = `<div class="trade-row">
            <span>🔪 ${db.SHARPEN.label}</span>
            <button class="trade-btn" onclick="CityServices.weaponSharpen()" ${canSharpen ? '' : 'disabled'}>${upgraded ? '✔ تم' : 'شحذ السلاح'}</button>
        </div>`;

        // مواد الحدادة - شراء
        let buyMaterialsHtml = '';
        db.BLACKSMITH.BUY_OFFERS.forEach(b => {
            const hasCoins = coins >= b.coinAmt;
            buyMaterialsHtml += `<div class="trade-row">
                <span>🪙 ${b.coinAmt} → ${b.icon} +${b.qty} ${CityData.ITEM_NAMES[b.item]}</span>
                <button class="trade-btn" onclick="CityTrade.buyWithCoins('${b.item}', ${b.qty}, ${b.coinAmt}, 'openBlacksmith')" ${hasCoins ? '' : 'disabled'}>شراء</button>
            </div>`;
        });

        // مواد الحدادة - بيع
        let sellMaterialsHtml = '';
        db.BLACKSMITH.SELL_OFFERS.forEach(s => {
            const hasEnough = (inv[s.item] || 0) >= s.qty;
            sellMaterialsHtml += `<div class="trade-row">
                <span>${s.icon} ${s.qty} ${CityData.ITEM_NAMES[s.item]} → +${s.coinAmt} 🪙</span>
                <button class="trade-btn" onclick="CityTrade.sellForCoins('${s.item}', ${s.qty}, ${s.coinAmt}, 'openBlacksmith')" ${hasEnough ? '' : 'disabled'}>بيع</button>
            </div>`;
        });

        const questRow = questDone
            ? `<p style="margin-top:14px; color:#6ddc6d; font-size:0.85rem">✔️ مهمة طريق الوادي مكتملة — البوابة الجنوبية مفتوحة حالياً.</p>`
            : `<div class="trade-row" style="margin-top:14px; background:rgba(255,208,96,0.06)">
                <span>🚪 مهمة: فتح طريق الوادي (طلب جلد وحشي + 3 أسنان)</span>
                <button class="trade-btn" onclick="CityQuests.checkValleyQuest()">تسليم وتفجير البوابة</button>
              </div>`;

        this.openModal('⚒️ ورشة الحدادة وتطوير الأسلحة', `
            <div class="shop-balance">🛠️ رصيدك المتاح: 🪙 ${coins} دينار ذهبي</div>
            <p class="shop-section">المعدات والترقيات المصنوعة بغابات الغرب والشرق</p>
            ${upgradesHtml}
            <p class="shop-section">🗡️ شحذ الأسلحة وصيانة المعدات</p>
            ${sharpenHtml}
            <p class="shop-section">♻️ بيع وشراء خام الحديد والأحجار والقرون</p>
            ${buyMaterialsHtml}
            ${sellMaterialsHtml}
            ${questRow}
        `);
    },

    /**
     * فتح لوحة العلاج الدوائي والشفاء لدى العيادة الصيدلية
     */
    openHealer() {
        const inv = CityState.player.inventory;
        const meatCount = getFoodCount(inv, 'meat');
        const fishCount = getFoodCount(inv, 'fish');
        const fullHp = CityState.player.hp >= CityState.player.maxHp;
        const rested = CityState.mapState.restedOnce;

        this.openModal('🏥 صيدلية المعالج والصحة', `
            <p style="margin-bottom:14px; color:#ccc; line-height:1.7">
                صحة البطل الحالية: ❤️ <strong style="color:#e74c3c">${Math.ceil(CityState.player.hp)}</strong> / ${CityState.player.maxHp} 
                ${fullHp ? '<span style="color:#2ecc71; margin-right:6px"> (مكتملة الصحة!)</span>' : ''}
            </p>
            
            <div class="trade-row">
                <span>🥩 2 لحوم مغذية (لديك ${meatCount}) → استعادة كاملة للصحة</span>
                <button class="trade-btn" onclick="CityServices.healPlayer('meat')" ${fullHp || meatCount < 2 ? 'disabled' : ''}>مداواة</button>
            </div>
            
            <div class="trade-row" style="margin-top:8px">
                <span>🐟 2 سمكة طازجة (لديك ${fishCount}) → استعادة نصف الصحة</span>
                <button class="trade-btn" onclick="CityServices.healPlayer('fish')" ${fullHp || fishCount < 2 ? 'disabled' : ''}>علاج جزئي</button>
            </div>
            
            <div class="trade-row" style="margin-top:8px">
                <span>💤 أخذ استراحة نوم سريعة بالمدينة (مجانية) → استعادة 20❤️</span>
                <button class="trade-btn" onclick="CityServices.restPlayer()" ${rested || fullHp ? 'disabled' : ''}>${rested ? 'استرحت اليوم' : 'استراحة ونوم'}</button>
            </div>
        `);
    },

    // ─────────────── شاشات المرافق الترفيهية والتطويرات للأطفال ───────────────

    /**
     * فتح صالون مخبز الأرانب اللطيف لصنع السكاكر والحلويات
     */
    openBakery() {
        const db = (typeof CityData !== 'undefined') ? CityData.BAKERY : { SWEETS_RECIPES:[], REST_BENEFITS:[] };
        const inv = CityState.player.inventory;

        let cookHtml = '';
        db.SWEETS_RECIPES.forEach(r => {
            // التحقق من توافر كافة مكونات الوصفة اللذيذة
            let canCraft = true;
            let detailIngredients = [];
            for (const item in r.ingredients) {
                const req = r.ingredients[item];
                const has = inv[item] || 0;
                detailIngredients.push(`${req} ${CityData.ITEM_NAMES[item]} (لديك ${has})`);
                if (has < req) canCraft = false;
            }

            cookHtml += `<div class="trade-row" style="flex-direction:column; align-items:stretch; gap:6px">
                <div style="display:flex; justify-content:space-between">
                    <span>${r.icon} <strong>${CityData.ITEM_NAMES[r.result]}</strong></span>
                    <button class="trade-btn" onclick="CityTrade.cookSweet('${r.id}')" ${canCraft ? '' : 'disabled'}>خبز الحلوى</button>
                </div>
                <span style="font-size:0.72rem; color:#aaa">${detailIngredients.join(' + ')}</span>
            </div>`;
        });

        let eatHtml = '';
        db.REST_BENEFITS.forEach(b => {
            const count = inv[b.item] || 0;
            const fullHp = CityState.player.hp >= CityState.player.maxHp;
            eatHtml += `<div class="trade-row">
                <span>${b.label} (المتوفر بحقيبتك: ${count})</span>
                <button class="trade-btn" onclick="CityServices.eatSweet('${b.item}', ${b.healAmt})" ${count > 0 && !fullHp ? '' : 'disabled'}>تناول</button>
            </div>`;
        });

        this.openModal('🧁 مخبز الأرانب الكوزي', `
            <p style="margin-bottom:14px; color:#ccc; line-height:1.7">مرحباً بك! ادمج خيرات الغابات والأعشاب والعسل البري لصناعة ألذ الحلويات المغذية التي تساندك في المغامرات.</p>
            <p class="shop-section">🧑‍🍳 إعداد وخبز الحلويات</p>
            ${cookHtml}
            <p class="shop-section">🍴 تناول الحلويات المخزنة لديك للتعافي</p>
            ${eatHtml}
        `);
    },

    /**
     * شاشة قراءة كتب وقصص المغامرات والتاريخ في مكتبة الهمس
     * @param {string} [bookId] - معرف الكتاب المفتوح للقراءة حالياً
     * @param {number} [pageIdx] - الصفحة الحالية المفتوحة
     */
    openBookstore(bookId, pageIdx) {
        const db = (typeof CityData !== 'undefined') ? CityData.LIBRARY.BOOKS : [];
        
        if (!bookId) {
            // شاشة اختيار كتاب لقراءته
            let booksListHtml = '';
            db.forEach(b => {
                const read = CityState.mapState.readBooks.includes(b.id);
                booksListHtml += `<div class="trade-row">
                    <span>📖 ${b.title} ${read ? '<span style="color:#ffd060; font-size:0.75rem">(سبق وقرأته)</span>' : ''}</span>
                    <button class="trade-btn" onclick="CityDialogue.openBookstore('${b.id}', 0)">فتح الكتاب</button>
                </div>`;
            });

            this.openModal('📚 مكتبة الهمس للقراءة', `
                <p style="margin-bottom:14px; color:#ccc">اختر كتاباً من الرفوف بجوار المدفأة المشتعلة واستمتع بالقصص المفيدة والمعارف التاريخية:</p>
                ${booksListHtml}
            `);
        } else {
            // شاشة قراءة صفحات الكتاب المحدد
            const book = db.find(b => b.id === bookId);
            if (!book) return;

            pageIdx = pageIdx || 0;
            const text = book.pages[pageIdx];
            const isLast = pageIdx >= book.pages.length - 1;

            const nextBtn = isLast
                ? `<button class="trade-btn" onclick="CityDialogue.finishReadingBook('${bookId}')">إنهاء القراءة 📖</button>`
                : `<button class="trade-btn" onclick="CityDialogue.openBookstore('${bookId}', ${pageIdx + 1})">الصفحة التالية ➔</button>`;
            
            const prevBtn = pageIdx > 0
                ? `<button class="trade-btn" onclick="CityDialogue.openBookstore('${bookId}', ${pageIdx - 1})" style="margin-right:8px">➔ الصفحة السابقة</button>`
                : `<button class="trade-btn" onclick="CityDialogue.openBookstore()" style="margin-right:8px">الرفوف 📚</button>`;

            this.openModal(`📖 ${book.title}`, `
                <div style="background:rgba(255,255,255,0.03); border:1px dashed rgba(255,208,96,0.3); border-radius:10px; padding:16px; min-height:130px; margin-bottom:14px; font-size:0.92rem; line-height:1.8; color:#eee">
                    ${text}
                </div>
                <div style="display:flex; justify-content:space-between; align-items:center">
                    <span style="font-size:0.75rem; color:#aaa">صفحة ${pageIdx + 1} من ${book.pages.length}</span>
                    <div>
                        ${prevBtn}
                        ${nextBtn}
                    </div>
                </div>
            `);
        }
    },

    /**
     * إنهاء قراءة كتاب وحفظ التقدم
     */
    finishReadingBook(bookId) {
        if (!CityState.mapState.readBooks.includes(bookId)) {
            CityState.mapState.readBooks.push(bookId);
            if (typeof window.saveCityState === 'function') {
                window.saveCityState();
            }
        }
        if (typeof window.notify === 'function') {
            window.notify('📚 اكتملت قراءة الكتاب وتوسعت معارفك!', '#ffd060');
        }
        this.openBookstore();
    },

    /**
     * فتح أكاديمية الكشافة لعرض الشارات والبطولات الحاصل عليها
     */
    openAcademy() {
        const db = (typeof CityData !== 'undefined') ? CityData.RANGERS_ACADEMY.BADGES : [];
        const earned = CityState.mapState.earnedBadges;

        let badgesHtml = '';
        db.forEach(b => {
            const hasIt = earned.includes(b.id);
            badgesHtml += `<div class="trade-row" style="opacity: ${hasIt ? 1.0 : 0.4}; gap:14px">
                <span style="font-size:1.6rem">${b.icon}</span>
                <div style="flex:1; display:flex; flex-direction:column; gap:2px">
                    <strong style="color: ${hasIt ? '#ffd060' : '#ccc'}">${b.name}</strong>
                    <span style="font-size:0.72rem; color:#aaa">${b.desc}</span>
                </div>
                <span style="color: ${hasIt ? '#6ddc6d' : '#888'}; font-weight:bold">${hasIt ? 'مكتسبة ✓' : 'مقفلة 🔒'}</span>
            </div>`;
        });

        this.openModal('🏹 أكاديمية الكشافة وشارات البطولة', `
            <p style="margin-bottom:14px; color:#ccc; line-height:1.7">هنا يسجل القادة الصغار بطولاتهم ومساعداتهم لأهل الساحة. نفذ المهام الطيبة واحصل على الشارات الفخرية لفتح بوابات الغابة الجنوبية:</p>
            ${badgesHtml}
        `);
    },

    /**
     * تفاعل الحوار لإطعام ومداعبة الحيوانات الأليفة اللطيفة
     * @param {Object} walker - كائن الحيوان الأليف
     */
    openAnimalModal(walker) {
        const name = walker.name;
        const isDog = walker.emoji === '🐶';
        const db = isDog ? CityData.ANIMAL_INTERACTIONS.puppy : CityData.ANIMAL_INTERACTIONS.kitten;
        const foodKey = isDog ? 'meat' : 'fish';
        const hasFood = getFoodCount(CityState.player.inventory, foodKey) >= 1;

        this.openModal(`${walker.emoji} تفاعل مع ${name}`, `
            <p style="margin-bottom:14px; color:#ccc; line-height:1.8">ما الذي ترغب في فعله مع ${name} اللطيف؟</p>
            <div style="display:flex; justify-content:center; gap:8px">
                <button class="trade-btn" onclick="CityDialogue.interactAnimalAction('${walker.name}', 'pet')">👋 مداعبة بلطف</button>
                <button class="trade-btn" onclick="CityDialogue.interactAnimalAction('${walker.name}', 'feed')" ${hasFood ? '' : 'disabled'}>🥩 إطعام</button>
                <button class="trade-btn" onclick="CityDialogue.closeModal()">إلغاء</button>
            </div>
        `);
    },

    /**
     * تنفيذ تفاعلات الحيوانات وحفظ الحالة وتعديل الموارد
     */
    interactAnimalAction(name, action) {
        // البحث عن الكائن
        const walker = window.CityNPCs.walkers.find(w => w.name === name);
        if (!walker) return;

        const isDog = walker.emoji === '🐶';
        const db = isDog ? CityData.ANIMAL_INTERACTIONS.puppy : CityData.ANIMAL_INTERACTIONS.kitten;
        
        if (action === 'pet') {
            if (typeof window.notify === 'function') {
                window.notify(db.petMsg, '#ffd060', 3500);
            }
            walker.bubble = '❤️ *سعيد*';
            walker.bubbleUntil = performance.now() + 2000;
            this.closeModal();
        } else if (action === 'feed') {
            const foodKey = isDog ? 'meat' : 'fish';
            takeFoodItems(CityState.player.inventory, foodKey, 1);
            if (typeof window.notify === 'function') {
                window.notify(db.feedMsg, '#6ddc6d', 3500);
            }
            
            // تحقق شارات الأكاديمية
            CityQuests.checkEarnedBadges();

            walker.bubble = '✨ 😋 *لذيذ*';
            walker.bubbleUntil = performance.now() + 2500;
            
            // حفظ التغييرات على حقيبة الموارد بالملف
            if (typeof window.saveCityState === 'function') {
                window.saveCityState();
            }
            this.closeModal();
        }
    }
};

// إلحاق الكائن بالنطاق العام للمستعرض ليكون متاحاً لـ HTML والـ inline onclicks
if (typeof window !== 'undefined') {
    window.CityDialogue = CityDialogue;
}
