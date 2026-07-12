'use strict';

// =========================================================
//  CITY BUILDINGS — رسم المباني والمعالم الحضرية للأطفال (v2)
// =========================================================

const CityBuildings = {
    // قائمة تعريفات المباني وتنسيق مواقعها بالخريطة وألوانها وعناوينها
    BUILDING_DEFS: [
        // الصف العلوي (حي الخدمات والتجارة)
        { id: 'blacksmith', c: 1,  r: 2,  w: 4, h: 3, color: '#604828', label: '⚒️ الحداد',         npcId: 'blacksmith' },
        { id: 'healer',     c: 5,  r: 2,  w: 4, h: 3, color: '#284860', label: '🏥 صيدلية المعالج',  npcId: 'healer' },
        { id: 'merchant',   c: 9,  r: 2,  w: 5, h: 3, color: '#284828', label: '🛒 متجر المقايضة',  npcId: 'merchant' },
        { id: 'bookstore',  c: 14, r: 2,  w: 4, h: 3, color: '#482848', label: '📚 مكتبة الهمس',    npcId: 'librarian' }, // بديل النزل
        { id: 'academy',    c: 18, r: 2,  w: 4, h: 3, color: '#483020', label: '🏹 أكاديمية الكشافة',npcId: 'ranger_mentor' }, // بديل المكتبة المكررة

        // الصف السفلي (الحي الجنوبي والمهن)
        { id: 'farm',       c: 1,  r: 14, w: 4, h: 2, color: '#405030', label: '🌾 مزرعة المدينة',   npcId: null },
        { id: 'artisan',    c: 5,  r: 14, w: 4, h: 2, color: '#503040', label: '🏺 الحرفي الصغير',   npcId: null },
        { id: 'scholar',    c: 14, r: 14, w: 4, h: 2, color: '#304050', label: '⚗️ المختبر العلمي',   npcId: null },
        { id: 'bakery',     c: 18, r: 14, w: 4, h: 2, color: '#b55838', label: '🧁 مخبز الأرانب',     npcId: 'baker' } // بديل الحانة
    ],

    /**
     * رسم جميع معالم ومباني المدينة مع التظليل واليافطات والأنوار الليلية
     * @param {CanvasRenderingContext2D} ctx - سياق رسم اللعب الأساسي
     * @param {number} tileSize - حجم البلاطة بالبكسل
     * @param {number} nightRatio - نسبة الظلام الحالية (0..1)
     */
    draw(ctx, tileSize, nightRatio) {
        ctx.save();

        for (const b of this.BUILDING_DEFS) {
            const bx = b.c * tileSize;
            const by = b.r * tileSize;
            const bw = b.w * tileSize;
            const bh = b.h * tileSize;

            // 1. رسم الظل الخارجي للمبنى لإعطاء بعد ثلاثي
            ctx.fillStyle = 'rgba(0, 0, 0, 0.24)';
            ctx.fillRect(bx + 6, by + 8, bw, bh);

            // 2. رسم الهيكل الرئيسي للمبنى (الجدران)
            ctx.fillStyle = b.color;
            ctx.fillRect(bx, by + 12, bw, bh - 12);

            // 3. رسم السقف المثلثي اللطيف المظلل
            ctx.fillStyle = 'rgba(255, 255, 255, 0.12)';
            ctx.beginPath();
            ctx.moveTo(bx - 4, by + 12);
            ctx.lineTo(bx + bw / 2, by - 6);
            ctx.lineTo(bx + bw + 4, by + 12);
            ctx.closePath();
            ctx.fill();

            // رسم بلاط السقف الخشبي الإجرائي
            ctx.fillStyle = 'rgba(20, 12, 8, 0.22)';
            for (let tx = bx + 8; tx < bx + bw; tx += 16) {
                ctx.fillRect(tx, by + 14, 10, 3);
                ctx.fillRect(tx + 5, by + 22, 10, 3);
            }

            // 4. رسم مظلة المحل الملونة (Awning) فوق النوافذ
            ctx.fillStyle = 'rgba(15, 18, 18, 0.48)';
            ctx.fillRect(bx + 6, by + bh - 29, bw - 12, 5);
            ctx.fillStyle = 'rgba(255, 208, 96, 0.12)';
            ctx.fillRect(bx + 6, by + bh - 24, bw - 12, 4);

            // 5. رسم الباب الخشبي الداكن
            ctx.fillStyle = '#2d1b0d';
            ctx.fillRect(bx + bw / 2 - 7, by + bh - 18, 14, 18);
            // مقبض ذهبي صغير للباب
            ctx.fillStyle = '#dfab40';
            ctx.fillRect(bx + bw / 2 + 3, by + bh - 9, 2, 2);

            // 6. رسم النوافذ المضيئة (تشتد إضاءتها ليلاً بوهج دافئ)
            // إضافة اهتزاز لطيف لضوء النوافذ ليحاكي قنديل الزيت أو الشموع
            const windowFlicker = 0.88 + Math.sin(Date.now() * 0.007) * 0.12;
            const windowAlpha = Math.max(0.40, 0.40 + nightRatio * 0.50) * windowFlicker;
            
            ctx.fillStyle = `rgba(255, 220, 100, ${windowAlpha})`;
            ctx.fillRect(bx + 14, by + bh - 22, 12, 9);
            ctx.fillRect(bx + bw - 26, by + bh - 22, 12, 9);

            // إطارات النوافذ الخشبية الداكنة
            ctx.strokeStyle = 'rgba(45, 30, 16, 0.75)';
            ctx.lineWidth = 1;
            ctx.strokeRect(bx + 14, by + bh - 22, 12, 9);
            ctx.strokeRect(bx + bw - 26, by + bh - 22, 12, 9);

            // 7. يافطة المتجر الذهبية ذات خط عريض ومقروء للأطفال
            const labelText = b.label;
            const signW = Math.min(bw - 18, Math.max(86, labelText.length * 10 + 26));
            const signY = by + bh / 2 - 8;

            ctx.fillStyle = 'rgba(18, 14, 10, 0.86)';
            ctx.strokeStyle = 'rgba(255, 208, 96, 0.65)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.roundRect(bx + bw / 2 - signW / 2, signY, signW, 23, 5);
            ctx.fill();
            ctx.stroke();

            // رسم النص بمنتصف اليافطة باللغة العربية
            ctx.font = 'bold 13px Cairo';
            ctx.fillStyle = '#ffe49a';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(labelText, bx + bw / 2, signY + 12);
            ctx.textBaseline = 'alphabetic'; // إعادة الحالة الافتراضية لقلم الرسم
        }

        ctx.restore();
    }
};

// تصدير كائن المباني
if (typeof window !== 'undefined') {
    window.CityBuildings = CityBuildings;
}
