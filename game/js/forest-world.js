'use strict';
// =========================================================
//  FOREST WORLD — خريطة العالم، الإنشاء، والتضاريس
// =========================================================

// ===== TILE MAP =====
const tileMap = new Uint8Array(CFG.WORLD_COLS * CFG.WORLD_ROWS);

function getTile(c, r) {
    if (c < 0 || c >= CFG.WORLD_COLS || r < 0 || r >= CFG.WORLD_ROWS) return T.WATER;
    return tileMap[r * CFG.WORLD_COLS + c];
}
function setTile(c, r, t) {
    if (c < 0 || c >= CFG.WORLD_COLS || r < 0 || r >= CFG.WORLD_ROWS) return;
    tileMap[r * CFG.WORLD_COLS + c] = t;
}
function setRect(c1, r1, c2, r2, t) {
    for (let r = r1; r < r2; r++) for (let c = c1; c < c2; c++) setTile(c, r, t);
}
function setCircleT(cx, cy, rad, t) {
    for (let r = Math.floor(cy - rad); r <= Math.ceil(cy + rad); r++)
        for (let c = Math.floor(cx - rad); c <= Math.ceil(cx + rad); c++)
            if ((c - cx) ** 2 + (r - cy) ** 2 <= rad * rad) setTile(c, r, t);
}
function isWater(wx, wy) {
    return getTile(Math.floor(wx / CFG.TILE_SIZE), Math.floor(wy / CFG.TILE_SIZE)) === T.WATER;
}

// ===== WORLD GENERATION =====
function generateWorld() {
    tileMap.fill(T.GRASS);
    setRect(0, 0, 22, 25, T.DARK);
    setRect(57, 0, 80, 25, T.DARK);
    setRect(0, 0, 8, 80, T.DARK);
    setRect(64, 20, 80, 62, T.ROCK);
    setRect(20, 55, 60, 80, T.GRASS);
    for (let i = 0; i < 60; i++) {
        const c = 10 + Math.floor(seededRand(i * 7) * 60);
        const r = 15 + Math.floor(seededRand(i * 13) * 50);
        if (getTile(c, r) === T.GRASS) setCircleT(c, r, 2 + seededRand(i) * 3, T.DEEP);
    }
    setCircleT(12, 12, 8, T.WATER);
    setCircleT(68, 12, 7, T.WATER);
    setCircleT(40, 38, 4, T.WATER);
    setCircleT(12, 12, 10, T.SAND); setCircleT(12, 12, 8, T.WATER);
    setCircleT(68, 12, 9, T.SAND);  setCircleT(68, 12, 7, T.WATER);
    setCircleT(40, 38, 6, T.SAND);  setCircleT(40, 38, 4, T.WATER);
    setRect(37, 58, 43, 80, T.SAND);
    generateTrees();
}

function seededRand(seed) {
    const x = Math.sin(seed + 1) * 10000;
    return x - Math.floor(x);
}

function generateTrees() {
    const zones = [
        { x1: 50,   y1: 50,   x2: 880,  y2: 1000, count: 42, rMin: 18, rMax: 38 },
        { x1: 2300, y1: 50,   x2: 3150, y2: 1000, count: 36, rMin: 18, rMax: 36 },
        { x1: 50,   y1: 50,   x2: 320,  y2: 3150, count: 44, rMin: 20, rMax: 40 },
        { x1: 800,  y1: 400,  x2: 2400, y2: 2200, count: 34, rMin: 16, rMax: 30 },
        { x1: 800,  y1: 2000, x2: 2800, y2: 3150, count: 22, rMin: 15, rMax: 26 },
    ];
    let seed = 0;
    for (const z of zones) {
        let placed = 0, tries = 0;
        while (placed < z.count && tries < z.count * 6) {
            tries++;
            const x = z.x1 + seededRand(seed++) * (z.x2 - z.x1);
            const y = z.y1 + seededRand(seed++) * (z.y2 - z.y1);
            const r = z.rMin + seededRand(seed++) * (z.rMax - z.rMin);
            if (isWater(x, y)) continue;
            let ok = true;
            for (const t of trees) {
                if (Math.hypot(t.x - x, t.y - y) < t.r + r + 8) { ok = false; break; }
            }
            if (ok) {
                const maxHp = 3;
                trees.push({ x, y, r, hp: maxHp, maxHp, chopped: false, shakeTimer: 0 });
                placed++;
            }
        }
    }
}

