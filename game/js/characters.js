'use strict';
// ===== بيانات الشخصيات والأعداء =====

const ENEMY_TEMPLATES = {
    wildRabbit: {
        id: 'wildRabbit',
        name: 'أرنب بري',
        emoji: '🐇',
        color: '#d4a574',
        radius: 11,
        hp: 20,
        defense: 0,
        attackDmg: 0,
        behavior: 'flee',
        fleeRange: 120,
        aggroRange: 0,
        attackRange: 0,
        attackCooldown: 0,
        speed: 3.2,
        xp: 5,
        skills: { endurance: 2 },
        drops: {
            meat:  { chance: 1.0, amount: 1 },
            horn:  { chance: 0.5, amount: 1 }
        }
    },

    deer: {
        id: 'deer',
        name: 'غزال',
        emoji: '🦌',
        color: '#9b7240',
        radius: 15,
        hp: 40,
        defense: 5,
        attackDmg: 0,
        behavior: 'flee',
        fleeRange: 140,
        aggroRange: 0,
        attackRange: 0,
        attackCooldown: 0,
        speed: 4.0,
        xp: 10,
        skills: { endurance: 5 },
        drops: {
            meat:    { chance: 1.0, amount: 2 },
            horn:    { chance: 1.0, amount: 2 },
            leather: { chance: 0.8, amount: 1 }
        }
    },

    fox: {
        id: 'fox',
        name: 'ثعلب',
        emoji: '🦊',
        color: '#d4630a',
        radius: 12,
        hp: 35,
        defense: 3,
        attackDmg: 0,
        behavior: 'flee',
        fleeRange: 100,
        aggroRange: 0,
        attackRange: 0,
        attackCooldown: 0,
        speed: 3.8,
        xp: 8,
        skills: { stealth: 3 },
        drops: {
            teeth: { chance: 0.4, amount: 1 }
        }
    },

    wolf: {
        id: 'wolf',
        name: 'ذئب',
        emoji: '🐺',
        color: '#7a7a7a',
        radius: 16,
        hp: 60,
        defense: 10,
        attackDmg: 8,
        behavior: 'aggressive',
        fleeRange: 0,
        aggroRange: 120,
        attackRange: 28,
        attackCooldown: 1100,
        speed: 2.9,
        xp: 20,
        skills: { bite: 8, endurance: 4 },
        drops: {
            teeth:   { chance: 0.5, amount: 2 },
            leather: { chance: 0.7, amount: 1 }
        }
    },

    snake: {
        id: 'snake',
        name: 'أفعى',
        emoji: '🐍',
        color: '#4a7a2a',
        radius: 10,
        hp: 30,
        defense: 5,
        attackDmg: 5,
        behavior: 'aggressive',
        fleeRange: 0,
        aggroRange: 90,
        attackRange: 22,
        attackCooldown: 1500,
        speed: 2.5,
        poisonDamage: 3,
        poisonDuration: 5000,
        xp: 12,
        skills: { fangs: 5, stealth: 3 },
        drops: {
            teeth: { chance: 0.7, amount: 1 }
        }
    },

    wildBoar: {
        id: 'wildBoar',
        name: 'خنزير بري',
        emoji: '🐗',
        color: '#7a5030',
        radius: 17,
        hp: 80,
        defense: 15,
        attackDmg: 12,
        behavior: 'aggressive',
        fleeRange: 0,
        aggroRange: 110,
        attackRange: 30,
        attackCooldown: 1200,
        speed: 2.8,
        xp: 25,
        skills: { tusks: 12, endurance: 8 },
        drops: {
            teeth:   { chance: 0.6, amount: 2 },
            leather: { chance: 0.8, amount: 1 }
        }
    },

    bear: {
        id: 'bear',
        name: 'دب',
        emoji: '🐻',
        color: '#5a3520',
        radius: 24,
        hp: 180,
        defense: 20,
        attackDmg: 20,
        behavior: 'aggressive',
        fleeRange: 0,
        aggroRange: 130,
        attackRange: 38,
        attackCooldown: 1500,
        speed: 2.2,
        xp: 50,
        skills: { claw: 20, physicalPower: 15 },
        drops: {
            meat:    { chance: 0.7, amount: 3 },
            leather: { chance: 1.0, amount: 2 }
        }
    },

    gorilla: {
        id: 'gorilla',
        name: 'غوريلا',
        emoji: '🦍',
        color: '#2a2a2a',
        radius: 21,
        hp: 150,
        defense: 18,
        attackDmg: 18,
        behavior: 'aggressive',
        fleeRange: 0,
        aggroRange: 120,
        attackRange: 34,
        attackCooldown: 1300,
        speed: 2.4,
        xp: 40,
        skills: { punch: 18, physicalPower: 15 },
        drops: {}
    },

    crocodile: {
        id: 'crocodile',
        name: 'تمساح',
        emoji: '🐊',
        color: '#2a5a2a',
        radius: 19,
        hp: 200,
        defense: 25,
        attackDmg: 25,
        behavior: 'aggressive',
        fleeRange: 0,
        aggroRange: 110,
        attackRange: 32,
        attackCooldown: 1800,
        speed: 1.8,
        swims: true,          // يتحرك داخل الماء
        xp: 55,
        skills: { bite: 25, endurance: 15 },
        drops: {
            teeth: { chance: 0.6, amount: 3 }
        }
    },

    eagle: {
        id: 'eagle',
        name: 'نسر',
        emoji: '🦅',
        color: '#8b5a20',
        radius: 13,
        hp: 45,
        defense: 8,
        attackDmg: 0,
        behavior: 'flee',
        fleeRange: 150,
        aggroRange: 0,
        attackRange: 0,
        attackCooldown: 0,
        speed: 4.5,
        xp: 15,
        skills: { claw: 10, endurance: 5 },
        drops: {}
    }
};

// أسماء المواد بالعربية
const ITEM_NAMES = {
    stick:      'عصا',
    stone:      'حجر',
    meat:       'لحم',
    horn:       'قرن',
    teeth:      'أسنان',
    leather:    'جلد',
    fish:       'سمكة',
    arrows:     'سهام',
    healthOrb:  'نقطة حياة',
    axe:        'فأس',
    fishingRod: 'سنارة',
    hornSpear:  'رمح القرن',
    hornSword:  'سيف القرن',
    leatherArmor: 'درع جلدي'
};

const ITEM_EMOJIS = {
    stick:      '🪵',
    stone:      '🪨',
    meat:       '🥩',
    horn:       '🦷',
    teeth:      '🦴',
    leather:    '🧥',
    fish:       '🐟',
    arrows:     '🏹',
    healthOrb:  '❤️',
    axe:        '🪓',
    fishingRod: '🎣',
    hornSpear:  '🗡️',
    hornSword:  '⚔️',
    leatherArmor: '🛡️'
};

window.ENEMY_TEMPLATES = ENEMY_TEMPLATES;
window.ITEM_NAMES = ITEM_NAMES;
window.ITEM_EMOJIS = ITEM_EMOJIS;
