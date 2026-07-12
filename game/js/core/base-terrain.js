'use strict';

// =========================================================
//  BASE TERRAIN MANAGER — المدير الأساسي لتضاريس المراحل (Core)
// =========================================================

class BaseTerrainManager {
    /**
     * @param {Object} config - إعدادات التضاريس الخاصة بالمرحلة
     * @param {number} config.cols - عدد الأعمدة في الشبكة
     * @param {number} config.rows - عدد الصفوف في الشبكة
     * @param {number} config.tileSize - حجم البلاطة الواحدة بالبكسل
     * @param {Array<string>} [config.textures] - أسماء الأنسجة المطلوبة للمرحلة
     * @param {Array<Array<number>>} [config.layout] - مصفوفة التضاريس الثابتة (اختياري)
     * @param {number} [config.defaultBlockTile] - نوع البلاطة الافتراضية للحدود الخارجية (التصادم)
     */
    constructor(config) {
        this.cols = config.cols || 20;
        this.rows = config.rows || 20;
        this.tileSize = config.tileSize || 48;
        this.textures = config.textures || [];
        this.defaultBlockTile = config.defaultBlockTile !== undefined ? config.defaultBlockTile : 2; // Building/Rock default
        
        // إنشاء شبكة بلاطات ثنائية الأبعاد مخزنة في مصفوفة أحادية الأبعاد موفرة للذاكرة
        this.tileMap = new Uint8Array(this.cols * this.rows);
        
        // قماش الرسم المسبق للتضاريس لتحسين الأداء
        this.prerenderedCanvas = null;
        
        // إذا كان هناك تخطيط جاهز، نقوم بتحميله
        if (config.layout && Array.isArray(config.layout)) {
            this.loadLayout(config.layout);
        }
    }

    /**
     * تحميل شبكة البلاطات من مصفوفة ثنائية الأبعاد
     * @param {Array<Array<number>>} layoutGrid
     */
    loadLayout(layoutGrid) {
        for (let r = 0; r < this.rows; r++) {
            for (let c = 0; c < this.cols; c++) {
                if (layoutGrid[r] && layoutGrid[r][c] !== undefined) {
                    this.setTile(c, r, layoutGrid[r][c]);
                }
            }
        }
    }

    /**
     * الحصول على نوع البلاطة في إحداثيات الشبكة
     */
    getTile(c, r) {
        if (c < 0 || c >= this.cols || r < 0 || r >= this.rows) {
            return this.defaultBlockTile;
        }
        return this.tileMap[r * this.cols + c];
    }

    /**
     * تعيين نوع البلاطة في إحداثيات الشبكة
     */
    setTile(c, r, t) {
        if (c < 0 || c >= this.cols || r < 0 || r >= this.rows) return;
        this.tileMap[r * this.cols + c] = t;
    }

    /**
     * تعيين بلاطات داخل منطقة مستطيلة
     */
    setRect(c1, r1, c2, r2, t) {
        for (let r = r1; r < r2; r++) {
            for (let c = c1; c < c2; c++) {
                this.setTile(c, r, t);
            }
        }
    }

    /**
     * تعيين بلاطات داخل منطقة دائرية
     */
    setCircle(cx, cy, rad, t) {
        for (let r = Math.floor(cy - rad); r <= Math.ceil(cy + rad); r++) {
            for (let c = Math.floor(cx - rad); c <= Math.ceil(cx + rad); c++) {
                if ((c - cx) ** 2 + (r - cy) ** 2 <= rad * rad) {
                    this.setTile(c, r, t);
                }
            }
        }
    }

    /**
     * الحصول على البلاطة بناءً على إحداثيات العالم بالبكسل
     */
    getTileAtWorld(wx, wy) {
        const c = Math.floor(wx / this.tileSize);
        const r = Math.floor(wy / this.tileSize);
        return this.getTile(c, r);
    }

    /**
     * التحقق مما إذا كانت نقطة معينة في العالم مسدودة وتمنع حركة اللاعب
     * @param {number} wx - إحداثيات X في العالم
     * @param {number} wy - إحداثيات Y في العالم
     * @param {Array<number>} blockedTypes - قائمة بأنواع البلاطات الصلبة
     * @returns {boolean}
     */
    isBlocked(wx, wy, blockedTypes) {
        const tileType = this.getTileAtWorld(wx, wy);
        if (blockedTypes && Array.isArray(blockedTypes)) {
            return blockedTypes.includes(tileType);
        }
        // افتراضياً، بلاطة المباني (2) صلبة ومسدودة
        return tileType === 2; 
    }

    /**
     * حساب دالة ضجيج عشوائية محددة deterministic للرسم وتوزيع التفاصيل
     */
    _vhash(ix, iy) {
        const s = Math.sin(ix * 127.1 + iy * 311.7) * 43758.5453;
        return s - Math.floor(s);
    }

