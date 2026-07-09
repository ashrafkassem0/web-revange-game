'use strict';
// =========================================================
//  FOREST ENTITIES — كلاسات الأعداء والسهام والعناصر
// =========================================================

// ===== ENEMY CLASS =====
class Enemy {
    constructor(tmpl, x, y, savedLevel) {
        Object.assign(this, JSON.parse(JSON.stringify(tmpl)));
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
        // صقل AI
        this._stuckAcc = 0;
        this._lastStuckX = x;
        this._lastStuckY = y;
        this.alertTimer = 0;
        this.alertX = 0;
        this.alertY = 0;
        this.smokePuffs = [];
        this._packCalled = false;

        // مستوى الوحش + تحجيم الإحصائيات
        const lo = tmpl.levelMin != null ? tmpl.levelMin : 1;
        const hi = tmpl.levelMax != null ? tmpl.levelMax : lo;
        if (typeof savedLevel === 'number' && savedLevel >= lo && savedLevel <= hi) {
            this.level = savedLevel;
        } else {
            this.level = lo + Math.floor(Math.random() * (hi - lo + 1));
        }
        this._baseHp = tmpl.hp;
        this._baseAtk = tmpl.attackDmg || 0;
        this._baseXp = tmpl.xp || 10;
        this._levelMin = lo;
        this._applyLevelStats();
    }

    _applyLevelStats() {
        const t = Math.max(0, (this.level || 1) - (this._levelMin || 1));
        this.maxHp = Math.round(this._baseHp * (1 + 0.08 * t));
        this.hp = this.maxHp;
        if (this._baseAtk > 0) {
            this.attackDmg = Math.round(this._baseAtk * (1 + 0.06 * t));
        }
        this.xp = Math.round(this._baseXp * (1 + 0.12 * ((this.level || 1) - 1)));
    }

    /** لون الخطر نسبةً لمستوى اللاعب: أخضر أضعف · أزرق متكافئ · أحمر أخطر */
    getThreatColor() {
        const pLv = (typeof player !== 'undefined' && player.level) ? player.level : 1;
        const eLv = this.level || 1;
        if (eLv > pLv) return '#e74c3c';
        if (eLv === pLv) return '#3498db';
        return '#2ecc71';
    }

    _effectiveAggro() {
        let r = this.aggroRange || 0;
        if (this.nocturnal && typeof isNight !== 'undefined' && isNight) r *= 1.12;
        return r;
    }

    _isChasing(dist) {
        // بعد الإصابة (سيف/قوس) يطارد من أي مسافة
        if (this.provoked) return true;
        if (this.behavior === 'aggressive' && dist < this._effectiveAggro()) return true;
        return false;
    }

    _campfirePush() {
        let firePushX = 0, firePushY = 0;
        if (typeof structures === 'undefined' || !structures.length) return { x: 0, y: 0 };
        const repel = (typeof CFG !== 'undefined' && CFG.CAMPFIRE_REPEL_RANGE) || 170;
        for (const s of structures) {
            if (s.type !== 'campfire' || !s.lit) continue;
            const fdx = this.x - s.x, fdy = this.y - s.y;
            const fd = Math.hypot(fdx, fdy);
            if (fd > 0.1 && fd < repel) {
                const push = (1 - fd / repel) * this.speed * 0.85;
                firePushX += (fdx / fd) * push;
                firePushY += (fdy / fd) * push;
            }
        }
        return { x: firePushX, y: firePushY };
    }

    /** دفع بعيداً عن بوابة المدينة (منطقة آمنة) */
    _portalPush() {
        if (typeof cityPortalRepelForce !== 'function') return { x: 0, y: 0 };
        return cityPortalRepelForce(this.x, this.y, this.speed);
    }

    _spawnSmoke(n) {
        n = n || 4;
        for (let i = 0; i < n; i++) {
            this.smokePuffs.push({
                x: this.x + (Math.random() - 0.5) * 18,
                y: this.y + (Math.random() - 0.5) * 12,
                r: 3 + Math.random() * 5,
                life: 280 + Math.random() * 220,
                max: 400
            });
        }
    }

    _updateSmoke(dt) {
        if (!this.smokePuffs.length) return;
        for (const p of this.smokePuffs) {
            p.life -= dt;
            p.y -= dt * 0.012;
            p.r += dt * 0.004;
        }
        this.smokePuffs = this.smokePuffs.filter(p => p.life > 0);
    }

