'use strict';
// =========================================================
//  FOREST QUESTS — أساس مهام الغابة (TASK_041) + سلسلة الحارس (TASK_042)
//  قاعدة: عدة مهام نشطة معاً (حد أقصى MAX_ACTIVE_TOTAL) — بدون تكرار نفس الـ id
// =========================================================

/** سلسلة مهام حارس بوابة المدينة */
const FOREST_GIVER_CHAIN = [
    'fq_chain_rabbits',
    'fq_chain_fox',
    'fq_chain_wolf'
];

/** تعريفات المهام */
const FOREST_QUEST_DEFS = {
    fq_chain_rabbits: {
        id: 'fq_chain_rabbits',
        title: 'أرانب المراعي',
        description: 'الوحوش الصغيرة تتكاثر قرب الممرات. اقتل 5 أرانب برية لتهدئة الطريق إلى المدينة.',
        source: 'giver',
        objectives: [
            { type: 'kill', enemyId: 'wildRabbit', count: 5, minLevel: 1 }
        ],
        rewards: {
            xp: (typeof FOREST_QUEST_XP_REWARDS !== 'undefined')
                ? FOREST_QUEST_XP_REWARDS.chain_q1_rabbits : 20,
            items: { rawMeat: 2 }
        },
        prereq: null,
        repeatable: false
    },
    fq_chain_fox: {
        id: 'fq_chain_fox',
        title: 'أثر الثعلب',
        description: 'ثعالب ماكرة تسرق المؤن من المسافرين. اقتل 3 ثعالب.',
        source: 'giver',
        objectives: [
            { type: 'kill', enemyId: 'fox', count: 3, minLevel: 1 }
        ],
        rewards: {
            xp: (typeof FOREST_QUEST_XP_REWARDS !== 'undefined')
                ? FOREST_QUEST_XP_REWARDS.chain_q2_foxes : 25,
            items: { teeth: 2, leather: 1 }
        },
        prereq: 'fq_chain_rabbits',
        repeatable: false
    },
    fq_chain_wolf: {
        id: 'fq_chain_wolf',
        title: 'ذئب المراعي',
        description: 'ذئب قوي يهدد بوابة المدينة. احذر: الذئاب تبدأ من المستوى 5 فما فوق — اقتل واحداً منها.',
        source: 'giver',
        objectives: [
            { type: 'kill', enemyId: 'wolf', count: 1, minLevel: 5 }
        ],
        rewards: {
            xp: (typeof FOREST_QUEST_XP_REWARDS !== 'undefined')
                ? FOREST_QUEST_XP_REWARDS.chain_q3_wolf : 35,
            items: { beastHide: 1 }
        },
        prereq: 'fq_chain_fox',
        repeatable: false
    },

    // ----- لوحة الصيد (TASK_043) -----
    fq_board_rabbits: {
        id: 'fq_board_rabbits',
        title: 'صيد الأرانب',
        description: 'اقتل 8 أرانب برية في مراعي الوسط.',
        source: 'board',
        region: 'centerMeadows',
        regionLabel: 'مراعي الوسط',
        suggestedLevel: 1,
        objectives: [
            { type: 'kill', enemyId: 'wildRabbit', count: 8, minLevel: 1 }
        ],
        rewards: {
            xp: (typeof FOREST_QUEST_XP_REWARDS !== 'undefined')
                ? FOREST_QUEST_XP_REWARDS.board_rabbits : 30,
            items: { rawMeat: 3 }
        },
        prereq: null,
        repeatable: false
    },
    fq_board_foxes: {
        id: 'fq_board_foxes',
        title: 'مطاردة الثعالب',
        description: 'اقتل 4 ثعالب في مراعي الوسط.',
        source: 'board',
        region: 'centerMeadows',
        regionLabel: 'مراعي الوسط',
        suggestedLevel: 2,
        objectives: [
            { type: 'kill', enemyId: 'fox', count: 4, minLevel: 1 }
        ],
        rewards: {
            xp: (typeof FOREST_QUEST_XP_REWARDS !== 'undefined')
                ? FOREST_QUEST_XP_REWARDS.board_foxes : 30,
            items: { teeth: 3 }
        },
        prereq: null,
        repeatable: false
    },
    fq_board_wolves: {
        id: 'fq_board_wolves',
        title: 'ذئاب الجبال',
        description: 'اقتل 3 ذئاب من المستوى 5 فأعلى في جبال الشرق.',
        source: 'board',
        region: 'mountains',
        regionLabel: 'جبال الشرق',
        suggestedLevel: 5,
        objectives: [
            { type: 'kill', enemyId: 'wolf', count: 3, minLevel: 5 }
        ],
        rewards: {
            xp: (typeof FOREST_QUEST_XP_REWARDS !== 'undefined')
                ? FOREST_QUEST_XP_REWARDS.board_wolves : 75,
            items: { leather: 2 }
        },
        prereq: null,
        repeatable: false
    },
    fq_board_bear: {
        id: 'fq_board_bear',
        title: 'دب الجبل',
        description: 'اقتل دباً واحداً من المستوى 8 فأعلى في جبال الشرق.',
        source: 'board',
        region: 'mountains',
        regionLabel: 'جبال الشرق',
        suggestedLevel: 8,
        objectives: [
            { type: 'kill', enemyId: 'bear', count: 1, minLevel: 8 }
        ],
        rewards: {
            xp: (typeof FOREST_QUEST_XP_REWARDS !== 'undefined')
                ? FOREST_QUEST_XP_REWARDS.board_bear : 80,
            items: { leather: 3 }
        },
        prereq: null,
        repeatable: false
    },
    fq_board_night: {
        id: 'fq_board_night',
        title: 'خطر ليلي',
        description: 'اقتل مفترسين ليليين (ذئب مرعب أو فهد الظلام) في غابة الغرب.',
        source: 'board',
        region: 'westForest',
        regionLabel: 'غابة الغرب',
        suggestedLevel: 10,
        objectives: [
            { type: 'kill', enemyIds: ['direWolf', 'nightPanther'], count: 2, minLevel: 1, nocturnal: true }
        ],
        rewards: {
            xp: (typeof FOREST_QUEST_XP_REWARDS !== 'undefined')
                ? FOREST_QUEST_XP_REWARDS.board_night : 150,
            items: { nightCrystal: 1, beastHide: 1 }
        },
        prereq: null,
        repeatable: false
    }
};

/** ترتيب عرض مهام لوحة الصيد */
const FOREST_BOARD_HUNTS = [
    'fq_board_rabbits',
    'fq_board_foxes',
    'fq_board_wolves',
    'fq_board_bear',
    'fq_board_night'
];

/** معرف ثابت لمهمة اليوم (لا يُكدّس في completedQuests) */
const RADIANT_QUEST_ID = 'fq_radiant_current';

