'use strict';
// =========================================================
//  FOREST ENTITIES — كلاسات الأعداء والسهام والعناصر
// =========================================================

// ===== ENEMY CLASS =====
class Enemy {
    constructor(tmpl, x, y) {
        Object.assign(this, JSON.parse(JSON.stringify(tmpl)));
        this.maxHp = this.hp;
        this.x = x; this.y = y;
        // نقطة المنزل: يبقى معظم الوقت قرب منطقة توليده
        this.homeX = x;
        this.homeY = y;
        this.leashRadius = 400;
        this.vx = 0; this.vy = 0;
        this.wanderTimer = 0;
        this.wanderAngle = Math.random() * Math.PI * 2;
        this.attackTimer = 0;
        this.hurtTimer = 0;
        this.retreatTimer = 0; // بعد الهجوم: يتراجع للخلف ~1 ثانية ثم يهاجم مجدداً
        this.isDead = false;
        this.deathTimer = 0;
        this.provoked = false;
        this.uid = Math.random().toString(36).slice(2);
    }

    update(dt) {
        if (this.isDead) { this.deathTimer += dt; return; }
        this.attackTimer = Math.max(0, this.attackTimer - dt);
        this.hurtTimer   = Math.max(0, this.hurtTimer - dt);
        this.retreatTimer = Math.max(0, (this.retreatTimer || 0) - dt);

        const dx = player.x - this.x;
        const dy = player.y - this.y;
        const dist = Math.hypot(dx, dy);

        // بعد الهجوم: تراجع بطيء ثم اندفاع سريع للهجوم مجدداً
        if (this.retreatTimer > 0 && this.behavior === 'aggressive') {
            const a = Math.atan2(-dy, -dx);
            const retreatSpd = this.speed * 0.28; // تراجع بطيء
            this.vx = Math.cos(a) * retreatSpd;
            this.vy = Math.sin(a) * retreatSpd;
        } else if (this.provoked && this.behavior === 'flee') {
            this.provokedAttackTimer = Math.max(0, (this.provokedAttackTimer || 0) - dt);
            if (this.retreatTimer > 0) {
                const a = Math.atan2(-dy, -dx);
                const retreatSpd = this.speed * 0.28;
                this.vx = Math.cos(a) * retreatSpd;
                this.vy = Math.sin(a) * retreatSpd;
            } else {
                const a = Math.atan2(dy, dx);
                const chargeSpd = this.speed * 1.7; // اندفاع سريع للهجوم
                this.vx = Math.cos(a) * chargeSpd;
                this.vy = Math.sin(a) * chargeSpd;
                if (dist < this.provokedAttackRange + this.radius && this.provokedAttackTimer <= 0) {
                    this.provokedAttackTimer = this.provokedAttackCd;
                    this.retreatTimer = 1000;
                    const dmg = this.provokedAttackDmg;
                    player.hp = Math.max(0, player.hp - dmg);
                    player.hurtTimer = 400;
                    SFX.playerHurt();
                    flashScreen();
                    notify(`-${dmg} 💔`, '#e74c3c', this.x, this.y - this.radius - 8);
                    if (player.hp <= 0) killPlayer();
                    updateHUD();
                }
            }
        } else if (this.behavior === 'flee') {
            const fleeSpd = this.hurtTimer > 0
                ? this.speed * (0.4 + 0.4 * (this.hp / this.maxHp))
                : this.speed;
            if (dist < this.fleeRange) {
                const a = Math.atan2(-dy, -dx);
                this.vx = Math.cos(a) * fleeSpd;
                this.vy = Math.sin(a) * fleeSpd;
            } else { this._wander(dt); }
        } else if (this.behavior === 'aggressive') {
            if (dist < this.aggroRange) {
                const a = Math.atan2(dy, dx);
                // بعد التراجع: اندفاع سريع نحو اللاعب للهجوم
                const chargeSpd = this.attackTimer > 0 ? this.speed * 1.7 : this.speed;
                this.vx = Math.cos(a) * chargeSpd;
                this.vy = Math.sin(a) * chargeSpd;
                if (dist < this.attackRange + this.radius + 14 && this.attackTimer <= 0) {
                    this._attackPlayer();
                }
            } else { this._wander(dt); }
        }

        const nx = Math.max(this.radius, Math.min(CFG.WORLD_W - this.radius, this.x + this.vx));
        const ny = Math.max(this.radius, Math.min(CFG.WORLD_H - this.radius, this.y + this.vy));

        if (this.swims) {
            // الحيوانات المائية تتحرك بحرية في الماء واليابسة
            this.x = nx;
            this.y = ny;
        } else {
            const inWaterX = isWater(nx, this.y);
            const inWaterY = isWater(this.x, ny);
            if (!inWaterX) this.x = nx; else { this.vx = 0; this.wanderAngle = Math.random() * Math.PI * 2; }
            if (!inWaterY) this.y = ny; else { this.vy = 0; this.wanderAngle = Math.random() * Math.PI * 2; }
        }

        // تصادم مع المباني (السياج/الكوخ يمنع الوحوش)
        if (typeof resolveStructureCollision === 'function') {
            const rp = resolveStructureCollision(this.x, this.y, this.radius, true);
            this.x = rp.x; this.y = rp.y;
        }
    }

