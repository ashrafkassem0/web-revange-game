'use strict';
// =========================================================
//  FOREST HUD — واجهة المستخدم والإشعارات والخريطة
// =========================================================

// ===== AUDIO SETTINGS PANEL =====
let audioPanelOpen = false;

function syncAudioPanelUI() {
    if (typeof SFX === 'undefined') return;
    const master = document.getElementById('audioMaster');
    const sfx = document.getElementById('audioSfx');
    const ambient = document.getElementById('audioAmbient');
    const quran = document.getElementById('audioQuran');
    const mute = document.getElementById('audioMute');
    const btn = document.getElementById('audioBtn');
    if (master) master.value = Math.round((SFX.getMasterVolume ? SFX.getMasterVolume() : 1) * 100);
    if (sfx) sfx.value = Math.round((SFX.getSfxVolume ? SFX.getSfxVolume() : 1) * 100);
    if (ambient) ambient.value = Math.round((SFX.getAmbientVolume ? SFX.getAmbientVolume() : 1) * 100);
    if (quran) quran.value = Math.round((SFX.getQuranVolume ? SFX.getQuranVolume() : 0.9) * 100);
    if (mute) mute.checked = !!(SFX.isMuted && SFX.isMuted());
    if (btn) btn.textContent = (SFX.isMuted && SFX.isMuted()) ? '🔇 الصوت' : '🔊 الصوت';
}

function toggleAudioPanel() {
    const panel = document.getElementById('audioPanel');
    if (!panel) return;
    audioPanelOpen = !audioPanelOpen;
    panel.classList.toggle('open', audioPanelOpen);
    if (audioPanelOpen) {
        if (typeof SFX !== 'undefined' && SFX.loadSettings) SFX.loadSettings();
        syncAudioPanelUI();
        if (typeof SFX !== 'undefined' && SFX.click) SFX.click();
    }
}

function closeAudioPanel() {
    const panel = document.getElementById('audioPanel');
    if (!panel) return;
    audioPanelOpen = false;
    panel.classList.remove('open');
}

function onAudioSlider(kind, value) {
    if (typeof SFX === 'undefined') return;
    const v = Math.max(0, Math.min(100, Number(value) || 0)) / 100;
    if (kind === 'master' && SFX.setMasterVolume) SFX.setMasterVolume(v);
    else if (kind === 'sfx' && SFX.setSfxVolume) SFX.setSfxVolume(v);
    else if (kind === 'ambient' && SFX.setAmbientVolume) SFX.setAmbientVolume(v);
    else if (kind === 'quran' && SFX.setQuranVolume) SFX.setQuranVolume(v);
    if (kind === 'master' && typeof QuranAyahs !== 'undefined' && QuranAyahs.applyVolume) {
        QuranAyahs.applyVolume();
    }
    syncAudioPanelUI();
}

function onAudioMuteToggle(checked) {
    if (typeof SFX === 'undefined' || !SFX.mute) return;
    SFX.mute(!!checked);
    syncAudioPanelUI();
}

function toggleMuteKey() {
    if (typeof SFX === 'undefined' || !SFX.toggleMute) return;
    const muted = SFX.toggleMute();
    syncAudioPanelUI();
    if (typeof notify === 'function') {
        notify(muted ? '🔇 تم كتم الصوت' : '🔊 الصوت مفعّل', muted ? '#aaa' : '#ffd060');
    }
}

// ===== XP HUD (TASK_040) =====
function updateXpHud(p) {
    p = p || (typeof player !== 'undefined' ? player : null);
    if (!p) return;
    const levelEl = document.getElementById('xp-level');
    const fillEl  = document.getElementById('xp-fill');
    const textEl  = document.getElementById('xp-text');
    if (!levelEl || !fillEl || !textEl) return;

    const max = (CFG && CFG.MAX_HERO_LEVEL) || 100;
    const info = (typeof levelFromTotalXp === 'function')
        ? levelFromTotalXp(p.xp || 0)
        : { level: p.level || 1, xpIntoLevel: 0, xpNeeded: 40 };
    p.level = info.level;

    levelEl.textContent = `المستوى ${info.level}`;
    if (info.level >= max) {
        fillEl.style.width = '100%';
        textEl.textContent = 'الحد الأقصى';
        fillEl.classList.add('xp-max');
    } else {
        const pct = Math.max(0, Math.min(100, (info.xpIntoLevel / info.xpNeeded) * 100));
        fillEl.style.width = pct + '%';
        textEl.textContent = `${info.xpIntoLevel} / ${info.xpNeeded}`;
        fillEl.classList.remove('xp-max');
    }
}

