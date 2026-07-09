'use strict';
// =========================================================
//  FOREST SAVE — الحفظ والاستعادة
// =========================================================

function serializeEnemies() {
    if (typeof enemies === 'undefined') return [];
    return enemies
        .filter(e => !e.isDead)
        .map(e => ({
            id: e.id,
            x: Math.round(e.x),
            y: Math.round(e.y),
            hp: e.hp,
            homeX: e.homeX != null ? Math.round(e.homeX) : Math.round(e.x),
            homeY: e.homeY != null ? Math.round(e.homeY) : Math.round(e.y),
            leashRadius: e.leashRadius || 400,
            provoked: !!e.provoked,
            nocturnal: !!e.nocturnal
        }));
}

function restoreEnemies(arr) {
    if (!arr || !arr.length || typeof Enemy === 'undefined' || typeof ENEMY_TEMPLATES === 'undefined') return;
    enemies = [];
    for (const s of arr) {
        const tmpl = ENEMY_TEMPLATES[s.id];
        if (!tmpl) continue;
        const e = new Enemy(tmpl, s.x, s.y);
        if (typeof s.hp === 'number') e.hp = Math.min(e.maxHp, s.hp);
        e.homeX = s.homeX != null ? s.homeX : s.x;
        e.homeY = s.homeY != null ? s.homeY : s.y;
        e.leashRadius = s.leashRadius || 400;
        e.provoked = !!s.provoked;
        if (e.provoked && typeof e.applyProvokedStats === 'function') e.applyProvokedStats();
        enemies.push(e);
    }
}

function serializeDroppedItems() {
    if (typeof droppedItems === 'undefined') return [];
    return droppedItems
        .filter(i => !i.collected)
        .map(i => ({
            type: i.type,
            amount: i.amount || 1,
            x: Math.round(i.x),
            y: Math.round(i.y)
        }));
}

function restoreDroppedItems(arr) {
    if (!arr || !arr.length || typeof DroppedItem === 'undefined') return;
    droppedItems = [];
    for (const d of arr) {
        const item = new DroppedItem(d.type, d.amount || 1, d.x, d.y);
        item.x = d.x; // إلغاء الإزاحة العشوائية عند الاستعادة
        item.y = d.y;
        droppedItems.push(item);
    }
}

/** Closest lit campfire (or any campfire) for combat-load respawn. */
function getLastCampfirePos(preferred) {
    if (preferred && preferred.x != null && preferred.y != null) {
        return { x: Math.round(preferred.x), y: Math.round(preferred.y) };
    }
    if (typeof structures === 'undefined' || !structures.length || !player) return null;
    const fires = structures.filter(s => s && s.type === 'campfire');
    if (!fires.length) return null;
    const lit = fires.filter(f => f.lit);
    const pool = lit.length ? lit : fires;
    let best = pool[0], bestD = Infinity;
    for (const f of pool) {
        const d = Math.hypot(f.x - player.x, f.y - player.y);
        if (d < bestD) { best = f; bestD = d; }
    }
    return { x: Math.round(best.x), y: Math.round(best.y) };
}