    _wander(dt) {
        this.wanderTimer -= dt;
        if (this.wanderTimer <= 0) {
            this.wanderTimer = 1500 + Math.random() * 2500;
            let bestAngle = Math.random() * Math.PI * 2;
            const step = CFG.TILE_SIZE * 1.5;
            for (let attempt = 0; attempt < 8; attempt++) {
                const a = Math.random() * Math.PI * 2;
                const tx = this.x + Math.cos(a) * step;
                const ty = this.y + Math.sin(a) * step;
                if (this.swims) {
                    // الحيوانات المائية تفضل البقاء في الماء
                    if (isWater(tx, ty)) { bestAngle = a; break; }
                } else {
                    if (!isWater(tx, ty)) { bestAngle = a; break; }
                }
            }
            // إن ابتعد عن منطقته: يميل للعودة نحو المنزل (حبل مرن)
            const leash = this.leashRadius || 0;
            if (leash > 0 && this.homeX != null) {
                const homeDist = Math.hypot(this.x - this.homeX, this.y - this.homeY);
                if (homeDist > leash) {
                    const homeA = Math.atan2(this.homeY - this.y, this.homeX - this.x);
                    const pull = Math.min(0.85, 0.35 + (homeDist - leash) / leash * 0.4);
                    const wx = Math.cos(bestAngle) * (1 - pull) + Math.cos(homeA) * pull;
                    const wy = Math.sin(bestAngle) * (1 - pull) + Math.sin(homeA) * pull;
                    bestAngle = Math.atan2(wy, wx);
                }
            }
            this.wanderAngle = bestAngle;
        }
        // خارج الحبل: يمشي أسرع قليلاً نحو المنزل
        let sp = this.speed * 0.3;
        if (this.leashRadius > 0 && this.homeX != null) {
            const homeDist = Math.hypot(this.x - this.homeX, this.y - this.homeY);
            if (homeDist > this.leashRadius * 1.35) sp = this.speed * 0.55;
        }
        this.vx = Math.cos(this.wanderAngle) * sp;
        this.vy = Math.sin(this.wanderAngle) * sp;
    }

    _attackPlayer() {
        // هجوم كل ثانيتين: يضرب ثم يتراجع للخلف ثانية ويعود
        this.attackTimer = this.attackCooldown || 2000;
        this.retreatTimer = 1000;
        const dmg = this.attackDmg;
        player.hp = Math.max(0, player.hp - dmg);
        player.hurtTimer = 400;
        if (this.poisonDamage && Math.random() < 0.5) {
            player.poisoned = true;
            player.poisonTimer = this.poisonDuration;
            player.poisonDmg = this.poisonDamage;
        }
        SFX.playerHurt();
        flashScreen();
        if (dmg > 0) notify(`-${dmg} 💔`, '#e74c3c', this.x, this.y - this.radius - 8);
        if (player.hp <= 0) killPlayer();
        updateHUD();
    }

    takeDamage(amount) {
        if (this.isDead) return;
        this.hp -= amount;
        this.hurtTimer = 300;
        SFX.hit();
        notify(`-${amount}`, '#ff8060', this.x, this.y - this.radius - 6);
        if (this.hp <= 0) {
            this._die();
        } else if (!this.provoked) {
            this.provoked = true;
            if (this.behavior === 'flee') {
                this.provokedAttackDmg   = Math.max(3, Math.floor(this.maxHp * 0.08));
                this.provokedAttackRange = this.radius + 20;
                this.provokedAggroRange  = 400;
                this.provokedAttackCd    = 2000;
                this.provokedAttackTimer = 0;
                this.speed = Math.min(this.speed * 1.3, 5.5);
            }
            notify('😡 استشاط غضباً!', '#ff4400', this.x, this.y - this.radius - 18);
        }
    }

