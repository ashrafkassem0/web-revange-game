'use strict';
// =========================================================
//  FOREST PLAYER — حالة اللاعب، الرسم، والحركة
// =========================================================

const player = {
    x: 1600, y: 2800,
    w: 20, h: 28,
    hp: 100, maxHp: 100,
    stamina: 150,
    weapon: 'sword',
    attack: 30, defense: 5,
    skills: { sword: 1, bow: 1, swimming: 1, woodcutting: 0, fishing: 0 },
    absorbedAttack: 0, absorbedDefense: 0,
    inventory: { stick: 0, stone: 0, meat: 0, horn: 0, teeth: 0, leather: 0, fish: 0, arrows: 15 },
    craftedItems: { axe: false, fishingRod: false, hornSpear: false, hornSword: false, leatherArmor: false },
    attackCd: 0, hurtTimer: 0, chopCd: 0,
    walkTimer: 0, isMoving: false,
    isFishing: false, fishingTimer: 0, fishingBite: false, fishingBiteTimer: 0,
    poisoned: false, poisonTimer: 0, poisonDmg: 0,
    distanceTraveled: 0, lastX: 1600, lastY: 2800,
    killCount: 0, xp: 0,
    isSprinting: false, facing: Math.PI / 2,
};

// ===== UPDATE PLAYER =====
function updatePlayer(dt) {
    let dx = 0, dy = 0;
    if (keys['w'] || keys['W'] || keys['ArrowUp'])    dy -= 1;
    if (keys['s'] || keys['S'] || keys['ArrowDown'])  dy += 1;
    if (keys['a'] || keys['A'] || keys['ArrowLeft'])  dx -= 1;
    if (keys['d'] || keys['D'] || keys['ArrowRight']) dx += 1;

    const moving = dx !== 0 || dy !== 0;
    player.isMoving = moving;
    if (moving) {
        const walkSpeed = player.isSprinting ? 0.014 : 0.009;
        player.walkTimer += walkSpeed * (player.isSprinting ? 1.5 : 1.0);
    }
    if (dx !== 0 && dy !== 0) { dx *= 0.707; dy *= 0.707; }

    const wantSprint = keys['Shift'] && moving;
    if (wantSprint && player.stamina > 0) {
        player.stamina = Math.max(0, player.stamina - CFG.STAMINA_DRAIN);
        player.isSprinting = player.stamina > 0;
    } else {
        player.isSprinting = false;
        if (!moving || !wantSprint)
            player.stamina = Math.min(CFG.STAMINA_MAX, player.stamina + CFG.STAMINA_REGEN);
    }

    const spd = player.isSprinting ? CFG.SPRINT_SPEED : CFG.PLAYER_SPEED;
    let nx = player.x + dx * spd;
    let ny = player.y + dy * spd;

    nx = Math.max(14, Math.min(CFG.WORLD_W - 14, nx));
    ny = Math.max(14, Math.min(CFG.WORLD_H - 14, ny));

    for (const tree of trees) {
        const tdx = nx - tree.x, tdy = ny - tree.y;
        const d = Math.hypot(tdx, tdy);
        const minD = tree.r - 4 + 12;
        if (d < minD) {
            const a = Math.atan2(tdy, tdx);
            nx = tree.x + Math.cos(a) * minD;
            ny = tree.y + Math.sin(a) * minD;
        }
    }

    player.x = nx; player.y = ny;

    if (moving) {
        const d = Math.hypot(player.x - player.lastX, player.y - player.lastY);
        player.distanceTraveled += d;
        if (player.distanceTraveled % 300 < d) checkCompletion();
    }
    player.lastX = player.x; player.lastY = player.y;

    player.attackCd  = Math.max(0, player.attackCd - dt);
    player.hurtTimer = Math.max(0, player.hurtTimer - dt);
    player.chopCd    = Math.max(0, player.chopCd - dt);
    for (const t of trees) t.shakeTimer = Math.max(0, (t.shakeTimer || 0) - dt);

    for (const res of resources) res.update(dt);
}