    /**
     * دالة رقع التضاريس العشوائية (Stochastic Bombing) لتوزيع الأنسجة الطبيعية دون تكرار ممل
     * @param {CanvasRenderingContext2D} tc - سياق رسم قماش التضاريس
     * @param {number} tileId - نوع البلاطة المستهدفة بالرسم العشوائي
     * @param {HTMLImageElement} img - صورة النسيج الطبيعي (ملمس عشب، رمل، ماء)
     * @param {string} [tint] - لون تظليل إضافي (اختياري)
     */
    bombTexture(tc, tileId, img, tint) {
        if (!img || !img.complete || img.naturalWidth === 0) return;
        
        const iW = img.naturalWidth;
        const iH = img.naturalHeight;
        const sampleSize = Math.min(180, Math.min(iW, iH) * 0.58);
        const patchR = Math.min(120, sampleSize * 0.7 + 18);
        const step = Math.round(patchR * 1.12);
        
        const worldWidth = this.cols * this.tileSize;
        const worldHeight = this.rows * this.tileSize;

        tc.save();
        tc.beginPath();
        // نقوم بعمل قناع (Clip Mask) فقط فوق البلاطات التي تطابق المعرف المستهدف
        for (let r = 0; r < this.rows; r++) {
            for (let c = 0; c < this.cols; c++) {
                if (this.getTile(c, r) === tileId) {
                    tc.rect(c * this.tileSize - 1, r * this.tileSize - 1, this.tileSize + 2, this.tileSize + 2);
                }
            }
        }
        tc.clip();

        let gi = 0;
        const pad = patchR + step;
        
        // رسم رقع دائرية متداخلة بزوايا عشوائية لكسر حدة شبكة البكسل الثنائية
        for (let gy = -pad; gy < worldHeight + pad; gy += step) {
            for (let gx = -pad; gx < worldWidth + pad; gx += step) {
                const h0 = this._vhash(gi, tileId * 17 + 1);
                const h1 = this._vhash(gi, tileId * 17 + 2);
                const h2 = this._vhash(gi, tileId * 17 + 3);
                const h3 = this._vhash(gi, tileId * 17 + 4);
                const h4 = this._vhash(gi, tileId * 17 + 5);
                const h5 = this._vhash(gi, tileId * 17 + 6);
                gi++;

                const wx = gx + h0 * step;
                const wy = gy + h1 * step;
                const srcX = h2 * Math.max(1, iW - sampleSize);
                const srcY = h3 * Math.max(1, iH - sampleSize);
                const sw = Math.min(sampleSize, iW - srcX);
                const sh = Math.min(sampleSize, iH - srcY);
                const pr = patchR * (0.82 + h5 * 0.36);

                tc.save();
                tc.translate(wx, wy);
                tc.rotate(h4 * Math.PI * 2);
                tc.beginPath();
                tc.arc(0, 0, pr, 0, Math.PI * 2);
                tc.clip();
                tc.globalAlpha = 0.72 + h5 * 0.24;
                tc.drawImage(img, srcX, srcY, sw, sh, -pr, -pr, pr * 2, pr * 2);
                tc.restore();
            }
        }
        
        if (tint) {
            tc.fillStyle = tint;
            tc.fillRect(0, 0, worldWidth, worldHeight);
        }
        tc.restore();
    }

    /**
     * الرسم المسبق للتضاريس على قماش داخلي (Canvas Prerendering) لتقليل زمن معالجة كل إطار
     * @param {Object} loadedTextures - قاموس يحتوي على كائنات الصور المحملة مسبقاً
     * @param {Function} tileRenderCallback - دالة رسم مخصصة لرسم تفاصيل البلاطات الافتراضية
     */
    prerenderTerrain(loadedTextures, tileRenderCallback) {
        this.prerenderedCanvas = document.createElement('canvas');
        this.prerenderedCanvas.width = this.cols * this.tileSize;
        this.prerenderedCanvas.height = this.rows * this.tileSize;
        
        const tc = this.prerenderedCanvas.getContext('2d');
        
        // الخطوة 1: رسم الأرضية الأساسية لكل بلاطة استناداً إلى دالة الرسم المخصصة
        if (tileRenderCallback && typeof tileRenderCallback === 'function') {
            tileRenderCallback(tc, this);
        } else {
            // رسم افتراضي بسيط في حال غياب دالة التخصيص
            for (let r = 0; r < this.rows; r++) {
                for (let c = 0; c < this.cols; c++) {
                    const t = this.getTile(c, r);
                    tc.fillStyle = t === 2 ? '#555' : '#3d8a35'; // رمادي للمباني وأخضر للعشب
                    tc.fillRect(c * this.tileSize, r * this.tileSize, this.tileSize + 1, this.tileSize + 1);
                }
            }
        }

        // الخطوة 2: تطبيق تداخل الأنسجة العشوائية الطبيعية (Grass, Sand, Water, etc.)
        if (loadedTextures && Object.keys(loadedTextures).length > 0) {
            // نقوم بالمرور على الأنسجة المتوفرة وتطبيق القنابل العشوائية عليها تلقائياً
            // العشب = بلاطة 3، الماء = بلاطة 4، الرمل = بلاطة 5
            if (loadedTextures.grass) this.bombTexture(tc, 3, loadedTextures.grass, null);
            if (loadedTextures.water) this.bombTexture(tc, 4, loadedTextures.water, 'rgba(0, 15, 50, 0.15)');
            if (loadedTextures.sand)  this.bombTexture(tc, 5, loadedTextures.sand, null);
        }
    }

    /**
     * رسم التضاريس المخزنة مسبقاً على سياق اللعب الأساسي
     */
    draw(ctx) {
        if (this.prerenderedCanvas) {
            ctx.imageSmoothingEnabled = false;
            ctx.drawImage(this.prerenderedCanvas, 0, 0);
        }
    }
}

// تصدير الكائن الأساسي للنطاق العام للمتصفح
if (typeof window !== 'undefined') {
    window.BaseTerrainManager = BaseTerrainManager;
}
