'use strict';

// =========================================================
//  BASE TIME & WEATHER SYSTEM — نظام الوقت والطقس العام (Core)
// =========================================================

class BaseTimeWeatherSystem {
    /**
     * @param {Object} config - إعدادات الطقس والوقت الخاصة بالمرحلة
     * @param {Array<string>} [config.supportedWeather] - حالات الطقس المدعومة في هذه المرحلة
     * @param {number} [config.maxParticles] - الحد الأقصى للجزيئات المعروضة بالثانية
     * @param {number} [config.minParticles] - الحد الأدنى للجزيئات المعروضة بالثانية
     * @param {number} [config.startClockMin] - دقيقة بدء الوقت الافتراضي
     * @param {number} [config.nightMaxDarkness] - أقصى تظليل لطبقة الليل
     */
    constructor(config) {
        config = config || {};
        this.supportedWeather = config.supportedWeather || ['clear', 'sunShower', 'autumnBreeze', 'snowy', 'fog'];
        this.maxParticles = config.maxParticles || 120;
        this.minParticles = config.minParticles || 40;
        
        // متغيرات دورة الوقت (بالدقائق من 0 إلى 1440)
        this.timeMinutes = config.startClockMin !== undefined ? config.startClockMin : 8 * 60; // 08:00
        this.gameMinPerRealSec = 1; // دقيقة لعبة = ثانية حقيقية واحدة
        
        // الحدود الزمنية للتحولات
        this.DAWN_START = 5 * 60;  // 05:00
        this.DAY_START = 7 * 60;   // 07:00
        this.DUSK_START = 17 * 60; // 17:00
        this.NIGHT_START = 19 * 60;// 19:00
        this.NIGHT_END = 5 * 60;   // 05:00

        this.nightMaxDarkness = config.nightMaxDarkness || 0.76;

        // حالة الطقس الحالية
        this.weatherState = 'clear';
        this.weatherFade = 1.0;
        this.weatherFadeTarget = 1.0;
        this.weatherRemainingMs = 4 * 60 * 1000; // 4 دقائق افتراضية

        // جزيئات الطقس
        this.particles = [];
        this.fogAlpha = 0.0;
        this.fogTargetAlpha = 0.0;

        // تأثيرات العاصفة والبرق (البرق الخاطف واهتزاز الكاميرا)
        this.lightningFlash = 0.0;
        this.cameraShakeMs = 0;
        this.cameraShakeAmp = 0;

        // أوزان الطقس التلقائي
        this.weatherWeights = {
            clear:         [['sunShower', 35], ['fog', 25], ['autumnBreeze', 25], ['snowy', 15]],
            sunShower:     [['clear', 50], ['fog', 20], ['autumnBreeze', 30]],
            autumnBreeze:  [['clear', 45], ['sunShower', 25], ['snowy', 30]],
            snowy:         [['clear', 40], ['autumnBreeze', 40], ['fog', 20]],
            fog:           [['clear', 50], ['sunShower', 20], ['snowy', 30]]
        };
    }

    /**
     * اختيار الطقس التالي تلقائياً استناداً إلى الأوزان المحددة
     */
    rollNextWeather() {
        const table = this.weatherWeights[this.weatherState] || this.weatherWeights.clear;
        let total = 0;
        for (const [, w] of table) total += w;
        let r = Math.random() * total;
        let nextState = 'clear';
        for (const [state, w] of table) {
            r -= w;
            if (r <= 0) {
                nextState = state;
                break;
            }
        }
        
        // التحقق من أن الطقس المختار مدعوم بالمرحلة الحالية
        if (!this.supportedWeather.includes(nextState)) {
            nextState = 'clear';
        }
        
        const duration = (2 * 60 + Math.random() * 4 * 60) * 1000; // 2 إلى 6 دقائق
        this.setWeather(nextState, duration);
    }

