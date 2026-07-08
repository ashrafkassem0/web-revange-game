'use strict';
// =========================================================
//  FOREST SAVE — الحفظ والاستعادة
// =========================================================

function saveForestProgress() {
    if (gameCompleted) return;

    const collectedRes = resources.map((r, i) => r.collected ? i : -1).filter(i => i >= 0);
    const choppedTrees = trees.map((t, i) => t.chopped ? i : -1).filter(i => i >= 0);

    GameState.saveForestState({
        x: Math.round(player.x),
        y: Math.round(player.y),
        hp: player.hp,
        stamina: player.stamina,
        killCount: player.killCount,
        distanceTraveled: player.distanceTraveled,
        xp: player.xp,
        seenIntro: true,
        collectedResources: collectedRes,
        choppedTrees: choppedTrees,
        savedAt: Date.now()
    });

    GameState.saveHeroStats({
        hp: player.hp, maxHp: player.maxHp,
        attack: player.attack, defense: player.defense,
        skills: player.skills,
        absorbedAttack: player.absorbedAttack,
        absorbedDefense: player.absorbedDefense
    });
    GameState.saveInventory(player.inventory);
    GameState.saveCraftedItems(player.craftedItems);
}

function saveProgress() { saveForestProgress(); }

function showAutoSaveToast() {
    const el = document.createElement('div');
    el.style.cssText = `
        position:fixed;bottom:70px;left:50%;transform:translateX(-50%);
        background:rgba(0,0,0,0.7);color:#2ecc71;font-family:Cairo,sans-serif;
        font-size:0.75rem;padding:4px 14px;border-radius:20px;
        pointer-events:none;z-index:200;transition:opacity 1.2s;
    `;
    el.textContent = '💾 محفوظ تلقائياً';
    document.body.appendChild(el);
    setTimeout(() => { el.style.opacity = '0'; }, 1800);
    setTimeout(() => el.remove(), 3100);
}

function resumeGame(savedState) {
    if (typingInterval) clearInterval(typingInterval);
    document.getElementById('introOverlay').style.display = 'none';

    player.x = savedState.x || player.x;
    player.y = savedState.y || player.y;
    player.lastX = player.x;
    player.lastY = player.y;
    player.hp             = Math.min(savedState.hp || player.hp, player.maxHp);
    player.stamina        = savedState.stamina || CFG.STAMINA_MAX;
    player.killCount      = savedState.killCount || 0;
    player.distanceTraveled = savedState.distanceTraveled || 0;
    player.xp             = savedState.xp || 0;

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

    gameRunning = true;
    lastTime = performance.now();
    updateHUD();
    gameLoop(lastTime);
}

// Auto-save every 30 seconds
setInterval(() => {
    if (gameRunning && !gameCompleted) {
        saveForestProgress();
        showAutoSaveToast();
    }
}, 30000);

window.addEventListener('beforeunload', () => {
    if (gameRunning && !gameCompleted) saveForestProgress();
});