/** قوالب مهام يومية — نهار */
const RADIANT_DAY_POOL = [
    {
        key: 'rad_kill_rabbits',
        enemyId: 'wildRabbit',
        countMin: 4, countMax: 6,
        minLevel: 1,
        region: 'centerMeadows',
        regionLabel: 'مراعي الوسط',
        titleFn: (n) => `صيد يومي: ${n} أرانب`,
        descFn: (n) => `اقتل ${n} أرانب برية في مراعي الوسط قبل غروب الشمس.`,
        xpBase: 5, xpPer: 4
    },
    {
        key: 'rad_kill_fox',
        enemyId: 'fox',
        countMin: 2, countMax: 3,
        minLevel: 1,
        region: 'centerMeadows',
        regionLabel: 'مراعي الوسط',
        titleFn: (n) => `صيد يومي: ${n} ثعالب`,
        descFn: (n) => `اقتل ${n} ثعالب في مراعي الوسط.`,
        xpBase: 8, xpPer: 6
    },
    {
        key: 'rad_kill_wolf',
        enemyId: 'wolf',
        countMin: 1, countMax: 2,
        minLevel: 5,
        region: 'mountains',
        regionLabel: 'جبال الشرق',
        titleFn: (n) => `صيد يومي: ${n} ذئاب`,
        descFn: (n) => `اقتل ${n} ذئاب (م5+) في جبال الشرق.`,
        xpBase: 15, xpPer: 20
    },
    {
        key: 'rad_kill_snake',
        enemyId: 'snake',
        countMin: 2, countMax: 3,
        minLevel: 1,
        region: 'westForest',
        regionLabel: 'غابة الغرب',
        titleFn: (n) => `صيد يومي: ${n} أفاعي`,
        descFn: (n) => `اقتل ${n} أفاعي في غابة الغرب.`,
        xpBase: 12, xpPer: 10
    }
];

/** قوالب مهام يومية — ليل */
const RADIANT_NIGHT_POOL = [
    {
        key: 'rad_night_dire',
        enemyId: 'direWolf',
        countMin: 1, countMax: 1,
        minLevel: 1,
        region: 'westForest',
        regionLabel: 'غابة الغرب',
        nocturnal: true,
        titleFn: () => 'صيد ليلي: ذئب مرعب',
        descFn: () => 'اقتل ذئباً مرعباً في غابة الغرب تحت جنح الظلام.',
        xpBase: 55, xpPer: 15
    },
    {
        key: 'rad_night_spider',
        enemyId: 'giantSpider',
        countMin: 1, countMax: 2,
        minLevel: 1,
        region: 'westForest',
        regionLabel: 'غابة الغرب',
        nocturnal: true,
        titleFn: (n) => `صيد ليلي: ${n} عناكب`,
        descFn: (n) => `اقتل ${n} عنكبوتاً عملاقاً في غابة الغرب ليلاً.`,
        xpBase: 35, xpPer: 20
    },
    {
        key: 'rad_night_panther',
        enemyId: 'nightPanther',
        countMin: 1, countMax: 1,
        minLevel: 1,
        region: 'westForest',
        regionLabel: 'غابة الغرب',
        nocturnal: true,
        titleFn: () => 'صيد ليلي: فهد الظلام',
        descFn: () => 'اقتل فهد الظلام في غابة الغرب.',
        xpBase: 50, xpPer: 20
    }
];

const RADIANT_ITEM_POOL = ['rawMeat', 'teeth', 'leather'];

function getForestDayIndex() {
    return (typeof dayCount === 'number' && dayCount > 0) ? dayCount : 1;
}

function getRadiantPeriodKey() {
    const day = getForestDayIndex();
    const night = (typeof isNight !== 'undefined') ? !!isNight
        : (typeof dayNightPhase !== 'undefined' && (dayNightPhase === 'night' || dayNightPhase === 'dusk'));
    return day + '_' + (night ? 'night' : 'day');
}

function _randInt(a, b) {
    return a + Math.floor(Math.random() * (b - a + 1));
}

function _clamp(n, lo, hi) {
    return Math.max(lo, Math.min(hi, n));
}

/**
 * يولّد تعريف مهمة يومية حسب النهار/الليل.
 * @returns {object} تعريف مهمة بـ id = fq_radiant_current
 */
function rollRadiantQuest(dayIndex, night) {
    const pool = night ? RADIANT_NIGHT_POOL : RADIANT_DAY_POOL;
    const t = pool[Math.floor(Math.random() * pool.length)];
    const count = _randInt(t.countMin, t.countMax);
    let xp = Math.round(t.xpBase + count * t.xpPer);
    if (typeof FOREST_QUEST_XP_REWARDS !== 'undefined') {
        if (night) {
            xp = _clamp(xp,
                FOREST_QUEST_XP_REWARDS.radiant_night_min || 40,
                FOREST_QUEST_XP_REWARDS.radiant_night_max || 80);
        } else {
            xp = _clamp(xp,
                FOREST_QUEST_XP_REWARDS.radiant_day_min || 15,
                FOREST_QUEST_XP_REWARDS.radiant_day_max || 35);
        }
    }

    const rewards = { xp: xp, items: {} };
    if (Math.random() < 0.4) {
        const item = RADIANT_ITEM_POOL[Math.floor(Math.random() * RADIANT_ITEM_POOL.length)];
        rewards.items[item] = 1 + (Math.random() < 0.35 ? 1 : 0);
    }

    const enemyName = (typeof ENEMY_TEMPLATES !== 'undefined' && ENEMY_TEMPLATES[t.enemyId])
        ? ENEMY_TEMPLATES[t.enemyId].name
        : t.enemyId;

    let flavor = '';
    if (typeof getWeatherState === 'function') {
        const w = getWeatherState();
        if (w && (w.id === 'storm' || w.id === 'heavyRain')) {
            flavor = ' العاصفة أجفلت الفرائس — كن حذراً.';
        }
    } else if (typeof weatherState !== 'undefined' && weatherState) {
        const wid = weatherState.id || weatherState.type;
        if (wid === 'storm' || wid === 'heavy' || wid === 'heavyRain') {
            flavor = ' العاصفة أجفلت الفرائس — كن حذراً.';
        }
    }

    return {
        id: RADIANT_QUEST_ID,
        title: t.titleFn(count),
        description: t.descFn(count) + flavor,
        source: 'radiant',
        repeatable: true,
        region: t.region,
        regionLabel: t.regionLabel,
        templateKey: t.key,
        dayIndex: dayIndex,
        period: night ? 'night' : 'day',
        objectives: [{
            type: 'kill',
            enemyId: t.enemyId,
            count: count,
            minLevel: t.minLevel || 1,
            nocturnal: !!t.nocturnal
        }],
        rewards: rewards,
        prereq: null,
        _enemyName: enemyName
    };
}

