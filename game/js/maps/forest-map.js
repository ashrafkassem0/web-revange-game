/**
 * توليد خريطة الغابة 5 كم² — 2500×2000 متر
 */
function seededRandom(seed) {
    let s = seed;
    return function () {
        s = (s * 16807) % 2147483647;
        return (s - 1) / 2147483646;
    };
}

function generateObstacles(count, width, height, minSize, maxSize, rand, type) {
    const items = [];
    for (let i = 0; i < count; i++) {
        const w = minSize + rand() * (maxSize - minSize);
        const h = type === 'tree' ? w * (1.2 + rand() * 0.5) : w * (0.6 + rand() * 0.4);
        items.push({
            x: rand() * (width - w),
            y: rand() * (height - h),
            width: w,
            height: h,
            type,
            solid: true
        });
    }
    return items;
}

function generateForestMap(seed = 42) {
    const rand = seededRandom(seed);
    const widthM = 2500;
    const heightM = 2000;

    const lakes = [
        { id: 'north', x: 400, y: 200, width: 300, height: 250, fishCount: 8, crocodileCount: 3 },
        { id: 'south', x: 1500, y: 1200, width: 400, height: 350, fishCount: 12, crocodileCount: 4 },
        { id: 'pond', x: 900, y: 800, width: 150, height: 120, fishCount: 5, crocodileCount: 0 }
    ];

    const trees = generateObstacles(800, widthM, heightM, 2, 4, rand, 'tree');
    const rocks = generateObstacles(200, widthM, heightM, 1, 3, rand, 'rock');

    const resourceNodes = [];
    for (let i = 0; i < 120; i++) {
        resourceNodes.push({
            x: rand() * widthM,
            y: rand() * heightM,
            type: rand() > 0.6 ? 'stone' : 'stick'
        });
    }

    const spawnZones = [
        { id: 'clearings', bounds: { x: 0, y: 0, w: widthM, h: 800 }, creatures: ['wildRabbit', 'deer'], maxCount: [8, 4] },
        { id: 'denseForest', bounds: { x: 0, y: 0, w: 1200, h: heightM }, creatures: ['wolf', 'fox', 'wildBoar'], maxCount: [3, 2, 3] },
        { id: 'rockyHills', bounds: { x: 1200, y: 0, w: 1300, h: 800 }, creatures: ['snake', 'bear'], maxCount: [4, 2] },
        { id: 'canopy', bounds: { x: 0, y: 0, w: widthM, h: heightM }, creatures: ['eagle'], maxCount: [2] },
        { id: 'lakeShores', bounds: { x: 0, y: 0, w: widthM, h: heightM }, creatures: ['gorilla', 'crocodile'], maxCount: [2, 6] },
        { id: 'lakes', bounds: { x: 0, y: 0, w: widthM, h: heightM }, creatures: ['fish'], maxCount: [20] }
    ];

    return {
        id: 'forest',
        nameAr: 'خريطة الغابة',
        widthM,
        heightM,
        areaKm2: 5,
        spawnPoint: { x: 1250, y: 1900 },
        safeRadiusM: 100,
        trees,
        rocks,
        lakes,
        spawnZones,
        resourceNodes
    };
}

const FOREST_MAP = generateForestMap(42);

function canMoveTo(map, x, y, size, excludeList) {
    const half = size / 2;
    const box = { x: x - half, y: y - half, width: size, height: size };
    const obstacles = [...map.trees, ...map.rocks];
    for (const obs of obstacles) {
        if (excludeList && excludeList.includes(obs)) continue;
        if (CharacterRules && CharacterRules.rectsCollide(box, obs)) return false;
        if (!CharacterRules) {
            if (box.x < obs.x + obs.width && box.x + box.width > obs.x &&
                box.y < obs.y + obs.height && box.y + box.height > obs.y) return false;
        }
    }
    return x >= 0 && y >= 0 && x <= map.widthM && y <= map.heightM;
}

function isInLake(map, x, y) {
    return map.lakes.some(
        (lake) => x >= lake.x && x <= lake.x + lake.width && y >= lake.y && y <= lake.y + lake.height
    );
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { FOREST_MAP, generateForestMap, canMoveTo, isInLake, seededRandom };
}
