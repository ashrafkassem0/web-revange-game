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

// ===== مناطق إقليمية — كل منطقة = طبقة DOM/SVG واحدة (شكل متموج) =====
const WAVY_CLIP_PATHS = {
    organic1: 'M0.207,0.288 C0.187,0.312,0.149,0.347,0.1,0.364 C0.033,0.387,0,0.449,0,0.518 C0,0.57,0.024,0.613,0.05,0.643 C0.038,0.702,0.051,0.75,0.091,0.781 C0.119,0.803,0.158,0.814,0.21,0.811 C0.211,0.857,0.236,0.92,0.301,0.96 C0.386,1,0.551,1,0.627,0.992 C0.686,0.986,0.73,0.96,0.74,0.906 C0.778,0.914,0.824,0.913,0.865,0.884 C0.919,0.846,0.923,0.781,0.912,0.738 C0.967,0.71,1,0.665,1,0.602 C1,0.54,0.967,0.495,0.913,0.468 C0.923,0.426,0.92,0.361,0.866,0.323 C0.835,0.3,0.793,0.297,0.752,0.304 C0.747,0.244,0.71,0.161,0.63,0.113 C0.528,0.053,0.42,0.09,0.36,0.134 C0.328,0.113,0.28,0.096,0.228,0.117 C0.188,0.133,0.16,0.174,0.15,0.218 C0.15,0.241,0.16,0.273,0.178,0.296 L0.207,0.288 Z',
    organic2: 'M0.25,0.15 C0.15,0.2,0.05,0.35,0.08,0.5 C0.1,0.62,0.02,0.75,0.15,0.85 C0.28,0.95,0.45,0.88,0.6,0.92 C0.75,0.95,0.9,0.85,0.92,0.7 C0.95,0.55,0.85,0.45,0.88,0.3 C0.9,0.15,0.75,0.05,0.6,0.08 C0.45,0.1,0.35,0.05,0.25,0.15 Z',
    organic3: 'M0.3,0.05 C0.15,0.08,0.05,0.25,0.1,0.4 C0.15,0.55,0.05,0.65,0.15,0.78 C0.25,0.9,0.45,0.82,0.55,0.88 C0.65,0.95,0.85,0.9,0.9,0.75 C0.95,0.6,0.82,0.5,0.88,0.35 C0.95,0.2,0.8,0.1,0.65,0.05 C0.5,0,0.45,0.02,0.3,0.05 Z',
};

/** تعريفات الطبقات الإقليمية (إحداثيات عالم 3200×3200)
 *  كل طبقة = خلفية صورة متكررة من game/textures/*.png داخل شكل متموج واحد */
const REGION_DEFS = {
    // رمال الشمال تمتد شرقاً تحت سفوح الجبال للتناغم البصري
    northSand: {
        el: 'layer-north-sand',
        x: 700, y: 20, w: 2400, h: 900,
        pathKey: 'organic2',
        tile: T.SAND,
        layers: [
            { scale: 1.00, texture: 'sand' },
            { scale: 0.42, texture: 'water', tile: T.WATER },
        ],
    },
    // الجبال فوق الرمال (z-index أعلى) — سفح رملي خفيف ثم صخر
    mountains: {
        el: 'layer-mountains',
        x: 2180, y: 200, w: 1080, h: 2300,
        pathKey: 'organic3',
        tile: T.ROCK,
        layers: [
            { scale: 1.00, texture: 'sand', opacity: 0.55 },
            { scale: 0.82, texture: 'rock' },
        ],
    },
    westForest: {
        el: 'layer-west-forest',
        x: 20, y: 80, w: 980, h: 2800,
        pathKey: 'organic1',
        tile: T.DARK,
        layers: [
            { scale: 1.00, texture: 'deep', tile: T.DEEP },
            { scale: 0.72, texture: 'dark', tile: T.DARK },
        ],
    },
    centerMeadows: {
        el: 'layer-center-meadows',
        x: 900, y: 1000, w: 1400, h: 1200,
        pathKey: 'organic2',
        tile: T.GRASS,
        layers: [
            { scale: 1.00, texture: 'grass' },
        ],
    },
    southGate: {
        el: 'layer-south-gate',
        x: 1180, y: 2680, w: 840, h: 520,
        pathKey: 'organic3',
        tile: T.SAND,
        layers: [
            { scale: 1.00, texture: 'sand' },
        ],
        roads: true,
    },
};

/**
 * Animal Zones — كل منطقة إقليمية تتميز بحيواناتها
 * التوليد يتم داخل حدود REGION_DEFS (شكل متموج) وليس مستطيلات عشوائية فقط
 */