    /**
     * تعيين حالة الطقس الحالية مع وقت التحول والتلاشي اللطيف
     */
    setWeather(state, durationMs) {
        if (!this.supportedWeather.includes(state)) state = 'clear';
        const prev = this.weatherState;
        this.weatherState = state;
        this.weatherRemainingMs = durationMs || (3 * 60 * 1000);

        if (prev !== state) {
            this.weatherFade = 0.15;
            this.weatherFadeTarget = 1.0;
        } else {
            this.weatherFade = 1.0;
            this.weatherFadeTarget = 1.0;
        }

        // تحديد قيم الضباب المستهدفة
        if (state === 'fog') {
            this.fogTargetAlpha = 0.42;
        } else if (state === 'sunShower') {
            this.fogTargetAlpha = 0.05;
        } else {
            this.fogTargetAlpha = 0.0;
        }

        // تهيئة جزيئات الطقس الأولية للمظهر الطبيعي
        this.particles = [];
    }

    /**
     * دالة لتحديث الزمن، حالات الطقس، وتحريك الجزيئات
     * @param {number} dt - فرق الزمن بالملي ثانية
     * @param {boolean} paused - هل اللعبة في وضع الإيقاف المؤقت؟
     * @param {number} viewWidth - عرض منطقة العرض
     * @param {number} viewHeight - ارتفاع منطقة العرض
     */
    update(dt, paused, viewWidth, viewHeight) {
        // 1. تحديث دورة الوقت اليومية بالدقيقة
        if (!paused) {
            const timePassedMin = (dt / 1000) * this.gameMinPerRealSec;
            this.timeMinutes = (this.timeMinutes + timePassedMin) % 1440;
            
            // تحديث الطقس المتبقي وتمريره
            this.weatherRemainingMs -= dt;
            if (this.weatherRemainingMs <= 0) {
                this.rollNextWeather();
            }
        }

        // 2. تحديث تلاشي الطقس وانتقال الضباب بسلاسة
        const fadeSpeed = dt / 1500;
        if (this.weatherFade < this.weatherFadeTarget) {
            this.weatherFade = Math.min(this.weatherFadeTarget, this.weatherFade + fadeSpeed);
        } else if (this.weatherFade > this.weatherFadeTarget) {
            this.weatherFade = Math.max(this.weatherFadeTarget, this.weatherFade - fadeSpeed);
        }

        const fogLerp = Math.min(1.0, dt / 1000);
        this.fogAlpha += (this.fogTargetAlpha * this.weatherFade - this.fogAlpha) * fogLerp;

        // 3. تلاشي برق العواصف واهتزاز الشاشة
        if (this.lightningFlash > 0) {
            this.lightningFlash = Math.max(0, this.lightningFlash - dt / 250);
        }
        if (this.cameraShakeMs > 0) {
            this.cameraShakeMs = Math.max(0, this.cameraShakeMs - dt);
        }

        // 4. تحديث وحركة الجزيئات (Precipitation Particles)
        if (!paused) {
            this.updateParticles(dt, viewWidth, viewHeight);
        }
    }

    /**
     * تحديث حركة الجزيئات المختلفة بناءً على الطقس الحالي
     */
    updateParticles(dt, W, H) {
        let targetCount = 0;
        if (this.weatherState === 'sunShower') targetCount = Math.round(this.maxParticles * 0.4);
        else if (this.weatherState === 'autumnBreeze') targetCount = Math.round(this.maxParticles * 0.7);
        else if (this.weatherState === 'snowy') targetCount = this.maxParticles;

        targetCount = Math.min(targetCount, this.maxParticles);

        // إنشاء جزيئات جديدة إذا كانت الحقيبة ناقصة
        while (this.particles.length < targetCount) {
            this.particles.push(this.createParticle(W, H, true));
        }
        // تقليص الجزيئات في حال العودة للطقس الصحو
        if (targetCount < this.particles.length) {
            this.particles.length = targetCount;
        }

        // تحريك وتحديث كل جزيء
        const timeFactor = dt / 16.67;
        for (const p of this.particles) {
            p.x += p.vx * timeFactor;
            p.y += p.vy * timeFactor;

            // اهتزازات خفيفة إضافية للثلج وأوراق الخريف
            if (this.weatherState === 'snowy') {
                p.x += Math.sin(p.wobbleTime) * 0.4 * timeFactor;
                p.wobbleTime += 0.03 * timeFactor;
            } else if (this.weatherState === 'autumnBreeze') {
                p.x += Math.sin(p.wobbleTime) * 0.6 * timeFactor;
                p.wobbleTime += 0.04 * timeFactor;
            }

            // إعادة الجزيء من أعلى الشاشة إذا خرج عن الحدود
            if (p.y > H + 20 || p.x < -40 || p.x > W + 40) {
                const newP = this.createParticle(W, H, false);
                Object.assign(p, newP);
            }
        }
    }