// ===== HUD UPDATE =====
function updateHUD() {
    const p = player;
    document.getElementById('hpBar').style.width       = (p.hp / p.maxHp * 100) + '%';
    document.getElementById('hpVal').textContent        = `${Math.ceil(p.hp)}/${p.maxHp}`;
    document.getElementById('staminaBar').style.width  = (p.stamina / CFG.STAMINA_MAX * 100) + '%';
    document.getElementById('staminaVal').textContent   = Math.floor(p.stamina / CFG.STAMINA_MAX * 100) + '%';
    document.getElementById('weaponLabel2').textContent = p.weapon === 'sword' ? '⚔️ السيف' : '🏹 القوس';
    document.getElementById('atkVal').textContent       = Math.floor(p.attack);
    const defEl = document.getElementById('defVal');
    if (defEl) defEl.textContent = Math.floor(p.defense || 0);
    updateXpHud(p);

    for (const k of ['stick', 'stone', 'horn', 'teeth', 'leather', 'herb', 'honey']) {
        const el = document.getElementById('inv-' + k);
        if (el) el.textContent = p.inventory[k] || 0;
    }
    // اللحم/السمك في الشريط العلوي = مجموع النيء + المطهو
    const meatEl = document.getElementById('inv-meat');
    if (meatEl) meatEl.textContent = (p.inventory.rawMeat || 0) + (p.inventory.cookedMeat || 0) + (p.inventory.meat || 0);
    const fishEl = document.getElementById('inv-fish');
    if (fishEl) fishEl.textContent = (p.inventory.rawFish || 0) + (p.inventory.cookedFish || 0) + (p.inventory.fish || 0);
    const arrowEl = document.getElementById('inv-arrows');
    if (arrowEl) arrowEl.textContent = (p.inventory.arrows || 0) > 0 ? p.inventory.arrows : '∞';
    if (typeof ForestQuests !== 'undefined' && ForestQuests.refreshHud) {
        ForestQuests.refreshHud();
    }
}

// ===== MINIMAP =====
function drawMinimap() {
    const mw = 140, mh = 140;
    minimapCtx.clearRect(0, 0, mw, mh);
    const sx = CFG.WORLD_W / mw, sy = CFG.WORLD_H / mh;

    for (let r = 0; r < mh; r += 2) {
        for (let c = 0; c < mw; c += 2) {
            const t = getTile(Math.floor(c * sx / CFG.TILE_SIZE), Math.floor(r * sy / CFG.TILE_SIZE));
            minimapCtx.fillStyle = ['#2d6628', '#1e5218', '#1050a0', '#666658', '#122810', '#b09040'][t];
            minimapCtx.fillRect(c, r, 2, 2);
        }
    }

    for (const res of resources) {
        if (res.collected) continue;
        if (res.type === 'herb') minimapCtx.fillStyle = '#5ecf66';
        else if (res.type === 'honey') minimapCtx.fillStyle = '#ffd060';
        else minimapCtx.fillStyle = '#2ecc71';
        minimapCtx.fillRect(res.x / sx - 1, res.y / sy - 1, 2, 2);
    }

    if (typeof structures !== 'undefined') {
        for (const s of structures) {
            minimapCtx.fillStyle = s.type === 'campfire' ? '#ff8030' : (s.type === 'hut' ? '#e0b040' : '#8a5a2a');
            minimapCtx.fillRect(s.x / sx - 1, s.y / sy - 1, 2, 2);
        }
    }

    minimapCtx.fillStyle = '#e74c3c';
    for (const e of enemies) {
        if (e.isDead) continue;
        minimapCtx.fillStyle = e.nocturnal ? '#a06cff' : '#e74c3c';
        minimapCtx.fillRect(e.x / sx - 1.5, e.y / sy - 1.5, 3, 3);
    }

    minimapCtx.strokeStyle = 'rgba(255,255,255,0.2)';
    minimapCtx.lineWidth = 1;
    minimapCtx.strokeRect(camera.x / sx, camera.y / sy, (canvas.width / ZOOM) / sx, (canvas.height / ZOOM) / sy);

    minimapCtx.fillStyle = '#ffffff';
    minimapCtx.beginPath();
    minimapCtx.arc(player.x / sx, player.y / sy, 3, 0, Math.PI * 2);
    minimapCtx.fill();
}