const ANIMAL_ZONES = {
    mountains: {
        label: 'جبال الشرق',
        animals: [
            { type: 'wolf',     count: 8, leash: 450, prefer: T.ROCK },
            { type: 'direWolf', count: 4, leash: 500, prefer: T.ROCK },
            { type: 'bear',     count: 3, leash: 480 },
            { type: 'eagle',    count: 2, leash: 550 },
        ],
    },
    westForest: {
        label: 'غابة الغرب المظلمة',
        animals: [
            { type: 'snake',        count: 10, leash: 320, prefer: T.DARK },
            { type: 'gorilla',      count: 4,  leash: 360, prefer: T.DARK },
            { type: 'bear',         count: 2,  leash: 480 },
            { type: 'nightPanther', count: 3,  leash: 480, prefer: T.DARK },
            { type: 'giantSpider',  count: 3,  leash: 400, prefer: T.DARK },
            { type: 'shadowBeast',  count: 1,  leash: 520, prefer: T.DARK },
        ],
    },
    northSand: {
        label: 'رمال الشمال والبحيرة',
        animals: [
            { type: 'crocodile', count: 8, leash: 500, prefer: T.WATER },
            { type: 'eagle',     count: 1, leash: 550 },
        ],
    },
    centerMeadows: {
        label: 'مراعي الوسط',
        animals: [
            { type: 'wildRabbit', count: 10, leash: 380 },
            { type: 'deer',       count: 5,  leash: 420, prefer: T.GRASS },
            { type: 'fox',        count: 5,  leash: 400 },
            { type: 'wildBoar',   count: 6,  leash: 400 },
        ],
    },
    southGate: {
        label: 'مدخل المدينة',
        animals: [
            { type: 'wildRabbit', count: 3, leash: 300 },
            { type: 'fox',        count: 1, leash: 350 },
        ],
    },
};

const _zoneProbeCtx = (typeof document !== 'undefined')
    ? document.createElement('canvas').getContext('2d')
    : null;

/** يحوّل مسار SVG (0..1) إلى Path2D بإحداثيات العالم */
function buildRegionPath(region, scale) {
    scale = scale == null ? 1 : scale;
    const d = WAVY_CLIP_PATHS[region.pathKey];
    if (!d) return null;
    const s = Math.max(0.05, scale);
    const ox = region.x + region.w * (1 - s) * 0.5;
    const oy = region.y + region.h * (1 - s) * 0.5;
    const sx = region.w * s;
    const sy = region.h * s;

    const path = new Path2D();
    const tokens = d.match(/[MLCZ]|-?\d*\.?\d+(?:e[-+]?\d+)?/gi);
    if (!tokens || !tokens.length) return null;

    let i = 0;
    let cmd = 'M';
    const num = () => parseFloat(tokens[i++]);
    const X = (u) => ox + u * sx;
    const Y = (v) => oy + v * sy;

    while (i < tokens.length) {
        const t = tokens[i];
        if (/^[MLCZ]$/i.test(t)) {
            cmd = t.toUpperCase();
            i++;
        }
        if (cmd === 'M') {
            path.moveTo(X(num()), Y(num()));
            cmd = 'L';
        } else if (cmd === 'L') {
            path.lineTo(X(num()), Y(num()));
        } else if (cmd === 'C') {
            const x1 = X(num()), y1 = Y(num());
            const x2 = X(num()), y2 = Y(num());
            const x  = X(num()), y  = Y(num());
            path.bezierCurveTo(x1, y1, x2, y2, x, y);
        } else if (cmd === 'Z') {
            path.closePath();
        } else {
            break;
        }
    }
    return path;
}

function pointInRegionPath(path, wx, wy) {
    if (!path || !_zoneProbeCtx) return false;
    return _zoneProbeCtx.isPointInPath(path, wx, wy);
}

function pointInRegion(regionKey, wx, wy, scale) {
    const region = REGION_DEFS[regionKey];
    if (!region) return false;
    return pointInRegionPath(buildRegionPath(region, scale == null ? 1 : scale), wx, wy);
}

/** يملأ tileMap من الطبقات للاستعلام (توليد/خريطة مصغّرة) */
function stampRegionToTiles(region) {
    const cs = CFG.TILE_SIZE;
    for (const layer of region.layers) {
        const path = buildRegionPath(region, layer.scale);
        if (!path) continue;
        const tile = layer.tile != null ? layer.tile : region.tile;
        const c0 = Math.max(0, Math.floor(region.x / cs));
        const r0 = Math.max(0, Math.floor(region.y / cs));
        const c1 = Math.min(CFG.WORLD_COLS - 1, Math.ceil((region.x + region.w) / cs));
        const r1 = Math.min(CFG.WORLD_ROWS - 1, Math.ceil((region.y + region.h) / cs));
        for (let r = r0; r <= r1; r++) {
            for (let c = c0; c <= c1; c++) {
                if (pointInRegionPath(path, c * cs + cs * 0.5, r * cs + cs * 0.5)) {
                    setTile(c, r, tile);
                }
            }
        }
    }
}

function stampAllRegions() {
    // رمال أولاً ثم جبال فوقها (tileMap + بصرياً)، ثم باقي المناطق
    for (const key of ['westForest', 'northSand', 'mountains', 'centerMeadows', 'southGate']) {
        stampRegionToTiles(REGION_DEFS[key]);
    }
}