// ===== SPAWN ENEMIES — كل حيوان في بيئته الطبيعية =====
// مرجع الخريطة (بالبكسل، الخلية = 40px):
//   DARK  (غابة مظلمة): يسار (0-320, 0-3200)، أعلى-يسار (0-880, 0-1000)، أعلى-يمين (2280-3200, 0-1000)
//   ROCK  (صخر/جبل)  : يمين (2560-3200, 800-2480)
//   WATER (ماء)       : بحيرة ش-غ ≈(480,480)، ش-ش ≈(2720,480)، وسط ≈(1600,1520)
//   SAND  (رمل)       : شواطئ البحيرات + شريط جنوبي (1480-1680, 2320-3200)
//   GRASS / DEEP      : بقية الخريطة

function spawnEnemies() {
    // prefer: T.DARK | T.ROCK | T.WATER | T.SAND | undefined (= أي أرض)
    const sp = [
        // ————— أرانب — الغابة العشبية —————
        { type: 'wildRabbit', zone: [850,  1600, 2350, 2900], count: 6 },
        { type: 'wildRabbit', zone: [1000, 2200, 2200, 3050], count: 4 },

        // ————— غزلان — المراعي المفتوحة —————
        { type: 'deer', zone: [900,  1800, 2300, 3000], count: 3 },
        { type: 'deer', zone: [1000, 1100, 2100, 1900], count: 2 },

        // ————— ذئاب — المناطق الصخرية الجبلية —————
        { type: 'wolf', zone: [2560, 850,  3150, 2000], count: 5, prefer: T.ROCK },
        { type: 'wolf', zone: [2560, 2000, 3150, 2450], count: 3, prefer: T.ROCK },

        // ————— دببة — قرب الغابة والمياه —————
        { type: 'bear', zone: [150,  150,  880,  880],  count: 2 }, // قرب بحيرة ش-غ
        { type: 'bear', zone: [2200, 150,  3100, 880],  count: 2 }, // قرب بحيرة ش-ش
        { type: 'bear', zone: [1200, 1250, 2050, 1850], count: 2 }, // قرب البحيرة الوسطى

        // ————— تماسيح — داخل المياه وعلى الشواطئ —————
        { type: 'crocodile', zone: [150,  150,  800,  800],  count: 3, prefer: T.WATER }, // بحيرة ش-غ
        { type: 'crocodile', zone: [2380, 150,  3100, 800],  count: 3, prefer: T.WATER }, // بحيرة ش-ش
        { type: 'crocodile', zone: [1440, 1360, 1820, 1760], count: 2, prefer: T.WATER }, // البحيرة الوسطى
        { type: 'crocodile', zone: [1460, 2360, 1700, 3100], count: 2, prefer: T.SAND  }, // الشريط الجنوبي

        // ————— ثعابين — الغابة المظلمة —————
        { type: 'snake', zone: [30,   100,  310,  3100], count: 5, prefer: T.DARK }, // الحافة اليسرى
        { type: 'snake', zone: [30,   30,   870,  970],  count: 4, prefer: T.DARK }, // أعلى-يسار
        { type: 'snake', zone: [2290, 30,   3150, 970],  count: 4, prefer: T.DARK }, // أعلى-يمين

        // ————— خنازير برية — الغابة الكثيفة —————
        { type: 'wildBoar', zone: [350,  300,  1800, 1300], count: 3 },
        { type: 'wildBoar', zone: [1800, 100,  3000, 900],  count: 3 },

        // ————— ثعالب — أطراف الغابة —————
        { type: 'fox', zone: [800,  1200, 2200, 2400], count: 3 },
        { type: 'fox', zone: [600,  1600, 1800, 2500], count: 2 },

        // ————— غوريلا — قلب الغابة المظلمة —————
        { type: 'gorilla', zone: [30,   30,   700,  900],  count: 2, prefer: T.DARK },
        { type: 'gorilla', zone: [2290, 30,   3100, 800],  count: 2, prefer: T.DARK },

        // ————— نسور — المناطق المفتوحة —————
        { type: 'eagle', zone: [600, 200, 2600, 1600], count: 3 },
    ];

    for (const s of sp) {
        const tmpl = ENEMY_TEMPLATES[s.type];
        if (!tmpl) continue;

        for (let i = 0; i < s.count; i++) {
            let x = 0, y = 0, tries = 0;
            let valid = false;

            while (tries < 25) {
                x = s.zone[0] + Math.random() * (s.zone[2] - s.zone[0]);
                y = s.zone[1] + Math.random() * (s.zone[3] - s.zone[1]);
                tries++;
                const tile = getTile(Math.floor(x / CFG.TILE_SIZE), Math.floor(y / CFG.TILE_SIZE));

                if (s.prefer === T.WATER) {
                    // تماسيح: تُحسّب الأولوية للماء والرمال، وإن فشلت تُقبل أي أرض
                    if (tile === T.WATER || tile === T.SAND) { valid = true; break; }
                    if (tries > 18 && tile !== T.WATER)     { valid = true; break; }
                } else if (s.prefer === T.SAND) {
                    if (tile === T.SAND)               { valid = true; break; }
                    if (tries > 18 && tile !== T.WATER) { valid = true; break; }
                } else if (s.prefer === T.ROCK) {
                    if (tile === T.ROCK)               { valid = true; break; }
                    if (tries > 18 && tile !== T.WATER) { valid = true; break; }
                } else if (s.prefer === T.DARK) {
                    if (tile === T.DARK)               { valid = true; break; }
                    if (tries > 18 && tile !== T.WATER) { valid = true; break; }
                } else {
                    if (tile !== T.WATER)              { valid = true; break; }
                }
            }

            if (!valid) continue;
            enemies.push(new Enemy(tmpl, x, y));
        }
    }
}