// ===== DRAW PLAYER =====
function drawPlayer(camX, camY) {
    const sx = player.x - camX;
    const sy = player.y - camY;

    const wt        = player.walkTimer;
    const moving    = player.isMoving;
    const sprinting = player.isSprinting;
    const legSwing  = moving ? Math.sin(wt) * 5 : 0;
    const bodyBob   = moving ? Math.abs(Math.sin(wt)) * 1.5 : 0;
    const armSwingL = moving ? -Math.sin(wt) * 5 : 0;
    const armSwingR = moving ?  Math.sin(wt) * 5 : 0;

    ctx.save();
    if (player.hurtTimer > 0) ctx.globalAlpha = 0.5 + 0.5 * Math.sin(Date.now() * 0.03);

    const shadowW = sprinting ? 13 : 10;
    ctx.beginPath();
    ctx.ellipse(sx, sy + 13 - bodyBob, shadowW, 4, 0, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(0,0,0,0.32)';
    ctx.fill();

    // Left leg
    const legTop = sy + 8 - bodyBob;
    ctx.save();
    ctx.translate(sx - 4, legTop + 7);
    ctx.rotate(legSwing * 0.08);
    ctx.fillStyle = '#1a1a1a';
    ctx.beginPath(); ctx.roundRect(-3, -7, 6, 14, 2); ctx.fill();
    ctx.fillStyle = '#2a1810';
    ctx.beginPath(); ctx.roundRect(-4, 5, 8, 4, 1); ctx.fill();
    ctx.restore();

    // Right leg
    ctx.save();
    ctx.translate(sx + 4, legTop + 7);
    ctx.rotate(-legSwing * 0.08);
    ctx.fillStyle = '#1a1a1a';
    ctx.beginPath(); ctx.roundRect(-3, -7, 6, 14, 2); ctx.fill();
    ctx.fillStyle = '#2a1810';
    ctx.beginPath(); ctx.roundRect(-4, 5, 8, 4, 1); ctx.fill();
    ctx.restore();

    // Body
    const bodyY = sy - 8 - bodyBob;
    ctx.fillStyle = player.hurtTimer > 0 ? '#ff8888' : '#dde0e8';
    ctx.beginPath(); ctx.roundRect(sx - 8, bodyY, 16, 17, 3); ctx.fill();
    ctx.fillStyle = '#222';
    ctx.beginPath(); ctx.roundRect(sx - 8, bodyY + 2, 4, 13, [2, 0, 0, 2]); ctx.fill();
    ctx.beginPath(); ctx.roundRect(sx + 4, bodyY + 2, 4, 13, [0, 2, 2, 0]); ctx.fill();
    ctx.fillStyle = '#5a3010';
    ctx.fillRect(sx - 8, bodyY + 13, 16, 3);
    ctx.fillStyle = '#c8a040';
    ctx.fillRect(sx - 2, bodyY + 13, 4, 3);

    // Left arm
    ctx.save();
    ctx.translate(sx - 9, bodyY + 3);
    ctx.rotate(armSwingL * 0.07);
    ctx.fillStyle = player.hurtTimer > 0 ? '#ff8888' : '#dde0e8';
    ctx.beginPath(); ctx.roundRect(-3, 0, 5, 10, 2); ctx.fill();
    ctx.fillStyle = '#c8a070';
    ctx.beginPath(); ctx.arc(0, 11, 3, 0, Math.PI * 2); ctx.fill();
    ctx.restore();

    // Right arm
    ctx.save();
    ctx.translate(sx + 9, bodyY + 3);
    ctx.rotate(armSwingR * 0.07);
    ctx.fillStyle = player.hurtTimer > 0 ? '#ff8888' : '#dde0e8';
    ctx.beginPath(); ctx.roundRect(-2, 0, 5, 10, 2); ctx.fill();
    ctx.fillStyle = '#c8a070';
    ctx.beginPath(); ctx.arc(1, 11, 3, 0, Math.PI * 2); ctx.fill();
    ctx.restore();

    // Head
    const headY = sy - 15 - bodyBob;
    ctx.fillStyle = '#b89060';
    ctx.fillRect(sx - 3, headY + 8, 6, 5);
    ctx.beginPath(); ctx.arc(sx, headY, 10, 0, Math.PI * 2);
    ctx.fillStyle = '#c8a070'; ctx.fill();
    ctx.beginPath(); ctx.arc(sx, headY - 3, 8, Math.PI, Math.PI * 2);
    ctx.fillStyle = '#3a1e05'; ctx.fill();
    ctx.fillStyle = '#3a1e05';
    ctx.fillRect(sx - 9, headY - 4, 3, 5);
    ctx.fillRect(sx + 6, headY - 4, 3, 5);
    ctx.fillStyle = '#1a0a00';
    ctx.beginPath(); ctx.arc(sx - 3, headY - 1, 2, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(sx + 3, headY - 1, 2, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    ctx.beginPath(); ctx.arc(sx - 2, headY - 2, 0.8, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(sx + 4, headY - 2, 0.8, 0, Math.PI * 2); ctx.fill();

    // Weapon
    if (player.weapon === 'sword') {
        ctx.strokeStyle = '#8a6030'; ctx.lineWidth = 4; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(sx + 7, bodyY + 10); ctx.lineTo(sx + 10, bodyY + 3); ctx.stroke();
        ctx.strokeStyle = '#c0a040'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(sx + 5, bodyY + 3); ctx.lineTo(sx + 15, bodyY); ctx.stroke();
        ctx.strokeStyle = '#d0d0e0'; ctx.lineWidth = 2.5;
        ctx.beginPath(); ctx.moveTo(sx + 10, bodyY + 3); ctx.lineTo(sx + 22, bodyY - 14); ctx.stroke();
    } else {
        ctx.strokeStyle = '#8a6030'; ctx.lineWidth = 2.5;
        ctx.beginPath(); ctx.arc(sx - 11, bodyY + 5, 13, -Math.PI * 0.42, Math.PI * 0.42); ctx.stroke();
        ctx.strokeStyle = '#e0d0a0'; ctx.lineWidth = 0.8;
        ctx.beginPath(); ctx.moveTo(sx - 11, bodyY - 8); ctx.lineTo(sx - 11, bodyY + 18); ctx.stroke();
    }

    // Sprint dust
    if (sprinting) {
        const dustAlpha = 0.15 + 0.05 * Math.sin(wt * 3);
        ctx.globalAlpha = dustAlpha;
        ctx.fillStyle = '#c8a878';
        for (let i = 0; i < 4; i++) {
            const ds = 4 + i * 2;
            ctx.beginPath();
            ctx.arc(sx - 8 + i * 5 + Math.sin(wt + i) * 2, sy + 16 + bodyBob, ds, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    ctx.restore();

    // Sword swing arc
    if (player.attackCd > CFG.ATTACK_CD - 200 && player.weapon === 'sword') {
        ctx.save();
        ctx.globalAlpha = 0.4 - (CFG.ATTACK_CD - player.attackCd) * 0.002;
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(sx, sy - 6, CFG.SWORD_RANGE * 0.6, -Math.PI * 0.8, -Math.PI * 0.1);
        ctx.stroke();
        ctx.restore();
    }
}