/** يحفظ كل بيانات الغابة + البطل + المخزون + المباني + الحيوانات */
function saveForestProgress(opts) {
    opts = opts || {};
    if (typeof player === 'undefined' || !player) return false;

    const collectedRes = (typeof resources !== 'undefined')
        ? resources.map((r, i) => r.collected ? i : -1).filter(i => i >= 0) : [];
    const choppedTrees = (typeof trees !== 'undefined')
        ? trees.map((t, i) => t.chopped ? i : -1).filter(i => i >= 0) : [];

    const structuresData = (typeof serializeStructures === 'function') ? serializeStructures() : undefined;
    const camp = getLastCampfirePos(opts.campfire || null);

    // Batch into one document write (avoids 5× localStorage thrash)
    const doc = GameState._ensure();
    const forestSnap = {
        x: Math.round(player.x),
        y: Math.round(player.y),
        hp: player.hp,
        maxHp: player.maxHp,
        stamina: player.stamina,
        weapon: player.weapon || 'sword',
        killCount: player.killCount,
        distanceTraveled: player.distanceTraveled,
        xp: player.xp,
        level: player.level || 1,
        facing: player.facing,
        poisoned: !!player.poisoned,
        poisonTimer: player.poisonTimer || 0,
        poisonDmg: player.poisonDmg || 0,
        nauseous: !!player.nauseous,
        nauseaTimer: player.nauseaTimer || 0,
        seenIntro: true,
        gameCompleted: !!gameCompleted,
        collectedResources: collectedRes,
        choppedTrees: choppedTrees,
        clockMinutes: (typeof gameClock !== 'undefined') ? gameClock.minutes : undefined,
        dayCount: (typeof dayCount !== 'undefined') ? dayCount : undefined,
        weather: (typeof serializeWeather === 'function') ? serializeWeather() : undefined,
        structures: structuresData,
        enemies: serializeEnemies(),
        droppedItems: serializeDroppedItems(),
        inventory: Object.assign({}, player.inventory),
        craftedItems: Object.assign({}, player.craftedItems),
        skills: Object.assign({}, player.skills),
        absorbedAttack: player.absorbedAttack || 0,
        absorbedDefense: player.absorbedDefense || 0,
        attack: player.attack,
        defense: player.defense,
        lastCampfire: camp,
        savedAt: Date.now()
    };

    GameState._writeForestMap(forestSnap);
    doc.heroStats = Object.assign({}, doc.heroStats || {}, {
        hp: player.hp, maxHp: player.maxHp,
        attack: player.attack, defense: player.defense,
        skills: player.skills,
        absorbedAttack: player.absorbedAttack,
        absorbedDefense: player.absorbedDefense,
        xp: player.xp || 0,
        level: player.level || (doc.heroStats && doc.heroStats.level) || 1
    });
    doc.inventory = (typeof GameState.normalizeInventory === 'function')
        ? GameState.normalizeInventory(player.inventory)
        : Object.assign({}, player.inventory);
    doc.craftedItems = Object.assign({}, player.craftedItems);
    doc.progress.completedForest = !!gameCompleted;
    doc.meta.currentMap = 'forest';
    if (camp) doc.meta.lastCampfire = camp;

    const force = !!(opts.force || opts.manual);
    if (opts.debounce && !force) {
        return GameState.autoSave(false);
    }
    return GameState._persist({ force: force });
}

function saveProgress() { return saveForestProgress({ manual: true }); }

/** زر الحفظ اليدوي — يحفظ كل شيء ويُظهر تأكيداً */
function manualSaveGame() {
    if (!gameRunning && !gameCompleted) {
        notify('⚠️ ابدأ اللعبة أولاً', '#e74c3c');
        return;
    }
    const ok = saveForestProgress({ force: true, manual: true });
    if (ok) {
        showSaveToast('💾 تم حفظ كل البيانات');
        if (typeof notify === 'function') notify('💾 تم الحفظ بنجاح!', '#2ecc71');
        if (typeof SFX !== 'undefined' && SFX.click) SFX.click();
    } else {
        if (typeof notify === 'function') notify('❌ فشل الحفظ', '#e74c3c');
    }
}

function showAutoSaveToast() {
    showSaveToast('💾 محفوظ تلقائياً');
}

function showSaveToast(text) {
    const el = document.createElement('div');
    el.style.cssText = `
        position:fixed;bottom:70px;left:50%;transform:translateX(-50%);
        background:rgba(0,0,0,0.78);color:#2ecc71;font-family:Cairo,sans-serif;
        font-size:0.82rem;font-weight:700;padding:6px 18px;border-radius:20px;
        pointer-events:none;z-index:200;transition:opacity 1.2s;
        border:1px solid rgba(46,204,113,0.35);
    `;
    el.textContent = text || '💾 محفوظ';
    document.body.appendChild(el);
    setTimeout(() => { el.style.opacity = '0'; }, 1800);
    setTimeout(() => el.remove(), 3100);
}

