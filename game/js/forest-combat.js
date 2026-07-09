'use strict';
// =========================================================
//  FOREST COMBAT & FISHING — القتال والصيد وقطع الأشجار
// =========================================================

// ===== ATTACK =====
function playerAttack() {
    if (player.attackCd > 0 || gamePaused || craftMenuOpen) return;
    player.attackCd = CFG.ATTACK_CD;
    SFX.sword();
    let hit = 0;
    for (const e of enemies) {
        if (e.isDead) continue;
        if (Math.hypot(e.x - player.x, e.y - player.y) < CFG.SWORD_RANGE + e.radius) {
            e.takeDamage(CharacterRules.playerSwordDamage(player.skills, player.absorbedAttack));
            hit++;
        }
    }
    if (hit === 0) notify('مسافة بعيدة ↔', '#666');
}

function shootArrow() {
    if (player.attackCd > 0 || gamePaused || craftMenuOpen) return;
    player.attackCd = CFG.ATTACK_CD;

    let aimX = mouseWorldX, aimY = mouseWorldY;
    if (lockedTarget && !lockedTarget.isDead) {
        aimX = lockedTarget.x;
        aimY = lockedTarget.y;
    }

    const angle = Math.atan2(aimY - player.y, aimX - player.x);
    arrows.push(new Arrow(player.x, player.y - 8, angle));
    SFX.arrow();
}

// ===== FOOD: EAT / COOK / NAUSEA =====
// قيم الشفاء لكل صنف طعام
const FOOD_HEAL = {
    cookedMeat: 26, cookedFish: 20,
    rawMeat: 5, rawFish: 4, meat: 5, fish: 4,
    honey: 10, herbSalve: 18, revitalTonic: 28
};
const RAW_SET = { rawMeat: 1, rawFish: 1, meat: 1, fish: 1 };

// أكل صنف طعام محدّد (من الحقيبة أو مفتاح Q)
function eatFood(type) {
    if (!type || (player.inventory[type] || 0) <= 0) {
        notify('لا يوجد هذا الطعام!', '#e74c3c');
        return false;
    }
    player.inventory[type]--;
    const heal = FOOD_HEAL[type] != null ? FOOD_HEAL[type] : 6;
    player.hp = Math.min(player.maxHp, player.hp + heal);
    const emoji = (typeof ITEM_EMOJIS !== 'undefined' && ITEM_EMOJIS[type]) || '🍽️';
    const name  = (typeof ITEM_NAMES !== 'undefined' && ITEM_NAMES[type])  || type;

    if (RAW_SET[type]) {
        // طعام نيء → غثيان
        triggerNausea();
        notify(`🤢 أكلت ${name} نيئاً! (+${heal}❤️ لكنك أُصبت بالغثيان)`, '#8bc34a');
        if (typeof SFX !== 'undefined' && SFX.playerHurt) SFX.playerHurt();
    } else {
        notify(`+${heal}❤️ أكلت ${emoji} ${name}`, '#e74c3c');
        if (typeof SFX !== 'undefined' && SFX.xp) SFX.xp();
    }
    updateHUD();
    return true;
}

// مفتاح Q: يأكل أفضل طعام متاح (يفضّل المطهو)
function eatMeat() {
    const order = [
        'revitalTonic', 'herbSalve', 'cookedMeat', 'cookedFish',
        'honey', 'rawMeat', 'rawFish', 'meat', 'fish'
    ];
    for (const t of order) {
        if ((player.inventory[t] || 0) > 0) { eatFood(t); return; }
    }
    notify('لا يوجد طعام! 🍖🐟', '#e74c3c');
}

// طهي طعام نيء على موقد مشتعل قريب
function cookFood(type) {
    const cooked = (typeof RAW_FOODS !== 'undefined') ? RAW_FOODS[type] : null;
    if (!cooked) { notify('لا يمكن طهي هذا الصنف', '#e74c3c'); return false; }
    if ((player.inventory[type] || 0) <= 0) { notify('لا يوجد طعام نيء', '#e74c3c'); return false; }
    if (!(typeof isNearLitCampfire === 'function' && isNearLitCampfire())) {
        notify('🔥 اقترب من موقد مشتعل للطهي!', '#ff8040');
        return false;
    }
    player.inventory[type]--;
    player.inventory[cooked] = (player.inventory[cooked] || 0) + 1;
    const name = (typeof ITEM_NAMES !== 'undefined' && ITEM_NAMES[cooked]) || cooked;
    notify(`🔥 طهوت ${name}!`, '#ff8040');
    if (typeof SFX !== 'undefined' && SFX.xp) SFX.xp();
    updateHUD();
    if (typeof saveForestProgress === 'function') saveForestProgress({ debounce: true });
    return true;
}

// رمي عنصر أرضاً أمام اللاعب
function throwItem(type) {
    if ((player.inventory[type] || 0) <= 0) return false;
    player.inventory[type]--;
    const a = player.facing != null ? player.facing : 0;
    const tx = player.x + Math.cos(a) * 40;
    const ty = player.y + Math.sin(a) * 40;
    droppedItems.push(new DroppedItem(type, 1, tx, ty));
    const name = (typeof ITEM_NAMES !== 'undefined' && ITEM_NAMES[type]) || type;
    notify(`🗑️ رميت ${name}`, '#aaa');
    updateHUD();
    return true;
}

// ===== NAUSEA (غثيان من الطعام النيء) =====
function triggerNausea() {
    player.nauseous = true;
    player.nauseaTimer = CFG.NAUSEA_DURATION;
    player.nauseaTick = 0;
}

