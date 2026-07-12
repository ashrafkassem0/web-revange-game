'use strict';

// =========================================================
//  CITY NPCs — إدارة شخصيات ومواطني وحيوانات المدينة (v2)
// =========================================================

// تعريف المواقع ونقاط التوقف للحركة المتجولة بالبكسل
const CityStops = [
    { name: 'الحداد', x: 3 * 48, y: 5.5 * 48 },
    { name: 'المعالج', x: 7 * 48, y: 5.5 * 48 },
    { name: 'التاجر', x: 11.5 * 48, y: 5.5 * 48 },
    { name: 'مكتبة الهمس', x: 16 * 48, y: 5.5 * 48 },
    { name: 'أكاديمية الكشافة', x: 20 * 48, y: 5.5 * 48 },
    { name: 'الساحة المركزية', x: 11 * 48, y: 10.5 * 48 },
    { name: 'البئر', x: 11 * 48, y: 8.5 * 48 },
    { name: 'مخبز الأرانب', x: 20 * 48, y: 15.5 * 48 },
    { name: 'الحي الجنوبي', x: 11 * 48, y: 13.5 * 48 }
];

// دالة لتغليف دمج حوارات الشخصيات الثابتة
function handleNpcTalk(npcId, serviceOpenFn) {
    if (window.CityDialogue && typeof window.CityDialogue.openNpcIntro === 'function') {
        window.CityDialogue.openNpcIntro(npcId, serviceOpenFn);
    } else {
        console.warn(`CityDialogue غير جاهز لفتح حوار الشخصية: ${npcId}`);
    }
}

// تهيئة كائن المشاة والشخصيات بالكامل استناداً للمكتبة الأساسية
const CityNPCs = new BaseNPCManager({
    // 1. الشخصيات الثابتة وتفاعلاتها
    npcs: [
        {
            id: 'blacksmith',
            x: 3 * 48, y: 5.5 * 48,
            emoji: '⚒️', label: 'الحداد',
            color: '#a06020', radius: 20, interactRange: 55,
            onInteract() { handleNpcTalk('blacksmith', () => window.CityDialogue.openBlacksmith()); }
        },
        {
            id: 'healer',
            x: 7 * 48, y: 5.5 * 48,
            emoji: '🧑‍⚕️', label: 'المعالج',
            color: '#2080a0', radius: 20, interactRange: 55,
            onInteract() { handleNpcTalk('healer', () => window.CityDialogue.openHealer()); }
        },
        {
            id: 'merchant',
            x: 11.5 * 48, y: 5.5 * 48,
            emoji: '🧑‍💼', label: 'التاجر',
            color: '#8060a0', radius: 20, interactRange: 55,
            onInteract() { handleNpcTalk('merchant', () => window.CityDialogue.openMerchant()); }
        },
        {
            id: 'librarian',
            x: 16 * 48, y: 5.5 * 48,
            emoji: '🦉', label: 'البومة أمينة المكتبة',
            color: '#a05580', radius: 20, interactRange: 55,
            onInteract() { handleNpcTalk('librarian', () => window.CityDialogue.openBookstore()); }
        },
        {
            id: 'ranger_mentor',
            x: 20 * 48, y: 5.5 * 48,
            emoji: '🦅', label: 'المرشد رعد',
            color: '#b5a03a', radius: 20, interactRange: 55,
            onInteract() { handleNpcTalk('ranger_mentor', () => window.CityDialogue.openAcademy()); }
        },
        {
            id: 'baker',
            x: 20 * 48, y: 15.5 * 48,
            emoji: '🐰', label: 'الخباز شوشو',
            color: '#df7b40', radius: 20, interactRange: 55,
            onInteract() { handleNpcTalk('baker', () => window.CityDialogue.openBakery()); }
        }
    ],

    // 2. نقاط التوقف المشتركة لحركات المشاة
    stops: CityStops,

    // 3. المواطنون والحيوانات المتجولون
    walkers: [
        // مواطنون
        { name: 'سالم', emoji: '🧑', color: '#6a7a9a', x: CityStops[0].x, y: CityStops[0].y, speed: 0.048 },
        { name: 'ليلى', emoji: '👩', color: '#9a7a6a', x: CityStops[2].x, y: CityStops[2].y, speed: 0.042 },
        { name: 'عمر', emoji: '👦', color: '#7a9a6a', x: CityStops[5].x, y: CityStops[5].y, speed: 0.052 },
        { name: 'مريم', emoji: '🧕', color: '#96704f', x: CityStops[3].x, y: CityStops[3].y, speed: 0.038 },
        
        // حيوانات لطيفة أليفة للتفاعل
        { name: 'الجرو بوب', emoji: '🐶', color: '#c49a6c', x: CityStops[5].x + 30, y: CityStops[5].y + 30, speed: 0.035 },
        { name: 'القطة ميمي', emoji: '🐱', color: '#dfb893', x: CityStops[7].x - 20, y: CityStops[7].y, speed: 0.03 },
        
        // حمام متطاير حول الساحة والنافورة
        { name: 'حمامة', emoji: '🐦', color: '#90a4ae', x: CityStops[6].x - 15, y: CityStops[6].y + 10, speed: 0.06 }
    ],

    // 4. الحوارات العشوائية بين المواطنين المشتقة من قاعدة البيانات
    dialoguePairs: (typeof CityData !== 'undefined') ? CityData.CITIZEN_CONVERSATIONS : [
        ['أهلاً بك في ساحتنا!', 'شكراً لك، الجو جميل اليوم.']
    ]
});

/**
 * دالة لتشغيل حوار خاص بالحيوانات الأليفة عند تفاعل اللاعب معها في المدى القريب
 * @param {Object} walker - كائن الكلب أو القطة
 */
function interactWithAnimal(walker) {
    if (!walker) return;
    if (typeof window.CityDialogue === 'undefined' || !window.CityDialogue.openAnimalModal) {
        console.warn('CityDialogue غير متوفر لرسم تفاعلات الحيوان.');
        return;
    }
    window.CityDialogue.openAnimalModal(walker);
}

/**
 * دالة إضافية لتحديث هروب حمام الساحة عند اقتراب اللاعب منها بسرعة
 * @param {number} playerX - إحداثيات اللاعب X
 * @param {number} playerY - إحداثيات اللاعب Y
 */
function updatePigeonsFlight(playerX, playerY) {
    for (const w of CityNPCs.walkers) {
        if (w.emoji === '🐦') {
            const dist = Math.hypot(playerX - w.x, playerY - w.y);
            if (dist < 42 && Math.random() < 0.15) {
                // الحمامة تفزع وتطير بسرعة بعيداً لجهة عشوائية
                w.state = 'walking';
                const escapeAngle = Math.random() * Math.PI * 2;
                w.x += Math.cos(escapeAngle) * 60;
                w.y += Math.sin(escapeAngle) * 60;
                w.bubble = '🕊️ طار!';
                w.bubbleUntil = performance.now() + 1000;
            }
        }
    }
}

// دمج الدوال الإضافية وحالة التصدير العام
if (typeof window !== 'undefined') {
    window.CityNPCs = CityNPCs;
    window.interactWithAnimal = interactWithAnimal;
    window.updatePigeonsFlight = updatePigeonsFlight;
}