// ===== WORLD GENERATION =====
function generateWorld() {
    tileMap.fill(T.GRASS);
    stampAllRegions();
    generateTrees();
    generateRocks();
}

function seededRand(seed) {
    const x = Math.sin(seed + 1) * 10000;
    return x - Math.floor(x);
}

function _hexA(hex, a) {
    const n = parseInt(hex.slice(1), 16);
    return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
}

/** بلاطة العالم عند إحداثيات العالم */
function tileAtWorld(wx, wy) {
    return getTile(Math.floor(wx / CFG.TILE_SIZE), Math.floor(wy / CFG.TILE_SIZE));
}

/** أشجار: غابة مظلمة / غابة عميقة / أعشاب فقط — لا جبال ولا ماء ولا رمال */
function canPlaceTreeAt(wx, wy) {
    if (isWater(wx, wy)) return false;
    const t = tileAtWorld(wx, wy);
    return t === T.GRASS || t === T.DARK || t === T.DEEP;
}

/** عسل: الغابات المظلمة / العميقة فقط */
function canPlaceHoneyAt(wx, wy) {
    if (isWater(wx, wy)) return false;
    const t = tileAtWorld(wx, wy);
    return t === T.DARK || t === T.DEEP;
}

/** أعشاب: المراعي العشبية فقط */
function canPlaceHerbAt(wx, wy) {
    if (isWater(wx, wy)) return false;
    return tileAtWorld(wx, wy) === T.GRASS;
}

/** عصي ساقطة: غابات + أعشاب */
function canPlaceStickAt(wx, wy) {
    return canPlaceTreeAt(wx, wy);
}

/** حجارة صغيرة / صخور تعدين: جبال وصخور (+ سفوح رملية خفيفة) — لا غابات ولا ماء */
function canPlaceStoneAt(wx, wy) {
    if (isWater(wx, wy)) return false;
    const t = tileAtWorld(wx, wy);
    return t === T.ROCK || t === T.SAND;
}

function canPlaceMineRockAt(wx, wy) {
    if (isWater(wx, wy)) return false;
    const t = tileAtWorld(wx, wy);
    return t === T.ROCK || (t === T.SAND && pointInRegion('mountains', wx, wy, 1.05));
}

/**
 * يضع عناصر داخل مناطق إقليمية محددة مع فلتر بلاطة.
 * @param {string[]} regionKeys مفاتيح REGION_DEFS
 * @param {function} tileOk (x,y) => boolean
 */
function _pickBiomePoint(regionKeys, tileOk, seedRef, avoidList, minDist) {
    avoidList = avoidList || [];
    minDist = minDist || 20;
    for (let tries = 0; tries < 40; tries++) {
        const key = regionKeys[Math.floor(seededRand(seedRef.n++) * regionKeys.length)];
        const region = REGION_DEFS[key];
        if (!region) continue;
        const pad = 50;
        const x = region.x + pad + seededRand(seedRef.n++) * Math.max(40, region.w - pad * 2);
        const y = region.y + pad + seededRand(seedRef.n++) * Math.max(40, region.h - pad * 2);
        if (!pointInRegion(key, x, y, 1)) continue;
        if (typeof tileOk === 'function' && !tileOk(x, y)) continue;
        let ok = true;
        for (const o of avoidList) {
            const or = o.r || 12;
            if (Math.hypot((o.x || 0) - x, (o.y || 0) - y) < or + minDist) { ok = false; break; }
        }
        if (!ok) continue;
        return { x, y, regionKey: key };
    }
    return null;
}

function generateTrees() {
    // غابة الغرب المظلمة + مراعي الوسط (أعشاب) — لا جبال / ماء / بوابة رملية
    const plans = [
        { regions: ['westForest'], count: 70, rMin: 18, rMax: 40 },
        { regions: ['centerMeadows'], count: 48, rMin: 15, rMax: 30 },
    ];
    const seedRef = { n: 0 };
    for (const plan of plans) {
        let placed = 0, tries = 0;
        while (placed < plan.count && tries < plan.count * 12) {
            tries++;
            const pt = _pickBiomePoint(plan.regions, canPlaceTreeAt, seedRef, trees, 14);
            if (!pt) continue;
            const r = plan.rMin + seededRand(seedRef.n++) * (plan.rMax - plan.rMin);
            let ok = true;
            for (const t of trees) {
                if (Math.hypot(t.x - pt.x, t.y - pt.y) < t.r + r + 8) { ok = false; break; }
            }
            if (!ok) continue;
            const maxHp = 3;
            trees.push({ x: pt.x, y: pt.y, r, hp: maxHp, maxHp, chopped: false, shakeTimer: 0 });
            placed++;
        }
    }
}

