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

// ===== VALUE NOISE (deterministic) — لحدود مناطق منحنية طبيعية =====
function _vhash(ix, iy) {
    const s = Math.sin(ix * 127.1 + iy * 311.7) * 43758.5453;
    return s - Math.floor(s);
}
function valNoise(x, y) {
    const x0 = Math.floor(x), y0 = Math.floor(y);
    const fx = x - x0, fy = y - y0;
    const v00 = _vhash(x0, y0),     v10 = _vhash(x0 + 1, y0);
    const v01 = _vhash(x0, y0 + 1), v11 = _vhash(x0 + 1, y0 + 1);
    const sx = fx * fx * (3 - 2 * fx), sy = fy * fy * (3 - 2 * fy);
    const a = v00 + (v10 - v00) * sx;
    const b = v01 + (v11 - v01) * sx;
    return a + (b - a) * sy;
}
// Fractal Brownian Motion — يعيد ~0..1
function fbm(x, y) {
    let sum = 0, amp = 0.5, freq = 1;
    for (let o = 0; o < 4; o++) {
        sum += valNoise(x * freq, y * freq) * amp;
        freq *= 2; amp *= 0.5;
    }
    return sum;
}

// رقعة منحنية: نصف القطر يُزاح بضجيج لإعطاء حواف عضوية بدل الدائرة الصمّاء
function setBlob(cx, cy, rad, t, wobble) {
    wobble = wobble || 0;
    const ext = rad * (1 + wobble) + 2;
    for (let r = Math.floor(cy - ext); r <= Math.ceil(cy + ext); r++) {
        for (let c = Math.floor(cx - ext); c <= Math.ceil(cx + ext); c++) {
            const dist = Math.hypot(c - cx, r - cy);
            const wob  = wobble ? (fbm(c * 0.28 + cx, r * 0.28 + cy) - 0.5) * 2 * rad * wobble : 0;
            if (dist + wob <= rad) setTile(c, r, t);
        }
    }
}

// ===== WORLD GENERATION — حدود مناطق منحنية عبر الضجيج =====
function generateWorld() {
    tileMap.fill(T.GRASS);
    const COLS = CFG.WORLD_COLS, ROWS = CFG.WORLD_ROWS;

    // ——— غابة مظلمة (DARK) بحواف متعرّجة على اليسار والأعلى ———
    for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
            const nL = fbm(c * 0.14, r * 0.14);
            const nT = fbm(c * 0.12 + 20, r * 0.12 + 5);
            const leftEdge = 7 + nL * 8;                 // حافة يسرى تتموّج ~7..15
            const topEdge  = 5 + nT * 8;                 // حافة عليا تتموّج ~5..13
            let dark = c < leftEdge;
            // زوايا علوية أعمق (يسار وأعلى-يمين)
            if (r < topEdge + 6 && (c < 22 + nT * 7 || c > 56 - nT * 7)) dark = true;
            if (dark) setTile(c, r, T.DARK);
        }
    }

    // ——— كتلة جبلية (ROCK) يمين بساحل مموّج ———
    for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
            const n = fbm(c * 0.11 + 50, r * 0.11 + 50);
            const rockEdge = 60 + n * 9;                 // حدّ يتموّج ~60..69
            if (c > rockEdge && r > 15 + n * 9 && r < 66 - n * 7) setTile(c, r, T.ROCK);
        }
    }

    // ——— بقع غابة كثيفة (DEEP) عضوية داخل العشب ———
    for (let i = 0; i < 70; i++) {
        const c = 10 + Math.floor(seededRand(i * 7) * 58);
        const r = 14 + Math.floor(seededRand(i * 13) * 52);
        if (getTile(c, r) === T.GRASS) setBlob(c, r, 2 + seededRand(i) * 3.2, T.DEEP, 0.55);
    }

    // ——— بحيرات بحواف مموّجة (شاطئ رملي ثم ماء) ———
    setBlob(12, 12, 10, T.SAND, 0.4); setBlob(12, 12, 8, T.WATER, 0.4);
    setBlob(68, 12, 9,  T.SAND, 0.4); setBlob(68, 12, 7, T.WATER, 0.4);
    setBlob(40, 38, 6,  T.SAND, 0.35); setBlob(40, 38, 4, T.WATER, 0.35);

    // ——— شريط رملي جنوبي متموّج نحو بوابة المدينة ———
    for (let r = 57; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
            const n = fbm(c * 0.22, r * 0.22 + 30);
            if (c > 35 + n * 5 && c < 45 - n * 5) setTile(c, r, T.SAND);
        }
    }

    generateTrees();
}