    _die() {
        this.isDead = true;
        SFX.kill();

        let dropCount = 0;
        for (const [item, cfg] of Object.entries(this.drops || {})) {
            if (Math.random() < cfg.chance) {
                droppedItems.push(new DroppedItem(item, cfg.amount, this.x, this.y));
                dropCount++;
            }
        }

        const hpOrb = Math.max(3, Math.floor(this.maxHp * 0.12));
        droppedItems.push(new DroppedItem('healthOrb', hpOrb, this.x, this.y));

        if (dropCount > 0) {
            notify('⬇️ اقترب لالتقاط الغنائم', '#f0c040', this.x, this.y - this.radius - 12);
        } else {
            notify('⬇️ ❤️ اقترب للتعافي', '#e74c3c', this.x, this.y - this.radius - 12);
        }

        const ab = CharacterRules.absorbOnKill(player, this);
        player.skills = ab.skills;
        player.absorbedAttack  = ab.absorbedAttack;
        player.absorbedDefense = ab.absorbedDefense;
        player.attack = CharacterRules.playerSwordDamage(player.skills, player.absorbedAttack);
        player.xp += this.xp || 10;
        player.killCount++;

        if (ab.hpGain > 0) notify(`⚡ +${ab.hpGain} مهارة`, '#f0c040', this.x, this.y + 18);
        SFX.xp();
        updateHUD();
        checkCompletion();
        if (player.killCount % 5 === 0) saveForestProgress();
    }

