const GameState = {
    save(key, value) {
        localStorage.setItem('revenge_' + key, JSON.stringify(value));
    },

    load(key, defaultValue = null) {
        const data = localStorage.getItem('revenge_' + key);
        return data ? JSON.parse(data) : defaultValue;
    },

    getProgress() {
        return {
            xp: this.load('xp', 0),
            level: this.load('level', 1),
            completedIntro: this.load('completedIntro', false),
            completedForest: this.load('completedForest', false),
            completedCity: this.load('completedCity', false),
            completedDeathValley: this.load('completedDeathValley', false),
            unlockedMaps: this.load('unlockedMaps', ['forest']),
            currentMap: this.load('currentMap', 'forest')
        };
    },

    getHeroRuntime() {
        const saved = this.load('heroStats', null);
        if (saved) return saved;
        if (typeof CHARACTERS !== 'undefined') {
            const hero = JSON.parse(JSON.stringify(CHARACTERS.hero));
            return { stats: hero.stats, skills: hero.skills };
        }
        return { stats: { hp: 100, maxHp: 100, speed: 1, attack: 1, defense: 1 }, skills: {} };
    },

    saveHeroRuntime(hero) {
        this.save('heroStats', { stats: hero.stats, skills: hero.skills });
    },

    getInventory() {
        return this.load('inventory', {
            stick: 0,
            stone: 0,
            meat: 0,
            horn: 0,
            teeth: 0,
            tools: {}
        });
    },

    saveInventory(inventory) {
        this.save('inventory', inventory);
    },

    getTotalDistanceRun() {
        return this.load('totalDistanceRun', 0);
    },

    saveTotalDistanceRun(meters) {
        this.save('totalDistanceRun', meters);
    },

    reset() {
        const keys = [
            'xp', 'level', 'completedIntro', 'completedForest', 'completedCity',
            'completedDeathValley', 'unlockedMaps', 'currentMap',
            'heroStats', 'inventory', 'totalDistanceRun'
        ];
        keys.forEach((k) => localStorage.removeItem('revenge_' + k));
    },

    getMapEntryPath(mapId) {
        const paths = {
            forest: '../maps/forest/index.html',
            city: '../maps/city/index.html',
            'death-valley': '../maps/death-valley/index.html',
            'dark-kingdom': '../maps/dark-kingdom/index.html'
        };
        return paths[mapId] || paths.forest;
    }
};

function navigateTo(page) {
    const overlay = document.querySelector('.fade-overlay');
    if (overlay) {
        overlay.classList.add('active');
        setTimeout(() => {
            window.location.href = page;
        }, 800);
    } else {
        window.location.href = page;
    }
}

const GAME_CONFIG = {
    absorbRatio: 0.5,
    forestCompleteKm: 3,
    forestCompleteKills: 10,
    meatHealRabbit: 10,
    meatHealDeer: 15
};