// ===== SPAWN RESOURCES =====
function spawnResources() {
    for (let i = 0; i < 28; i++) {
        let x, y, tries = 0;
        do {
            x = 300 + seededRand(i * 11) * 2600;
            y = 300 + seededRand(i * 17) * 2600;
            tries++;
        } while ((isWater(x, y) || getTile(Math.floor(x / CFG.TILE_SIZE), Math.floor(y / CFG.TILE_SIZE)) === T.ROCK) && tries < 10);
        resources.push(new ResourceNode('stick', x, y));
    }
    for (let i = 0; i < 20; i++) {
        let x, y, tries = 0;
        do {
            x = 400 + seededRand(i * 19 + 50) * 2800;
            y = 400 + seededRand(i * 23 + 50) * 2400;
            tries++;
        } while (isWater(x, y) && tries < 10);
        resources.push(new ResourceNode('stone', x, y));
    }
}

// ===== PRE-RENDERED TERRAIN =====
let terrainCanvas = null;

function th(c, r, salt) {
    return Math.abs(Math.sin(c * 127.1 * (salt || 1) + r * 311.7)) % 1;
}
function rh(a, b) {
    return Math.abs(Math.sin(a * 127.1 + b * 311.7 + a * b * 0.0013)) % 1;
}

function loadTerrainTextures(onReady) {
    const names = ['grass', 'deep', 'water', 'rock', 'dark', 'sand'];
    const textures = {};
    let pending = names.length;
    names.forEach(name => {
        const img = new Image();
        img.onload  = () => { textures[name] = img; if (--pending === 0) onReady(textures); };
        img.onerror = () => {                        if (--pending === 0) onReady(textures); };
        img.src = '../textures/' + name + '.png';
    });
}