const ForestQuests = {
    /** أقصى مهام نشطة معاً (سلسلة + لوحة + يومية…) */
    MAX_ACTIVE_TOTAL: 5,

    defs: FOREST_QUEST_DEFS,

    registerDefs(extra) {
        if (!extra || typeof extra !== 'object') return;
        Object.assign(this.defs, extra);
    },

    getDef(id) {
        return this.defs[id] || null;
    },

    _gs() {
        if (typeof window !== 'undefined' && window.GameState) return window.GameState;
        if (typeof GameState !== 'undefined') return GameState;
        return null;
    },

    _doc() {
        const GS = this._gs();
        if (!GS || !GS._ensure) return null;
        return GS._ensure();
    },

    getState() {
        const doc = this._doc();
        if (!doc || !doc.maps) return null;
        if (!doc.maps.forest) {
            doc.maps.forest = (typeof deepClone === 'function' && typeof DEFAULT_MAPS !== 'undefined')
                ? deepClone(DEFAULT_MAPS.forest)
                : {
                    activeQuests: [], completedQuests: [], spokenToNpcs: [],
                    huntBoard: { activeId: null, completedIds: [] },
                    radiant: { lastId: null, lastDayIndex: null, activeId: null }
                };
        }
        if (typeof ensureForestQuestFields === 'function') ensureForestQuestFields(doc.maps.forest);
        else if (typeof window !== 'undefined' && typeof window.ensureForestQuestFields === 'function') {
            window.ensureForestQuestFields(doc.maps.forest);
        }
        return doc.maps.forest;
    },

    _persist(opts) {
        opts = opts || {};
        if (typeof saveForestProgress === 'function') {
            saveForestProgress(opts.force ? { force: true } : { debounce: true });
            return;
        }
        const GS = this._gs();
        if (GS && GS._persist) GS._persist({ force: !!opts.force });
    },

    _sanitizeActive() {
        const st = this.getState();
        if (!st) return [];
        st.activeQuests = (st.activeQuests || []).filter(aq => aq && aq.id && this.getDef(aq.id));
        return st.activeQuests;
    },

    getActive() {
        return this._sanitizeActive()[0] || null;
    },

    getActives() {
        return this._sanitizeActive();
    },

    getActiveBySource(source) {
        return this._sanitizeActive().find(aq => aq.source === source) || null;
    },

    getActiveById(id) {
        return this._sanitizeActive().find(aq => aq.id === id) || null;
    },

    _isReady(aq) {
        if (!aq) return false;
        const def = this.getDef(aq.id);
        return !!(aq.readyToTurnIn || (def && this._objectivesDone(def, aq)));
    },

    canAcceptMore() {
        return this._sanitizeActive().length < this.MAX_ACTIVE_TOTAL;
    },

    /** المهمة التالية في سلسلة الحارس (أو null إن اكتملت) */
    getNextGiverQuestId() {
        for (const id of FOREST_GIVER_CHAIN) {
            if (!this.isCompleted(id) && !this.getActiveById(id)) return id;
        }
        return null;
    },

    isGiverChainDone() {
        return FOREST_GIVER_CHAIN.every(id => this.isCompleted(id));
    },

    /**
     * علامة فوق الحارس: '!' قبول · '?' تسليم · '…' قيد التنفيذ · null لا شيء
     */
    getGiverMarker() {
        const giver = this.getActiveBySource('giver');
        const radiant = this.getActiveBySource('radiant');
        if ((giver && this._isReady(giver)) || (radiant && this._isReady(radiant))) return '?';
        if (giver || radiant) {
            this.ensureRadiantOffer();
            // قيد التنفيذ، لكن ما زال يمكن قبول مهمة أخرى إن وُجدت سعة
            if (this.canAcceptMore() && (this.getNextGiverQuestId() || this.hasRadiantOffer())) return '!';
            return '…';
        }
        this.ensureRadiantOffer();
        if (this.getNextGiverQuestId() || this.hasRadiantOffer()) return '!';
        return null;
    },

    _rewardHtml(def) {
        if (!def || !def.rewards) return '';
        const parts = [];
        if (def.rewards.xp) parts.push(`${def.rewards.xp} خبرة`);
        if (def.rewards.items) {
            for (const [k, v] of Object.entries(def.rewards.items)) {
                const n = (typeof ITEM_NAMES !== 'undefined' && ITEM_NAMES[k]) ? ITEM_NAMES[k] : k;
                parts.push(`${v}× ${n}`);
            }
        }
        if (!parts.length) return '';
        return `<p class="fq-reward">المكافأة: ${parts.join(' + ')}</p>`;
    },

    /** عرض تفاصيل مهمة السلسلة مع زر القبول */
    _offerGiverQuest(npcName, questId) {
        const def = this.getDef(questId);
        if (!def) return;
        this.openModal({
            title: def.title,
            bodyHtml:
                `<p class="fq-desc">${def.description || ''}</p>` +
                this._rewardHtml(def),
            buttons: [
                {
                    label: 'قبول المهمة',
                    primary: true,
                    onClick: () => {
                        const r = this.accept(questId, 'giver');
                        if (r.ok) {
                            if (typeof notify === 'function') notify('تم قبول المهمة', '#ffd060');
                            this.closeModal();
                        } else if (r.reason === 'busy') {
                            if (typeof notify === 'function') {
                                notify('وصلت للحد الأقصى من المهام النشطة', '#e74c3c');
                            }
                        } else if (r.reason === 'done') {
                            if (typeof notify === 'function') notify('أنجزت هذا من قبل.', '#aaa');
                        } else if (r.reason === 'prereq') {
                            if (typeof notify === 'function') notify('أكمل المهمة السابقة أولاً', '#e74c3c');
                        }
                    }
                },
                { label: 'لاحقاً', action: 'close' }
            ]
        });
    },

    /** حوار حارس البوابة — سلسلة قصة + مهمة اليوم */
    openGiverDialogue(npc) {
        const npcName = (npc && npc.name) || 'حارس البوابة';
        const npcId = (npc && npc.id) || 'forest_gate_guard';
        const firstTalk = !this.hasSpoken(npcId);
        if (firstTalk) this.markSpoken(npcId);

        if (typeof dismissPortalPanel === 'function') dismissPortalPanel();
        this.ensureRadiantOffer();

        // أولوية: تسليم جاهز من السلسلة أو اليومية
        const readyGiver = this.getActives().find(aq =>
            (aq.source === 'giver' || aq.source === 'radiant') && this._isReady(aq));
        if (readyGiver) {
            this.showQuest(readyGiver.id, 'turnin');
            return;
        }

        const nextId = this.getNextGiverQuestId();
        const radiantReady = this.hasRadiantOffer();
        const activeGiver = this.getActiveBySource('giver');
        const activeRadiant = this.getActiveBySource('radiant');
        const buttons = [];

        // عرض تقدم المهام النشطة من الحارس/اليومية
        if (activeGiver && !this._isReady(activeGiver)) {
            buttons.push({
                label: 'تقدم السلسلة',
                onClick: () => this.showQuest(activeGiver.id, 'info')
            });
        }
        if (activeRadiant && !this._isReady(activeRadiant)) {
            buttons.push({
                label: 'تقدم مهمة اليوم',
                onClick: () => this.showQuest(activeRadiant.id, 'info')
            });
        }

        if (nextId && this.canAcceptMore()) {
            buttons.push({
                label: 'هل لديك عمل؟',
                primary: true,
                onClick: () => this._offerGiverQuest(npcName, nextId)
            });
        }
        if (radiantReady && this.canAcceptMore()) {
            buttons.push({
                label: 'مهمة اليوم',
                primary: !nextId,
                onClick: () => this._offerRadiantQuest(npcName)
            });
        }
        buttons.push({ label: 'وداعاً', action: 'close' });

        let body;
        if (!nextId && !radiantReady && !activeGiver && !activeRadiant) {
            body = `<p class="fq-desc">أحسنت أيها الصياد… الغابة أأمن قليلاً. عد لاحقاً لمهمة يوم جديدة.</p>`;
        } else if (firstTalk) {
            body = `<p class="fq-desc">السلام عليك. أنا ${npcName}. أحرس ممر المدينة من وحوش الغابة.</p>` +
                `<p class="fq-desc">يمكنك قبول أكثر من مهمة في آن واحد.</p>`;
        } else if (!nextId && radiantReady) {
            body = `<p class="fq-desc">مرحباً مجدداً. سلسلة المهام انتهت — لكن لديّ صيد اليوم إن شئت.</p>`;
        } else {
            body = `<p class="fq-desc">مرحباً مجدداً. يمكنك متابعة مهامك أو قبول عمل جديد.</p>`;
        }

        this.openModal({ title: npcName, bodyHtml: body, buttons });
    },

    _offerRadiantQuest(npcName) {
        this.ensureRadiantOffer();
        const def = this.getRadiantOfferDef();
        if (!def) {
            this.openModal({
                title: npcName || 'مهمة اليوم',
                bodyHtml: `<p class="fq-desc">لا توجد مهمة يوم متاحة الآن. عد عند الفجر أو الغسق.</p>`,
                buttons: [{ label: 'حسناً', action: 'close', primary: true }]
            });
            return;
        }
        this.openModal({
            title: def.title,
            bodyHtml:
                `<p class="fq-desc">${def.description || ''}</p>` +
                (def.regionLabel ? `<p class="fq-hunt-region">📍 ${def.regionLabel}</p>` : '') +
                this._rewardHtml(def),
            buttons: [
                {
                    label: 'قبول مهمة اليوم',
                    primary: true,
                    onClick: () => {
                        const r = this.accept(RADIANT_QUEST_ID, 'radiant');
                        if (r.ok) {
                            if (typeof notify === 'function') notify('تم قبول المهمة', '#ffd060');
                            this.closeModal();
                        } else if (r.reason === 'busy') {
                            if (typeof notify === 'function') {
                                notify('وصلت للحد الأقصى من المهام النشطة', '#e74c3c');
                            }
                        }
                    }
                },
                { label: 'لاحقاً', action: 'close' }
            ]
        });
    },

    isCompleted(id) {
        const st = this.getState();
        return !!(st && Array.isArray(st.completedQuests) && st.completedQuests.indexOf(id) >= 0);
    },

    hasSpoken(npcId) {
        const st = this.getState();
        return !!(st && Array.isArray(st.spokenToNpcs) && st.spokenToNpcs.indexOf(npcId) >= 0);
    },

    markSpoken(npcId) {
        const st = this.getState();
        if (!st || !npcId) return;
        if (!Array.isArray(st.spokenToNpcs)) st.spokenToNpcs = [];
        if (st.spokenToNpcs.indexOf(npcId) < 0) st.spokenToNpcs.push(npcId);
        this._persist({ force: false });
    },

    /**
     * قبول مهمة. يسمح بعدة مهام نشطة حتى MAX_ACTIVE_TOTAL.
     * @returns {{ ok:boolean, reason?:string, quest?:object }}
     */
    accept(id, source) {
        const def = this.getDef(id);
        if (!def) return { ok: false, reason: 'unknown' };
        if (this.isCompleted(id) && !def.repeatable) return { ok: false, reason: 'done' };
        if (def.prereq && !this.isCompleted(def.prereq)) return { ok: false, reason: 'prereq' };

        const st = this.getState();
        if (!st) return { ok: false, reason: 'nostate' };
        this._sanitizeActive();

        const existing = st.activeQuests.find(aq => aq.id === id);
        if (existing) {
            this.ensureObjectiveSpawns(existing);
            return { ok: true, quest: existing, reason: 'already' };
        }

        if (st.activeQuests.length >= this.MAX_ACTIVE_TOTAL) {
            return { ok: false, reason: 'busy' };
        }

        // مهمة يومية واحدة نشطة فقط
        if ((source || def.source) === 'radiant') {
            if (st.activeQuests.some(aq => aq.source === 'radiant')) {
                return { ok: false, reason: 'busy' };
            }
        }

        const progress = {};
        (def.objectives || []).forEach((obj, i) => { progress[i] = 0; });

        const entry = {
            id: def.id,
            progress: progress,
            source: source || def.source || 'giver',
            readyToTurnIn: false
        };
        st.activeQuests.push(entry);

        if (entry.source === 'board') {
            if (!st.huntBoard) st.huntBoard = { activeId: null, completedIds: [] };
            st.huntBoard.activeId = id;
        }
        if (entry.source === 'radiant') {
            if (!st.radiant) st.radiant = {};
            st.radiant.activeId = id;
        }

        this.ensureObjectiveSpawns(entry);
        this._persist({ force: true });
        this.refreshHud();
        return { ok: true, quest: entry };
    },

    /**
     * يضمن وجود أهداف القتل الحيّة في موطنها (مثلاً 5 أرانب في المراعي).
     * يولّد النقص فقط — لا يضاعف إن كان العدد كافياً.
     */
    ensureObjectiveSpawns(aq) {
        // إن لم تُمرَّر مهمة: ولّد لكل المهام النشطة
        if (!aq) {
            let total = 0;
            for (const a of this.getActives()) total += this.ensureObjectiveSpawns(a);
            return total;
        }
        const def = this.getDef(aq.id);
        if (!def || !def.objectives) return 0;
        if (typeof ensureHabitatPopulation !== 'function') return 0;

        let totalSpawned = 0;
        const names = [];
        (def.objectives || []).forEach((obj, i) => {
            if (!obj || obj.type !== 'kill') return;
            const need = obj.count || 1;
            const have = (aq.progress && aq.progress[i]) || 0;
            const remaining = Math.max(0, need - have);
            if (!remaining) return;

            const types = (obj.enemyIds && obj.enemyIds.length)
                ? obj.enemyIds.slice()
                : (obj.enemyId ? [obj.enemyId] : []);
            if (!types.length) return;

            // وزّع التوليد على الأنواع المطلوبة
            let left = remaining;
            let ti = 0;
            while (left > 0 && ti < types.length * 4) {
                const type = types[ti % types.length];
                const chunk = Math.max(1, Math.ceil(left / (types.length - (ti % types.length))));
                const want = Math.min(left, chunk);
                const regionKey = (def.region)
                    || ((typeof QUEST_SPAWN_REGIONS !== 'undefined') ? QUEST_SPAWN_REGIONS[type] : null);
                const spawned = ensureHabitatPopulation(type, want, {
                    minLevel: obj.minLevel != null ? obj.minLevel : 1,
                    preferRegionKey: regionKey,
                    minDistFromPlayer: 100
                });
                if (spawned > 0) {
                    totalSpawned += spawned;
                    left -= spawned;
                    const label = (typeof ENEMY_TEMPLATES !== 'undefined' && ENEMY_TEMPLATES[type])
                        ? ENEMY_TEMPLATES[type].name
                        : type;
                    names.push(`${spawned}× ${label}`);
                }
                ti++;
                // إن فشل نوع واحد بالكامل، جرّب التالي دون إنقاص left إلا عند النجاح
                if (spawned === 0 && ti >= types.length) break;
            }
        });

        if (totalSpawned > 0 && typeof notify === 'function') {
            notify(`ظهرت في المنطقة: ${names.join('، ')}`, '#a8d070');
        }
        return totalSpawned;
    },

    abandon(id) {
        const st = this.getState();
        if (!st) return { ok: false };
        const before = st.activeQuests.length;
        const was = (st.activeQuests || []).find(aq => aq.id === id);
        st.activeQuests = (st.activeQuests || []).filter(aq => aq.id !== id);
        if (st.huntBoard && st.huntBoard.activeId === id) st.huntBoard.activeId = null;
        if (st.radiant && st.radiant.activeId === id) {
            st.radiant.activeId = null;
            // لا إعادة تدوير فورية — نفس الفترة تبقى «مستخدمة»
            st.radiant.lastPeriod = getRadiantPeriodKey();
            st.radiant.lastDayIndex = getForestDayIndex();
            st.radiant.offerDef = null;
            if (this.defs[RADIANT_QUEST_ID]) delete this.defs[RADIANT_QUEST_ID];
        }
        if (st.activeQuests.length === before) return { ok: false, reason: 'missing' };
        this._persist({ force: true });
        this.refreshHud();
        if (was && was.source === 'radiant' && typeof notify === 'function') {
            notify('أُلغيت مهمة اليوم — عد غداً لصيد جديد', '#aaa');
        }
        return { ok: true };
    },

    _objectivesDone(def, aq) {
        const objs = def.objectives || [];
        if (!objs.length) return true;
        for (let i = 0; i < objs.length; i++) {
            const need = objs[i].count || 1;
            const have = (aq.progress && aq.progress[i]) || 0;
            if (have < need) return false;
        }
        return true;
    },

    /**
     * حدث لعبة: kill | collect | talk
     */
    onEvent(ev) {
        if (!ev || !ev.type) return;
        const st = this.getState();
        if (!st) return;
        const actives = this._sanitizeActive();
        if (!actives.length) return;

        let changed = false;
        for (const aq of actives) {
            const def = this.getDef(aq.id);
            if (!def) continue;
            if (!aq.progress) aq.progress = {};

            (def.objectives || []).forEach((obj, i) => {
                if (!obj || obj.type !== ev.type) return;
                const need = obj.count || 1;
                const have = aq.progress[i] || 0;
                if (have >= need) return;

                if (obj.type === 'kill') {
                    if (obj.enemyId && ev.enemyId !== obj.enemyId) return;
                    if (obj.enemyIds && obj.enemyIds.length && obj.enemyIds.indexOf(ev.enemyId) < 0) return;
                    if (obj.nocturnal && !ev.nocturnal) return;
                    if (obj.minLevel != null && (ev.level || 1) < obj.minLevel) return;
                    aq.progress[i] = have + 1;
                    changed = true;
                } else if (obj.type === 'collect') {
                    if (obj.itemId && ev.itemId !== obj.itemId) return;
                    const add = Math.max(1, ev.amount | 0 || 1);
                    aq.progress[i] = Math.min(need, have + add);
                    changed = true;
                } else if (obj.type === 'talk') {
                    if (obj.npcId && ev.npcId !== obj.npcId) return;
                    aq.progress[i] = need;
                    changed = true;
                }
            });

            if (this._objectivesDone(def, aq)) {
                if (!aq.readyToTurnIn) {
                    aq.readyToTurnIn = true;
                    changed = true;
                    if (typeof notify === 'function') {
                        notify(`✔️ اكتملت: ${def.title}`, '#ffd060');
                    }
                }
            }
        }

        if (changed) {
            this._persist({ force: false });
            this.refreshHud();
        }
    },

    /**
     * تسليم مهمة جاهزة → مكافآت + completedQuests
     */
    turnIn(id) {
        const st = this.getState();
        if (!st) return { ok: false, reason: 'nostate' };
        const aq = (st.activeQuests || []).find(a => a.id === id);
        if (!aq) return { ok: false, reason: 'inactive' };
        const def = this.getDef(id);
        if (!def) return { ok: false, reason: 'unknown' };
        if (!aq.readyToTurnIn && !this._objectivesDone(def, aq)) {
            return { ok: false, reason: 'incomplete' };
        }

        this._applyRewards(def.rewards || {});

        st.activeQuests = st.activeQuests.filter(a => a.id !== id);
        if (!Array.isArray(st.completedQuests)) st.completedQuests = [];
        if (!def.repeatable && st.completedQuests.indexOf(id) < 0) {
            st.completedQuests.push(id);
        }
        if (st.huntBoard) {
            if (st.huntBoard.activeId === id) st.huntBoard.activeId = null;
            if (!Array.isArray(st.huntBoard.completedIds)) st.huntBoard.completedIds = [];
            if (def.source === 'board' && st.huntBoard.completedIds.indexOf(id) < 0) {
                st.huntBoard.completedIds.push(id);
            }
        }
        if (st.radiant && (st.radiant.activeId === id || def.source === 'radiant')) {
            st.radiant.activeId = null;
            st.radiant.lastId = id;
            st.radiant.totalCompleted = (st.radiant.totalCompleted | 0) + 1;
            // أغلِق عرض هذه الفترة — التدوير التالي عند فجر/غسق جديد فقط
            if (!st.radiant.lastPeriod) st.radiant.lastPeriod = getRadiantPeriodKey();
            st.radiant.offerDef = null;
            if (this.defs[RADIANT_QUEST_ID]) delete this.defs[RADIANT_QUEST_ID];
        }

        this._persist({ force: true });
        this.refreshHud();
        if (typeof notify === 'function') {
            notify(`✅ سُلّمت المهمة: ${def.title}`, '#2ecc71');
        }
        if (typeof updateHUD === 'function') updateHUD();
        return { ok: true, def: def };
    },

    _applyRewards(rewards) {
        if (!rewards) return;
        if (rewards.xp && typeof grantXp === 'function' && typeof player !== 'undefined') {
            grantXp(player, rewards.xp);
        } else if (rewards.xp && typeof player !== 'undefined') {
            player.xp = (player.xp || 0) + rewards.xp;
        }
        if (rewards.items && typeof player !== 'undefined' && player.inventory) {
            for (const [k, v] of Object.entries(rewards.items)) {
                player.inventory[k] = (player.inventory[k] || 0) + (v | 0);
            }
            if (typeof GameState !== 'undefined' && GameState.save) {
                GameState.save('inventory', player.inventory);
            } else if (typeof window !== 'undefined' && window.GameState && window.GameState.save) {
                window.GameState.save('inventory', player.inventory);
            }
        }
    },

    /** تلميح HUD عربي — يعرض أول مهمة جاهزة للتسليم أو أول نشطة + العدد */
    getHudHint() {
        const actives = this.getActives();
        if (!actives.length) return '';
        const ready = actives.find(aq => this._isReady(aq));
        const aq = ready || actives[0];
        const def = this.getDef(aq.id);
        if (!def) return '';
        const extra = actives.length > 1 ? ` (+${actives.length - 1})` : '';
        if (this._isReady(aq)) {
            return `مهمة: ${def.title} — جاهزة للتسليم${extra}`;
        }
        const obj = (def.objectives || [])[0];
        if (!obj) return `مهمة: ${def.title}${extra}`;
        const have = (aq.progress && aq.progress[0]) || 0;
        const need = obj.count || 1;
        if (obj.type === 'kill') {
            return `مهمة: ${this._objLabel(obj)} ${have}/${need}${extra}`;
        }
        if (obj.type === 'collect') {
            const name = (typeof ITEM_NAMES !== 'undefined' && ITEM_NAMES[obj.itemId])
                ? ITEM_NAMES[obj.itemId]
                : (obj.itemId || 'غرض');
            return `مهمة: اجمع ${name} ${have}/${need}${extra}`;
        }
        if (obj.type === 'talk') {
            return `مهمة: تحدّث إلى الهدف ${have >= need ? '✓' : '…'}${extra}`;
        }
        return `مهمة: ${def.title} ${have}/${need}${extra}`;
    },

    _sourceLabel(source) {
        if (source === 'giver') return 'حارس البوابة';
        if (source === 'board') return 'لوحة الصيد';
        if (source === 'radiant') return 'مهمة يومية';
        return '';
    },

    /** سطر تقدّم هدف واحد للوحة المهام */
    _progressLine(obj, have) {
        if (!obj) return '';
        const need = obj.count || 1;
        const n = have || 0;
        if (obj.type === 'kill') {
            return `${this._objLabel(obj)} ${n}/${need}`;
        }
        if (obj.type === 'collect') {
            const name = (typeof ITEM_NAMES !== 'undefined' && ITEM_NAMES[obj.itemId])
                ? ITEM_NAMES[obj.itemId]
                : (obj.itemId || 'غرض');
            return `اجمع ${name} ${n}/${need}`;
        }
        if (obj.type === 'talk') {
            return n >= need ? 'تحدّث إلى الهدف ✓' : 'تحدّث إلى الهدف…';
        }
        return `${n}/${need}`;
    },

    /** يحدّث لوحة المهام تحت الخريطة الصغيرة */
    refreshQuestLogPanel() {
        const list = document.getElementById('questLogList');
        if (!list) return;
        const active = this._sanitizeActive();
        if (!active.length) {
            list.innerHTML = '<div class="quest-log-empty">لا توجد مهام مقبولة</div>';
            return;
        }
        list.innerHTML = active.map(aq => {
            const def = this.getDef(aq.id);
            if (!def) return '';
            const ready = !!(aq.readyToTurnIn || this._objectivesDone(def, aq));
            const title = def.title || aq.id;
            const src = this._sourceLabel(aq.source || def.source);
            let progHtml = '';
            if (ready) {
                progHtml = '<div class="quest-log-prog">جاهزة للتسليم</div>';
            } else if (def.objectives && def.objectives.length) {
                progHtml = def.objectives.map((obj, i) => {
                    const have = (aq.progress && aq.progress[i]) || 0;
                    return `<div class="quest-log-prog">${this._progressLine(obj, have)}</div>`;
                }).join('');
            }
            return `<div class="quest-log-item${ready ? ' ready' : ''}">` +
                `<div class="quest-log-name">${title}</div>` +
                progHtml +
                (src ? `<div class="quest-log-src">${src}</div>` : '') +
                `</div>`;
        }).join('');
    },

    refreshHud() {
        const el = document.getElementById('questHudHint');
        if (el) {
            const hint = this.getHudHint();
            if (!hint) {
                el.classList.add('hidden');
                el.textContent = '';
            } else {
                el.textContent = hint;
                el.classList.remove('hidden');
            }
        }
        this.refreshQuestLogPanel();
    },

    // ----- نافذة المهام المشتركة -----

    isModalOpen() {
        const m = document.getElementById('forest-quest-modal');
        return !!(m && m.classList.contains('open'));
    },

    openModal(opts) {
        opts = opts || {};
        const modal = document.getElementById('forest-quest-modal');
        const titleEl = document.getElementById('fqModalTitle');
        const bodyEl = document.getElementById('fqModalBody');
        const actionsEl = document.getElementById('fqModalActions');
        if (!modal || !titleEl || !bodyEl || !actionsEl) return;

        titleEl.textContent = opts.title || 'مهمة';
        bodyEl.innerHTML = opts.bodyHtml || '';
        actionsEl.innerHTML = '';

        const buttons = opts.buttons || [{ label: 'إغلاق', action: 'close', primary: false }];
        buttons.forEach(btn => {
            const b = document.createElement('button');
            b.type = 'button';
            b.className = 'fq-btn' + (btn.primary ? ' fq-btn-primary' : '');
            b.textContent = btn.label;
            b.addEventListener('click', () => {
                if (typeof btn.onClick === 'function') btn.onClick();
                else if (btn.action === 'close') this.closeModal();
            });
            actionsEl.appendChild(b);
        });

        modal.classList.add('open');
        if (typeof gamePaused !== 'undefined') gamePaused = true;
        if (typeof stopIdlePoem === 'function') stopIdlePoem();
    },

    closeModal() {
        const modal = document.getElementById('forest-quest-modal');
        if (modal) modal.classList.remove('open');
        if (typeof craftMenuOpen !== 'undefined' && craftMenuOpen) return;
        if (typeof backpackOpen !== 'undefined' && backpackOpen) return;
        if (typeof sleepMenuOpen !== 'undefined' && sleepMenuOpen) return;
        if (typeof campfireMenuOpen !== 'undefined' && campfireMenuOpen) return;
        if (typeof gamePaused !== 'undefined') gamePaused = false;
    },

    /** عرض تعريف مهمة (قبول / تسليم / معلومات) */
    showQuest(id, mode) {
        mode = mode || 'info';
        const def = this.getDef(id);
        if (!def) return;
        const aq = this.getActiveById(id) || (this.getActive() && this.getActive().id === id ? this.getActive() : null);
        const isActive = !!aq;
        const ready = isActive && this._isReady(aq);

        let progressHtml = '';
        if (isActive && def.objectives) {
            progressHtml = '<ul class="fq-obj-list">' + def.objectives.map((obj, i) => {
                const have = (aq.progress && aq.progress[i]) || 0;
                const need = obj.count || 1;
                const done = have >= need;
                return `<li class="${done ? 'done' : ''}">${this._objLabel(obj)} — ${have}/${need}</li>`;
            }).join('') + '</ul>';
        }

        const bodyHtml =
            `<p class="fq-desc">${def.description || ''}</p>${progressHtml}` +
            (def.rewards && def.rewards.xp
                ? `<p class="fq-reward">المكافأة: ${def.rewards.xp} خبرة` +
                  (def.rewards.items
                      ? ' + ' + Object.entries(def.rewards.items).map(([k, v]) => {
                          const n = (typeof ITEM_NAMES !== 'undefined' && ITEM_NAMES[k]) ? ITEM_NAMES[k] : k;
                          return `${v}× ${n}`;
                      }).join('، ')
                      : '') + '</p>'
                : '');

        const buttons = [];
        if (mode === 'accept' && !isActive && !this.isCompleted(id)) {
            buttons.push({
                label: 'قبول المهمة',
                primary: true,
                onClick: () => {
                    const r = this.accept(id, def.source);
                    if (r.ok) {
                        if (typeof notify === 'function') notify('تم قبول المهمة', '#ffd060');
                        this.closeModal();
                    } else if (r.reason === 'busy') {
                        if (typeof notify === 'function') {
                            notify('وصلت للحد الأقصى من المهام النشطة', '#e74c3c');
                        }
                    } else if (r.reason === 'done') {
                        if (typeof notify === 'function') notify('أنجزت هذا من قبل.', '#aaa');
                    }
                }
            });
        }
        if ((mode === 'turnin' || ready) && isActive && ready) {
            buttons.push({
                label: 'تسليم المهمة',
                primary: true,
                onClick: () => {
                    this.turnIn(id);
                    this.closeModal();
                }
            });
        }
        if (isActive && !ready && def.source === 'radiant') {
            buttons.push({
                label: 'إلغاء مهمة اليوم',
                onClick: () => {
                    this.abandon(id);
                    this.closeModal();
                }
            });
        }
        buttons.push({ label: 'إغلاق', action: 'close' });

        this.openModal({ title: def.title, bodyHtml, buttons });
    },

    _objLabel(obj) {
        if (!obj) return 'هدف';
        if (obj.type === 'kill') {
            if (obj.enemyIds && obj.enemyIds.length) {
                const names = obj.enemyIds.map(id =>
                    (typeof ENEMY_TEMPLATES !== 'undefined' && ENEMY_TEMPLATES[id])
                        ? ENEMY_TEMPLATES[id].name : id
                );
                return `اقتل ${names.join(' / ')}`;
            }
            const name = (typeof ENEMY_TEMPLATES !== 'undefined' && ENEMY_TEMPLATES[obj.enemyId])
                ? ENEMY_TEMPLATES[obj.enemyId].name : (obj.enemyId || 'عدو');
            return `اقتل ${name}`;
        }
        if (obj.type === 'collect') {
            const name = (typeof ITEM_NAMES !== 'undefined' && ITEM_NAMES[obj.itemId])
                ? ITEM_NAMES[obj.itemId] : obj.itemId;
            return `اجمع ${name}`;
        }
        if (obj.type === 'talk') return 'تحدّث';
        return obj.type || 'هدف';
    },

    isBoardCompleted(id) {
        if (this.isCompleted(id)) return true;
        const st = this.getState();
        return !!(st && st.huntBoard && Array.isArray(st.huntBoard.completedIds)
            && st.huntBoard.completedIds.indexOf(id) >= 0);
    },

    getAvailableBoardHunts() {
        const ids = (typeof FOREST_BOARD_HUNTS !== 'undefined')
            ? FOREST_BOARD_HUNTS
            : Object.keys(this.defs).filter(id => {
                const d = this.defs[id];
                return d && d.source === 'board';
            });
        return ids.map(id => this.getDef(id)).filter(d => d && !this.isBoardCompleted(d.id));
    },

    // ----- مهام يومية (TASK_044) -----

    _hydrateRadiantDef() {
        const st = this.getState();
        if (!st || !st.radiant || !st.radiant.offerDef) return null;
        const def = st.radiant.offerDef;
        if (!def || !def.id) return null;
        this.defs[def.id] = def;
        return def;
    },

    getRadiantOfferDef() {
        this._hydrateRadiantDef();
        return this.getDef(RADIANT_QUEST_ID);
    },

    hasRadiantOffer() {
        const st = this.getState();
        if (!st || !st.radiant) return false;
        if (st.radiant.activeId) return false;
        return !!(st.radiant.offerDef && st.radiant.lastId === RADIANT_QUEST_ID);
    },

    /**
     * يضمن عرض مهمة يوم للفترة الحالية (يوم/ليل).
     * لا يعيد التدوير إن وُجدت مهمة نشطة أو عُرضت/أُلغيت في نفس الفترة.
     */
    ensureRadiantOffer() {
        const st = this.getState();
        if (!st) return null;
        if (!st.radiant) {
            st.radiant = {
                lastId: null, lastDayIndex: null, activeId: null,
                lastPeriod: null, totalCompleted: 0, offerDef: null
            };
        }
        const rad = st.radiant;
        const day = getForestDayIndex();
        const period = getRadiantPeriodKey();
        const night = period.indexOf('_night') >= 0;

        // استعادة التعريف المحفوظ في الذاكرة
        if (rad.offerDef && rad.offerDef.id) {
            this.defs[rad.offerDef.id] = rad.offerDef;
        }

        // مهمة نشطة — لا تغيّر العرض
        if (rad.activeId) {
            const aq = this.getActive();
            if (aq && aq.id === rad.activeId) return this.getDef(rad.activeId);
        }

        // نفس الفترة وقد عُرضت مسبقاً (أو أُغلقت بعد تسليم/إلغاء)
        if (rad.lastPeriod === period) {
            if (rad.offerDef) return rad.offerDef;
            return null; // أُنجزت/أُلغيت هذه الفترة — انتظر الفترة التالية
        }

        // فترة جديدة → تدوير واحد فقط (حتى لو فاتت أيام)
        const def = rollRadiantQuest(day, night);
        this.defs[def.id] = def;
        rad.offerDef = def;
        rad.lastId = def.id;
        rad.lastDayIndex = day;
        rad.lastPeriod = period;
        this._persist({ force: false });
        return def;
    },

    /**
     * علامة فوق لوحة الصيد: '!' متاحة · '?' تسليم · '…' قيد التنفيذ · null
     */
    getBoardMarker() {
        const board = this.getActiveBySource('board');
        const radiant = this.getActiveBySource('radiant');
        if ((board && this._isReady(board)) || (radiant && this._isReady(radiant))) return '?';
        if (board || radiant) {
            this.ensureRadiantOffer();
            if (this.canAcceptMore() && (this.hasRadiantOffer() || this.getAvailableBoardHunts().length)) return '!';
            return '…';
        }
        this.ensureRadiantOffer();
        if (this.hasRadiantOffer() || this.getAvailableBoardHunts().length) return '!';
        return null;
    },

    /** نافذة لوحة الصيد — عدة صيود نشطة + قائمة قبول */
    openHuntBoardModal() {
        this.ensureRadiantOffer();

        const readyBoard = this.getActives().find(aq =>
            (aq.source === 'board' || aq.source === 'radiant') && this._isReady(aq));
        if (readyBoard) {
            this.showQuest(readyBoard.id, 'turnin');
            return;
        }

        const hunts = this.getAvailableBoardHunts().filter(d => !this.getActiveById(d.id));
        const radiantDef = this.hasRadiantOffer() ? this.getRadiantOfferDef() : null;
        const activeBoard = this.getActiveBySource('board');
        const activeRadiant = this.getActiveBySource('radiant');

        if (!hunts.length && !radiantDef && !activeBoard && !activeRadiant) {
            this.openModal({
                title: 'لوحة الصيد',
                bodyHtml: `<p class="fq-desc">لا توجد صيود متاحة حالياً. عد عند الفجر أو الغسق لمهمة يوم جديدة.</p>`,
                buttons: [{ label: 'إغلاق', action: 'close', primary: true }]
            });
            return;
        }

        const playerLv = (typeof player !== 'undefined' && player.level) ? player.level : 1;
        let listHtml = '<div class="fq-hunt-list">';

        [activeRadiant, activeBoard].filter(Boolean).forEach(aq => {
            const def = this.getDef(aq.id);
            if (!def) return;
            const have = (aq.progress && aq.progress[0]) || 0;
            const need = (def.objectives && def.objectives[0] && def.objectives[0].count) || 1;
            listHtml +=
                `<div class="fq-hunt-row fq-hunt-active" data-hunt-id="${aq.id}">` +
                `<div class="fq-hunt-badge">${aq.source === 'radiant' ? 'نشطة · يوم' : 'نشطة'}</div>` +
                `<div class="fq-hunt-title">${def.title}</div>` +
                `<div class="fq-hunt-obj">${this._progressLine(def.objectives && def.objectives[0], have)}</div>` +
                `<button type="button" class="fq-btn fq-hunt-progress" data-hunt-id="${aq.id}">عرض</button>` +
                `</div>`;
        });

        if (radiantDef && this.canAcceptMore()) {
            listHtml +=
                `<div class="fq-hunt-row fq-hunt-radiant" data-hunt-id="${radiantDef.id}">` +
                `<div class="fq-hunt-badge">صيد اليوم</div>` +
                `<div class="fq-hunt-title">${radiantDef.title}</div>` +
                `<div class="fq-hunt-obj">${radiantDef.description || ''}</div>` +
                (radiantDef.regionLabel
                    ? `<div class="fq-hunt-region">📍 ${radiantDef.regionLabel}</div>` : '') +
                this._rewardHtml(radiantDef) +
                `<button type="button" class="fq-btn fq-btn-primary fq-hunt-accept" data-hunt-id="${radiantDef.id}" data-source="radiant">قبول</button>` +
                `</div>`;
        }

        hunts.forEach(def => {
            if (!this.canAcceptMore()) return;
            const warn = (def.suggestedLevel && playerLv < def.suggestedLevel)
                ? `<div class="fq-hunt-warn">موصى به: مستوى لاعب ≥ ${def.suggestedLevel}</div>`
                : '';
            const region = def.regionLabel
                ? `<div class="fq-hunt-region">📍 ${def.regionLabel}</div>`
                : '';
            listHtml +=
                `<div class="fq-hunt-row" data-hunt-id="${def.id}">` +
                `<div class="fq-hunt-title">${def.title}</div>` +
                `<div class="fq-hunt-obj">${def.description || ''}</div>` +
                region +
                this._rewardHtml(def) +
                warn +
                `<button type="button" class="fq-btn fq-btn-primary fq-hunt-accept" data-hunt-id="${def.id}" data-source="board">قبول</button>` +
                `</div>`;
        });
        listHtml += '</div>';

        const canMore = this.canAcceptMore();
        this.openModal({
            title: 'لوحة الصيد',
            bodyHtml:
                `<p class="fq-desc">${canMore
                    ? 'يمكنك قبول عدة صيود معاً. سلّمها هنا أو عند الحارس.'
                    : 'وصلت للحد الأقصى من المهام النشطة — سلّم بعضها أولاً.'}</p>${listHtml}`,
            buttons: [{ label: 'إغلاق', action: 'close' }]
        });

        const bodyEl = document.getElementById('fqModalBody');
        if (!bodyEl) return;
        bodyEl.querySelectorAll('.fq-hunt-accept').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = btn.getAttribute('data-hunt-id');
                const src = btn.getAttribute('data-source') || 'board';
                const r = this.accept(id, src);
                if (r.ok) {
                    if (typeof notify === 'function') notify('تم قبول المهمة', '#ffd060');
                    this.closeModal();
                } else if (r.reason === 'busy') {
                    if (typeof notify === 'function') {
                        notify('وصلت للحد الأقصى من المهام النشطة', '#e74c3c');
                    }
                } else if (r.reason === 'done') {
                    if (typeof notify === 'function') notify('أنجزت هذا من قبل.', '#aaa');
                }
            });
        });
        bodyEl.querySelectorAll('.fq-hunt-progress').forEach(btn => {
            btn.addEventListener('click', () => {
                this.showQuest(btn.getAttribute('data-hunt-id'), 'info');
            });
        });
    }
};

if (typeof window !== 'undefined') {
    window.ForestQuests = ForestQuests;
    window.FOREST_QUEST_DEFS = FOREST_QUEST_DEFS;
    window.FOREST_GIVER_CHAIN = FOREST_GIVER_CHAIN;
    window.FOREST_BOARD_HUNTS = FOREST_BOARD_HUNTS;
    window.RADIANT_QUEST_ID = RADIANT_QUEST_ID;
    window.rollRadiantQuest = rollRadiantQuest;
    window.getForestDayIndex = getForestDayIndex;
    window.getRadiantPeriodKey = getRadiantPeriodKey;
}