// ===== NOTIFICATIONS =====
function notify(text, color, worldX, worldY) {
    const el = document.createElement('div');
    el.className   = 'notif';
    el.style.color = color || '#fff';
    el.textContent = text;
    if (worldX != null) {
        el.style.left = Math.round(worldX - camera.x) + 'px';
        el.style.top  = Math.round(worldY - camera.y - 20) + 'px';
    } else {
        el.style.left      = '50%';
        el.style.top       = '82%';
        el.style.transform = 'translateX(-50%)';
    }
    document.getElementById('notifications').appendChild(el);
    setTimeout(() => {
        el.style.opacity   = '0';
        el.style.transform = (worldX != null ? '' : 'translateX(-50%) ') + 'translateY(-28px)';
    }, 1600);
    setTimeout(() => el.remove(), 2200);
}

function flashScreen() {
    const f = document.getElementById('screenFlash');
    f.style.background = 'rgba(231,76,60,0.3)';
    setTimeout(() => { f.style.background = 'rgba(231,76,60,0)'; }, 120);
}

// ===== CRAFTING MENU =====
function openCraftingMenu() {
    if (craftMenuOpen) { closeCraftingMenu(); return; }
    craftMenuOpen = true;
    gamePaused = true;
    const menu = document.getElementById('craftingMenu');
    menu.classList.remove('hidden');

    const inv = player.inventory;
    document.getElementById('craftingInvInfo').textContent =
        `🪵×${inv.stick} 🪨×${inv.stone} 🥩×${inv.meat} 🦷×${inv.horn} 🦴×${inv.teeth} 🧥×${inv.leather || 0} 🐟×${inv.fish || 0}`;

    const list = document.getElementById('recipesList');
    list.innerHTML = '';
    for (const recipe of CRAFTING_RECIPES) {
        const done  = recipe.isUnique && player.craftedItems[recipe.id];
        const canC  = Crafting.canCraft(recipe, player.inventory);
        const matsHtml = Object.entries(recipe.requires).map(([k, v]) => {
            const have = player.inventory[k] || 0;
            const ok   = have >= v;
            return `<span class="${ok ? 'ok' : 'bad'}">${ITEM_EMOJIS[k]}${v}</span>`;
        }).join(' + ');

        const btnClass = done ? 'done' : (canC ? 'can' : 'no');
        const btnText  = done ? '✅ مصنوع' : (canC ? 'اصنع ✨' : 'ناقص 🔒');
        const card = document.createElement('div');
        card.className = 'recipe-card';
        card.innerHTML = `
            <div class="recipe-emoji">${recipe.emoji}</div>
            <div class="recipe-info">
                <div class="recipe-name">${recipe.name}</div>
                <div class="recipe-desc">${recipe.description}</div>
                <div class="recipe-mats">المواد: ${matsHtml}</div>
            </div>
            <button class="craft-btn ${btnClass}" onclick="doCraft('${recipe.id}')">${btnText}</button>
        `;
        list.appendChild(card);
    }
}

function doCraft(recipeId) {
    const result = Crafting.craft(recipeId, player);
    if (result.success) {
        SFX.victory();
        notify(result.message, '#2ecc71');
        player.attack = CharacterRules.playerSwordDamage(player.skills, player.absorbedAttack);
        updateHUD();
        checkCompletion();
        // Unique crafts force an immediate save (TASK_001 trigger)
        const unique = !!(result.recipe && result.recipe.isUnique);
        saveForestProgress({ force: unique, manual: unique });
        openCraftingMenu();
    } else {
        SFX.playerHurt();
        notify(result.message, '#e74c3c');
    }
}

function closeCraftingMenu() {
    craftMenuOpen = false;
    gamePaused = false;
    document.getElementById('craftingMenu').classList.add('hidden');
}

// ===== BACKPACK (الحقيبة) =====
let _bpSelected = null;

function openBackpack() {
    if (backpackOpen) { closeBackpack(); return; }
    if (craftMenuOpen) closeCraftingMenu();
    if (typeof buildMode !== 'undefined' && buildMode && typeof exitBuildMode === 'function') exitBuildMode();
    backpackOpen = true;
    gamePaused = true;
    _bpSelected = null;
    const el = document.getElementById('backpackPanel');
    if (el) el.classList.remove('hidden');
    renderBackpack();
}

function closeBackpack() {
    backpackOpen = false;
    gamePaused = false;
    _bpSelected = null;
    const el = document.getElementById('backpackPanel');
    if (el) el.classList.add('hidden');
}