    /**
     * توليد كائن جزيء طقس جديد مع خصائص فيزيائية مناسبة لنوعه
     * @param {number} W - العرض الأقصى للنافذة
     * @param {number} H - الارتفاع الأقصى للنافذة
     * @param {boolean} randomizeY - هل نوزع جزيئات Y عشوائياً (عند بدء الطقس) أم تظهر من أعلى الحافة؟
     */
    createParticle(W, H, randomizeY) {
        const type = this.weatherState;
        const p = {
            x: Math.random() * (W + 60) - 30,
            y: randomizeY ? Math.random() * H : -20,
            vx: 0,
            vy: 0,
            size: 1,
            color: '#fff',
            wobbleTime: Math.random() * 100
        };

        if (type === 'sunShower') {
            // قطرات مطر خفيفة مائلة
            p.vx = -1.5 - Math.random() * 1.5;
            p.vy = 8 + Math.random() * 5;
            p.size = 1.0 + Math.random() * 1.5;
            p.color = 'rgba(180, 210, 255, 0.45)';
        } else if (type === 'autumnBreeze') {
            // أوراق شجر تتطاير وتدور بلطف بالخريف
            p.vx = -2.0 - Math.random() * 2.0;
            p.vy = 1.5 + Math.random() * 1.8;
            p.size = 3.5 + Math.random() * 4.0;
            const colors = ['#cf7428', '#c49a3a', '#b53e2b', '#96603a'];
            p.color = colors[Math.floor(Math.random() * colors.length)];
        } else if (type === 'snowy') {
            // بلورات الثلج البيضاء الخفيفة
            p.vx = -0.3 - Math.random() * 0.6;
            p.vy = 1.0 + Math.random() * 1.2;
            p.size = 1.5 + Math.random() * 2.2;
            p.color = `rgba(255, 255, 255, ${0.6 + Math.random() * 0.35})`;
        }

        return p;
    }

    /**
     * الحصول على نسبة الظلام الحالية (0 = نهار ساطع، 1 = ليل معتم)
     */
    getDarknessRatio() {
        const min = this.timeMinutes;
        
        // الليل الكامل
        if (min >= this.NIGHT_START || min < this.NIGHT_END) {
            return this.nightMaxDarkness;
        }
        // النهار الكامل
        if (min >= this.DAY_START && min < this.DUSK_START) {
            return 0.0;
        }
        // فترة الفجر (تدريج من الليل العاتم إلى النهار)
        if (min >= this.NIGHT_END && min < this.DAY_START) {
            const range = this.DAY_START - this.NIGHT_END;
            const progress = min - this.NIGHT_END;
            return this.nightMaxDarkness * (1.0 - (progress / range));
        }
        // فترة الغسق (تدريج من النهار إلى ليل عاصف)
        if (min >= this.DUSK_START && min < this.NIGHT_START) {
            const range = this.NIGHT_START - this.DUSK_START;
            const progress = min - this.DUSK_START;
            return this.nightMaxDarkness * (progress / range);
        }

        return 0.0;
    }