/** صخور كبيرة قابلة للتعدين — الجبال والصخور فقط */
function generateRocks() {
    if (typeof rocks === 'undefined') return;
    rocks.length = 0;
    const plans = [
        { regions: ['mountains'], count: 18, rMin: 22, rMax: 38 },
        { regions: ['northSand'], count: 4, rMin: 20, rMax: 30 }, // سفوح رملية قرب الجبال فقط عبر canPlaceMineRockAt
    ];
    const seedRef = { n: 9000 };
    for (const plan of plans) {
        let placed = 0, tries = 0;
        while (placed < plan.count && tries < plan.count * 14) {
            tries++;
            const pt = _pickBiomePoint(plan.regions, canPlaceMineRockAt, seedRef, rocks.concat(trees), 20);
            if (!pt) continue;
            const r = plan.rMin + seededRand(seedRef.n++) * (plan.rMax - plan.rMin);
            let ok = true;
            for (const rk of rocks) {
                if (Math.hypot(rk.x - pt.x, rk.y - pt.y) < rk.r + r + 18) { ok = false; break; }
            }
            if (!ok) continue;
            for (const t of trees) {
                if (Math.hypot(t.x - pt.x, t.y - pt.y) < t.r + r + 12) { ok = false; break; }
            }
            if (!ok) continue;
            const maxHp = 3 + Math.floor(seededRand(seedRef.n++) * 2);
            rocks.push({
                x: pt.x, y: pt.y, r,
                hp: maxHp, maxHp,
                mined: false, shakeTimer: 0,
                yieldMin: 2, yieldMax: 5
            });
            placed++;
        }
    }
}

/** يبني ANIMAL_HABITATS من ANIMAL_ZONES + حدود REGION_DEFS */
function _buildHabitatsFromAnimalZones() {
    const out = {};
    for (const [regionKey, zone] of Object.entries(ANIMAL_ZONES)) {
        const region = REGION_DEFS[regionKey];
        if (!region || !zone.animals) continue;
        const bbox = [
            region.x + 40,
            region.y + 40,
            region.x + region.w - 40,
            region.y + region.h - 40,
        ];
        for (const a of zone.animals) {
            const prefer = a.prefer;
            if (!out[a.type]) {
                out[a.type] = {
                    zones: [bbox],
                    regionKeys: [regionKey],
                    prefer: prefer,
                    count: a.count || 0,
                    leash: a.leash || 400,
                };
            } else {
                out[a.type].zones.push(bbox);
                out[a.type].regionKeys.push(regionKey);
                out[a.type].count += a.count || 0;
                if (prefer !== out[a.type].prefer) out[a.type].prefer = undefined;
            }
        }
    }
    return out;
}

// ===== HABITAT ZONES — مشتقّة من Animal Zones الإقليمية =====
const ANIMAL_HABITATS = _buildHabitatsFromAnimalZones();

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
        if (tile === T.DARK || tile === T.DEEP) return true;
        return tries > 18 && tile !== T.WATER;
    }
    if (prefer === T.DEEP) {
        if (tile === T.DEEP || tile === T.GRASS) return true;
        return tries > 18 && tile !== T.WATER;
    }
    return tile !== T.WATER;
}

/** منطقة مفضّلة لتوليد أهداف مهام القتل */
const QUEST_SPAWN_REGIONS = {
    wildRabbit: 'centerMeadows',
    fox: 'centerMeadows',
    wolf: 'mountains',
    deer: 'centerMeadows',
    wildBoar: 'centerMeadows',
    bear: 'mountains',
    snake: 'westForest',
    direWolf: 'westForest',
    nightPanther: 'westForest',
    giantSpider: 'westForest'
};

/** يختار نقطة توليد داخل Animal Zone الإقليمية (شكل متموج) */
function pickHabitatSpawn(type, opts) {
    opts = opts || {};
    const hab = ANIMAL_HABITATS[type];
    let zones = hab && hab.zones && hab.zones.length
        ? hab.zones.slice()
        : [[220, 220, CFG.WORLD_W - 220, CFG.WORLD_H - 220]];
    let regionKeys = (hab && hab.regionKeys) ? hab.regionKeys.slice() : [];
    const prefer = hab ? hab.prefer : undefined;
    const minDist = opts.minDistFromPlayer || 0;
    const radius = opts.radius || 16;
    const preferRegion = opts.preferRegionKey || null;

    // إن طُلبت منطقة معيّنة (مثل مراعي الأرانب) — ضيّق الاختيار إليها أولاً
    if (preferRegion && regionKeys.length) {
        const filteredZones = [];
        const filteredKeys = [];
        for (let i = 0; i < regionKeys.length; i++) {
            if (regionKeys[i] === preferRegion) {
                filteredZones.push(zones[i]);
                filteredKeys.push(regionKeys[i]);
            }
        }
        if (filteredZones.length) {
            zones = filteredZones;
            regionKeys = filteredKeys;
        } else if (REGION_DEFS[preferRegion]) {
            const region = REGION_DEFS[preferRegion];
            zones = [[
                region.x + 40,
                region.y + 40,
                region.x + region.w - 40,
                region.y + region.h - 40
            ]];
            regionKeys = [preferRegion];
        }
    }

    for (let tries = 0; tries < 60; tries++) {
        const zi = Math.floor(Math.random() * zones.length);
        const zone = zones[zi];
        const regionKey = regionKeys[zi];
        const x = zone[0] + Math.random() * (zone[2] - zone[0]);
        const y = zone[1] + Math.random() * (zone[3] - zone[1]);

        // التزم بحدود الشكل المتموج للمنطقة إن وُجدت
        if (regionKey && !pointInRegion(regionKey, x, y, 1)) {
            if (tries < 40) continue;
        }

        const tile = getTile(Math.floor(x / CFG.TILE_SIZE), Math.floor(y / CFG.TILE_SIZE));
        if (!_tileOkForPrefer(tile, prefer, tries)) continue;
        if (minDist > 0 && typeof player !== 'undefined' &&
            Math.hypot(x - player.x, y - player.y) < minDist) continue;
        if (_isBlockedByStructure(x, y, radius)) continue;
        if (typeof isInCityPortalSafeZone === 'function' && isInCityPortalSafeZone(x, y, radius + 20)) continue;
        return { x, y, leash: (hab && hab.leash) || 400, regionKey: regionKey || null };
    }
    return null;
}

