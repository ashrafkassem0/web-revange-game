/**
 * قواعد القتال والاكتساب والحركة — تُستخدم في كل الخرائط.
 */
const CharacterRules = {
    isAlive(character) {
        return character.stats.hp > 0;
    },

    takeDamage(character, amount) {
        character.stats.hp = Math.max(0, character.stats.hp - amount);
        return character.stats.hp <= 0;
    },

    canHeroKill(hero, target) {
        return hero.stats.attack >= target.stats.defense;
    },

    absorbSkillsFromKill(hero, victim) {
        const ratio = typeof ABSORB_RATIO !== 'undefined' ? ABSORB_RATIO : 0.5;

        Object.keys(victim.skills).forEach((key) => {
            const gain = Math.floor(victim.skills[key] * ratio);
            if (gain > 0) {
                hero.skills[key] = (hero.skills[key] || 0) + gain;
            }
        });

        const hpGain = Math.floor(victim.stats.maxHp * ratio);
        hero.stats.maxHp += hpGain;
        hero.stats.hp = Math.min(hero.stats.maxHp, hero.stats.hp + hpGain);

        hero.stats.attack = getAttackFromSkills(hero.skills);
        hero.stats.defense = getDefenseFromSkills(hero.skills);
    },

    updateSpeedFromDistance(hero, distanceMeters, state) {
        state.totalDistanceRun = (state.totalDistanceRun || 0) + distanceMeters;
        const km = Math.floor(state.totalDistanceRun / 1000);
        const baseSpeed = CHARACTERS.hero.stats.speed;
        hero.stats.speed = baseSpeed + km;
        return state.totalDistanceRun;
    },

    rollDrop(min, max) {
        return min + Math.floor(Math.random() * (max - min + 1));
    },

    collectLoot(victim, inventory) {
        if (!victim.drops) return inventory;

        Object.keys(victim.drops).forEach((item) => {
            const drop = victim.drops[item];
            if (Math.random() <= drop.chance) {
                const amount = this.rollDrop(drop.min, drop.max);
                inventory[item] = (inventory[item] || 0) + amount;
            }
        });

        return inventory;
    },

    rectsCollide(a, b) {
        return (
            a.x < b.x + b.width &&
            a.x + a.width > b.x &&
            a.y < b.y + b.height &&
            a.y + a.height > b.y
        );
    }
};

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { CharacterRules };
}
