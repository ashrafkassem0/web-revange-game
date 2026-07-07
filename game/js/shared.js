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
            completedIntro:      this.load('completedIntro', false),
            completedForest:     this.load('completedForest', false),
            completedCity:       this.load('completedCity', false),
            completedDeathValley:this.load('completedDeathValley', false),
        };
    },

    saveForestState(state) {
        this.save('forestState', state);
    },

    loadForestState() {
        return this.load('forestState', null);
    },

    getHeroStats() {
        return this.load('heroStats', {
            hp: 100, maxHp: 100,
            attack: 25, defense: 5,
            skills: { sword: 1, bow: 1, swimming: 1, woodcutting: 0, fishing: 0 },
            absorbedAttack: 0,
            absorbedDefense: 0
        });
    },

    saveHeroStats(stats) {
        this.save('heroStats', stats);
    },

    getInventory() {
        return this.load('inventory', {
            stick: 0, stone: 0, meat: 0, horn: 0, teeth: 0
        });
    },

    saveInventory(inv) {
        this.save('inventory', inv);
    },

    getCraftedItems() {
        return this.load('craftedItems', {
            axe: false, fishingRod: false, hornSpear: false, hornSword: false
        });
    },

    saveCraftedItems(items) {
        this.save('craftedItems', items);
    },

    getCurrentStage() {
        const p = this.getProgress();
        if (!p.completedIntro) return 'intro';
        if (!p.completedForest) return 'forest';
        if (!p.completedCity) return 'city';
        if (!p.completedDeathValley) return 'deathValley';
        return 'darkKingdom';
    },

    reset() {
        const keys = [
            'completedIntro', 'completedForest', 'completedCity',
            'completedDeathValley', 'heroStats', 'inventory',
            'craftedItems', 'forestState'
        ];
        keys.forEach(k => localStorage.removeItem('revenge_' + k));
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

window.GameState = GameState;
window.navigateTo = navigateTo;