function spawnEnemyInHabitat(type, opts) {
    opts = opts || {};
    const tmpl = ENEMY_TEMPLATES[type];
    if (!tmpl) return null;
    const pt = pickHabitatSpawn(type, Object.assign({ radius: tmpl.radius || 16 }, opts));
    if (!pt) return null;
    let forceLevel = opts.forceLevel;
    if (forceLevel == null && opts.minLevel != null) {
        const lo = tmpl.levelMin != null ? tmpl.levelMin : 1;
        const hi = tmpl.levelMax != null ? tmpl.levelMax : lo;
        forceLevel = Math.max(lo, Math.min(hi, opts.minLevel));
    }
    const e = new Enemy(tmpl, pt.x, pt.y, forceLevel);
    e.homeX = pt.x;
    e.homeY = pt.y;
    e.leashRadius = pt.leash;
    if (opts.questSpawn) e.questSpawn = true;
    enemies.push(e);
    return e;
}

/**
 * يضمن وجود عدد كافٍ من نوع حيوان حيّ في موطنه (لمهام القتل).
 * @returns {number} عدد ما تم توليده الآن
 */
function ensureHabitatPopulation(type, targetCount, opts) {
    opts = opts || {};
    if (!type || !(targetCount > 0)) return 0;
    if (typeof enemies === 'undefined' || !enemies) return 0;
    const tmpl = ENEMY_TEMPLATES[type];
    if (!tmpl) return 0;

    const minLevel = opts.minLevel != null ? opts.minLevel : 1;
    const preferRegion = opts.preferRegionKey || QUEST_SPAWN_REGIONS[type] || null;
    let alive = 0;
    for (const e of enemies) {
        if (e.isDead || e.id !== type) continue;
        if ((e.level || 1) < minLevel) continue;
        // إن حُددت منطقة مهمة — احسب فقط من بداخلها
        if (preferRegion && typeof pointInRegion === 'function') {
            if (!pointInRegion(preferRegion, e.x, e.y, 1)) continue;
        }
        alive++;
    }
    const need = Math.max(0, targetCount - alive);
    if (!need) return 0;

    const spawnOpts = {
        preferRegionKey: preferRegion,
        minDistFromPlayer: opts.minDistFromPlayer != null ? opts.minDistFromPlayer : 90,
        minLevel: minLevel,
        forceLevel: opts.forceLevel,
        questSpawn: true
    };

    let spawned = 0;
    for (let i = 0; i < need; i++) {
        const e = spawnEnemyInHabitat(type, spawnOpts);
        if (e) spawned++;
    }
    return spawned;
}

if (typeof window !== 'undefined') {
    window.QUEST_SPAWN_REGIONS = QUEST_SPAWN_REGIONS;
    window.pickHabitatSpawn = pickHabitatSpawn;
    window.spawnEnemyInHabitat = spawnEnemyInHabitat;
    window.ensureHabitatPopulation = ensureHabitatPopulation;
    window.ANIMAL_HABITATS = ANIMAL_HABITATS;
    window.ANIMAL_ZONES = ANIMAL_ZONES;
}

function spawnEnemies() {
    for (const [type, hab] of Object.entries(ANIMAL_HABITATS)) {
        if (!ENEMY_TEMPLATES[type] || ENEMY_TEMPLATES[type].nocturnal) continue;
        const n = hab.count || 0;
        for (let i = 0; i < n; i++) spawnEnemyInHabitat(type);
    }
}

