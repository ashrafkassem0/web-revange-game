/**
 * مصدر الحقيقة لكل شخصيات اللعبة — يُستخدم في كافة الخرائط.
 */
const ABSORB_RATIO = 0.5;

const ATTACK_SKILLS = ['sword', 'bow', 'bite', 'tusks', 'fangs', 'claw', 'whip', 'physicalPower', 'punch', 'poison'];
const DEFENSE_SKILLS = ['physicalPower', 'pushPower', 'endurance', 'climbing', 'stealth'];

const CHARACTERS = {
    hero: {
        id: 'hero',
        nameAr: 'أشرف',
        type: 'player',
        map: 'forest',
        model: '/assets/models/hero.glb',
        scale: 1.48,
        appearance: {
            eyes: 'brown',
            hair: 'brown',
            heightCm: 140,
            outfit: { pants: 'black', shirt: 'white', jacket: 'black', shoes: 'white' }
        },
        animations: {
            idle: 'Idle',
            walk: 'Walking',
            run: 'Running',
            jump: 'Jump',
            attackBow: 'Shooting Arrow',
            attackSword: 'Sword Slash'
        },
        stats: { hp: 100, maxHp: 100, speed: 1, attack: 1, defense: 1 },
        skills: { bow: 1, sword: 1, swimming: 1, fishing: 0, woodcutting: 0 },
        drops: {}
    },

    wildRabbit: {
        id: 'wildRabbit',
        nameAr: 'الأرنب البري',
        type: 'enemy',
        map: 'forest',
        hasHorns: true,
        model: '/assets/models/rabbit.glb',
        scale: 0.4,
        animations: { idle: 'Idle', walk: 'Walking', jump: 'Jump' },
        stats: { hp: 20, maxHp: 20, speed: 1, attack: 1, defense: 1 },
        skills: { jump: 1 },
        drops: {
            meat: { chance: 1.0, min: 1, max: 1 },
            horn: { chance: 0.5, min: 1, max: 1 }
        }
    },

    terrorKing: {
        id: 'terrorKing',
        nameAr: 'ملك الرعب',
        type: 'boss',
        map: 'dark-kingdom',
        model: '/assets/models/terror-king.glb',
        scale: 1.2,
        appearance: { hair: 'black', eyes: 'black', clothes: 'black' },
        animations: { idle: 'Idle', walk: 'Walking', attack: 'Sword Slash' },
        stats: { hp: 1000, maxHp: 1000, speed: 1000, attack: 1000, defense: 1000 },
        skills: { whip: 1000, sword: 1000, physicalPower: 1000 },
        drops: {}
    },

    crocodile: {
        id: 'crocodile',
        nameAr: 'التمساح',
        type: 'enemy',
        map: 'forest',
        model: '/assets/models/crocodile.glb',
        scale: 0.8,
        stats: { hp: 200, maxHp: 200, speed: 2, attack: 200, defense: 150 },
        skills: { swimming: 100, pushPower: 150, bite: 200 },
        drops: { teeth: { chance: 0.6, min: 1, max: 2 } }
    },

    gorilla: {
        id: 'gorilla',
        nameAr: 'الغوريلا',
        type: 'enemy',
        map: 'forest',
        model: '/assets/models/gorilla.glb',
        scale: 1,
        stats: { hp: 150, maxHp: 150, speed: 2, attack: 70, defense: 75 },
        skills: { physicalPower: 80, punch: 70, climbing: 60 },
        drops: {}
    },

    wildBoar: {
        id: 'wildBoar',
        nameAr: 'الخنزير البري',
        type: 'enemy',
        map: 'forest',
        model: '/assets/models/boar.glb',
        scale: 0.7,
        stats: { hp: 80, maxHp: 80, speed: 3, attack: 55, defense: 45 },
        skills: { charge: 65, tusks: 60, endurance: 50 },
        drops: { teeth: { chance: 0.6, min: 1, max: 2 } }
    },

    wolf: {
        id: 'wolf',
        nameAr: 'الذئب',
        type: 'enemy',
        map: 'forest',
        model: '/assets/models/wolf.glb',
        scale: 0.6,
        stats: { hp: 60, maxHp: 60, speed: 4, attack: 40, defense: 30 },
        skills: { bite: 40, packHunt: 35 },
        drops: { teeth: { chance: 0.5, min: 1, max: 2 } }
    },

    deer: {
        id: 'deer',
        nameAr: 'الغزال',
        type: 'enemy',
        map: 'forest',
        hasHorns: true,
        model: '/assets/models/deer.glb',
        scale: 0.7,
        stats: { hp: 40, maxHp: 40, speed: 6, attack: 5, defense: 10 },
        skills: { run: 50, jump: 30 },
        drops: {
            meat: { chance: 1.0, min: 1, max: 2 },
            horn: { chance: 1.0, min: 1, max: 2 }
        }
    },

    fox: {
        id: 'fox',
        nameAr: 'الثعلب',
        type: 'enemy',
        map: 'forest',
        model: '/assets/models/fox.glb',
        scale: 0.5,
        stats: { hp: 35, maxHp: 35, speed: 5, attack: 25, defense: 20 },
        skills: { deception: 45, bite: 25 },
        drops: { teeth: { chance: 0.4, min: 1, max: 1 } }
    },

    snake: {
        id: 'snake',
        nameAr: 'الأفعى',
        type: 'enemy',
        map: 'forest',
        model: '/assets/models/snake.glb',
        scale: 0.4,
        stats: { hp: 30, maxHp: 30, speed: 2, attack: 55, defense: 15 },
        skills: { poison: 55, stealth: 40 },
        drops: { teeth: { chance: 0.7, min: 1, max: 2 } }
    },

    bear: {
        id: 'bear',
        nameAr: 'الدب',
        type: 'enemy',
        map: 'forest',
        model: '/assets/models/bear.glb',
        scale: 1.1,
        stats: { hp: 180, maxHp: 180, speed: 2.5, attack: 85, defense: 70 },
        skills: { claw: 85, physicalPower: 80 },
        drops: {}
    },

    eagle: {
        id: 'eagle',
        nameAr: '\u0627\u0644\u0646\u0633\u0631',
        type: 'enemy',
        map: 'forest',
        model: '/assets/models/eagle.glb',
        scale: 0.5,
        stats: { hp: 45, maxHp: 45, speed: 8, attack: 50, defense: 25 },
        skills: { flight: 60, claw: 50 },
        drops: {}
    },

    fish: {
        id: 'fish',
        nameAr: 'السمك',
        type: 'neutral',
        map: 'forest',
        model: '/assets/models/fish.glb',
        scale: 0.2,
        stats: { hp: 10, maxHp: 10, speed: 2, attack: 0, defense: 5 },
        skills: { swimming: 30, camouflage: 20 },
        drops: {}
    }
};

function getAttackFromSkills(skills) {
    let max = 0;
    for (const key of ATTACK_SKILLS) {
        if (skills[key] && skills[key] > max) max = skills[key];
    }
    return max || 1;
}

function getDefenseFromSkills(skills) {
    let max = 0;
    for (const key of DEFENSE_SKILLS) {
        if (skills[key] && skills[key] > max) max = skills[key];
    }
    return max || 1;
}

function initCharacterStats(character) {
    character.stats.attack = character.stats.attack || getAttackFromSkills(character.skills);
    character.stats.defense = character.stats.defense || getDefenseFromSkills(character.skills);
    return character;
}

Object.keys(CHARACTERS).forEach((key) => initCharacterStats(CHARACTERS[key]));

if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        CHARACTERS,
        ABSORB_RATIO,
        ATTACK_SKILLS,
        DEFENSE_SKILLS,
        getAttackFromSkills,
        getDefenseFromSkills,
        initCharacterStats
    };
}
