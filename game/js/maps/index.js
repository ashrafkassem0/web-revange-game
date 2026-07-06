/**
 * سجل كل خرائط اللعبة — أضف خريطة جديدة هنا.
 */
const MAPS = {
    forest: {
        id: 'forest',
        nameAr: 'خريطة الغابة',
        folder: 'maps/forest',
        areaKm2: 5,
        unlockAfter: 'completedIntro',
        enemies: ['wildRabbit', 'wolf', 'deer', 'fox', 'snake', 'bear', 'eagle', 'gorilla', 'wildBoar', 'crocodile', 'fish'],
        status: 'active'
    },
    city: {
        id: 'city',
        nameAr: 'المدينة',
        folder: 'maps/city',
        areaKm2: 2,
        unlockAfter: 'completedForest',
        enemies: [],
        status: 'placeholder'
    },
    deathValley: {
        id: 'death-valley',
        nameAr: 'وادي الموت',
        folder: 'maps/death-valley',
        areaKm2: 8,
        unlockAfter: 'completedCity',
        enemies: [],
        status: 'placeholder'
    },
    darkKingdom: {
        id: 'dark-kingdom',
        nameAr: 'مملكة الظلام',
        folder: 'maps/dark-kingdom',
        areaKm2: 3,
        unlockAfter: 'completedDeathValley',
        enemies: ['terrorKing'],
        boss: 'terrorKing',
        status: 'placeholder'
    }
};

function getMapById(id) {
    return MAPS[id] || MAPS[id.replace(/-/g, '')] || null;
}

function getUnlockedMaps(progress) {
    const unlocked = progress.unlockedMaps || ['forest'];
    return Object.values(MAPS).filter((m) => unlocked.includes(m.id));
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { MAPS, getMapById, getUnlockedMaps };
}