function renderBackpack() {
    const grid = document.getElementById('backpackGrid');
    if (!grid) return;
    grid.innerHTML = '';
    const inv = player.inventory;
    const order = [
        'cookedMeat', 'rawMeat', 'cookedFish', 'rawFish', 'meat', 'fish',
        'revitalTonic', 'herbSalve', 'honey', 'herb',
        'stick', 'stone', 'horn', 'teeth', 'leather', 'arrows',
        'beastHide', 'nightCrystal', 'venomSac', 'shadowEssence'
    ];
    // عناصر إضافية معروفة فقط (لها اسم عربي) — تجاهل مفاتيح دخيلة مثل maxSlots
    for (const k of Object.keys(inv)) {
        if (order.includes(k)) continue;
        if ((inv[k] || 0) <= 0) continue;
        if (typeof ITEM_NAMES !== 'undefined' && ITEM_NAMES[k]) order.push(k);
    }
    let any = false;
    for (const key of order) {
        const amt = inv[key] || 0;
        if (amt <= 0) continue;
        any = true;
        const isFood = (typeof FOOD_ITEMS !== 'undefined') && FOOD_ITEMS.includes(key);
        const slot = document.createElement('div');
        slot.className = 'bp-slot' + (_bpSelected === key ? ' selected' : '') + (isFood ? ' food' : '');
        slot.innerHTML =
            `<span class="bp-emoji">${(ITEM_EMOJIS[key] || '?')}</span>` +
            `<span class="bp-name">${(ITEM_NAMES[key] || key)}</span>` +
            `<span class="bp-count">×${amt}</span>`;
        slot.onclick = () => { _bpSelected = (_bpSelected === key ? null : key); renderBackpack(); };
        grid.appendChild(slot);
    }
    if (!any) grid.innerHTML = '<div class="bp-empty">الحقيبة فارغة 🎒</div>';

    const act = document.getElementById('backpackActions');
    if (!act) return;
    if (!_bpSelected) { act.innerHTML = '<div class="bp-hint">انقر عنصراً لعرض الإجراءات</div>'; return; }
    const key = _bpSelected;
    const isFood   = (typeof FOOD_ITEMS !== 'undefined') && FOOD_ITEMS.includes(key);
    const isRaw    = (typeof RAW_FOODS !== 'undefined') && !!RAW_FOODS[key];
    const nearFire = (typeof isNearLitCampfire === 'function') && isNearLitCampfire();
    let html = `<div class="bp-sel">${(ITEM_EMOJIS[key] || '')} ${(ITEM_NAMES[key] || key)}</div><div class="bp-btns">`;
    if (isFood) html += `<button class="bp-act eat" onclick="bpEat()">🍽️ أكل</button>`;
    if (isRaw)  html += `<button class="bp-act cook ${nearFire ? '' : 'disabled'}" onclick="bpCook()">🔥 طهي${nearFire ? '' : ' (قرب موقد)'}</button>`;
    html += `<button class="bp-act throw" onclick="bpThrow()">🗑️ رمي</button></div>`;
    act.innerHTML = html;
}

function _bpAfter() {
    if (_bpSelected && (player.inventory[_bpSelected] || 0) <= 0) _bpSelected = null;
    renderBackpack();
}
function bpEat()   { if (_bpSelected) { eatFood(_bpSelected);  _bpAfter(); } }
function bpCook()  { if (_bpSelected) { cookFood(_bpSelected); _bpAfter(); } }
function bpThrow() { if (_bpSelected) { throwItem(_bpSelected); _bpAfter(); } }