    /**
     * رسم تأثيرات الطقس وجزيئاته مع تعتيم الليل والبرق الخاطف
     * @param {CanvasRenderingContext2D} ctx - سياق رسم اللعبة الأساسي
     * @param {number} W - العرض
     * @param {number} H - الارتفاع
     */
    draw(ctx, W, H) {
        // 1. رسم جزيئات الطقس (Precipitation)
        if (this.particles.length > 0 && this.weatherFade > 0.05) {
            ctx.save();
            const type = this.weatherState;
            
            if (type === 'sunShower') {
                ctx.strokeStyle = 'rgba(180, 210, 255, 0.45)';
                ctx.lineWidth = 1.2;
                ctx.beginPath();
                for (const p of this.particles) {
                    ctx.moveTo(p.x, p.y);
                    ctx.lineTo(p.x + p.vx * 0.9, p.y + p.size * 6.0);
                }
                ctx.stroke();
            } else if (type === 'autumnBreeze') {
                // رسم أوراق متساقطة عشوائية
                for (const p of this.particles) {
                    ctx.fillStyle = p.color;
                    ctx.beginPath();
                    ctx.ellipse(p.x, p.y, p.size, p.size * 0.5, Math.sin(p.wobbleTime * 0.5) * 0.5, 0, Math.PI * 2);
                    ctx.fill();
                }
            } else if (type === 'snowy') {
                // رسم بلورات ثلجية بيضاء ناعمة
                for (const p of this.particles) {
                    ctx.fillStyle = p.color;
                    ctx.beginPath();
                    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                    ctx.fill();
                }
            }
            ctx.restore();
        }

        // 2. رسم تأثير الضباب المحيط
        if (this.fogAlpha > 0.01) {
            ctx.save();
            // طبقة رمادية خفيفة على كامل الشاشة
            ctx.fillStyle = `rgba(122, 132, 145, ${this.fogAlpha * 0.5})`;
            ctx.fillRect(0, 0, W, H);
            
            // تدرج شعاعي للحواف لتقليل التباين وإعطاء عمق طبيعي للضباب
            const grad = ctx.createRadialGradient(W * 0.5, H * 0.45, Math.min(W, H) * 0.2,
                W * 0.5, H * 0.5, Math.max(W, H) * 0.72);
            grad.addColorStop(0, 'rgba(40, 48, 58, 0)');
            grad.addColorStop(1, `rgba(32, 38, 50, ${this.fogAlpha * 0.45})`);
            ctx.fillStyle = grad;
            ctx.fillRect(0, 0, W, H);
            ctx.restore();
        }

        // 3. رسم طبقة الليل وتعتيم الغسق/الفجر (Ambient Light Tint)
        const darkRatio = this.getDarknessRatio();
        if (darkRatio > 0.01) {
            ctx.save();
            // لون أزرق نيلي معتم يماثل أجواء الليل والغروب
            ctx.fillStyle = `rgba(15, 20, 42, ${darkRatio})`;
            ctx.fillRect(0, 0, W, H);
            ctx.restore();
        }

        // 4. وميض البرق الخاطف (Lightning Flash)
        if (this.lightningFlash > 0.01) {
            ctx.save();
            ctx.fillStyle = `rgba(255, 255, 255, ${this.lightningFlash * 0.65})`;
            ctx.fillRect(0, 0, W, H);
            ctx.restore();
        }
    }

    /**
     * الحصول على تفاصيل التعديل على الكاميرا لمحاكاة الاهتزاز
     */
    applyCameraShake(camera) {
        if (this.cameraShakeMs <= 0 || !camera) return;
        const t = performance.now() * 0.05;
        const amp = this.cameraShakeAmp * (this.cameraShakeMs / 350);
        camera.x += Math.sin(t * 2.1) * amp;
        camera.y += Math.cos(t * 1.7) * amp * 0.85;
    }
}

// تصدير الكائن للنطاق العام للمستعرض
if (typeof window !== 'undefined') {
    window.BaseTimeWeatherSystem = BaseTimeWeatherSystem;
}
