/**
 * نظام الصناعة — وصفات قابلة للتعديل.
 */
const CRAFTING_RECIPES = {
    axe: {
        id: 'axe',
        nameAr: 'فأس',
        requires: { stone: 1, stick: 2 },
        unlocksSkill: 'woodcutting',
        unlockValue: 1
    },
    fishingRod: {
        id: 'fishingRod',
        nameAr: 'سنارة',
        requires: { stick: 2, teeth: 2 },
        unlocksSkill: 'fishing',
        unlockValue: 1
    },
    hornSpear: {
        id: 'hornSpear',
        nameAr: 'رمح قرن',
        requires: { horn: 1, stick: 2 },
        bonusAttack: 15
    },
    hornSword: {
        id: 'hornSword',
        nameAr: 'سيف قرن',
        requires: { horn: 2, stone: 1 },
        bonusSkill: { sword: 2 }
    }
};

const MEAT_HEAL = { rabbit: 10, deer: 15, meat: 10 };

const Crafting = {
    canCraft(recipeId, inventory) {
        const recipe = CRAFTING_RECIPES[recipeId];
        if (!recipe) return false;
        return Object.entries(recipe.requires).every(
            ([item, count]) => (inventory[item] || 0) >= count
        );
    },

    craft(recipeId, inventory, hero) {
        if (!this.canCraft(recipeId, inventory)) return { ok: false, message: 'مواد غير كافية' };

        const recipe = CRAFTING_RECIPES[recipeId];
        Object.entries(recipe.requires).forEach(([item, count]) => {
            inventory[item] = (inventory[item] || 0) - count;
        });

        if (recipe.unlocksSkill) {
            hero.skills[recipe.unlocksSkill] = Math.max(
                hero.skills[recipe.unlocksSkill] || 0,
                recipe.unlockValue || 1
            );
        }
        if (recipe.bonusAttack) {
            hero.stats.attack += recipe.bonusAttack;
        }
        if (recipe.bonusSkill) {
            Object.entries(recipe.bonusSkill).forEach(([skill, val]) => {
                hero.skills[skill] = (hero.skills[skill] || 0) + val;
            });
            hero.stats.attack = getAttackFromSkills(hero.skills);
        }

        inventory.tools = inventory.tools || {};
        inventory.tools[recipeId] = true;

        return { ok: true, recipe };
    },

    eatMeat(inventory, hero, type) {
        const key = type === 'deer' ? 'deer' : 'meat';
        if ((inventory.meat || 0) < 1) return { ok: false, message: 'لا يوجد لحم' };

        inventory.meat -= 1;
        const heal = MEAT_HEAL[key] || MEAT_HEAL.meat;
        hero.stats.hp = Math.min(hero.stats.maxHp, hero.stats.hp + heal);
        return { ok: true, heal };
    },

    getAvailableRecipes(inventory) {
        return Object.keys(CRAFTING_RECIPES).filter((id) => this.canCraft(id, inventory));
    }
};

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { CRAFTING_RECIPES, MEAT_HEAL, Crafting };
}