function prerenderTerrain(textures) {
    terrainCanvas = document.createElement('canvas');
    terrainCanvas.width  = CFG.WORLD_W;
    terrainCanvas.height = CFG.WORLD_H;
    const tc = terrainCanvas.getContext('2d');
    const cs = CFG.TILE_SIZE;

    const TYPES = [
        { id: T.GRASS, key: 'grass', base: '#3a8228', tint: null },
        { id: T.DEEP,  key: 'deep',  base: '#1b5016', tint: 'rgba(0,12,0,0.12)' },
        { id: T.WATER, key: 'water', base: '#0e5ab5', tint: 'rgba(0,15,50,0.18)' },
        { id: T.ROCK,  key: 'rock',  base: '#5a5248', tint: null },
        { id: T.DARK,  key: 'dark',  base: '#0a1206', tint: 'rgba(0,4,0,0.20)' },
        { id: T.SAND,  key: 'sand',  base: '#c09030', tint: null },
    ];

    // PASS 1 — solid base colours
    for (let r = 0; r < CFG.WORLD_ROWS; r++) {
        for (let c = 0; c < CFG.WORLD_COLS; c++) {
            const t   = getTile(c, r);
            const cfg = TYPES.find(x => x.id === t);
            tc.fillStyle = cfg ? cfg.base : '#3a8228';
            tc.fillRect(c * cs, r * cs, cs + 1, cs + 1);
        }
    }

    // PASS 2 — stochastic texture bombing
    for (const { id, key, tint } of TYPES) {
        const img = textures && textures[key];
        if (!img || !img.complete || img.naturalWidth === 0) continue;

        const iW = img.naturalWidth;
        const iH = img.naturalHeight;
        const sampleSize = Math.min(190, Math.min(iW, iH) * 0.58);
        const patchR = Math.min(130, sampleSize * 0.72 + 20);
        const step   = Math.round(patchR * 1.1);

        tc.save();
        tc.beginPath();
        for (let r = 0; r < CFG.WORLD_ROWS; r++) {
            for (let c = 0; c < CFG.WORLD_COLS; c++) {
                if (getTile(c, r) === id) tc.rect(c * cs - 1, r * cs - 1, cs + 2, cs + 2);
            }
        }
        tc.clip();

        let gi = 0;
        const pad = patchR + step;
        for (let gy = -pad; gy < CFG.WORLD_H + pad; gy += step) {
            for (let gx = -pad; gx < CFG.WORLD_W + pad; gx += step) {
                const h0 = rh(gi, id * 17 + 1);
                const h1 = rh(gi, id * 17 + 2);
                const h2 = rh(gi, id * 17 + 3);
                const h3 = rh(gi, id * 17 + 4);
                const h4 = rh(gi, id * 17 + 5);
                const h5 = rh(gi, id * 17 + 6);
                gi++;

                const wx = gx + h0 * step;
                const wy = gy + h1 * step;
                const srcX = h2 * Math.max(1, iW - sampleSize);
                const srcY = h3 * Math.max(1, iH - sampleSize);
                const sw   = Math.min(sampleSize, iW  - srcX);
                const sh   = Math.min(sampleSize, iH  - srcY);
                const rot  = h4 * Math.PI * 2;
                const pr   = patchR * (0.82 + h5 * 0.36);

                tc.save();
                tc.translate(wx, wy);
                tc.rotate(rot);
                tc.beginPath();
                tc.arc(0, 0, pr, 0, Math.PI * 2);
                tc.clip();
                tc.globalAlpha = id === T.WATER ? 0.55 : (0.72 + h5 * 0.24);
                tc.drawImage(img, srcX, srcY, sw, sh, -pr, -pr, pr * 2, pr * 2);
                tc.restore();
            }
        }

        if (tint) {
            tc.fillStyle = tint;
            tc.fillRect(0, 0, CFG.WORLD_W, CFG.WORLD_H);
        }
        tc.restore();
    }

    // PASS 3 — sparse detail accents
    for (let r = 0; r < CFG.WORLD_ROWS; r++) {
        for (let c = 0; c < CFG.WORLD_COLS; c++) {
            const t  = getTile(c, r);
            const tx = c * cs, ty = r * cs;
            const s1 = th(c, r, 1), s2 = th(c, r, 2), s3 = th(c, r, 3);

            if (t === T.GRASS && s1 > 0.88) {
                tc.fillStyle = s2 > 0.5 ? 'rgba(255,230,50,0.72)' : 'rgba(255,120,160,0.65)';
                tc.beginPath(); tc.arc(tx + s2 * cs, ty + s3 * cs, 1.3, 0, Math.PI * 2); tc.fill();
            }
            if (t === T.DEEP && s2 > 0.90) {
                tc.fillStyle = 'rgba(175,55,30,0.80)';
                tc.beginPath(); tc.arc(tx + s1 * cs, ty + s3 * cs, 2.2, 0, Math.PI * 2); tc.fill();
            }
            if (t === T.SAND && s1 > 0.82) {
                tc.fillStyle = 'rgba(145,130,95,0.60)';
                tc.beginPath();
                tc.ellipse(tx + s2 * cs, ty + s3 * cs, 2.8 * s1, 1.9 * s1, s2 * Math.PI, 0, Math.PI * 2);
                tc.fill();
            }
        }
    }
}