    draw(cx, cy) {
        const sx = this.x - cx;
        const sy = this.y - cy;
        const W = canvas.width / ZOOM, H = canvas.height / ZOOM;
        if (sx < -60 || sx > W + 60 || sy < -60 || sy > H + 60) return;

        ctx.save();
        if (this.isDead) {
            ctx.globalAlpha = Math.max(0, 1 - this.deathTimer / 800);
            if (ctx.globalAlpha <= 0) { ctx.restore(); return; }
        }
        if (this.hurtTimer > 0) ctx.globalAlpha = 0.55 + 0.45 * Math.sin(Date.now() * 0.025);

        ctx.beginPath();
        ctx.ellipse(sx, sy + this.radius * 0.85, this.radius * 0.8, this.radius * 0.28, 0, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(0,0,0,0.3)';
        ctx.fill();

        if (this.provoked && this.behavior === 'flee') {
            ctx.beginPath();
            ctx.arc(sx, sy, this.radius + 5, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(255,50,0,${0.25 + 0.15 * Math.sin(Date.now() * 0.01)})`;
            ctx.fill();
        }

        ctx.beginPath();
        ctx.arc(sx, sy, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = this.hurtTimer > 0 ? '#ff5555' : (this.provoked ? '#cc2200' : this.color);
        ctx.fill();
        ctx.strokeStyle = this.provoked ? 'rgba(255,80,0,0.8)' : 'rgba(0,0,0,0.55)';
        ctx.lineWidth = this.provoked ? 2.5 : 1.5;
        ctx.stroke();

        ctx.font = `${Math.floor(this.radius * 1.25)}px serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.globalAlpha = (this.hurtTimer > 0) ? 0.7 : 1.0;
        ctx.fillText(this.emoji, sx, sy + 1);

        if (!this.isDead && this.hp < this.maxHp) {
            const bw = this.radius * 2.4, bh = 5;
            const bx = sx - bw / 2, by = sy - this.radius - 10;
            ctx.globalAlpha = 1;
            ctx.fillStyle = '#333';
            ctx.fillRect(bx, by, bw, bh);
            ctx.fillStyle = this.hp / this.maxHp > 0.5 ? '#2ecc71' : '#e74c3c';
            ctx.fillRect(bx, by, bw * (this.hp / this.maxHp), bh);
        }
        ctx.restore();
    }
}

// ===== ARROW CLASS =====
class Arrow {
    constructor(x, y, angle) {
        this.x = x; this.y = y;
        this.angle = angle;
        this.dmg = CharacterRules.playerBowDamage(player.skills, player.absorbedAttack);
        this.traveled = 0;
        this.dead = false;
    }
    update() {
        this.x += Math.cos(this.angle) * CFG.ARROW_SPEED;
        this.y += Math.sin(this.angle) * CFG.ARROW_SPEED;
        this.traveled += CFG.ARROW_SPEED;
        if (this.traveled > CFG.BOW_RANGE || this.x < 0 || this.x > CFG.WORLD_W || this.y < 0 || this.y > CFG.WORLD_H) {
            this.dead = true; return;
        }
        for (const e of enemies) {
            if (e.isDead) continue;
            if (Math.hypot(e.x - this.x, e.y - this.y) < e.radius + 5) {
                e.takeDamage(this.dmg);
                this.dead = true;
                break;
            }
        }
    }
    draw(cx, cy) {
        ctx.save();
        ctx.translate(this.x - cx, this.y - cy);
        ctx.rotate(this.angle);
        ctx.strokeStyle = '#c8a040';
        ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(-14, 0); ctx.lineTo(8, 0); ctx.stroke();
        ctx.fillStyle = '#e0e0e0';
        ctx.beginPath(); ctx.moveTo(8, 0); ctx.lineTo(2, -4); ctx.lineTo(2, 4); ctx.closePath(); ctx.fill();
        ctx.restore();
    }
}

// ===== DROPPED ITEM (ground loot) =====
class DroppedItem {
    constructor(type, amount, x, y) {
        this.type = type;
        this.amount = amount;
        this.x = x + (Math.random() - 0.5) * 44;
        this.y = y + (Math.random() - 0.5) * 44;
        this.collected = false;
        this.bobTimer   = Math.random() * Math.PI * 2;
        this.glowTimer  = Math.random() * 1000;
        this.isHealth   = (type === 'healthOrb');
    }

    update(dt) {
        this.bobTimer  += dt * 0.003;
        this.glowTimer += dt;
    }

    isNearPlayer() {
        return !this.collected &&
            Math.hypot(player.x - this.x, player.y - this.y) < CFG.ITEM_PICKUP_RANGE;
    }

    pickup() {
        if (this.collected) return;
        this.collected = true;
        if (this.isHealth) {
            const gained = Math.min(this.amount, player.maxHp - player.hp);
            player.hp = Math.min(player.maxHp, player.hp + this.amount);
            if (gained > 0) notify(`+${gained} ❤️`, '#e74c3c', this.x, this.y - 18);
        } else {
            player.inventory[this.type] = (player.inventory[this.type] || 0) + this.amount;
            const emoji = ITEM_EMOJIS[this.type] || '';
            const name  = ITEM_NAMES[this.type]  || this.type;
            notify(`+${this.amount} ${emoji} ${name}`, '#2ecc71', this.x, this.y - 18);
        }
        SFX.xp();
        updateHUD();
    }

    draw(cx, cy) {
        if (this.collected) return;
        const VW = canvas.width / ZOOM, VH = canvas.height / ZOOM;
        const sx = this.x - cx;
        const sy = this.y - cy + Math.sin(this.bobTimer) * 3;
        if (sx < -30 || sx > VW + 30 || sy < -30 || sy > VH + 30) return;

        ctx.save();
        ctx.beginPath();
        ctx.ellipse(sx, sy + 9, 11, 4, 0, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(0,0,0,0.28)';
        ctx.fill();

        const glow = 0.25 + 0.18 * Math.sin(this.glowTimer * 0.005);
        ctx.beginPath();
        ctx.arc(sx, sy, 15, 0, Math.PI * 2);
        ctx.fillStyle = this.isHealth
            ? `rgba(231,76,60,${glow})`
            : `rgba(46,204,113,${glow})`;
        ctx.fill();

        ctx.font = '20px serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(this.isHealth ? '❤️' : (ITEM_EMOJIS[this.type] || '?'), sx, sy);

        if (this.amount > 1) {
            ctx.font = 'bold 9px Cairo';
            ctx.fillStyle = '#fff';
            ctx.strokeStyle = '#000';
            ctx.lineWidth = 2;
            ctx.strokeText(`×${this.amount}`, sx + 10, sy + 10);
            ctx.fillText(`×${this.amount}`, sx + 10, sy + 10);
        }

        if (this.isNearPlayer()) {
            ctx.beginPath();
            ctx.arc(sx, sy, 18, 0, Math.PI * 2);
            ctx.strokeStyle = 'rgba(255,220,50,0.85)';
            ctx.lineWidth = 2;
            ctx.stroke();

            ctx.font = 'bold 10px Cairo';
            ctx.fillStyle = '#ffe066';
            ctx.strokeStyle = 'rgba(0,0,0,0.8)';
            ctx.lineWidth = 3;
            const label = `[E] ${this.isHealth ? 'استعادة' : 'خذ'}`;
            ctx.strokeText(label, sx, sy - 22);
            ctx.fillText(label, sx, sy - 22);
        }
        ctx.restore();
    }
}

// ===== RESOURCE NODE =====
class ResourceNode {
    constructor(type, x, y) {
        this.type = type;
        this.x = x; this.y = y;
        this.amount    = type === 'stick' ? 2 : 1;
        this.collected = false;
        this.radius    = type === 'stick' ? 12 : 15;
        this.glowTimer = Math.random() * 1000;
    }

    update(dt) {
        this.glowTimer += dt;
    }

    isNearPlayer() {
        return !this.collected &&
            Math.hypot(player.x - this.x, player.y - this.y) < CFG.ITEM_PICKUP_RANGE;
    }

    pickup() {
        if (this.collected) return false;
        this.collected = true;
        player.inventory[this.type] += this.amount;
        SFX.xp();
        notify(`+${this.amount} ${ITEM_EMOJIS[this.type]} ${ITEM_NAMES[this.type]}`, '#2ecc71', this.x, this.y - 20);
        updateHUD();
        return true;
    }

    draw(cx, cy) {
        if (this.collected) return;
        const sx = this.x - cx, sy = this.y - cy;
        if (sx < -40 || sx > canvas.width / ZOOM + 40 || sy < -40 || sy > canvas.height / ZOOM + 40) return;

        const near = this.isNearPlayer();
        ctx.save();

        if (near) {
            const glow = 0.22 + 0.16 * Math.sin(this.glowTimer * 0.005);
            ctx.beginPath();
            ctx.arc(sx, sy, this.radius + 8, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(255,220,50,${glow})`;
            ctx.fill();
        }

        if (this.type === 'stick') {
            ctx.lineWidth = 4; ctx.lineCap = 'round';
            for (let i = 0; i < 3; i++) {
                const a = (i / 3) * Math.PI - 0.3;
                ctx.strokeStyle = i === 1 ? '#a07040' : '#8b6030';
                ctx.beginPath();
                ctx.moveTo(sx + Math.cos(a) * 5,            sy + Math.sin(a) * 5);
                ctx.lineTo(sx + Math.cos(a + Math.PI) * 11, sy + Math.sin(a + Math.PI) * 11);
                ctx.stroke();
            }
        } else {
            ctx.fillStyle = '#7a7a6a';
            ctx.beginPath(); ctx.ellipse(sx, sy, 11, 8, 0.3, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = '#999990';
            ctx.beginPath(); ctx.ellipse(sx - 2, sy - 3, 7, 5, -0.2, 0, Math.PI * 2); ctx.fill();
            ctx.strokeStyle = '#555'; ctx.lineWidth = 1; ctx.stroke();
        }

        ctx.font = '11px Cairo'; ctx.fillStyle = '#ccc';
        ctx.textAlign = 'center'; ctx.textBaseline = 'top';
        ctx.fillText(ITEM_EMOJIS[this.type], sx, sy + this.radius + 2);

        if (near) {
            ctx.beginPath();
            ctx.arc(sx, sy, this.radius + 9, 0, Math.PI * 2);
            ctx.strokeStyle = 'rgba(255,220,50,0.85)';
            ctx.lineWidth = 2;
            ctx.stroke();

            ctx.font = 'bold 10px Cairo';
            ctx.fillStyle = '#ffe066';
            ctx.strokeStyle = 'rgba(0,0,0,0.8)';
            ctx.lineWidth = 3;
            ctx.textBaseline = 'middle';
            ctx.strokeText('[E] خذ', sx, sy - this.radius - 12);
            ctx.fillText('[E] خذ', sx, sy - this.radius - 12);
        }
        ctx.restore();
    }
}