    _unstick() {
        // دفعة زاوية أو قفزة قصيرة نحو بلاطة مفتوحة
        const towardPlayer = Math.atan2(player.y - this.y, player.x - this.x);
        const angles = [
            towardPlayer + 0.9,
            towardPlayer - 0.9,
            towardPlayer + Math.PI * 0.5,
            towardPlayer - Math.PI * 0.5,
            towardPlayer
        ];
        const step = 36;
        for (const a of angles) {
            const tx = this.x + Math.cos(a) * step;
            const ty = this.y + Math.sin(a) * step;
            if (tx < this.radius || ty < this.radius ||
                tx > CFG.WORLD_W - this.radius || ty > CFG.WORLD_H - this.radius) continue;
            if (!this.swims && isWater(tx, ty)) continue;
            this.x = tx;
            this.y = ty;
            this.wanderAngle = a;
            this.vx = Math.cos(a) * this.speed;
            this.vy = Math.sin(a) * this.speed;
            this._spawnSmoke(5);
            this._stuckAcc = 0;
            this._lastStuckX = this.x;
            this._lastStuckY = this.y;
            return;
        }
        // احتياطي: إزاحة عشوائية صغيرة
        this.x += (Math.random() - 0.5) * 28;
        this.y += (Math.random() - 0.5) * 28;
        this._spawnSmoke(3);
        this._stuckAcc = 0;
    }

    _trackStuck(dt, chasing) {
        if (!chasing) {
            this._stuckAcc = 0;
            this._lastStuckX = this.x;
            this._lastStuckY = this.y;
            return;
        }
        const moved = Math.hypot(this.x - this._lastStuckX, this.y - this._lastStuckY);
        if (moved < 2.5) this._stuckAcc += dt;
        else {
            this._stuckAcc = 0;
            this._lastStuckX = this.x;
            this._lastStuckY = this.y;
        }
        if (this._stuckAcc >= 3000) this._unstick();
    }

    _alertNearby(radius) {
        if (typeof enemies === 'undefined') return;
        const R = radius || 220;
        for (const e of enemies) {
            if (e === this || e.isDead) continue;
            if (e.id !== this.id) continue;
            if (Math.hypot(e.x - this.x, e.y - this.y) > R) continue;
            e.alertTimer = 2200 + Math.random() * 600;
            e.alertX = this.x;
            e.alertY = this.y;
        }
    }

    _packCue() {
        // ذئاب قريبة: إن هاجم أحدها، ينبّه الآخر مرة واحدة
        if (this._packCalled) return;
        if (this.id !== 'wolf' && this.id !== 'direWolf') return;
        if (typeof enemies === 'undefined') return;
        this._packCalled = true;
        for (const e of enemies) {
            if (e === this || e.isDead) continue;
            if (e.id !== 'wolf' && e.id !== 'direWolf') continue;
            const dHome = Math.hypot(
                (e.homeX || e.x) - (this.homeX || this.x),
                (e.homeY || e.y) - (this.homeY || this.y)
            );
            if (dHome > 280) continue;
            if (Math.hypot(e.x - this.x, e.y - this.y) > 320) continue;
            e.alertTimer = 2500;
            e.alertX = player.x;
            e.alertY = player.y;
            e._packCalled = true;
        }
    }

    applyProvokedStats() {
        if (this.behavior !== 'flee') return;
        this.provokedAttackDmg   = Math.max(3, Math.floor(this.maxHp * 0.08));
        this.provokedAttackRange = this.radius + 20;
        this.provokedAggroRange  = 400;
        this.provokedAttackCd    = 2000;
        this.provokedAttackTimer = this.provokedAttackTimer || 0;
        this.speed = Math.min((this.speed || 2) * 1.3, 5.5);
    }