// ===== WORLD DRAW (terrain + water animation) =====
function drawWorld(camX, camY) {
    if (terrainCanvas) {
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(terrainCanvas, -camX, -camY);
    }

    const W  = canvas.width / ZOOM, H = canvas.height / ZOOM;
    const cs = CFG.TILE_SIZE;
    const sc = Math.max(0, Math.floor(camX / cs));
    const sr = Math.max(0, Math.floor(camY / cs));
    const ec = Math.min(CFG.WORLD_COLS - 1, Math.ceil((camX + W) / cs));
    const er = Math.min(CFG.WORLD_ROWS - 1, Math.ceil((camY + H) / cs));

    ctx.save();
    ctx.beginPath();
    for (let r = sr; r <= er; r++) {
        for (let c = sc; c <= ec; c++) {
            if (getTile(c, r) !== T.WATER) continue;
            ctx.rect(c * cs - camX, r * cs - camY, cs + 1, cs + 1);
        }
    }
    ctx.clip();

    const t = waveTime * 0.001;
    const bandCount = Math.ceil(H / 18) + 4;
    for (let i = 0; i < bandCount; i++) {
        const baseY = i * 18 - 9;
        for (let x = -30; x < W + 30; x += 6) {
            const wx = x + camX;
            const wave = Math.sin(t * 1.8 + wx * 0.03 + i * 0.6) * 6
                       + Math.sin(t * 1.1 + wx * 0.018 - i * 0.4) * 3;
            const y2 = baseY + wave;
            const alpha = 0.05 + Math.sin(t * 2.2 + wx * 0.04) * 0.02;
            ctx.fillStyle = `rgba(100,210,255,${Math.max(0, alpha)})`;
            ctx.fillRect(x, y2, 7, 2.5);
        }
    }

    for (let fi = 0; fi < 8; fi++) {
        const fw = (Math.sin(t * 0.7 + fi * 2.3) * 0.5 + 0.5) * W;
        const fh = (Math.cos(t * 0.5 + fi * 1.8) * 0.5 + 0.5) * H;
        const fa = Math.sin(t * 3 + fi) * 0.04 + 0.04;
        if (fa > 0.01) {
            ctx.fillStyle = `rgba(255,255,255,${fa})`;
            ctx.beginPath();
            ctx.ellipse(fw, fh, 18 + Math.sin(t + fi) * 8, 3, 0, 0, Math.PI * 2);
            ctx.fill();
        }
    }
    ctx.restore();

    // Trees behind player
    for (const tree of trees) {
        if (tree.y - tree.r > player.y) continue;
        drawTree(tree, camX, camY);
    }
}

function drawTreesFront(camX, camY) {
    for (const tree of trees) {
        if (tree.y - tree.r <= player.y) continue;
        drawTree(tree, camX, camY);
    }
}

