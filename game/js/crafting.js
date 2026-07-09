'use strict';
// ===== نظام الصناعة =====

const CRAFTING_RECIPES = [
    {
        id: 'axe',
        name: 'فأس',
        emoji: '🪓',
        description: 'لقطع الأشجار والحطب',
        requires: { stone: 1, stick: 2 },
        isUnique: true,
        unlocks: 'woodcutting'
    },
    {
        id: 'fishingRod',
        name: 'سنارة صيد',
        emoji: '🎣',
        description: 'للصيد في البحيرات',
        requires: { stick: 2, teeth: 2 },
        isUnique: true,
        unlocks: 'fishing'
    },
    {
        id: 'hornSpear',
        name: 'رمح القرن',
        emoji: '🗡️',
        description: '+18 هجوم',
        requires: { horn: 1, stick: 2 },
        isUnique: false,
        attackBonus: 18
    },
    {
        id: 'hornSword',
        name: 'سيف القرن',
        emoji: '⚔️',
        description: '+3 مهارة سيف',
        requires: { horn: 2, stone: 1 },
        isUnique: false,
        skillBonus: { sword: 3 }
    },
    {
        id: 'leatherArmor',
        name: 'درع جلدي',
        emoji: '🛡️',
        description: '+15 دفاع دائم',
        requires: { leather: 3, stick: 1 },
        isUnique: true,
        defenseBonus: 15
    },
    {
        id: 'arrows',
        name: 'سهام',
        emoji: '🏹',
        description: 'احصل على 10 سهام',
        requires: { stick: 2 },
        isUnique: false,
        givesItem: { arrows: 10 }
    },
    {
        id: 'nightBlade',
        name: 'نصل الليل',
        emoji: '🗡️',
        description: '+40 هجوم — من عناصر ليلية نادرة',
        requires: { nightCrystal: 1, beastHide: 2, stick: 2 },
        isUnique: false,
        attackBonus: 40
    },
    {
        id: 'shadowArmor',
        name: 'درع الظلال',
        emoji: '🛡️',
        description: '+35 دفاع دائم — من جوهر الظلال',
        requires: { shadowEssence: 1, beastHide: 3, leather: 2 },
        isUnique: true,
        defenseBonus: 35
    },
    {
        id: 'herbSalve',
        name: 'مرهم أعشاب',
        emoji: '💊',
        description: 'مستهلك — يعيد قدراً متواضعاً من الصحة عند الأكل',
        requires: { herb: 2 },
        isUnique: false,
        givesItem: { herbSalve: 1 }
    },
    {
        id: 'revitalTonic',
        name: 'منشط منعش',
        emoji: '🧴',
        description: 'مستهلك — أعشاب + عسل لشفاء أفضل',
        requires: { herb: 1, honey: 1 },
        isUnique: false,
        givesItem: { revitalTonic: 1 }
    }
];

const Crafting = {
    canCraft(recipe, inventory) {
        for (const [item, amount] of Object.entries(recipe.requires)) {
            if ((inventory[item] || 0) < amount) return false;
        }
        return true;
    },

    getMissingItems(recipe, inventory) {
        const missing = [];
        for (const [item, amount] of Object.entries(recipe.requires)) {
            const have = inventory[item] || 0;
            if (have < amount) {
                missing.push(`${amount - have} ${ITEM_NAMES[item]}`);
            }
        }
        return missing;
    },

    craft(recipeId, player) {
        const recipe = CRAFTING_RECIPES.find(r => r.id === recipeId);
        if (!recipe) return { success: false, message: 'وصفة غير معروفة' };

        if (recipe.isUnique && player.craftedItems[recipeId]) {
            return { success: false, message: `${recipe.name} مصنوع مسبقاً!` };
        }

        if (!this.canCraft(recipe, player.inventory)) {
            const missing = this.getMissingItems(recipe, player.inventory);
            return { success: false, message: `ناقص: ${missing.join(', ')}` };
        }

        // استهلاك المواد
        for (const [item, amount] of Object.entries(recipe.requires)) {
            player.inventory[item] -= amount;
        }

        // تطبيق النتيجة
        if (recipe.isUnique) {
            player.craftedItems[recipeId] = true;
        }

        if (recipe.attackBonus) {
            player.absorbedAttack = (player.absorbedAttack || 0) + recipe.attackBonus;
        }

        if (recipe.skillBonus) {
            for (const [skill, bonus] of Object.entries(recipe.skillBonus)) {
                player.skills[skill] = (player.skills[skill] || 0) + bonus;
            }
        }

        if (recipe.defenseBonus) {
            player.defense = (player.defense || 5) + recipe.defenseBonus;
        }

        if (recipe.unlocks) {
            player.skills[recipe.unlocks] = (player.skills[recipe.unlocks] || 0) + 1;
        }

        if (recipe.givesItem) {
            for (const [item, amount] of Object.entries(recipe.givesItem)) {
                player.inventory[item] = (player.inventory[item] || 0) + amount;
            }
        }

        return {
            success: true,
            message: `✅ صنعت: ${recipe.emoji} ${recipe.name}!`,
            recipe
        };
    }
};

window.CRAFTING_RECIPES = CRAFTING_RECIPES;
window.Crafting = Crafting;
