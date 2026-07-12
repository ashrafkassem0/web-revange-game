'use strict';

// =========================================================
//  BASE NPC MANAGER — المدير الأساسي للشخصيات المتفاعلة والمتجولة (Core)
// =========================================================

class BaseNPCManager {
    /**
     * @param {Object} stageConfig - تكوين المرحلة
     * @param {Array<Object>} stageConfig.npcs - قائمة الشخصيات الثابتة (مثل التجار، المعالجين)
     * @param {Array<Object>} stageConfig.walkers - قائمة المواطنين والحيوانات المتجولين
     * @param {Array<Object>} stageConfig.stops - نقاط التوقف والوجهات المتوفرة في الخريطة
     */
    constructor(stageConfig) {
        this.npcs = (stageConfig.npcs || []).map(npc => ({
            id: npc.id,
            x: npc.x,
            y: npc.y,
            emoji: npc.emoji || '👤',
            label: npc.label || 'شخصية غامضة',
            color: npc.color || '#888888',
            radius: npc.radius || 20,
            interactRange: npc.interactRange || 55,
            onInteract: npc.onInteract || null
        }));

        this.stops = stageConfig.stops || [];

        this.walkers = (stageConfig.walkers || []).map(w => ({
            name: w.name || 'مواطن',
            emoji: w.emoji || '🧑',
            color: w.color || '#666666',
            x: w.x || 0,
            y: w.y || 0,
            speed: w.speed || 0.045,
            state: 'waiting', // walking | waiting | talking
            target: null,
            waitUntil: 0,
            talkUntil: 0,
            partner: null,
            bubble: '',
            bubbleUntil: 0
        }));

        // ربط الحوارات العشوائية العامة المتوفرة في التكوين
        this.dialoguePairs = stageConfig.dialoguePairs || [
            ['أهلاً بك!', 'مرحباً!']
        ];
    }

    /**
     * البحث عن أقرب نقطة توقف بشكل عشوائي مع تجنب تكرار الهدف الحالي
     */
    pickNextStop(walker) {
        if (!this.stops || this.stops.length === 0) return null;
        let next = this.stops[Math.floor(Math.random() * this.stops.length)];
        
        // تفضيل الساحة المركزية في بعض الأحيان لزيادة التلاقي الاجتماعي
        if (Math.random() < 0.35 && this.stops.length > 3) {
            next = this.stops[2] || next; 
        }
        
        if (next === walker.target && this.stops.length > 1) {
            const idx = (this.stops.indexOf(next) + 1) % this.stops.length;
            next = this.stops[idx];
        }
        return next;
    }

    /**
     * بدء محادثة قصيرة بين متجولين
     */
    startConversation(a, b, now) {
        const lines = this.dialoguePairs[Math.floor(Math.random() * this.dialoguePairs.length)];
        const duration = 2600 + Math.random() * 1500;
        
        a.state = b.state = 'talking';
        a.partner = b; 
        b.partner = a;
        a.talkUntil = b.talkUntil = now + duration;
        a.bubble = lines[0]; 
        b.bubble = lines[1];
        a.bubbleUntil = b.bubbleUntil = now + duration;
    }

    /**
     * تحديث فيزيائية حركة المتجولين وجدولة حواراتهم
     * @param {number} dt - فرق الزمن بالملي ثانية
     */
    update(dt) {
        const now = performance.now();

        // 1. حركة وتفاعل المشاة المتجولين
        for (const w of this.walkers) {
            if (w.state === 'talking') {
                if (now >= w.talkUntil) {
                    w.state = 'waiting';
                    w.partner = null;
                    w.waitUntil = now + 900 + Math.random() * 1300;
                }
                continue;
            }

            if (w.state === 'waiting') {
                if (now < w.waitUntil) continue;
                w.target = this.pickNextStop(w);
                if (w.target) {
                    w.state = 'walking';
                }
            }

            if (w.state === 'walking' && w.target) {
                const dx = w.target.x - w.x;
                const dy = w.target.y - w.y;
                const dist = Math.hypot(dx, dy);

                if (dist <= 2.5) {
                    w.x = w.target.x;
                    w.y = w.target.y;
                    w.state = 'waiting';
                    w.waitUntil = now + 900 + Math.random() * 2400;
                    
                    // فقاعة تلميح إلى الوجهة التالية
                    w.bubble = `⇢ ${w.target.name}`;
                    w.bubbleUntil = now + 1050;
                } else {
                    const step = Math.min(dist, w.speed * dt);
                    w.x += (dx / dist) * step;
                    w.y += (dy / dist) * step;
                }
            }
        }

        // 2. التحقق من التقارب بين المشاة المنتظرين لبدء محادثة تلقائية
        for (let i = 0; i < this.walkers.length; i++) {
            for (let j = i + 1; j < this.walkers.length; j++) {
                const a = this.walkers[i];
                const b = this.walkers[j];
                
                if (a.state !== 'waiting' || b.state !== 'waiting') continue;
                
                const dist = Math.hypot(a.x - b.x, a.y - b.y);
                if (dist < 58 && Math.random() < dt / 850) {
                    this.startConversation(a, b, now);
                }
            }
        }
    }

