'use strict';

// =========================================================
//  CITY HUD — واجهة البطل التفاعلية (v2)
// =========================================================

const CityHUD = {
    // مؤقت تنظيف الإشعارات
    _toastTimers: [],

    /**
     * تهيئة جميع عناصر الـ HUD وربط المستمعين
     */
    init() {
        this._buildHUD();
        this._buildHotbar();
        this._buildTimeDisplay();
        this._buildNotifyArea();
        this._buildSoundBtn();
        this._buildControlsHint();
        this.update();
    },

    /**
     * بناء الشريط العلوي للبطل (HP / Attack / Coins)
     */
    _buildHUD() {
        const hud = document.getElementById('city-hud');
        if (!hud) return;

        hud.innerHTML = `
            <!-- بطاقة الصحة -->
            <div class="hud-card" id="hud-hp-card">
                <span class="hud-icon">❤️</span>
                <div>
                    <div class="hud-label">الصحة</div>
                    <div class="hud-bar-wrap">
                        <div class="hud-bar-fill hp" id="hud-hp-bar" style="width:100%"></div>
                    </div>
                </div>
                <span class="hud-value" id="hud-hp-val">100/100</span>
            </div>

            <!-- بطاقة الهجوم والمستوى -->
            <div class="hud-card" id="hud-atk-card">
                <span class="hud-icon">⚔️</span>
                <div>
                    <div class="hud-label">الهجوم</div>
                    <div class="hud-value" id="hud-atk-val" style="font-size:15px">25</div>
                </div>
                <div style="margin-right:6px">
                    <div class="hud-label">المستوى</div>
                    <div class="hud-value" id="hud-lvl-val" style="font-size:15px">1</div>
                </div>
            </div>

            <!-- بطاقة العملات -->
            <div class="hud-card" id="coin-display">
                <span class="coin-icon">🪙</span>
                <span class="coin-amt" id="hud-coins">0</span>
            </div>
        `;
    },

    /**
     * بناء شريط الأدوات السريعة في أسفل الشاشة
     */
    _buildHotbar() {
        const bar = document.getElementById('hotbar');
        if (!bar) return;

        const SLOTS = [
            { key: '1', icon: '🏹', id: 'arrows',    label: 'أسهم'  },
            { key: '2', icon: '🍖', id: 'meat',      label: 'لحم'   },
            { key: '3', icon: '🐟', id: 'fish',      label: 'سمك'   },
            { key: '4', icon: '🍰', id: 'berryTart', label: 'تورتة' },
            { key: '5', icon: '🍯', id: 'honeyCake', label: 'كعكة'  },
        ];

        bar.innerHTML = SLOTS.map((s, i) => `
            <div class="hotbar-slot${i === 0 ? ' active' : ''}"
                 id="slot-${s.id}"
                 title="${s.label}"
                 onclick="CityHUD.selectSlot('${s.id}')">
                <span class="slot-key">${s.key}</span>
                <span class="slot-icon">${s.icon}</span>
                <span class="slot-count" id="slot-cnt-${s.id}">0</span>
            </div>
        `).join('');
    },

    /**
     * بناء عرض الوقت والطقس أسفل الـ HUD
     */
    _buildTimeDisplay() {
        let el = document.getElementById('time-display');
        if (!el) {
            el = document.createElement('div');
            el.id = 'time-display';
            document.getElementById('game-wrapper')?.appendChild(el);
        }
        el.innerHTML = `
            <span class="time-icon" id="time-icon">☀️</span>
            <span class="time-label" id="time-label">النهار</span>
            <span class="time-val"  id="time-val">12:00</span>
        `;
    },

    /**
     * بناء منطقة الإشعارات المنبثقة
     */
    _buildNotifyArea() {
        let el = document.getElementById('notify-area');
        if (!el) {
            el = document.createElement('div');
            el.id = 'notify-area';
            document.getElementById('game-wrapper')?.appendChild(el);
        }
        // تعيين دالة الإشعار العالمية
        window.notify = (msg, color = '#ffd060', duration = 2800) => {
            this.showToast(msg, color, duration);
        };
    },

    /**
     * بناء زر التحكم في الصوت
     */
    _buildSoundBtn() {
        let btn = document.getElementById('sound-btn');
        if (!btn) {
            btn = document.createElement('button');
            btn.id = 'sound-btn';
            btn.setAttribute('aria-label', 'تبديل الصوت');
            document.getElementById('game-wrapper')?.appendChild(btn);
        }
        btn.textContent = CityState.transient.soundMuted ? '🔇' : '🔊';
        btn.onclick = () => {
            CityState.transient.soundMuted = !CityState.transient.soundMuted;
            btn.textContent = CityState.transient.soundMuted ? '🔇' : '🔊';

            if (typeof window.setCityAmbientVolume === 'function') {
                window.setCityAmbientVolume(CityState.transient.soundMuted ? 0 : 0.35);
            }
        };
    },

    /**
     * بناء تلميح مفاتيح التحكم
     */
    _buildControlsHint() {
        let el = document.getElementById('controls-hint');
        if (!el) {
            el = document.createElement('div');
            el.id = 'controls-hint';
            document.getElementById('game-wrapper')?.appendChild(el);
        }
        el.innerHTML = `
            <span class="hint-key">↑↓←→</span> التحرك<br>
            <span class="hint-key">E</span> تفاعل<br>
            <span class="hint-key">M</span> الخريطة<br>
            <span class="hint-key">I</span> الحقيبة<br>
            <span class="hint-key">Esc</span> إغلاق
        `;
    },

    /**
     * تحديث جميع قيم الـ HUD من حالة اللاعب الراهنة
     */
    update() {
        const p = CityState.player;

        // ـ الصحة ـ
        const hpPct = Math.max(0, Math.min(100, (p.hp / p.maxHp) * 100));
        const hpBar = document.getElementById('hud-hp-bar');
        const hpVal = document.getElementById('hud-hp-val');
        if (hpBar) hpBar.style.width = `${hpPct}%`;
        if (hpVal) hpVal.textContent = `${Math.round(p.hp)}/${p.maxHp}`;

        // لون شريط الصحة يتغير حسب النسبة
        if (hpBar) {
            if (hpPct > 60)      hpBar.style.background = 'linear-gradient(90deg,#e74c3c,#ff6b6b)';
            else if (hpPct > 30) hpBar.style.background = 'linear-gradient(90deg,#c0700a,#f0a040)';
            else                 hpBar.style.background = 'linear-gradient(90deg,#8a1010,#c03030)';
        }

        // ـ الهجوم والمستوى ـ
        const atkEl = document.getElementById('hud-atk-val');
        const lvlEl = document.getElementById('hud-lvl-val');
        if (atkEl) atkEl.textContent = p.attack || 25;
        if (lvlEl) lvlEl.textContent = p.level  || 1;

        // ـ العملات ـ
        const coinsEl = document.getElementById('hud-coins');
        if (coinsEl) coinsEl.textContent = p.inventory?.coins ?? 0;

        // ـ شريط الأدوات السريعة ـ
        const SLOT_ITEMS = ['arrows','meat','fish','berryTart','honeyCake'];
        SLOT_ITEMS.forEach(id => {
            const el = document.getElementById(`slot-cnt-${id}`);
            if (el) el.textContent = p.inventory?.[id] ?? 0;
        });

        // ـ الوقت والطقس ـ
        this.updateTimeDisplay();
    },

    /**
     * تحديث عرض الوقت والرمز المناسب حسب ساعة الدورة
     */
    updateTimeDisplay() {
        const weather = window.CityWeather;
        if (!weather) return;

        const hour    = weather.getHour?.() ?? 12;
        const mm      = weather.getMinute?.() ?? 0;
        const hDisp   = String(hour).padStart(2, '0');
        const mDisp   = String(mm).padStart(2, '0');

        let icon, label;
        if (hour >= 5 && hour < 7)       { icon = '🌅'; label = 'الفجر';   }
        else if (hour >= 7 && hour < 12) { icon = '☀️';  label = 'الصباح'; }
        else if (hour >= 12 && hour < 17){ icon = '🌤️'; label = 'الظهيرة';}
        else if (hour >= 17 && hour < 20){ icon = '🌇'; label = 'الغروب'; }
        else if (hour >= 20 && hour < 22){ icon = '🌆'; label = 'المساء'; }
        else                             { icon = '🌙'; label = 'الليل';   }

        const iconEl  = document.getElementById('time-icon');
        const labelEl = document.getElementById('time-label');
        const valEl   = document.getElementById('time-val');
        if (iconEl)  iconEl.textContent  = icon;
        if (labelEl) labelEl.textContent = label;
        if (valEl)   valEl.textContent   = `${hDisp}:${mDisp}`;
    },

    /**
     * تحديد فتحة الأداة النشطة بالحزام (يتأثر بالضغط رقمي أو النقر)
     * @param {string} itemId
     */
    selectSlot(itemId) {
        document.querySelectorAll('.hotbar-slot').forEach(el => el.classList.remove('active'));
        const target = document.getElementById(`slot-${itemId}`);
        if (target) target.classList.add('active');
        CityState.transient.activeSlot = itemId;
    },

    /**
     * عرض إشعار منبثق عائم في منتصف أعلى الشاشة
     * @param {string}  msg       - نص الرسالة
     * @param {string}  color     - لون الحدود (اختياري)
     * @param {number}  duration  - مدة الظهور بالملي ثانية
     */
    showToast(msg, color = '#ffd060', duration = 2800) {
        const area = document.getElementById('notify-area');
        if (!area) return;

        const toast = document.createElement('div');
        toast.className = 'notify-toast';
        toast.textContent = msg;
        toast.style.borderColor = color;
        toast.style.setProperty('--toast-dur', `${(duration / 1000).toFixed(2)}s`);
        area.appendChild(toast);

        const timer = setTimeout(() => {
            toast.remove();
        }, duration + 300);
        this._toastTimers.push(timer);
    },

    /**
     * تنظيف جميع الإشعارات المعلقة دفعة واحدة
     */
    clearToasts() {
        this._toastTimers.forEach(t => clearTimeout(t));
        this._toastTimers = [];
        const area = document.getElementById('notify-area');
        if (area) area.innerHTML = '';
    }
};

// تصدير للنطاق العام
if (typeof window !== 'undefined') {
    window.CityHUD = CityHUD;
}