    update(dt) {
        if (this.isDead) { this.deathTimer += dt; return; }
        this.attackTimer = Math.max(0, this.attackTimer - dt);
        this.hurtTimer   = Math.max(0, this.hurtTimer - dt);
        this.retreatTimer = Math.max(0, (this.retreatTimer || 0) - dt);
        this.alertTimer = Math.max(0, (this.alertTimer || 0) - dt);
        this._updateSmoke(dt);

        const dx = player.x - this.x;
        const dy = player.y - this.y;
        const dist = Math.hypot(dx, dy);
        const fire = this._campfirePush();
        const portal = this._portalPush();
        const pushX = fire.x + portal.x;
        const pushY = fire.y + portal.y;

        // داخل المنطقة الآمنة: أولوية الخروج فوراً (لا مطاردة داخل البوابة)
        if (typeof isInCityPortalSafeZone === 'function' && isInCityPortalSafeZone(this.x, this.y)) {
            this.vx = pushX || ((this.x - CITY_PORTAL.x) || 1) * 0.02;
            this.vy = pushY || ((this.y - CITY_PORTAL.y) || 1) * 0.02;
            const nx = Math.max(this.radius, Math.min(CFG.WORLD_W - this.radius, this.x + this.vx));
            const ny = Math.max(this.radius, Math.min(CFG.WORLD_H - this.radius, this.y + this.vy));
            this.x = nx; this.y = ny;
            return;
        }

        // تنبيه: يمشي نحو نقطة الإنذار لفترة قصيرة
        if (this.alertTimer > 0 && !this._isChasing(dist) && !(this.provoked && this.behavior === 'flee')) {
            const ax = this.alertX - this.x, ay = this.alertY - this.y;
            const ad = Math.hypot(ax, ay);
            if (ad > 8) {
                this.vx = (ax / ad) * this.speed * 0.85 + pushX;
                this.vy = (ay / ad) * this.speed * 0.85 + pushY;
            }
        // بعد الهجوم: تراجع بطيء ثم اندفاع سريع للهجوم مجدداً
        } else if (this.retreatTimer > 0 && this.behavior === 'aggressive') {
            const a = Math.atan2(-dy, -dx);
            const retreatSpd = this.speed * 0.28;
            this.vx = Math.cos(a) * retreatSpd + pushX;
            this.vy = Math.sin(a) * retreatSpd + pushY;
        } else if (this.provoked && this.behavior === 'flee') {
            this.provokedAttackTimer = Math.max(0, (this.provokedAttackTimer || 0) - dt);
            if (this.retreatTimer > 0) {
                const a = Math.atan2(-dy, -dx);
                const retreatSpd = this.speed * 0.28;
                this.vx = Math.cos(a) * retreatSpd + pushX;
                this.vy = Math.sin(a) * retreatSpd + pushY;
            } else {
                const a = Math.atan2(dy, dx);
                const chargeSpd = this.speed * 1.7;
                this.vx = Math.cos(a) * chargeSpd + pushX;
                this.vy = Math.sin(a) * chargeSpd + pushY;
                if (dist < this.provokedAttackRange + this.radius && this.provokedAttackTimer <= 0) {
                    this.provokedAttackTimer = this.provokedAttackCd;
                    this.retreatTimer = 1000;
                    const dmg = (typeof CharacterRules !== 'undefined' && CharacterRules.applyDefense)
                        ? CharacterRules.applyDefense(this.provokedAttackDmg, player)
                        : this.provokedAttackDmg;
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
                this.vx = Math.cos(a) * fleeSpd + pushX;
                this.vy = Math.sin(a) * fleeSpd + pushY;
            } else {
                this._wander(dt);
                this.vx += pushX;
                this.vy += pushY;
            }
        } else if (this.behavior === 'aggressive') {
            const aggro = this._effectiveAggro();
            // مستثار (مثلاً بسهم بعيد) أو داخل مدى العداء → مطاردة بلا حد مسافة
            if (this.provoked || dist < aggro) {
                const a = Math.atan2(dy, dx);
                const chargeSpd = this.attackTimer > 0 ? this.speed * 1.7 : this.speed;
                this.vx = Math.cos(a) * chargeSpd + pushX;
                this.vy = Math.sin(a) * chargeSpd + pushY;
                if (dist < this.attackRange + this.radius + 14 && this.attackTimer <= 0) {
                    this._attackPlayer();
                }
                this._packCue();
            } else {
                // خارج المدى وغير مستثار: عودة نحو المنزل إن ابتعد كثيراً
                const homeDist = (this.homeX != null)
                    ? Math.hypot(this.x - this.homeX, this.y - this.homeY) : 0;
                if (homeDist > (this.leashRadius || 400) * 0.85) {
                    const a = Math.atan2(this.homeY - this.y, this.homeX - this.x);
                    this.vx = Math.cos(a) * this.speed * 0.55 + pushX;
                    this.vy = Math.sin(a) * this.speed * 0.55 + pushY;
                } else {
                    this._wander(dt);
                    this.vx += pushX;
                    this.vy += pushY;
                }
            }
        }

        let nx = Math.max(this.radius, Math.min(CFG.WORLD_W - this.radius, this.x + this.vx));
        let ny = Math.max(this.radius, Math.min(CFG.WORLD_H - this.radius, this.y + this.vy));

        // امنع الدخول إلى منطقة بوابة المدينة الآمنة
        if (typeof isInCityPortalSafeZone === 'function' && isInCityPortalSafeZone(nx, ny)) {
            const rep = (typeof cityPortalRepelForce === 'function')
                ? cityPortalRepelForce(this.x, this.y, this.speed)
                : { x: 0, y: 0 };
            nx = Math.max(this.radius, Math.min(CFG.WORLD_W - this.radius, this.x + rep.x));
            ny = Math.max(this.radius, Math.min(CFG.WORLD_H - this.radius, this.y + rep.y));
            if (isInCityPortalSafeZone(nx, ny)) {
                nx = this.x;
                ny = this.y;
            }
        }

        if (this.swims) {
            this.x = nx;
            this.y = ny;
        } else {
            const inWaterX = isWater(nx, this.y);
            const inWaterY = isWater(this.x, ny);
            if (!inWaterX) this.x = nx; else { this.vx = 0; this.wanderAngle = Math.random() * Math.PI * 2; }
            if (!inWaterY) this.y = ny; else { this.vy = 0; this.wanderAngle = Math.random() * Math.PI * 2; }
        }

        if (typeof resolveStructureCollision === 'function') {
            const rp = resolveStructureCollision(this.x, this.y, this.radius, true);
            this.x = rp.x; this.y = rp.y;
        }

        this._trackStuck(dt, this._isChasing(dist));
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
        const raw = this.attackDmg;
        const dmg = (typeof CharacterRules !== 'undefined' && CharacterRules.applyDefense)
            ? CharacterRules.applyDefense(raw, player)
            : raw;
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
        this.alertTimer = 900;
        this.alertX = this.x;
        this.alertY = this.y;
        SFX.hit();
        notify(`-${amount}`, '#ff8060', this.x, this.y - this.radius - 6);
        this._alertNearby(220);
        if (this.hp <= 0) {
            this._die();
        } else if (!this.provoked) {
            this.provoked = true;
            if (this.behavior === 'flee') this.applyProvokedStats();
            notify('😡 استشاط غضباً!', '#ff4400', this.x, this.y - this.radius - 18);
            this._packCue();
        }
    }

    _die() {
        this.isDead = true;
        this.provoked = false;
        this.alertTimer = 0;
        this.smokePuffs = [];
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
        if (typeof CharacterRules !== 'undefined' && CharacterRules.syncHeroCombatStats) {
            CharacterRules.syncHeroCombatStats(player);
        } else {
            player.attack = CharacterRules.playerSwordDamage(player.skills, player.absorbedAttack, player.level);
        }
        const xpResult = (typeof grantKillXp === 'function')
            ? grantKillXp(player, this)
            : { leveled: false, prevLevel: player.level || 1 };
        player.killCount++;

        if (ab.hpGain > 0) notify(`⚡ +${ab.hpGain} مهارة`, '#f0c040', this.x, this.y + 18);
        SFX.xp();
        if (typeof ForestQuests !== 'undefined' && ForestQuests.onEvent) {
            ForestQuests.onEvent({
                type: 'kill',
                enemyId: this.id,
                level: this.level || 1,
                nocturnal: !!this.nocturnal
            });
        }
        updateHUD();
        checkCompletion();
        if (xpResult.leveled) {
            if (typeof saveForestProgress === 'function') saveForestProgress({ force: true });
        } else if (player.killCount % 5 === 0) {
            saveForestProgress({ debounce: true });
        }
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

        // دخان فكّ التعليق
        if (this.smokePuffs && this.smokePuffs.length) {
            for (const p of this.smokePuffs) {
                const a = Math.max(0, p.life / (p.max || 400)) * 0.45;
                ctx.beginPath();
                ctx.arc(p.x - cx, p.y - cy, p.r, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(180,180,180,${a})`;
                ctx.fill();
            }
        }

        if (this.provoked) {
            const pulse = 0.28 + 0.22 * Math.sin(Date.now() * 0.014);
            ctx.beginPath();
            ctx.arc(sx, sy, this.radius + 7 + pulse * 4, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(255,40,0,${pulse})`;
            ctx.fill();
            ctx.beginPath();
            ctx.arc(sx, sy, this.radius + 4, 0, Math.PI * 2);
            ctx.strokeStyle = `rgba(255,120,40,${0.55 + pulse * 0.4})`;
            ctx.lineWidth = 2.5;
            ctx.stroke();
        }

        ctx.beginPath();
        ctx.arc(sx, sy, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = this.hurtTimer > 0 ? '#ff5555' : (this.provoked ? '#cc2200' : this.color);
        ctx.fill();
        ctx.strokeStyle = this.provoked ? 'rgba(255,80,0,0.9)' : 'rgba(0,0,0,0.55)';
        ctx.lineWidth = this.provoked ? 2.8 : 1.5;
        ctx.stroke();

        ctx.font = `${Math.floor(this.radius * 1.25)}px serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.globalAlpha = (this.hurtTimer > 0) ? 0.7 : 1.0;
        ctx.fillText(this.emoji, sx, sy + 1);

        // علامة تنبيه عند الضربة / استدعاء القطيع
        if (!this.isDead && this.alertTimer > 400) {
            ctx.globalAlpha = Math.min(1, this.alertTimer / 600);
            ctx.font = 'bold 16px Cairo';
            ctx.fillStyle = '#ffd060';
            ctx.strokeStyle = 'rgba(0,0,0,0.85)';
            ctx.lineWidth = 3;
            ctx.strokeText('!', sx, sy - this.radius - 28);
            ctx.fillText('!', sx, sy - this.radius - 28);
        }

        // اسم الوحش + المستوى (قريب من اللاعب ~200px) بلون الخطر
        if (!this.isDead) {
            const pdx = (typeof player !== 'undefined' ? player.x : this.x) - this.x;
            const pdy = (typeof player !== 'undefined' ? player.y : this.y) - this.y;
            if (pdx * pdx + pdy * pdy <= 200 * 200) {
                const labelY = sy - this.radius - (this.hp < this.maxHp ? 22 : 14);
                const label = `${this.name || this.id} · م${this.level || 1}`;
                const threat = this.getThreatColor();
                ctx.globalAlpha = 1;
                ctx.font = 'bold 11px Cairo, Tajawal, sans-serif';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'bottom';
                ctx.lineWidth = 3.5;
                ctx.strokeStyle = 'rgba(0,0,0,0.8)';
                ctx.strokeText(label, sx, labelY);
                ctx.fillStyle = threat;
                ctx.fillText(label, sx, labelY);
            }
        }

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
        this.dmg = CharacterRules.playerBowDamage(player.skills, player.absorbedAttack, player.level);
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
        this.radius    = type === 'stick' ? 12
            : type === 'herb' ? 11
            : type === 'honey' ? 14
            : 15;
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
        player.inventory[this.type] = (player.inventory[this.type] || 0) + this.amount;
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
        } else if (this.type === 'herb') {
            // ورقة عشبة بسيطة
            ctx.fillStyle = '#3d9a45';
            ctx.beginPath();
            ctx.ellipse(sx, sy - 2, 5, 9, -0.35, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#5ecf66';
            ctx.beginPath();
            ctx.ellipse(sx + 4, sy + 1, 4, 7, 0.4, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = '#2a6b30';
            ctx.lineWidth = 1.2;
            ctx.beginPath();
            ctx.moveTo(sx, sy + 6);
            ctx.lineTo(sx, sy - 8);
            ctx.stroke();
        } else if (this.type === 'honey') {
            // خلية عسل بسيطة (شكل سداسي تقريبي)
            ctx.fillStyle = '#c9a227';
            ctx.beginPath();
            ctx.moveTo(sx, sy - 10);
            ctx.lineTo(sx + 9, sy - 4);
            ctx.lineTo(sx + 9, sy + 5);
            ctx.lineTo(sx, sy + 11);
            ctx.lineTo(sx - 9, sy + 5);
            ctx.lineTo(sx - 9, sy - 4);
            ctx.closePath();
            ctx.fill();
            ctx.strokeStyle = '#8a6a10';
            ctx.lineWidth = 1.5;
            ctx.stroke();
            ctx.fillStyle = '#ffe066';
            ctx.beginPath();
            ctx.arc(sx, sy, 3.5, 0, Math.PI * 2);
            ctx.fill();
        } else {
            // حجر
            ctx.fillStyle = '#7a7a6a';
            ctx.beginPath(); ctx.ellipse(sx, sy, 11, 8, 0.3, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = '#999990';
            ctx.beginPath(); ctx.ellipse(sx - 2, sy - 3, 7, 5, -0.2, 0, Math.PI * 2); ctx.fill();
            ctx.strokeStyle = '#555'; ctx.lineWidth = 1; ctx.stroke();
        }

        ctx.font = '11px Cairo'; ctx.fillStyle = '#ccc';
        ctx.textAlign = 'center'; ctx.textBaseline = 'top';
        ctx.fillText(ITEM_EMOJIS[this.type] || '?', sx, sy + this.radius + 2);

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