    /**
     * رسم جميع الشخصيات المتفاعلة والمتجولة مع ظلالها وفقاعاتها التوجيهية
     * @param {CanvasRenderingContext2D} ctx - سياق رسم اللعبة الأساسي
     * @param {number} playerX - إحداثيات اللاعب X
     * @param {number} playerY - إحداثيات اللاعب Y
     * @param {Function} isSpokenCallback - دالة لمعرفة هل تحدث اللاعب مع الشخصية من قبل
     */
    draw(ctx, playerX, playerY, isSpokenCallback) {
        const now = performance.now();

        // 1. رسم الشخصيات الثابتة (NPCs)
        for (const npc of this.npcs) {
            const dist = Math.hypot(playerX - npc.x, playerY - npc.y);
            const near = dist < npc.interactRange;
            const spoken = isSpokenCallback ? isSpokenCallback(npc.id) : false;

            ctx.save();
            // مؤشر أرضية ملون للشخصية
            ctx.fillStyle = npc.color + '40';
            ctx.beginPath();
            ctx.ellipse(npc.x, npc.y + 4, 20, 10, 0, 0, Math.PI * 2);
            ctx.fill();

            // ظل رمادي
            ctx.fillStyle = 'rgba(0,0,0,0.25)';
            ctx.beginPath();
            ctx.ellipse(npc.x, npc.y + 12, 14, 6, 0, 0, Math.PI * 2);
            ctx.fill();

            // دائرة الهالة الخارجية للشخصية مع نبض عند التقارب
            const pulse = near ? 1 + Math.sin(Date.now() * 0.005) * 0.08 : 1;
            ctx.beginPath();
            ctx.arc(npc.x, npc.y, 21 * pulse, 0, Math.PI * 2);
            ctx.fillStyle = npc.color;
            ctx.fill();
            
            ctx.strokeStyle = near ? '#ffd060' : (spoken ? 'rgba(255,208,96,0.42)' : 'rgba(255,255,255,0.52)');
            ctx.lineWidth = near ? 3 : 2;
            ctx.stroke();

            // رسم رمز الإيموجي بمنتصف الدائرة
            ctx.font = `${22 * pulse}px serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(npc.emoji, npc.x, npc.y);
            ctx.textBaseline = 'alphabetic';

            // يافطة الاسم فوق الشخصية
            ctx.font = `bold ${near ? 14 : 12}px Cairo`;
            ctx.fillStyle = near ? '#ffe49a' : '#f0eee7';
            ctx.shadowColor = 'rgba(0,0,0,0.9)';
            ctx.shadowBlur = 4;
            ctx.textAlign = 'center';
            ctx.fillText(npc.label, npc.x, npc.y - 29 * pulse);
            ctx.shadowBlur = 0;

            // علامة صح ✓ للدلالة على إكمال أول حوار
            if (spoken && !near) {
                ctx.font = '10px Cairo';
                ctx.fillStyle = 'rgba(255,208,96,0.5)';
                ctx.fillText('✓', npc.x + 20, npc.y - 28);
            }

            // تلميح تفاعل لوحة المفاتيح
            if (near) {
                ctx.fillStyle = 'rgba(0,0,0,0.65)';
                ctx.beginPath();
                ctx.roundRect(npc.x - 40, npc.y - 48, 80, 18, 5);
                ctx.fill();
                ctx.fillStyle = '#ffd060';
                ctx.font = 'bold 10px Cairo';
                ctx.fillText('[E] للتحدث', npc.x, npc.y - 35);
            }
            ctx.restore();
        }

        // 2. رسم المشاة المتجولين (Walkers)
        for (const w of this.walkers) {
            ctx.save();
            
            // ظل متحرك
            ctx.fillStyle = 'rgba(0,0,0,0.2)';
            ctx.beginPath();
            ctx.ellipse(w.x, w.y + 10, 10, 4, 0, 0, Math.PI * 2);
            ctx.fill();

            // كبسولة الجسم الملونة
            ctx.beginPath();
            ctx.arc(w.x, w.y, 16, 0, Math.PI * 2);
            ctx.fillStyle = w.color;
            ctx.fill();
            
            ctx.strokeStyle = 'rgba(255,255,255,0.62)';
            ctx.lineWidth = 1.5;
            ctx.stroke();

            // رسم الإيموجي
            ctx.font = '19px serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(w.emoji, w.x, w.y);

            // رسم الاسم أسفل القدمين للتوضيح
            ctx.font = 'bold 10px Cairo';
            ctx.fillStyle = '#f5f1df';
            ctx.shadowColor = 'rgba(0,0,0,0.9)';
            ctx.shadowBlur = 3;
            ctx.fillText(w.name, w.x, w.y + 27);
            ctx.shadowBlur = 0;

            // رسم فقاعة الكلام العائمة (Speech Bubble)
            if (w.bubble && now < w.bubbleUntil) {
                ctx.font = 'bold 9px Cairo';
                const textWidth = ctx.measureText(w.bubble).width;
                const bw = Math.max(52, textWidth + 16);
                const by = w.y - 37;

                // لوحة الخلفية للفقاعة
                ctx.fillStyle = 'rgba(18,23,28,0.9)';
                ctx.strokeStyle = 'rgba(255,208,96,0.55)';
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.roundRect(w.x - bw / 2, by - 11, bw, 20, 6);
                ctx.fill();
                ctx.stroke();

                // كتابة النص العربي بداخل الفقاعة
                ctx.fillStyle = '#fff0bd';
                ctx.textAlign = 'center';
                ctx.fillText(w.bubble, w.x, by);
            }
            ctx.restore();
        }
    }
}

// تصدير الكائن للنطاق العام
if (typeof window !== 'undefined') {
    window.BaseNPCManager = BaseNPCManager;
}