// ===== DRAW OVERLAYS (aim reticle, fishing line, city portal) =====
function drawAimReticle(camX, camY) {
    if (lockedTarget && (lockedTarget.isDead || lockedTarget.hp <= 0)) lockedTarget = null;
    if (!lockedTarget || player.weapon !== 'bow') return;

    const sx = lockedTarget.x - camX;
    const sy = lockedTarget.y - camY;
    const r  = (lockedTarget.radius || 18) + 10;
    const t  = Date.now() * 0.003;
    const spin = t % (Math.PI * 2);

    ctx.save();
    const pulse = 0.7 + Math.sin(t * 2) * 0.3;
    ctx.strokeStyle = `rgba(255,60,60,${pulse})`;
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(sx, sy, r + 4, 0, Math.PI * 2); ctx.stroke();

    const bLen = r * 0.55; // eslint-disable-line no-unused-vars
    const gaps = [0, Math.PI / 2, Math.PI, Math.PI * 1.5];
    ctx.strokeStyle = '#ff2020';
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    for (const g of gaps) {
        const a1 = g + spin, a2 = g + Math.PI / 4 + spin;
        const x1 = sx + Math.cos(a1) * r, y1 = sy + Math.sin(a1) * r;
        const x2 = sx + Math.cos(a2) * r, y2 = sy + Math.sin(a2) * r;
        ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
    }

    ctx.fillStyle = '#ff2020';
    ctx.beginPath(); ctx.arc(sx, sy, 3, 0, Math.PI * 2); ctx.fill();

    const px = player.x - camX, py = player.y - camY;
    ctx.setLineDash([4, 8]);
    ctx.strokeStyle = `rgba(255,80,80,${0.35 * pulse})`;
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(px, py - 10); ctx.lineTo(sx, sy); ctx.stroke();
    ctx.setLineDash([]);

    const barW  = Math.max(40, r * 2);
    const hpPct = lockedTarget.hp / lockedTarget.maxHp;
    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    ctx.fillRect(sx - barW / 2, sy - r - 20, barW, 7);
    ctx.fillStyle = hpPct > 0.5 ? '#e74c3c' : hpPct > 0.25 ? '#e67e22' : '#c0392b';
    ctx.fillRect(sx - barW / 2, sy - r - 20, barW * hpPct, 7);

    ctx.font = 'bold 10px Cairo';
    ctx.fillStyle = '#ffaaaa';
    ctx.textAlign = 'center';
    ctx.fillText(lockedTarget.name || '👾', sx, sy - r - 25);
    ctx.restore();
}

function drawFishingLine(camX, camY) {
    if (!player.isFishing) return;
    const sx = player.x - camX;
    const sy = player.y - camY;

    const step = CFG.TILE_SIZE;
    let wx = sx, wy = sy;
    const dirs = [
        [0, -step * 1.5], [0, step * 1.5],
        [-step * 1.5, 0], [step * 1.5, 0]
    ];
    for (const [dx, dy] of dirs) {
        if (isWater(player.x + dx, player.y + dy)) { wx = sx + dx; wy = sy + dy; break; }
    }

    ctx.save();
    ctx.strokeStyle = '#c8c8b0';
    ctx.lineWidth = 0.8;
    ctx.setLineDash([]);
    ctx.beginPath();
    ctx.moveTo(sx + 8, sy - 12);
    ctx.quadraticCurveTo(sx + (wx - sx) * 0.5, sy - 30, wx, wy);
    ctx.stroke();

    const bobY = player.fishingBite
        ? wy + Math.sin(Date.now() * 0.02) * 4
        : wy + Math.sin(Date.now() * 0.003) * 2;
    ctx.beginPath(); ctx.arc(wx, bobY, 4, 0, Math.PI * 2);
    ctx.fillStyle = player.fishingBite ? '#ff4400' : '#e74c3c';
    ctx.fill();
    ctx.beginPath(); ctx.arc(wx, bobY - 2, 4, Math.PI, Math.PI * 2);
    ctx.fillStyle = '#ffffff'; ctx.fill();

    if (player.fishingBite) {
        const bw = 50;
        const pct = player.fishingBiteTimer / 3000;
        ctx.fillStyle = 'rgba(0,0,0,0.6)';
        ctx.fillRect(sx - bw / 2, sy - 38, bw, 7);
        ctx.fillStyle = pct > 0.5 ? '#2ecc71' : '#e74c3c';
        ctx.fillRect(sx - bw / 2, sy - 38, bw * pct, 7);
        ctx.strokeStyle = 'rgba(255,255,255,0.3)';
        ctx.lineWidth = 1;
        ctx.strokeRect(sx - bw / 2, sy - 38, bw, 7);
    }

    ctx.font = 'bold 10px Cairo';
    ctx.fillStyle = player.fishingBite ? '#f0c040' : '#aaddff';
    ctx.textAlign = 'center';
    ctx.fillText(player.fishingBite ? '[R] اسحب!' : '🎣 ...', sx, sy - 42);
    ctx.restore();
}