function updateNausea(dt) {
    const ind = document.getElementById('nauseaIndicator');
    if (!player.nauseous) { if (ind) ind.style.display = 'none'; return; }
    if (ind) ind.style.display = 'block';
    player.nauseaTimer -= dt;
    if (player.nauseaTimer <= 0) {
        player.nauseous = false;
        if (ind) ind.style.display = 'none';
        return;
    }
    player.nauseaTick = (player.nauseaTick || 0) + dt;
    if (player.nauseaTick >= 1500) {
        player.nauseaTick -= 1500;
        player.hp = Math.max(1, player.hp - CFG.NAUSEA_TICK_DMG);
        notify(`🤢 -${CFG.NAUSEA_TICK_DMG} غثيان`, '#8bc34a');
        updateHUD();
    }
}

// ===== CHOP TREE =====
function chopTree(tree) {
    if (!player.craftedItems.axe) {
        notify('🪓 اصنع فأساً أولاً للقطع!', '#e74c3c');
        return;
    }
    if (player.chopCd > 0) return;
    player.chopCd = 550;
    tree.hp--;
    tree.shakeTimer = 320;
    SFX.hit();

    if (tree.hp <= 0) {
        tree.chopped = true;
        const count = 3 + Math.floor(Math.random() * 3);
        for (let i = 0; i < count; i++) {
            droppedItems.push(new DroppedItem('stick', 1, tree.x, tree.y));
        }
        notify('🪵 حصلت على خشب!', '#a07040', tree.x, tree.y - tree.r - 10);
        SFX.xp();
    } else {
        notify(`🪓 ضربة! (${tree.hp} ضربات باقية)`, '#c8a040', tree.x, tree.y - tree.r - 10);
    }
}

// ===== FISHING =====
function isAdjacentToWater() {
    const step = CFG.TILE_SIZE;
    const checks = [
        [player.x, player.y - step * 1.5],
        [player.x, player.y + step * 1.5],
        [player.x - step * 1.5, player.y],
        [player.x + step * 1.5, player.y],
    ];
    return checks.some(([wx, wy]) => isWater(wx, wy));
}

function startFishing() {
    if (!player.craftedItems.fishingRod) {
        notify('🎣 تحتاج سنارة صيد أولاً!', '#e74c3c'); return;
    }
    if (!isAdjacentToWater()) {
        notify('💧 اقترب من الماء أولاً!', '#5dade2'); return;
    }
    if (player.isFishing) { reelIn(); return; }
    player.isFishing = true;
    player.fishingBite = false;
    player.fishingTimer = 3000 + Math.random() * 5000;
    notify('🎣 ألقيت الخيط... انتظر...', '#5dade2');
    gamePaused = true;
}

function reelIn() {
    if (!player.isFishing) return;
    if (player.fishingBite) {
        const count = 1 + (Math.random() > 0.6 ? 1 : 0);
        player.inventory.rawFish = (player.inventory.rawFish || 0) + count;
        notify(`🐟 اصطدت ${count === 2 ? 'سمكتين' : 'سمكة'} نيئة!`, '#5dade2');
        SFX.xp();
        updateHUD();
    } else {
        notify('❌ السمكة هربت!', '#e74c3c');
    }
    player.isFishing = false;
    player.fishingBite = false;
    player.fishingTimer = 0;
    player.fishingBiteTimer = 0;
    gamePaused = false;
}

function updateFishing(dt) {
    const statusEl = document.getElementById('fishingStatus');
    if (!player.isFishing) {
        statusEl.style.display = 'none';
        return;
    }
    statusEl.style.display = 'block';
    if (!player.fishingBite) {
        const secs = Math.ceil(player.fishingTimer / 1000);
        statusEl.className = '';
        statusEl.textContent = `🎣 جارٍ الصيد... (${secs}ث) — اضغط R للسحب`;
        player.fishingTimer -= dt;
        if (player.fishingTimer <= 0) {
            player.fishingBite = true;
            player.fishingBiteTimer = 3000;
            notify('🐠 سمكة! اضغط R بسرعة!', '#f0c040');
            SFX.hit();
        }
    } else {
        const secs = Math.ceil(player.fishingBiteTimer / 1000);
        statusEl.className = 'fish-bite';
        statusEl.textContent = `🎣 سمكة في الطعم! اضغط R (${secs}ث)`;
        player.fishingBiteTimer -= dt;
        if (player.fishingBiteTimer <= 0) {
            notify('🐟 هربت السمكة!', '#e74c3c');
            player.isFishing = false;
            player.fishingBite = false;
            statusEl.style.display = 'none';
            gamePaused = false;
        }
    }
}

// ===== UPDATE ENEMIES & PROJECTILES =====
function updateEnemies(dt) {
    for (const e of enemies) e.update(dt);
    enemies = enemies.filter(e => !e.isDead || e.deathTimer < 900);
}

function updateArrows() {
    for (const a of arrows) a.update();
    arrows = arrows.filter(a => !a.dead);
}

function updatePoison(dt) {
    if (!player.poisoned) {
        document.getElementById('poisonIndicator').style.display = 'none';
        return;
    }
    document.getElementById('poisonIndicator').style.display = 'block';
    player.poisonTimer -= dt;
    if (player.poisonTimer <= 0) {
        player.poisoned = false;
        document.getElementById('poisonIndicator').style.display = 'none';
        return;
    }
    player.poisonTick = (player.poisonTick || 0) + dt;
    if (player.poisonTick >= 1000) {
        player.poisonTick -= 1000;
        player.hp = Math.max(1, player.hp - player.poisonDmg);
        notify(`☠️ -${player.poisonDmg} سم`, '#8bc34a');
        updateHUD();
        if (player.hp <= 1) { player.poisoned = false; }
    }
}

function updateDroppedItems(dt) {
    for (const item of droppedItems) item.update(dt);
    droppedItems = droppedItems.filter(i => !i.collected);
}