// ===== SPAWN RESOURCES — كل مورد في بيئته الطبيعية =====
function spawnResources() {
    const seedRef = { n: 200 };

    // عصي: غابة مظلمة + مراعي عشبية
    for (let i = 0; i < 26; i++) {
        const regions = i < 16 ? ['westForest'] : ['centerMeadows'];
        const pt = _pickBiomePoint(regions, canPlaceStickAt, seedRef, resources, 28);
        if (pt) resources.push(new ResourceNode('stick', pt.x, pt.y));
    }

    // حجارة صغيرة: جبال / صخور (+ رمال سفوح)
    for (let i = 0; i < 10; i++) {
        const regions = i < 8 ? ['mountains'] : ['northSand'];
        const pt = _pickBiomePoint(regions, canPlaceStoneAt, seedRef, resources, 32);
        if (pt) resources.push(new ResourceNode('stone', pt.x, pt.y));
    }

    // أعشاب: مراعي الوسط فقط
    for (let i = 0; i < 12; i++) {
        const pt = _pickBiomePoint(['centerMeadows'], canPlaceHerbAt, seedRef, resources, 36);
        if (pt) resources.push(new ResourceNode('herb', pt.x, pt.y));
    }

    // عسل: الغابة المظلمة فقط (westForest)
    for (let i = 0; i < 7; i++) {
        const pt = _pickBiomePoint(['westForest'], canPlaceHoneyAt, seedRef, resources, 48);
        if (pt) resources.push(new ResourceNode('honey', pt.x, pt.y));
    }
}

// ===== DOM/SVG WORLD LAYERS =====
let _worldLayersEl = null;

function _scaledPathD(pathKey, scale) {
    const d = WAVY_CLIP_PATHS[pathKey];
    if (!d) return '';
    const s = Math.max(0.05, scale);
    const ox = (1 - s) * 0.5;
    const oy = (1 - s) * 0.5;
    const tokens = d.match(/[MLCZ]|-?\d*\.?\d+(?:e[-+]?\d+)?/gi);
    if (!tokens) return '';
    let i = 0;
    let cmd = 'M';
    let out = '';
    const num = () => parseFloat(tokens[i++]);
    const X = (u) => (ox + u * s).toFixed(4);
    const Y = (v) => (oy + v * s).toFixed(4);
    while (i < tokens.length) {
        const t = tokens[i];
        if (/^[MLCZ]$/i.test(t)) {
            cmd = t.toUpperCase();
            i++;
        }
        if (cmd === 'M') {
            out += `M${X(num())},${Y(num())} `;
            cmd = 'L';
        } else if (cmd === 'L') {
            out += `L${X(num())},${Y(num())} `;
        } else if (cmd === 'C') {
            out += `C${X(num())},${Y(num())} ${X(num())},${Y(num())} ${X(num())},${Y(num())} `;
        } else if (cmd === 'Z') {
            out += 'Z';
        } else {
            break;
        }
    }
    return out.trim();
}

function _buildRegionHtml(region, key) {
    const uid = 'rg_' + key;
    let defs = '';
    let fills = '';
    let clipSeq = 0;

    function addClip(scale) {
        const clipId = `${uid}_clip${clipSeq++}`;
        const d = _scaledPathD(region.pathKey, scale);
        defs += `
            <clipPath id="${clipId}" clipPathUnits="objectBoundingBox">
                <path d="${d}"></path>
            </clipPath>`;
        return clipId;
    }

    function addFill(tex, clipId, opacity, z, extraClass) {
        fills += `
            <div class="region-fill${extraClass ? ' ' + extraClass : ''}" style="
                background-image: url('${tex}');
                opacity: ${opacity};
                clip-path: url(#${clipId});
                -webkit-clip-path: url(#${clipId});
                z-index: ${z};
            "></div>`;
    }

    region.layers.forEach((layer, li) => {
        const baseScale = layer.scale;
        const opacity = layer.opacity != null ? layer.opacity : 1;
        const tex = `../textures/${layer.texture}.png`;
        const zBase = (li + 1) * 10;

        // حواف مموّهة خارجية (أكبر + blur) تمتزج مع العشب/الجيران
        const softFarId = addClip(Math.min(1.08, baseScale * 1.10));
        addFill(tex, softFarId, opacity * 0.22, zBase, 'region-fill--soft region-fill--soft-far');

        const softNearId = addClip(Math.min(1.05, baseScale * 1.05));
        addFill(tex, softNearId, opacity * 0.40, zBase + 1, 'region-fill--soft');

        // اللب الواضح أصغر قليلاً حتى يبقى التمويه ظاهراً على الحافة
        const hardId = addClip(baseScale * 0.94);
        addFill(tex, hardId, opacity, zBase + 2, '');
    });

    let roads = '';
    if (region.roads) {
        roads = `
            <svg class="region-roads" viewBox="0 0 1 1" preserveAspectRatio="none"
                 xmlns="http://www.w3.org/2000/svg" style="z-index:20">
                <g fill="none" stroke="#8a7040" stroke-width="0.035" stroke-linecap="round" opacity="0.9">
                    <path d="M0.50,0.08 C0.48,0.35 0.52,0.55 0.50,0.92"></path>
                    <path d="M0.50,0.55 C0.30,0.58 0.18,0.70 0.12,0.85" stroke-width="0.022"></path>
                    <path d="M0.50,0.55 C0.70,0.58 0.82,0.70 0.88,0.85" stroke-width="0.022"></path>
                </g>
                <g fill="#c8a050" stroke="#5a4020" stroke-width="0.006">
                    <rect x="0.44" y="0.18" width="0.12" height="0.08" rx="0.01"></rect>
                    <text x="0.50" y="0.235" text-anchor="middle" font-size="0.045"
                          fill="#2a1a08" stroke="none" font-family="Cairo,sans-serif">مدينة</text>
                    <rect x="0.20" y="0.62" width="0.10" height="0.07" rx="0.01"></rect>
                    <text x="0.25" y="0.67" text-anchor="middle" font-size="0.035"
                          fill="#2a1a08" stroke="none" font-family="Cairo,sans-serif">←</text>
                    <rect x="0.70" y="0.62" width="0.10" height="0.07" rx="0.01"></rect>
                    <text x="0.75" y="0.67" text-anchor="middle" font-size="0.035"
                          fill="#2a1a08" stroke="none" font-family="Cairo,sans-serif">→</text>
                </g>
            </svg>`;
    }

    return `
        <svg class="clip-defs" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">
            <defs>${defs}</defs>
        </svg>
        ${fills}
        ${roads}`;
}

