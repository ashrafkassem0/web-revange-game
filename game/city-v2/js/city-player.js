'use strict';

// =========================================================
//  CITY PLAYER — حركة اللاعب، التصادم، ورسم المعدات المصنوعة (v2)
// =========================================================

const CityPlayer = {
    /**
     * تحديث حركة وموضع اللاعب بناءً على أزرار الاتجاهات
     * يدعم الانزلاق على الجدران وحل التصادمات قطرياً
     * @param {number} dt - فرق الزمن بالملي ثانية
     * @param {Object} keys - أزرار لوحة المفاتيح المضغوطة حالياً
     */
    update(dt, keys) {
        // التحقق من عدم فتح النوافذ المنبثقة أو الحوارات التي توقف حركة اللاعب
        const modal = document.getElementById('modal');
        if (modal && modal.classList.contains('open')) {
            CityState.player.isMoving = false;
            CityState.player.walkTimer = 0;
            return;
        }

        let dx = 0;
        let dy = 0;
        const player = CityState.player;

        // التقاط المدخلات (WASD أو أزرار الأسهم)
        if (keys['w'] || keys['W'] || keys['ArrowUp']) {
            dy -= 1;
            player.facing = 'up';
        }
        if (keys['s'] || keys['S'] || keys['ArrowDown']) {
            dy += 1;
            player.facing = 'down';
        }
        if (keys['a'] || keys['A'] || keys['ArrowLeft']) {
            dx -= 1;
            player.facing = 'left';
        }
        if (keys['d'] || keys['D'] || keys['ArrowRight']) {
            dx += 1;
            player.facing = 'right';
        }

        player.isMoving = (dx !== 0 || dy !== 0);

        if (player.isMoving) {
            // تطبيع السرعة القطرية (عند الضغط على زرين معاً)
            if (dx !== 0 && dy !== 0) {
                dx *= 0.7071;
                dy *= 0.7071;
            }

            const config = window.CityConfig || { TILE_SIZE: 48, WORLD_W: 1056, WORLD_H: 864, PLAYER_SPEED: 2.8 };
            const speed = config.PLAYER_SPEED;

            // حساب الموضع الجديد المؤقت
            const nextX = Math.max(14, Math.min(config.WORLD_W - 14, player.x + dx * speed));
            const nextY = Math.max(14, Math.min(config.WORLD_H - 14, player.y + dy * speed));

            // تصادم منفصل لكل محور لتسهيل الانزلاق على جوانب المباني والعوائق
            const isColliding = (x, y) => {
                if (window.CityMap && typeof window.CityMap.isBlocked === 'function') {
                    // المبنى (نوع 2) مسدود دائماً
                    return window.CityMap.isBlocked(x, y, [2]);
                }
                return false;
            };

            if (!isColliding(nextX, player.y)) {
                player.x = nextX;
            }
            if (!isColliding(player.x, nextY)) {
                player.y = nextY;
            }

            player.walkTimer += dt;
        } else {
            player.walkTimer = 0;
        }
    },

    /**
     * رسم البطل بجسده وألوانه وعتاده المصنوع في الغابة
     * @param {CanvasRenderingContext2D} ctx - سياق رسم اللعبة الأساسي
     */
    draw(ctx) {
        const player = CityState.player;
        const { x, y, walkTimer, isMoving } = player;

        // حساب اهتزاز الأرجل أثناء المشي
        const t = walkTimer * 0.008;
        const swing = isMoving ? Math.sin(t) * 3 : 0;

        // جلب العناصر المصنوعة من نظام الحفظ والتخزين العام لتحديث المظهر
        let crafted = {};
        if (typeof GameState !== 'undefined' && typeof GameState.getCraftedItems === 'function') {
            crafted = GameState.getCraftedItems() || {};
        }

        ctx.save();

        // 1. رسم الظل البيضاوي أسفل القدمين
        ctx.fillStyle = 'rgba(0, 0, 0, 0.22)';
        ctx.beginPath();
        ctx.ellipse(x, y + 14, 12, 5, 0, 0, Math.PI * 2);
        ctx.fill();

        // 2. رسم الساقين والقدمين
        ctx.fillStyle = '#2a2040'; // لون الحذاء/السروال
        ctx.fillRect(x - 6, y + 2, 5, 12 + swing);
        ctx.fillRect(x + 1, y + 2, 5, 12 - swing);

        // 3. رسم الجزء العلوي من الجسد (القميص والدرع)
        ctx.fillStyle = '#e8c88a'; // لون البشرة للرقبة
        ctx.fillRect(x - 9, y - 12, 18, 16);

        // تبديل لون ولون حافة الدرع بناءً على دروع الكشافة المصنوعة
        if (crafted.shadowArmor) {
            ctx.fillStyle = '#2b1b3d'; // درع الظلال الأرجواني المعتم
            ctx.fillRect(x - 8, y - 8, 16, 10);
            ctx.strokeStyle = '#8a5aff'; 
            ctx.lineWidth = 1;
            ctx.strokeRect(x - 8, y - 8, 16, 10);
        } else if (crafted.leatherArmor) {
            ctx.fillStyle = '#7b542d'; // الدرع الجلدي البني الكلاسيكي
            ctx.fillRect(x - 8, y - 8, 16, 10);
            ctx.strokeStyle = '#d6a55a'; 
            ctx.lineWidth = 1;
            ctx.strokeRect(x - 8, y - 8, 16, 10);
        } else {
            ctx.fillStyle = '#3060a0'; // قميص أزرق افتراضي للمبتدئين
            ctx.fillRect(x - 8, y - 8, 16, 10);
        }

        // حزام الخصر البني
        ctx.fillStyle = '#60401a';
        ctx.fillRect(x - 9, y + 3, 18, 3);

        // 4. رسم الرأس والوجه والشعر
        ctx.fillStyle = '#e8c28a'; // لون البشرة الأساسي للوجه
        ctx.beginPath();
        ctx.ellipse(x, y - 18, 11, 10, 0, 0, Math.PI * 2);
        ctx.fill();

        // شعر بني محكم
        ctx.fillStyle = '#603010';
        ctx.beginPath();
        ctx.ellipse(x, y - 24, 10, 6, 0, Math.PI, Math.PI * 2);
        ctx.fill();

        // العينين الداكنتين اللطيفتين
        ctx.fillStyle = '#201008';
        ctx.beginPath();
        ctx.arc(x - 4, y - 17, 2, 0, Math.PI * 2);
        ctx.arc(x + 4, y - 17, 2, 0, Math.PI * 2);
        ctx.fill();

        // 5. رسم السلاح المجهز باليد اليمنى للبطل الصغير
        // يدعم رسم السيف أو الرمح أو نصل الليل السحري بالتطابق التام مع الغابة
        if (crafted.hornSword || crafted.nightBlade) {
            // رسم النصل باللون الفضي أو البنفسجي المضيء
            ctx.strokeStyle = crafted.nightBlade ? '#a883ff' : '#d6d6d6';
            ctx.lineWidth = 3;
            ctx.lineCap = 'round';
            ctx.beginPath();
            ctx.moveTo(x + 10, y - 4);
            ctx.lineTo(x + 17, y - 16);
            ctx.stroke();

            // قبضة ومقبض السيف الخشبي
            ctx.strokeStyle = '#8a5a2a';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(x + 8, y - 4);
            ctx.lineTo(x + 13, y + 1);
            ctx.stroke();
        } else if (crafted.hornSpear) {
            // رسم رمح القرون الخشبي الطويل
            ctx.strokeStyle = '#b98a4b';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(x + 9, y + 8);
            ctx.lineTo(x + 19, y - 18);
            ctx.stroke();

            // رأس الرمح الفضي
            ctx.fillStyle = '#ddd';
            ctx.beginPath();
            ctx.moveTo(x + 19, y - 20);
            ctx.lineTo(x + 23, y - 13);
            ctx.lineTo(x + 16, y - 14);
            ctx.closePath();
            ctx.fill();
        }

        // 6. رسم هالة سحرية مؤقتة تدور حول اللاعب عند رمي قطعة نقدية في نافورة الأمنيات
        if (player.fountainBuffActive && Date.now() < player.fountainBuffUntil) {
            const rot = (Date.now() * 0.003) % (Math.PI * 2);
            ctx.strokeStyle = 'rgba(100, 255, 200, 0.6)';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.arc(x, y - 6, 25 + Math.sin(Date.now() * 0.005) * 3, 0, Math.PI * 2);
            ctx.stroke();

            // رسم شرارات سحرية تدور
            for (let i = 0; i < 3; i++) {
                const spAngle = rot + (i * Math.PI * 2) / 3;
                const spX = x + Math.cos(spAngle) * 25;
                const spY = y - 6 + Math.sin(spAngle) * 25;
                ctx.fillStyle = '#ffd060';
                ctx.beginPath();
                ctx.arc(spX, spY, 2, 0, Math.PI * 2);
                ctx.fill();
            }
        }

        ctx.restore();
    }
};

// تصدير كائن اللاعب للنطاق العام للمستعرض
if (typeof window !== 'undefined') {
    window.CityPlayer = CityPlayer;
}