function drawTree(tree, camX, camY) {
    const { x, y, r, chopped, hp, maxHp, shakeTimer } = tree;
    const shake = shakeTimer > 0 ? Math.sin(shakeTimer * 0.05) * 3 * (shakeTimer / 300) : 0;
    const sx = x - camX + shake;
    const sy = y - camY;
    const VW = canvas.width / ZOOM, VH = canvas.height / ZOOM;
    if (sx < -r - 10 || sx > VW + r + 10 || sy < -r - 20 || sy > VH + r + 10) return;

    const near = !chopped && Math.hypot(player.x - x, player.y - y) < r + 32;
    ctx.save();

    if (chopped) {
        const tw = r * 0.55, th2 = r * 0.45;
        ctx.fillStyle = '#4a2c10';
        ctx.fillRect(sx - tw / 2, sy - th2 / 2, tw, th2);
        ctx.strokeStyle = '#6a3c18'; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.ellipse(sx, sy, tw * 0.38, th2 * 0.28, 0, 0, Math.PI * 2); ctx.stroke();
        ctx.beginPath(); ctx.ellipse(sx, sy, tw * 0.2, th2 * 0.15, 0, 0, Math.PI * 2); ctx.stroke();
        ctx.beginPath(); ctx.ellipse(sx, sy - th2 / 2 + 3, tw / 2, th2 * 0.22, 0, 0, Math.PI * 2);
        ctx.fillStyle = '#7a4c28'; ctx.fill();
        ctx.restore();
        return;
    }

    ctx.beginPath(); ctx.ellipse(sx + r * 0.2, sy + r * 0.3, r * 1.1, r * 0.38, 0, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(0,0,0,0.22)'; ctx.fill();

    const trunkW = r * 0.36;
    const trunkH = r * 1.0;
    const trunkX = sx - trunkW / 2;
    const trunkY = sy - r * 0.15;

    ctx.fillStyle = '#3e2210';
    ctx.fillRect(trunkX, trunkY, trunkW, trunkH);
    ctx.fillStyle = '#6a3c1a';
    ctx.fillRect(trunkX + trunkW * 0.15, trunkY, trunkW * 0.55, trunkH);

    ctx.strokeStyle = 'rgba(30,12,2,0.45)';
    ctx.lineWidth = 1.2;
    for (let i = 0; i < 4; i++) {
        const bx = trunkX + trunkW * (0.15 + i * 0.18);
        ctx.beginPath();
        ctx.moveTo(bx, trunkY + trunkH * 0.1);
        ctx.lineTo(bx + (i % 2 === 0 ? 2 : -2), trunkY + trunkH * 0.85);
        ctx.stroke();
    }

    ctx.fillStyle = '#4a2c10';
    ctx.beginPath();
    ctx.moveTo(trunkX - r * 0.12, trunkY + trunkH * 0.9);
    ctx.quadraticCurveTo(trunkX, trunkY + trunkH * 0.6, trunkX + trunkW * 0.2, trunkY + trunkH * 0.5);
    ctx.lineTo(trunkX, trunkY + trunkH);
    ctx.closePath(); ctx.fill();

    ctx.beginPath();
    ctx.moveTo(trunkX + trunkW + r * 0.12, trunkY + trunkH * 0.9);
    ctx.quadraticCurveTo(trunkX + trunkW, trunkY + trunkH * 0.6, trunkX + trunkW * 0.8, trunkY + trunkH * 0.5);
    ctx.lineTo(trunkX + trunkW, trunkY + trunkH);
    ctx.closePath(); ctx.fill();

    ctx.beginPath(); ctx.arc(sx, sy - r * 0.55, r * 1.08, 0, Math.PI * 2);
    ctx.fillStyle = '#1a5512'; ctx.fill();
    ctx.beginPath(); ctx.arc(sx, sy - r * 0.6, r * 0.92, 0, Math.PI * 2);
    ctx.fillStyle = '#237318'; ctx.fill();
    ctx.beginPath(); ctx.arc(sx, sy - r * 0.65, r * 0.7, 0, Math.PI * 2);
    ctx.fillStyle = '#2d8c1e'; ctx.fill();
    ctx.beginPath(); ctx.ellipse(sx - r * 0.32, sy - r * 0.9, r * 0.36, r * 0.26, -0.5, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(80,210,60,0.32)'; ctx.fill();
    ctx.beginPath(); ctx.ellipse(sx + r * 0.18, sy - r * 0.55, r * 0.18, r * 0.14, 0.3, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(100,220,70,0.22)'; ctx.fill();

    if (hp < maxHp) {
        ctx.strokeStyle = '#f0c040';
        ctx.lineWidth = 2;
        for (let i = 0; i < maxHp - hp; i++) {
            const nx = trunkX + trunkW * 0.3 + i * (trunkW * 0.3);
            const ny = trunkY + trunkH * 0.35;
            ctx.beginPath();
            ctx.moveTo(nx,     ny - 5);
            ctx.lineTo(nx + 5, ny + 5);
            ctx.moveTo(nx + 5, ny - 5);
            ctx.lineTo(nx,     ny + 5);
            ctx.stroke();
        }
    }

    if (near) {
        const hasAxe = player.craftedItems && player.craftedItems.axe;
        ctx.beginPath(); ctx.arc(sx, sy - r * 0.55, r * 1.12, 0, Math.PI * 2);
        ctx.strokeStyle = hasAxe ? 'rgba(255,220,50,0.7)' : 'rgba(180,180,180,0.4)';
        ctx.lineWidth = 2.5;
        ctx.stroke();

        ctx.font = 'bold 11px Cairo';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        const label = hasAxe ? `[E] 🪓 اقطع (${hp}/${maxHp})` : `[E] 🪓 تحتاج فأس`;
        ctx.strokeStyle = 'rgba(0,0,0,0.85)';
        ctx.lineWidth = 3;
        ctx.strokeText(label, sx, sy - r * 1.75);
        ctx.fillStyle = hasAxe ? '#ffe066' : '#aaa';
        ctx.fillText(label, sx, sy - r * 1.75);

        const bw = r * 2.4, bh = 6;
        const bx = sx - bw / 2, by = sy - r * 1.55;
        ctx.fillStyle = '#333';
        ctx.fillRect(bx, by, bw, bh);
        ctx.fillStyle = hp === maxHp ? '#2ecc71' : '#f0c040';
        ctx.fillRect(bx, by, bw * (hp / maxHp), bh);
        ctx.strokeStyle = 'rgba(0,0,0,0.5)';
        ctx.lineWidth = 1;
        ctx.strokeRect(bx, by, bw, bh);
    }

    ctx.restore();
}