/** يبني طبقات DOM الإقليمية: خلفية صورة متكررة + clip-path متموج */
function initWorldLayers() {
    _worldLayersEl = document.getElementById('world-layers');
    if (!_worldLayersEl) return;

    _worldLayersEl.style.width = CFG.WORLD_W + 'px';
    _worldLayersEl.style.height = CFG.WORLD_H + 'px';

    for (const [key, region] of Object.entries(REGION_DEFS)) {
        const el = document.getElementById(region.el);
        if (!el) continue;
        el.style.left = region.x + 'px';
        el.style.top = region.y + 'px';
        el.style.width = region.w + 'px';
        el.style.height = region.h + 'px';
        el.innerHTML = _buildRegionHtml(region, key);
    }
}

function syncWorldLayers(camX, camY) {
    if (!_worldLayersEl) {
        _worldLayersEl = document.getElementById('world-layers');
        if (!_worldLayersEl) return;
    }
    const z = (typeof ZOOM !== 'undefined') ? ZOOM : 1;
    _worldLayersEl.style.transform =
        `translate(${-camX * z}px, ${-camY * z}px) scale(${z})`;
}

/** تهيئة الطبقات (بديل تحميل نسيج الـ canvas) */
function loadTerrainTextures(onReady) {
    initWorldLayers();
    if (typeof onReady === 'function') onReady({});
}

function prerenderTerrain() {
    // التضاريس أصبحت طبقات DOM/SVG — لا حاجة لـ terrainCanvas
}

// ===== WORLD DRAW (layers sync + water shimmer + trees) =====
function drawWorld(camX, camY) {
    syncWorldLayers(camX, camY);

    const W  = canvas.width / ZOOM, H = canvas.height / ZOOM;
    const cs = CFG.TILE_SIZE;
    const sc = Math.max(0, Math.floor(camX / cs));
    const sr = Math.max(0, Math.floor(camY / cs));
    const ec = Math.min(CFG.WORLD_COLS - 1, Math.ceil((camX + W) / cs));
    const er = Math.min(CFG.WORLD_ROWS - 1, Math.ceil((camY + H) / cs));

    // تموج خفيف فوق بلاطات الماء (استعلام tileMap فقط)
    ctx.save();
    ctx.beginPath();
    let anyWater = false;
    for (let r = sr; r <= er; r++) {
        for (let c = sc; c <= ec; c++) {
            if (getTile(c, r) !== T.WATER) continue;
            ctx.rect(c * cs - camX, r * cs - camY, cs + 1, cs + 1);
            anyWater = true;
        }
    }
    if (anyWater) {
        ctx.clip();
        const t = (typeof waveTime !== 'undefined' ? waveTime : 0) * 0.001;
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
    }
    ctx.restore();

    // Trees behind player
    for (const tree of trees) {
        if (tree.y - tree.r > player.y) continue;
        drawTree(tree, camX, camY);
    }
    if (typeof drawRocksBehind === 'function') drawRocksBehind(camX, camY);
}

function drawTreesFront(camX, camY) {
    for (const tree of trees) {
        if (tree.y - tree.r <= player.y) continue;
        drawTree(tree, camX, camY);
    }
}

function drawRocksBehind(camX, camY) {
    if (typeof rocks === 'undefined') return;
    for (const rock of rocks) {
        if (rock.y > player.y) continue;
        drawRock(rock, camX, camY);
    }
}

function drawRocksFront(camX, camY) {
    if (typeof rocks === 'undefined') return;
    for (const rock of rocks) {
        if (rock.y <= player.y) continue;
        drawRock(rock, camX, camY);
    }
}