function drawCityPortal(camX, camY) {
    const sx = CITY_PORTAL.x - camX;
    const sy = CITY_PORTAL.y - camY;
    const W = canvas.width / ZOOM, H = canvas.height / ZOOM;
    if (sx < -120 || sx > W + 120 || sy < -120 || sy > H + 120) return;

    ctx.save();
    const pulse = 0.85 + Math.sin(Date.now() * 0.002) * 0.15;

    ctx.fillStyle = '#b8a878';
    ctx.fillRect(sx - 22, sy - 70, 44, 80);
    ctx.strokeStyle = '#88784a'; ctx.lineWidth = 2;
    ctx.strokeRect(sx - 22, sy - 70, 44, 80);

    ctx.fillStyle = '#8a8070'; ctx.fillRect(sx - 38, sy - 72, 18, 78);
    ctx.fillStyle = '#aaa090'; ctx.fillRect(sx - 36, sy - 70, 6, 74);
    ctx.fillStyle = '#8a8070'; ctx.fillRect(sx + 20, sy - 72, 18, 78);
    ctx.fillStyle = '#aaa090'; ctx.fillRect(sx + 30, sy - 70, 6, 74);

    ctx.fillStyle = '#7a7060';
    ctx.beginPath(); ctx.ellipse(sx, sy - 72, 39, 22, 0, Math.PI, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#aaa090';
    ctx.beginPath(); ctx.ellipse(sx, sy - 72, 30, 16, 0, Math.PI, Math.PI * 2); ctx.fill();

    const grd = ctx.createRadialGradient(sx, sy - 60, 4, sx, sy - 60, 32);
    grd.addColorStop(0, `rgba(255,220,100,${0.55 * pulse})`);
    grd.addColorStop(1, `rgba(255,180,50,0)`);
    ctx.fillStyle = grd;
    ctx.beginPath(); ctx.ellipse(sx, sy - 60, 28, 20, 0, 0, Math.PI * 2); ctx.fill();

    ctx.fillStyle = '#5a3a10';
    ctx.fillRect(sx - 30, sy - 102, 60, 22);
    ctx.strokeStyle = '#a07030'; ctx.lineWidth = 2;
    ctx.strokeRect(sx - 30, sy - 102, 60, 22);
    ctx.fillStyle = '#ffd060';
    ctx.font = 'bold 11px Cairo';
    ctx.textAlign = 'center';
    ctx.fillText('🏙️ المدينة', sx, sy - 86);

    for (let i = 0; i < 5; i++) {
        const t = (Date.now() * 0.001 + i * 1.2) % 3;
        const px2 = sx + Math.sin(i * 2.5 + Date.now() * 0.001) * 18;
        const py2 = sy - 55 - t * 18;
        const alpha = Math.max(0, 1 - t / 3) * pulse;
        ctx.fillStyle = `rgba(255,220,80,${alpha * 0.7})`;
        ctx.beginPath(); ctx.arc(px2, py2, 2.5, 0, Math.PI * 2); ctx.fill();
    }

    if (isNearCityPortal()) {
        // Soft glowing ring to signal interaction zone
        ctx.save();
        const ringAlpha = 0.25 + Math.sin(Date.now() * 0.003) * 0.15;
        ctx.strokeStyle = `rgba(255,208,80,${ringAlpha})`;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(sx, sy - 50, CITY_PORTAL.radius * 0.85, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
    }

    // حلقة المنطقة الآمنة (لا وحوش) — خفيفة عند الاقتراب
    const safeR = CITY_PORTAL.safeRadius || 220;
    const distToPortal = (typeof player !== 'undefined')
        ? Math.hypot(player.x - CITY_PORTAL.x, player.y - CITY_PORTAL.y)
        : 9999;
    if (distToPortal < safeR + 160) {
        const a = Math.max(0.06, 0.18 - (distToPortal / (safeR + 160)) * 0.12);
        ctx.save();
        ctx.strokeStyle = `rgba(120, 200, 160, ${a})`;
        ctx.lineWidth = 1.5;
        ctx.setLineDash([8, 10]);
        ctx.beginPath();
        ctx.arc(sx, sy, safeR, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
        if (distToPortal < safeR) {
            ctx.fillStyle = `rgba(80, 180, 120, ${0.04 + Math.sin(Date.now() * 0.002) * 0.015})`;
            ctx.beginPath();
            ctx.arc(sx, sy, safeR, 0, Math.PI * 2);
            ctx.fill();
            ctx.font = 'bold 10px Cairo';
            ctx.textAlign = 'center';
            ctx.fillStyle = `rgba(180, 230, 200, ${0.35 + a})`;
            ctx.fillText('منطقة آمنة', sx, sy + safeR * 0.15);
        }
        ctx.restore();
    }
    ctx.restore();
}
