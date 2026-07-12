'use strict';

// =========================================================
//  CITY RENDERER — تنسيق طبقات الرسم البصري والجماليات (v2)
// =========================================================

const CityRenderer = {
    /**
     * رسم البئر الزخرفي في وسط المدينة
     */
    drawWell(ctx) {
        const config = window.CityConfig;
        if (!config) return;
        const { x, y } = config.WELL;

        ctx.save();
        // ظل البئر على الأرض
        ctx.fillStyle = 'rgba(0,0,0,0.2)';
        ctx.beginPath();
        ctx.ellipse(x, y + 6, 22, 10, 0, 0, Math.PI * 2);
        ctx.fill();

        // جسم البئر الحجري السفلي
        ctx.fillStyle = '#7a7060';
        ctx.beginPath();
        ctx.ellipse(x, y + 4, 20, 9, 0, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#5a5040';
        ctx.beginPath();
        ctx.ellipse(x, y, 18, 8, 0, 0, Math.PI * 2);
        ctx.fill();

        // فوهة الماء الزرقاء بالبئر
        ctx.fillStyle = '#1a80b0';
        ctx.beginPath();
        ctx.ellipse(x, y - 2, 13, 5, 0, 0, Math.PI * 2);
        ctx.fill();

        // أعمدة خشبية لحمل البكرة
        ctx.fillStyle = '#5a3010';
        ctx.fillRect(x - 16, y - 18, 4, 20);
        ctx.fillRect(x + 12, y - 18, 4, 20);

        // العارضة الخشبية العلوية
        ctx.fillStyle = '#7a4018';
        ctx.fillRect(x - 18, y - 20, 36, 4);

        // يافطة البئر الصغيرة
        ctx.font = 'bold 9px Cairo';
        ctx.fillStyle = '#ccc';
        ctx.textAlign = 'center';
        ctx.fillText('🪣 بئر الماء', x, y - 24);
        ctx.restore();
    },

    /**
     * رسم نافورة الأمنيات التفاعلية بساحة المدينة
     */
    drawFountain(ctx) {
        const config = window.CityConfig;
        if (!config) return;
        const { x, y, radius } = config.FOUNTAIN;
        const player = CityState.player;

        const near = Math.hypot(player.x - x, player.y - y) < 65;
        const pulse = 0.85 + Math.sin(Date.now() * 0.003) * 0.15;

        ctx.save();
        // ظل النافورة
        ctx.fillStyle = 'rgba(0,0,0,0.22)';
        ctx.beginPath();
        ctx.arc(x, y + 4, radius + 2, 0, Math.PI * 2);
        ctx.fill();

        // حواف الحجر للنافورة
        ctx.fillStyle = '#8a8070';
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = '#ffd060';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // مياه النافورة الزرقاء المتحركة
        ctx.fillStyle = `rgba(30, 160, 220, ${0.72 + pulse * 0.08})`;
        ctx.beginPath();
        ctx.arc(x, y - 2, radius - 6, 0, Math.PI * 2);
        ctx.fill();

        // تموجات الماء الداخلية
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.45)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(x, y - 2, (radius - 12) * pulse, 0, Math.PI * 2);
        ctx.stroke();

        // فوهة خروج الماء بالوسط
        ctx.fillStyle = '#5a5040';
        ctx.beginPath();
        ctx.arc(x, y - 2, 6, 0, Math.PI * 2);
        ctx.fill();

        // يافطة النافورة
        ctx.font = 'bold 9px Cairo';
        ctx.fillStyle = '#ffd060';
        ctx.textAlign = 'center';
        ctx.fillText('⛲ نافورة الأمنيات', x, y - radius - 8);

        // تلميح تفاعل رمي العملة للأطفال
        if (near) {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.65)';
            ctx.beginPath();
            ctx.roundRect(x - 55, y - 48, 110, 18, 5);
            ctx.fill();
            
            ctx.fillStyle = '#ffd060';
            ctx.font = 'bold 9px Cairo';
            ctx.fillText('اضغط [E] للتمني 🪙', x, y - 35);
        }

        ctx.restore();
    },

    /**
     * رسم البوابة الشمالية المؤدية للغابة (Forest Portal)
     */
    drawNorthGate(ctx) {
        const config = window.CityConfig;
        if (!config) return;
        const { x, y, radius } = config.FOREST_PORTAL;
        const player = CityState.player;
        const near = window.CityPortals
            ? CityPortals.isNearPortal(config.FOREST_PORTAL)
            : Math.hypot(player.x - x, player.y - y) < radius;
        const pulse = 0.85 + Math.sin(Date.now() * 0.0025) * 0.15;

        ctx.save();
        // طريق تمهيدي أسفل البوابة
        ctx.fillStyle = '#b8a878';
        ctx.fillRect(x - 22, y - 20, 44, 50);

        // العمود الأيسر للبوابة
        ctx.fillStyle = '#7a7060';
        ctx.fillRect(x - 40, y - 48, 18, 72);
        ctx.fillStyle = '#9a9080';
        ctx.fillRect(x - 38, y - 46, 6, 68);

        // العمود الأيمن للبوابة
        ctx.fillStyle = '#7a7060';
        ctx.fillRect(x + 22, y - 48, 18, 72);
        ctx.fillStyle = '#9a9080';
        ctx.fillRect(x + 32, y - 46, 6, 68);

        // قوس القمة الحجري
        ctx.fillStyle = '#6a6050';
        ctx.beginPath();
        ctx.ellipse(x, y - 48, 41, 22, 0, Math.PI, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#9a9080';
        ctx.beginPath();
        ctx.ellipse(x, y - 48, 31, 15, 0, Math.PI, Math.PI * 2);
        ctx.fill();

        // هالة البوابة الخضراء السحرية
        const grad = ctx.createRadialGradient(x, y - 38, 4, x, y - 38, 30);
        grad.addColorStop(0, `rgba(80, 220, 120, ${0.55 * pulse})`);
        grad.addColorStop(1, 'rgba(40, 180, 80, 0)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.ellipse(x, y - 38, 28, 18, 0, 0, Math.PI * 2);
        ctx.fill();

        // لافتة خشبية علوية توضح الوجهة
        ctx.fillStyle = '#3a2808';
        ctx.fillRect(x - 32, y - 76, 64, 22);
        ctx.strokeStyle = '#806020';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(x - 32, y - 76, 64, 22);

        ctx.fillStyle = '#a0ff80';
        ctx.font = 'bold 11px Cairo';
        ctx.textAlign = 'center';
        ctx.fillText('🌲 العودة للغابة', x, y - 60);

        // تطاير شرارات صغيرة لطيفة للأطفال من البوابة
        for (let i = 0; i < 4; i++) {
            const t = (Date.now() * 0.0007 + i * 1.5) % 3;
            const spX = x + Math.sin(i * 2.5 + Date.now() * 0.001) * 16;
            const spY = y - 38 - t * 15;
            const alpha = Math.max(0, 1 - t / 3) * pulse;
            
            ctx.fillStyle = `rgba(100, 255, 130, ${alpha * 0.72})`;
            ctx.beginPath();
            ctx.arc(spX, spY, 2, 0, Math.PI * 2);
            ctx.fill();
        }

        // إشعار التفاعل عند الاقتراب
        if (near) {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            ctx.beginPath();
            ctx.roundRect(x - 65, y - 96, 130, 22, 6);
            ctx.fill();
            
            ctx.fillStyle = '#a0ff80';
            ctx.font = 'bold 10px Cairo';
            ctx.fillText('[E] العودة للغابة 🌲', x, y - 80);
        }
        ctx.restore();
    },

    /**
     * رسم البوابة الجنوبية الموصدة بسلاسل (South Gate)
     */
    drawSouthGate(ctx) {
        const config = window.CityConfig;
        if (!config) return;
        const { x, y, radius } = config.SOUTH_GATE;
        const player = CityState.player;
        
        const unlocked = window.CityQuests ? window.CityQuests.isSouthGateUnlocked() : false;
        const near = window.CityPortals
            ? CityPortals.isNearPortal(config.SOUTH_GATE)
            : Math.hypot(player.x - x, player.y - y) < (radius || 60);
        const pulse = 0.85 + Math.sin(Date.now() * (unlocked ? 0.003 : 0.004)) * 0.15;

        ctx.save();
        // العمود الأيسر للبوابة
        ctx.fillStyle = '#5a4a38';
        ctx.fillRect(x - 3.5 * config.TILE_SIZE - 5, y - 48, 16, 64);
        ctx.fillStyle = '#6a5a48';
        ctx.fillRect(x - 3.5 * config.TILE_SIZE - 3, y - 46, 6, 60);

        // العمود الأيمن للبوابة
        ctx.fillStyle = '#5a4a38';
        ctx.fillRect(x + 3.5 * config.TILE_SIZE - 11, y - 48, 16, 64);
        ctx.fillStyle = '#6a5a48';
        ctx.fillRect(x + 3.5 * config.TILE_SIZE - 9, y - 46, 6, 60);

        if (unlocked) {
            // توهج أخضر بوابة الجنوب (مفتوحة)
            const grad = ctx.createRadialGradient(x, y - 10, 4, x, y - 10, 50);
            grad.addColorStop(0, `rgba(80, 220, 120, ${0.45 * pulse})`);
            grad.addColorStop(1, 'rgba(40, 180, 80, 0)');
            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.ellipse(x, y - 10, 60, 30, 0, 0, Math.PI * 2);
            ctx.fill();

            // يافطة كشفية خضراء للبوابة
            const signY = y - 50;
            ctx.fillStyle = '#1e3814';
            ctx.fillRect(x - 72, signY - 10, 144, 22);
            ctx.strokeStyle = '#80b060';
            ctx.lineWidth = 1.5;
            ctx.strokeRect(x - 72, signY - 10, 144, 22);

            ctx.fillStyle = '#a0ff80';
            ctx.font = 'bold 11px Cairo';
            ctx.textAlign = 'center';
            ctx.fillText('🚪 الغابة الجنوبية — مفتوح', x, signY + 5);
        } else {
            // عارضة خشبية موصدة
            ctx.fillStyle = '#4a3a28';
            ctx.fillRect(x - 3.5 * config.TILE_SIZE - 5, y - 50, 7 * config.TILE_SIZE + 10, 10);
            ctx.strokeStyle = '#6a5a3a';
            ctx.lineWidth = 1.5;
            ctx.strokeRect(x - 3.5 * config.TILE_SIZE - 5, y - 50, 7 * config.TILE_SIZE + 10, 10);

            // رسم سلاسل حديدية زخرفية
            ctx.strokeStyle = '#8a7a6a';
            ctx.lineWidth = 2.5;
            ctx.beginPath();
            ctx.moveTo(x - 3.2 * config.TILE_SIZE, y - 40);
            ctx.lineTo(x - config.TILE_SIZE * 1.2, y + 8);
            ctx.moveTo(x + 3.2 * config.TILE_SIZE, y - 40);
            ctx.lineTo(x + config.TILE_SIZE * 1.2, y + 8);
            ctx.stroke();

            // رسم قفل أحمر ناصع كبير للأطفال
            ctx.font = '24px serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.shadowColor = 'rgba(231, 76, 60, 0.6)';
            ctx.shadowBlur = 8 * pulse;
            ctx.fillStyle = '#e74c3c';
            ctx.fillText('🔒', x, y - 6);
            ctx.shadowBlur = 0;

            // لافتة موصدة مغلقة
            const signY = y + 28;
            ctx.fillStyle = 'rgba(231, 76, 60, 0.85)';
            ctx.beginPath();
            ctx.roundRect(x - 76, signY - 10, 152, 22, 6);
            ctx.fill();
            
            ctx.fillStyle = '#fff';
            ctx.font = 'bold 10px Cairo';
            ctx.fillText('🚧 بوابة الغابة الجنوبية — مقفلة', x, signY + 5);
        }

        // تلميحات التقارب
        if (near) {
            if (unlocked) {
                ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
                ctx.beginPath();
                ctx.roundRect(x - 76, y + 30, 152, 20, 6);
                ctx.fill();
                
                ctx.fillStyle = '#a0ff80';
                ctx.font = 'bold 10px Cairo';
                ctx.fillText('[E] اذهب للغابة الجنوبية 🗡️', x, y + 40);
            }
        }
        ctx.restore();
    },

    /**
     * رسم يافطات أحياء المدينة اللطيفة
     */
    drawDistrictLabels(ctx) {
        const config = window.CityConfig;
        if (!config) return;
        const ts = config.TILE_SIZE;
        const W = config.WORLD_W;

        ctx.save();
        ctx.textAlign = 'center';

        // 1. يافطة حي التجارة الشمالي
        ctx.font = 'bold 14px Cairo';
        ctx.fillStyle = 'rgba(255, 208, 96, 0.85)';
        ctx.shadowColor = 'rgba(0,0,0,0.6)';
        ctx.shadowBlur = 6;
        ctx.fillText('ـــ حي التجارة والخدمات ـــ', W / 2, 1.5 * ts);

        // 2. يافطة الساحة المركزية والنافورة
        ctx.font = 'bold 16px Cairo';
        ctx.fillStyle = 'rgba(255, 208, 96, 0.9)';
        ctx.shadowColor = 'rgba(0,0,0,0.6)';
        ctx.shadowBlur = 8;
        ctx.fillText('✦ ساحة المدينة والأنشطة ✦', W / 2, 7.3 * ts);

        // 3. يافطة الحي الجنوبي السكني
        ctx.font = 'bold 14px Cairo';
        ctx.fillStyle = 'rgba(255, 208, 96, 0.8)';
        ctx.shadowColor = 'rgba(0,0,0,0.5)';
        ctx.shadowBlur = 6;
        ctx.fillText('ـــ الحي الجنوبي والمهن ـــ', W / 2, 13.5 * ts);
        
        ctx.restore();
    },

    /**
     * رسم المشهد بالكامل بجميع طبقاته وتفاصيله
     * @param {CanvasRenderingContext2D} ctx - سياق رسم اللعب الأساسي
     */
    renderAll(ctx) {
        const config = window.CityConfig;
        if (!config) return;
        const W = config.WORLD_W;
        const H = config.WORLD_H;

        // تنظيف الشاشة
        ctx.clearRect(0, 0, W, H);

        // الطبقة 1: التضاريس الأساسية المحملة مسبقاً (Cobblestone/Grass)
        if (window.CityMap && typeof window.CityMap.draw === 'function') {
            window.CityMap.draw(ctx);
        }

        // الطبقة 2: المباني والورش والخدمات
        if (window.CityBuildings && typeof window.CityBuildings.draw === 'function') {
            // جلب نسبة التعتيم الحالي لإشعال النوافذ تلقائياً
            const nightRatio = window.CityWeather ? window.CityWeather.getDarknessRatio() : 0;
            window.CityBuildings.draw(ctx, config.TILE_SIZE, nightRatio);
        }

        // الطبقة 3: المعالم الثابتة الزخرفية (البئر والنافورة)
        this.drawWell(ctx);
        this.drawFountain(ctx);

        // الطبقة 4: يافطات أحياء المدينة
        this.drawDistrictLabels(ctx);

        // الطبقة 5: البوابات (العودة الشمالية والجنوبية الموصدة)
        this.drawNorthGate(ctx);
        this.drawSouthGate(ctx);

        // الطبقة 6: الشخصيات المتفاعلة والمواطنين المتجولين والحيوانات
        if (window.CityNPCs && typeof window.CityNPCs.draw === 'function') {
            const player = CityState.player;
            window.CityNPCs.draw(ctx, player.x, player.y, (npcId) => {
                return window.CityDialogue ? window.CityDialogue.isNpcSpoken(npcId) : false;
            });
        }

        // الطبقة 7: رسم بطل اللعبة وتحديث عتاده
        if (window.CityPlayer && typeof window.CityPlayer.draw === 'function') {
            window.CityPlayer.draw(ctx);
        }

        // الطبقة 8: جزيئات الطقس وتعتيم الليل (Weather/Ambient Overlays)
        if (window.CityWeather && typeof window.CityWeather.draw === 'function') {
            window.CityWeather.draw(ctx, W, H);
        }
    }
};

// تصدير كائن الرسم العام للنطاق العام
if (typeof window !== 'undefined') {
    window.CityRenderer = CityRenderer;
}