function drawRock(rock, camX, camY) {
    const { x, y, r, mined, hp, maxHp, shakeTimer } = rock;
    const shake = shakeTimer > 0 ? Math.sin(shakeTimer * 0.055) * 2.5 * (shakeTimer / 300) : 0;
    const sx = x - camX + shake;
    const sy = y - camY;
    const VW = canvas.width / ZOOM, VH = canvas.height / ZOOM;
    if (sx < -r - 10 || sx > VW + r + 10 || sy < -r - 10 || sy > VH + r + 10) return;

    const near = !mined && Math.hypot(player.x - x, player.y - y) < r + 34;
    ctx.save();

    // ظل
    ctx.beginPath();
    ctx.ellipse(sx + 2, sy + r * 0.35, r * 1.05, r * 0.38, 0, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(0,0,0,0.28)';
    ctx.fill();

    if (mined) {
        // بقايا حصى
        ctx.fillStyle = '#5a5848';
        ctx.beginPath();
        ctx.ellipse(sx, sy + 2, r * 0.55, r * 0.28, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#6e6a58';
        for (let i = 0; i < 4; i++) {
            const a = i * 1.7;
            ctx.beginPath();
            ctx.arc(sx + Math.cos(a) * r * 0.35, sy + Math.sin(a) * r * 0.18, 3 + (i % 2), 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.restore();
        return;
    }

    // جسم الصخرة (طبقات)
    ctx.beginPath();
    ctx.moveTo(sx - r * 0.95, sy + r * 0.15);
    ctx.quadraticCurveTo(sx - r * 1.05, sy - r * 0.35, sx - r * 0.45, sy - r * 0.75);
    ctx.quadraticCurveTo(sx, sy - r * 1.05, sx + r * 0.5, sy - r * 0.7);
    ctx.quadraticCurveTo(sx + r * 1.05, sy - r * 0.25, sx + r * 0.9, sy + r * 0.2);
    ctx.quadraticCurveTo(sx + r * 0.2, sy + r * 0.45, sx - r * 0.95, sy + r * 0.15);
    ctx.closePath();
    ctx.fillStyle = '#6a6860';
    ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,0.45)';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // إبراز علوي
    ctx.beginPath();
    ctx.moveTo(sx - r * 0.4, sy - r * 0.55);
    ctx.quadraticCurveTo(sx, sy - r * 0.85, sx + r * 0.35, sy - r * 0.5);
    ctx.quadraticCurveTo(sx, sy - r * 0.35, sx - r * 0.4, sy - r * 0.55);
    ctx.fillStyle = 'rgba(180,175,160,0.35)';
    ctx.fill();

    // شقوق
    ctx.strokeStyle = 'rgba(40,38,32,0.55)';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(sx - r * 0.2, sy - r * 0.4);
    ctx.lineTo(sx + r * 0.1, sy + r * 0.05);
    ctx.moveTo(sx + r * 0.25, sy - r * 0.2);
    ctx.lineTo(sx + r * 0.05, sy + r * 0.25);
    ctx.stroke();

    // بقع لون
    ctx.fillStyle = 'rgba(90, 100, 70, 0.25)';
    ctx.beginPath();
    ctx.ellipse(sx - r * 0.25, sy + r * 0.05, r * 0.28, r * 0.16, -0.4, 0, Math.PI * 2);
    ctx.fill();

    if (hp < maxHp) {
        ctx.strokeStyle = '#c8b070';
        ctx.lineWidth = 2;
        for (let i = 0; i < maxHp - hp; i++) {
            const nx = sx - r * 0.3 + i * (r * 0.35);
            const ny = sy - r * 0.1;
            ctx.beginPath();
            ctx.moveTo(nx, ny - 4);
            ctx.lineTo(nx + 5, ny + 4);
            ctx.moveTo(nx + 5, ny - 4);
            ctx.lineTo(nx, ny + 4);
            ctx.stroke();
        }
    }

    if (near) {
        const hasPick = player.craftedItems && player.craftedItems.pickaxe;
        ctx.beginPath();
        ctx.arc(sx, sy - r * 0.15, r * 1.15, 0, Math.PI * 2);
        ctx.strokeStyle = hasPick ? 'rgba(180,200,220,0.75)' : 'rgba(180,180,180,0.4)';
        ctx.lineWidth = 2.5;
        ctx.stroke();

        ctx.font = 'bold 11px Cairo';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        const label = hasPick
            ? `[E] ⛏️ عدّن (${hp}/${maxHp})`
            : `[E] ⛏️ تحتاج معول`;
        ctx.strokeStyle = 'rgba(0,0,0,0.85)';
        ctx.lineWidth = 3;
        ctx.strokeText(label, sx, sy - r * 1.35);
        ctx.fillStyle = hasPick ? '#c8d8e8' : '#aaa';
        ctx.fillText(label, sx, sy - r * 1.35);

        const bw = r * 2.2, bh = 6;
        const bx = sx - bw / 2, by = sy - r * 1.15;
        ctx.fillStyle = '#333';
        ctx.fillRect(bx, by, bw, bh);
        ctx.fillStyle = hp === maxHp ? '#7f8c8d' : '#b0c4de';
        ctx.fillRect(bx, by, bw * (hp / maxHp), bh);
        ctx.strokeStyle = 'rgba(0,0,0,0.5)';
        ctx.lineWidth = 1;
        ctx.strokeRect(bx, by, bw, bh);
    }

    ctx.restore();
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
