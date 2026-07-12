'use strict';

// =========================================================
//  CITY MAP — خريطة وتضاريس مدينة ريفنج المطورة (v2)
// =========================================================

// تخطيط خريطة المدينة الثابتة (22 عمود × 18 صف)
// B=مبنى مسدود، S=بلاط حجري، R=طريق ممهد، G=عشب أخضر، W=بقعة ماء، D=تراب ورمل البوابات
const CITY_MAP_LAYOUT_STR = [
    'BBBBBBBBBBBBBBBBBBBBBB',
    'BSSSSSSSSSSSSSSSSSSSBB',
    'BSBBBSBBBSBBBSBBBSBBB',
    'BSBBBSBBBSBBBSBBBSBBB',
    'BSBBBSBBBSBBBSBBBSBBB',
    'BSSSSSRRRRRRRRRSSSSSBB',
    'BSGGGGSRGGGGGGRSGGGBB',
    'BSGGGGSRGGGGGGRSGGGBB',
    'BSRRSSSSSSWWSSSSSSRRSB',
    'BSRRSSSSSSSSSSSSSSRRSB',
    'BSRRSSSSSSSSSSSSSSRRSB',
    'BSRRRRRRSSSSSSRRRRRRSB',
    'BSSSSSSSRGGGGGRSSSSSSB',
    'BSRRRRRRRGGGGGRRRRRRSB',
    'BSBBBSBBSSSSSSBBBSBBB',
    'BSBBBSBBSSSSSSBBBSBBB',
    'BSSSSSSSDDDDDDDSSSSSSB',
    'BBBBBBBDDDDDDDDBBBBBBB'
];

// دالة تفصيلية لتحويل الحروف إلى قيم البلاطات الرقمية المتوافقة مع CityConfig
const CHAR_TO_TILE_TYPE = {
    'S': 0, // STONE
    'R': 1, // ROAD
    'B': 2, // BUILDING
    'G': 3, // GRASS
    'W': 4, // WATER
    'D': 5  // SAND
};

const CityMapLayout = CITY_MAP_LAYOUT_STR.map(row => 
    [...row].map(char => CHAR_TO_TILE_TYPE[char] !== undefined ? CHAR_TO_TILE_TYPE[char] : 0)
);

// تهيئة مدير التضاريس الموروث من الكائن الأساسي BaseTerrainManager
const CityMap = new BaseTerrainManager({
    cols: 22,
    rows: 18,
    tileSize: 48,
    layout: CityMapLayout,
    defaultBlockTile: 2 // المباني هي الحدود الافتراضية
});

/**
 * دالة تفصيلية لحساب قيم عشوائية تعتمد على شبكة الإحداثيات (deterministic noise)
 */
function tileHash(c, r, s) {
    return Math.abs(Math.sin(c * 127.1 * (s || 1) + r * 311.7)) % 1;
}

/**
 * دالة الرسم المخصصة لرسم الأنماط الصورية والطبقات الحجرية والبريك للمدينة
 * @param {CanvasRenderingContext2D} tc - سياق رسم قماش التضاريس المسبق
 * @param {BaseTerrainManager} map - كائن التضاريس الحالي
 */