function seededRand(seed) {
    const x = Math.sin(seed + 1) * 10000;
    return x - Math.floor(x);
}

// rgba من لون hex بألفا مخصص (لتنعيم حواف المناطق)
function _hexA(hex, a) {
    const n = parseInt(hex.slice(1), 16);
    return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
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

// ===== HABITAT ZONES — منطقة مفضّلة لكل حيوان =====
// يُولَّد الحيوان داخل منطقته، ويمكنه الخروج قليلاً لكن يعود غالباً إليها
// مرجع الخريطة (بالبكسل، الخلية = 40px):
//   DARK  : يسار / أعلى-يسار / أعلى-يمين
//   ROCK  : يمين (جبل)
//   WATER : بحيرات ش-غ، ش-ش، وسط + شريط رملي جنوبي
const ANIMAL_HABITATS = {
    wildRabbit: {
        zones: [[850, 1600, 2350, 2900], [1000, 2200, 2200, 3050]],
        count: 10, leash: 380
    },
    deer: {
        zones: [[900, 1800, 2300, 3000], [1000, 1100, 2100, 1900]],
        count: 5, leash: 420
    },
    fox: {
        zones: [[800, 1200, 2200, 2400], [600, 1600, 1800, 2500]],
        count: 5, leash: 400
    },
    wolf: {
        zones: [[2560, 850, 3150, 2000], [2560, 2000, 3150, 2450]],
        prefer: T.ROCK, count: 8, leash: 450
    },
    snake: {
        zones: [[30, 100, 310, 3100], [30, 30, 870, 970], [2290, 30, 3150, 970]],
        prefer: T.DARK, count: 13, leash: 320
    },
    wildBoar: {
        zones: [[350, 300, 1800, 1300], [1800, 100, 3000, 900]],
        count: 6, leash: 400
    },
    bear: {
        zones: [[150, 150, 880, 880], [2200, 150, 3100, 880], [1200, 1250, 2050, 1850]],
        count: 6, leash: 480
    },
    gorilla: {
        zones: [[30, 30, 700, 900], [2290, 30, 3100, 800]],
        prefer: T.DARK, count: 4, leash: 360
    },
    crocodile: {
        zones: [[150, 150, 800, 800], [2380, 150, 3100, 800], [1440, 1360, 1820, 1760], [1460, 2360, 1700, 3100]],
        prefer: T.WATER, count: 10, leash: 500
    },
    eagle: {
        zones: [[600, 200, 2600, 1600]],
        count: 3, leash: 550
    },
    // مفترسات ليلية — مناطق مظلمة/صخرية بعيدة عن الجنوب
    direWolf: {
        zones: [[2560, 850, 3150, 2200], [30, 100, 500, 2000]],
        prefer: T.ROCK, count: 4, leash: 500
    },
    nightPanther: {
        zones: [[30, 30, 870, 1200], [2290, 30, 3150, 1100]],
        prefer: T.DARK, count: 3, leash: 480
    },
    giantSpider: {
        zones: [[30, 800, 400, 2800], [2400, 200, 3150, 1400]],
        prefer: T.DARK, count: 3, leash: 400
    },
    shadowBeast: {
        zones: [[80, 80, 700, 900], [2400, 80, 3100, 900]],
        prefer: T.DARK, count: 1, leash: 520
    },
};

function _isBlockedByStructure(x, y, radius) {
    if (typeof structures === 'undefined' || !structures.length) return false;
    for (const s of structures) {
        const def = (typeof BUILDABLES !== 'undefined') ? BUILDABLES[s.type] : null;
        if (!def || !def.solid) continue;
        if (def.gate) continue; // البوابة ليست منطقة توليد محظورة بالكامل
        if (Math.hypot(s.x - x, s.y - y) < (s.r || def.r) + radius + 8) return true;
    }
    return false;
}

function _tileOkForPrefer(tile, prefer, tries) {
    if (prefer === T.WATER) {
        if (tile === T.WATER || tile === T.SAND) return true;
        return tries > 18 && tile !== T.WATER;
    }
    if (prefer === T.SAND) {
        if (tile === T.SAND) return true;
        return tries > 18 && tile !== T.WATER;
    }
    if (prefer === T.ROCK) {
        if (tile === T.ROCK) return true;
        return tries > 18 && tile !== T.WATER;
    }
    if (prefer === T.DARK) {
        if (tile === T.DARK) return true;
        return tries > 18 && tile !== T.WATER;
    }
    return tile !== T.WATER;
}

/** يختار نقطة توليد داخل مناطق الحيوان المفضّلة (يتجنب الماء/السياج) */
function pickHabitatSpawn(type, opts) {
    opts = opts || {};
    const hab = ANIMAL_HABITATS[type];
    const zones = hab && hab.zones && hab.zones.length
        ? hab.zones
        : [[220, 220, CFG.WORLD_W - 220, CFG.WORLD_H - 220]];
    const prefer = hab ? hab.prefer : undefined;
    const minDist = opts.minDistFromPlayer || 0;
    const radius = opts.radius || 16;

    for (let tries = 0; tries < 50; tries++) {
        const zone = zones[Math.floor(Math.random() * zones.length)];
        const x = zone[0] + Math.random() * (zone[2] - zone[0]);
        const y = zone[1] + Math.random() * (zone[3] - zone[1]);
        const tile = getTile(Math.floor(x / CFG.TILE_SIZE), Math.floor(y / CFG.TILE_SIZE));
        if (!_tileOkForPrefer(tile, prefer, tries)) continue;
        if (minDist > 0 && typeof player !== 'undefined' &&
            Math.hypot(x - player.x, y - player.y) < minDist) continue;
        if (_isBlockedByStructure(x, y, radius)) continue;
        return { x, y, leash: (hab && hab.leash) || 400 };
    }
    return null;
}

function spawnEnemyInHabitat(type, opts) {
    const tmpl = ENEMY_TEMPLATES[type];
    if (!tmpl) return null;
    const pt = pickHabitatSpawn(type, Object.assign({ radius: tmpl.radius || 16 }, opts || {}));
    if (!pt) return null;
    const e = new Enemy(tmpl, pt.x, pt.y);
    e.homeX = pt.x;
    e.homeY = pt.y;
    e.leashRadius = pt.leash;
    enemies.push(e);
    return e;
}

function spawnEnemies() {
    for (const [type, hab] of Object.entries(ANIMAL_HABITATS)) {
        if (!ENEMY_TEMPLATES[type] || ENEMY_TEMPLATES[type].nocturnal) continue;
        const n = hab.count || 0;
        for (let i = 0; i < n; i++) spawnEnemyInHabitat(type);
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
    // أعشاب نادرة على العشب (لا تستجيب — تُجمع مرة)
    for (let i = 0; i < 10; i++) {
        let x, y, tries = 0;
        do {
            x = 350 + seededRand(i * 31 + 200) * 2500;
            y = 350 + seededRand(i * 37 + 210) * 2500;
            tries++;
        } while ((isWater(x, y) || getTile(Math.floor(x / CFG.TILE_SIZE), Math.floor(y / CFG.TILE_SIZE)) === T.ROCK) && tries < 14);
        resources.push(new ResourceNode('herb', x, y));
    }
    // خلايا عسل قليلة (3–8)
    for (let i = 0; i < 6; i++) {
        let x, y, tries = 0;
        do {
            x = 450 + seededRand(i * 41 + 300) * 2300;
            y = 450 + seededRand(i * 43 + 310) * 2300;
            tries++;
        } while (isWater(x, y) && tries < 14);
        resources.push(new ResourceNode('honey', x, y));
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

    // PASS 2.5 — تنعيم حواف المناطق: كل خلية حدودية تنشر لونها قليلاً على الجيران
    // فيتحوّل الحدّ المتدرّج (السلالم) إلى انتقال ناعم ويختفي مظهر المربعات
    for (let r = 0; r < CFG.WORLD_ROWS; r++) {
        for (let c = 0; c < CFG.WORLD_COLS; c++) {
            const t = getTile(c, r);
            if (t !== getTile(c - 1, r) || t !== getTile(c + 1, r) ||
                t !== getTile(c, r - 1) || t !== getTile(c, r + 1) ||
                t !== getTile(c - 1, r - 1) || t !== getTile(c + 1, r + 1) ||
                t !== getTile(c - 1, r + 1) || t !== getTile(c + 1, r - 1)) {
                const cfg = TYPES.find(x => x.id === t);
                const base = cfg ? cfg.base : '#3a8228';
                const cx2 = c * cs + cs / 2, cy2 = r * cs + cs / 2;
                const grd = tc.createRadialGradient(cx2, cy2, cs * 0.15, cx2, cy2, cs * 1.05);
                grd.addColorStop(0, _hexA(base, 0.0));
                grd.addColorStop(0.55, _hexA(base, 0.28));
                grd.addColorStop(1, _hexA(base, 0.62));
                tc.fillStyle = grd;
                tc.beginPath(); tc.arc(cx2, cy2, cs * 1.05, 0, Math.PI * 2); tc.fill();
            }
        }
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
