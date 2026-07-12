'use strict';

// =========================================================
//  CITY MINIMAP — خريطة المدينة المصغرة التفاعلية (v2)
// =========================================================

const CityMinimap = {
    // حجم خريطة المصغرة بالبكسل (مستطيل عرضي)
    WIDTH:  180,
    HEIGHT: 120,
    PADDING: 10, // هامش المسافة من حواف الشاشة

    // حالة التوسيع
    expanded: false,
    expandedW: 320,
    expandedH: 220,

    // إكاش الـ offscreen canvas لتفادي إعادة الرسم في كل إطار
    _cache: null,
    _cacheDirty: true,

    /**
     * إبطال الكاش عند تغيير حالة البوابة أو المهام
     */
    invalidateCache() {
        this._cacheDirty = true;
    },

    /**
     * بناء طبقة الخريطة الثابتة (تضاريس، مباني، بوابات) في canvas خارجي
     */
    _buildCache() {
        const config = window.CityConfig;
        if (!config) return;

        const W = this.expanded ? this.expandedW : this.WIDTH;
        const H = this.expanded ? this.expandedH : this.HEIGHT;
        const worldW = config.WORLD_W;
        const worldH = config.WORLD_H;
        const scaleX = (W - 2) / worldW;
        const scaleY = (H - 2) / worldH;
        const ts = config.TILE_SIZE;

        const oc = document.createElement('canvas');
        oc.width = W;
        oc.height = H;
        const ctx = oc.getContext('2d');

        // خلفية داكنة بحواف مستديرة
        ctx.fillStyle = 'rgba(14, 12, 22, 0.96)';
        ctx.beginPath();
        ctx.roundRect(0, 0, W, H, 8);
        ctx.fill();

        // رسم تضاريس المدينة (كل بلاطة ملونة حسب نوعها)
        if (window.CityMap && window.CityMap.grid) {
            const grid = window.CityMap.grid;
            const rows = Math.round(worldH / ts);
            const cols = Math.round(worldW / ts);

            for (let r = 0; r < rows; r++) {
                for (let c = 0; c < cols; c++) {
                    const tile = grid[r] && grid[r][c];
                    let color;
                    switch (tile) {
                        case 0:  color = '#5a6a50'; break; // عشب
                        case 1:  color = '#78695a'; break; // طريق حجري
                        case 2:  color = '#6a7870'; break; // عشب مزخرف
                        case 3:  color = '#686050'; break; // حجارة
                        case 4:  color = '#4a5a68'; break; // مياه / بحيرة
                        default: color = '#4a4038'; break;
                    }
                    ctx.fillStyle = color;
                    ctx.fillRect(
                        1 + c * ts * scaleX,
                        1 + r * ts * scaleY,
                        Math.ceil(ts * scaleX),
                        Math.ceil(ts * scaleY)
                    );
                }
            }
        } else {
            // بديل إذا لم تُبنَ الشبكة بعد: تلوين بسيط بالتدرج
            const bg = ctx.createLinearGradient(0, 0, 0, H);
            bg.addColorStop(0, '#384a30');
            bg.addColorStop(1, '#4a5838');
            ctx.fillStyle = bg;
            ctx.fillRect(1, 1, W - 2, H - 2);
        }

        // رسم مباني المدينة بمستطيلات ملونة مصغرة
        const buildings = window.CityConfig.BUILDINGS || [];
        buildings.forEach(b => {
            ctx.fillStyle = b.color || '#a07860';
            ctx.fillRect(
                1 + b.x * scaleX,
                1 + b.y * scaleY,
                Math.max(4, b.w * scaleX),
                Math.max(4, b.h * scaleY)
            );
            // اسم المبنى المختصر (حرفان أو رمز)
            if (b.tag) {
                ctx.font = `bold ${Math.max(6, 9 * (W / 180))}px Cairo`;
                ctx.fillStyle = '#fff';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(
                    b.tag,
                    1 + (b.x + b.w / 2) * scaleX,
                    1 + (b.y + b.h / 2) * scaleY
                );
            }
        });

        // رسم بوابة الشمال (العودة للغابة) بلون أخضر
        const fPortal = config.FOREST_PORTAL;
        if (fPortal) {
            ctx.fillStyle = '#4dc44d';
            ctx.beginPath();
            ctx.arc(
                1 + fPortal.x * scaleX,
                1 + fPortal.y * scaleY,
                Math.max(3, 5 * (W / 180)),
                0, Math.PI * 2
            );
            ctx.fill();
            ctx.fillStyle = '#e0ffe0';
            ctx.font = `bold ${Math.max(6, 8 * (W / 180))}px Cairo`;
            ctx.textAlign = 'center';
            ctx.fillText('🌲', 1 + fPortal.x * scaleX, 1 + fPortal.y * scaleY - 6 * (W / 180));
        }

        // رسم البوابة الجنوبية (مقفلة/مفتوحة بلونين مختلفين)
        const sGate = config.SOUTH_GATE;
        if (sGate) {
            const unlocked = window.CityQuests ? window.CityQuests.isSouthGateUnlocked() : false;
            ctx.fillStyle = unlocked ? '#e0a040' : '#c0404a';
            ctx.beginPath();
            ctx.arc(
                1 + sGate.x * scaleX,
                1 + sGate.y * scaleY,
                Math.max(3, 5 * (W / 180)),
                0, Math.PI * 2
            );
            ctx.fill();
            ctx.fillStyle = '#fff';
            ctx.font = `bold ${Math.max(6, 8 * (W / 180))}px Cairo`;
            ctx.textAlign = 'center';
            ctx.fillText(unlocked ? '🚪' : '🔒', 1 + sGate.x * scaleX, 1 + sGate.y * scaleY - 6 * (W / 180));
        }

        // رسم النافورة بلون أزرق دائري
        const fountain = config.FOUNTAIN;
        if (fountain) {
            ctx.fillStyle = '#4090c8';
            ctx.beginPath();
            ctx.arc(
                1 + fountain.x * scaleX,
                1 + fountain.y * scaleY,
                Math.max(2, 4 * (W / 180)),
                0, Math.PI * 2
            );
            ctx.fill();
        }

        // حدود الخريطة المصغرة
        ctx.strokeStyle = 'rgba(255, 208, 96, 0.5)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.roundRect(0.5, 0.5, W - 1, H - 1, 8);
        ctx.stroke();

        this._cache = oc;
        this._cacheDirty = false;
    },

    /**
     * رسم الخريطة المصغرة كاملة على الـ canvas الرئيسي
     * @param {CanvasRenderingContext2D} ctx - سياق الرسم الرئيسي للعبة
     * @param {number} screenW - عرض نافذة اللعبة
     * @param {number} screenH - ارتفاع نافذة اللعبة
     */
    draw(ctx, screenW, screenH) {
        const config = window.CityConfig;
        if (!config) return;
        if (!CityState.transient.showMinimap) return;

        const W = this.expanded ? this.expandedW : this.WIDTH;
        const H = this.expanded ? this.expandedH : this.HEIGHT;
        const px = this.PADDING;
        const py = this.PADDING;

        // إعادة بناء الكاش عند الضرورة
        if (this._cacheDirty || !this._cache || this._cache.width !== W) {
            this._buildCache();
        }

        if (!this._cache) return;

        // رسم نسخة الكاش
        ctx.save();
        ctx.drawImage(this._cache, px, py, W, H);

        // إحداثيات التحويل لتحويل مواضع عالم اللعبة لمواضع الخريطة
        const worldW = config.WORLD_W;
        const worldH = config.WORLD_H;
        const scaleX = (W - 2) / worldW;
        const scaleY = (H - 2) / worldH;

        // ـ رسم النقاط المتحركة (المواطنون والحيوانات والشخصيات الثابتة)
        const allEntities = [
            ...(window.CityNPCs && CityNPCs.walkers ? CityNPCs.walkers : []),
            ...(window.CityNPCs && CityNPCs.npcs    ? CityNPCs.npcs    : [])
        ];
        allEntities.forEach(npc => {
            if (npc.x === undefined || npc.y === undefined) return;
            ctx.fillStyle = npc.color || '#ffcca0';
            ctx.beginPath();
            ctx.arc(
                px + 1 + npc.x * scaleX,
                py + 1 + npc.y * scaleY,
                Math.max(2, 2.5 * (W / 180)),
                0, Math.PI * 2
            );
            ctx.fill();
        });

        // ـ رسم موقع اللاعب الحالي بنقطة ذهبية نابضة
        const player = CityState.player;
        const pxX = px + 1 + player.x * scaleX;
        const pxY = py + 1 + player.y * scaleY;

        const pulse = 0.8 + Math.sin(Date.now() * 0.005) * 0.2;
        ctx.fillStyle = `rgba(255, 240, 60, ${pulse})`;
        ctx.beginPath();
        ctx.arc(pxX, pxY, Math.max(3, 4 * (W / 180)), 0, Math.PI * 2);
        ctx.fill();

        // هالة نابضة حول موقع اللاعب
        ctx.strokeStyle = `rgba(255, 240, 60, ${0.45 * pulse})`;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(pxX, pxY, Math.max(5, 7 * (W / 180)), 0, Math.PI * 2);
        ctx.stroke();

        // ـ رسم الاتجاه أعلى يسار الخريطة المصغرة (بوصلة بسيطة)
        const bx = px + W - 14;
        const by = py + 14;
        ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
        ctx.beginPath();
        ctx.arc(bx, by, 10, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#e74c3c';
        ctx.font = 'bold 10px serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('ش', bx, by - 4);
        ctx.fillStyle = '#aaa';
        ctx.fillText('ج', bx, by + 4);

        // زر التوسيع/التصغير أسفل يسار الخريطة
        ctx.fillStyle = 'rgba(0, 0, 0, 0.55)';
        ctx.beginPath();
        ctx.roundRect(px + W - 22, py + H - 18, 20, 16, 4);
        ctx.fill();
        ctx.fillStyle = '#ffd060';
        ctx.font = '10px Cairo';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(this.expanded ? '⊟' : '⊞', px + W - 12, py + H - 10);

        ctx.restore();
    },

    /**
     * التعامل مع النقرات على منطقة الخريطة المصغرة
     * @param {number} mx - موضع النقر X بنسبة للشاشة
     * @param {number} my - موضع النقر Y بنسبة للشاشة
     * @returns {boolean} - هل النقر كان داخل الخريطة المصغرة؟
     */
    handleClick(mx, my) {
        const W = this.expanded ? this.expandedW : this.WIDTH;
        const H = this.expanded ? this.expandedH : this.HEIGHT;
        const px = this.PADDING;
        const py = this.PADDING;

        // التحقق أن النقر داخل منطقة الخريطة
        if (mx < px || mx > px + W || my < py || my > py + H) return false;

        // زر التوسيع/التصغير
        if (mx > px + W - 22 && my > py + H - 18) {
            this.expanded = !this.expanded;
            this._cacheDirty = true;
            return true;
        }

        return true; // استيعاب النقر ومنع التفاعل مع طبقات أسفله
    },

    /**
     * تبديل ظهور الخريطة المصغرة
     */
    toggle() {
        CityState.transient.showMinimap = !CityState.transient.showMinimap;
        if (typeof window.notify === 'function') {
            window.notify(CityState.transient.showMinimap ? '🗺️ تم عرض الخريطة' : '🗺️ تم إخفاء الخريطة', '#aaddff', 1800);
        }
    }
};

// تصدير الكائن للنطاق العام
if (typeof window !== 'undefined') {
    window.CityMinimap = CityMinimap;
}