function renderCityTiles(tc, map) {
    const ts = map.tileSize;
    
    for (let r = 0; r < map.rows; r++) {
        for (let c = 0; c < map.cols; c++) {
            const t = map.getTile(c, r);
            const tx = c * ts;
            const ty = r * ts;
            
            // استخراج بذور عشوائية ثابتة للبلاطة الحالية للمظهر غير المتماثل
            const s1 = tileHash(c, r, 1);
            const s2 = tileHash(c, r, 2);
            const s3 = tileHash(c, r, 3);

            if (t === 2) { // BUILDING
                // رسم جدار قرميدي داكن
                const gv = 55 + Math.floor(s1 * 15);
                tc.fillStyle = `rgb(${gv}, ${gv - 4}, ${gv - 8})`;
                tc.fillRect(tx, ty, ts + 1, ts + 1);
                
                tc.strokeStyle = 'rgba(30, 28, 24, 0.45)';
                tc.lineWidth = 1;
                const bh = ts / 3;
                
                // رسم الخطوط الأفقية والعمودية للطوب
                for (let i = 0; i < 3; i++) {
                    tc.beginPath();
                    tc.moveTo(tx, ty + i * bh);
                    tc.lineTo(tx + ts, ty + i * bh);
                    tc.stroke();
                    
                    const off = (i % 2 === 0) ? ts / 2 : 0;
                    tc.beginPath();
                    tc.moveTo(tx + off, ty + i * bh);
                    tc.lineTo(tx + off, ty + (i + 1) * bh);
                    tc.stroke();
                }
            } 
            else if (t === 0) { // STONE
                // بلاط حجري رمادي فاتح
                tc.fillStyle = `rgb(${140 + Math.floor(s1 * 12)}, ${138 + Math.floor(s2 * 10)}, ${128 + Math.floor(s3 * 10)})`;
                tc.fillRect(tx, ty, ts + 1, ts + 1);
                
                tc.strokeStyle = 'rgba(100, 95, 85, 0.35)';
                tc.lineWidth = 1;
                tc.strokeRect(tx + 0.5, ty + 0.5, ts - 1, ts - 1);
            } 
            else if (t === 1) { // ROAD
                // طريق ترابي ممهد مقسم لنصفين
                tc.fillStyle = `rgb(${100 + Math.floor(s1 * 10)}, ${95 + Math.floor(s2 * 8)}, ${80 + Math.floor(s3 * 8)})`;
                tc.fillRect(tx, ty, ts + 1, ts + 1);
                
                tc.strokeStyle = 'rgba(60, 55, 45, 0.4)';
                tc.lineWidth = 0.8;
                tc.strokeRect(tx + 2, ty + 2, ts / 2 - 2, ts - 4);
                tc.strokeRect(tx + ts / 2, ty + 2, ts / 2 - 2, ts - 4);
            } 
            else if (t === 3) { // GRASS
                // عشب أخضر ناعم
                tc.fillStyle = '#3a8228';
                tc.fillRect(tx, ty, ts + 1, ts + 1);
            } 
            else if (t === 4) { // WATER
                // بقعة ماء زرقاء داكنة
                tc.fillStyle = '#0e5ab5';
                tc.fillRect(tx, ty, ts + 1, ts + 1);
            } 
            else if (t === 5) { // SAND
                // رمل ذهبي ناعم للبوابات والمنافذ
                tc.fillStyle = '#c4a03a';
                tc.fillRect(tx, ty, ts + 1, ts + 1);
            }
        }
    }

    // إضفاء بعض التفاصيل الدقيقة (أزهار برية ونقاط عشوائية) فوق العشب الطبيعي
    for (let r = 0; r < map.rows; r++) {
        for (let c = 0; c < map.cols; c++) {
            const t = map.getTile(c, r);
            if (t !== 3) continue; // تفاصيل العشب فقط

            const tx = c * ts;
            const ty = r * ts;
            const s1 = tileHash(c, r, 1);
            const s2 = tileHash(c, r, 2);
            const s3 = tileHash(c, r, 3);
            
            // توليد أزهار صفراء أو وردية مبعثرة بنسبة 12%
            if (s1 > 0.88) {
                tc.fillStyle = s2 > 0.5 ? 'rgba(255, 230, 50, 0.70)' : 'rgba(255, 120, 160, 0.62)';
                tc.beginPath();
                tc.arc(tx + s2 * ts, ty + s3 * ts, 1.5, 0, Math.PI * 2);
                tc.fill();
            }
        }
    }
}

/**
 * دالة تحميل الأنسجة الطبيعية تمهيداً للرسم
 * @param {Function} onComplete - الاستدعاء بعد تحميل الأنسجة بنجاح
 */
function loadCityTextures(onComplete) {
    const textureNames = ['grass', 'water', 'sand'];
    const loaded = {};
    let pending = textureNames.length;
    
    textureNames.forEach(name => {
        const img = new Image();
        img.onload = () => {
            loaded[name] = img;
            if (--pending === 0) onComplete(loaded);
        };
        img.onerror = () => {
            // نتابع العمل حتى لو فشل تحميل النسيج بالاعتماد على التلوين الإجرائي
            console.warn(`فشل تحميل نسيج التضاريس: ${name}`);
            if (--pending === 0) onComplete(loaded);
        };
        img.src = `../textures/${name}.png`;
    });
}

/**
 * تهيئة التضاريس بشكل كامل للمدينة
 * @param {Function} onReady - عند اكتمال التهيئة والرسم المسبق
 */
function initCityMap(onReady) {
    loadCityTextures(textures => {
        // تمرير دالة التلوين الإجرائي والأنسجة لمدير التضاريس الموروث
        CityMap.prerenderTerrain(textures, renderCityTiles);
        if (onReady) onReady();
    });
}

// تصدير الكائن والدوال للنطاق العام للمتصفح
if (typeof window !== 'undefined') {
    window.CityMap = CityMap;
    window.initCityMap = initCityMap;
}