function resumeGame(savedState, opts) {
    opts = opts || {};
    if (typingInterval) clearInterval(typingInterval);
    document.getElementById('introOverlay').style.display = 'none';

    // Save-scum warning (reload within 10s)
    if (typeof SaveManager !== 'undefined' && SaveManager.markLoadTime) {
        SaveManager.markLoadTime();
    }

    player.x = savedState.x || player.x;
    player.y = savedState.y || player.y;
    player.lastX = player.x;
    player.lastY = player.y;
    if (typeof savedState.maxHp === 'number') player.maxHp = savedState.maxHp;
    player.hp             = Math.min(savedState.hp != null ? savedState.hp : player.hp, player.maxHp);
    player.stamina        = savedState.stamina != null ? savedState.stamina : CFG.STAMINA_MAX;
    player.killCount      = savedState.killCount || 0;
    player.distanceTraveled = savedState.distanceTraveled || 0;
    player.xp             = savedState.xp || 0;
    player.level          = savedState.level || (1 + Math.floor((player.xp || 0) / 100));
    if (savedState.weapon) player.weapon = savedState.weapon;
    if (savedState.facing != null) player.facing = savedState.facing;

    // Canonical inventory / crafted live in GameState (city trades must win over forest snapshot)
    if (typeof GameState !== 'undefined' && GameState.getInventory) {
        player.inventory = GameState.normalizeInventory
            ? GameState.normalizeInventory(GameState.getInventory())
            : Object.assign({}, player.inventory, GameState.getInventory());
    } else if (savedState.inventory) {
        player.inventory = Object.assign({}, player.inventory, savedState.inventory);
    }
    if (typeof GameState !== 'undefined' && GameState.getCraftedItems) {
        player.craftedItems = Object.assign(
            { axe: false, fishingRod: false, hornSpear: false, hornSword: false, leatherArmor: false, shadowArmor: false },
            GameState.getCraftedItems()
        );
    } else if (savedState.craftedItems) {
        player.craftedItems = Object.assign({}, player.craftedItems, savedState.craftedItems);
    }
    if (opts.fromCity && typeof GameState !== 'undefined' && GameState.getHeroStats) {
        const st = GameState.getHeroStats();
        if (st.maxHp != null) player.maxHp = st.maxHp;
        if (st.hp != null) player.hp = Math.min(st.hp, player.maxHp);
    }
    if (savedState.skills) player.skills = Object.assign({}, player.skills, savedState.skills);
    if (savedState.absorbedAttack != null) player.absorbedAttack = savedState.absorbedAttack;
    if (savedState.absorbedDefense != null) player.absorbedDefense = savedState.absorbedDefense;
    if (savedState.attack != null) player.attack = savedState.attack;
    if (savedState.defense != null) player.defense = savedState.defense;

    player.poisoned = !!savedState.poisoned;
    player.poisonTimer = savedState.poisonTimer || 0;
    player.poisonDmg = savedState.poisonDmg || 0;
    player.nauseous = !!savedState.nauseous;
    player.nauseaTimer = savedState.nauseaTimer || 0;

    if (savedState.gameCompleted) gameCompleted = true;
    else if (typeof GameState !== 'undefined' && GameState.load && GameState.load('completedForest', false)) {
        gameCompleted = true;
    }

    if (savedState.collectedResources) {
        for (const idx of savedState.collectedResources) {
            if (resources[idx]) resources[idx].collected = true;
        }
    }
    if (savedState.choppedTrees) {
        for (const idx of savedState.choppedTrees) {
            if (trees[idx]) { trees[idx].chopped = true; trees[idx].hp = 0; }
        }
    }

    if (typeof gameClock !== 'undefined' && typeof savedState.clockMinutes === 'number') {
        gameClock.minutes = savedState.clockMinutes;
        if (typeof savedState.dayCount === 'number') dayCount = savedState.dayCount;
        dayNightPhase = getPhaseFor(gameClock.minutes);
        isNight = (dayNightPhase === 'night' || dayNightPhase === 'dusk');
        updateClockHUD();
    }
    if (typeof restoreStructures === 'function' && savedState.structures) {
        restoreStructures(savedState.structures);
    }
    if (savedState.enemies && savedState.enemies.length) {
        restoreEnemies(savedState.enemies);
        if (typeof syncNightWildlifeFlag === 'function') syncNightWildlifeFlag();
    } else if (typeof initWildlife === 'function') {
        initWildlife();
    }
    if (savedState.droppedItems) {
        restoreDroppedItems(savedState.droppedItems);
    }
    if (typeof initWeather === 'function') {
        initWeather(savedState.weather || null);
    }

    gameRunning = true;
    lastTime = performance.now();
    updateHUD();
    if (typeof focusGameCanvas === 'function') focusGameCanvas();
    gameLoop(lastTime);
}

// Auto-save every 30 seconds (debounced to max once per 5s inside SaveManager)
setInterval(() => {
    if (gameRunning) {
        const ok = saveForestProgress({ debounce: true });
        if (ok) showAutoSaveToast();
    }
}, 30000);

window.addEventListener('beforeunload', () => {
    if (gameRunning) saveForestProgress({ force: true });
});
