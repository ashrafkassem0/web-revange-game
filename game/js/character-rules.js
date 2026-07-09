'use strict';
// ===== قواعد القتال والاكتساب =====

const CharacterRules = {
    OFFENSIVE_SKILLS: ['sword', 'bow', 'bite', 'tusks', 'fangs', 'claw', 'whip', 'physicalPower', 'punch', 'poison'],
    DEFENSIVE_SKILLS: ['physicalPower', 'pushPower', 'endurance', 'climbing', 'stealth'],

    /** مكافأة المستوى: المستوى 1 = 0، كل مستوى بعده يزيد الهجوم/الدفاع */
    levelStatBonus(level) {
        const lv = Math.max(1, level | 0);
        const atkPer = (typeof CFG !== 'undefined' && CFG.HERO_ATK_PER_LEVEL != null) ? CFG.HERO_ATK_PER_LEVEL : 3;
        const defPer = (typeof CFG !== 'undefined' && CFG.HERO_DEF_PER_LEVEL != null) ? CFG.HERO_DEF_PER_LEVEL : 2;
        const steps = lv - 1;
        return { attack: steps * atkPer, defense: steps * defPer };
    },

    /**
     * مزامنة attack/defense من المستوى + الاكتساب.
     * يُستدعى عند الارتقاء والتحميل وبعد امتصاص مهارات القتل.
     */
    syncHeroCombatStats(player) {
        if (!player) return;
        const baseAtk = (typeof CFG !== 'undefined' && CFG.HERO_BASE_ATTACK != null) ? CFG.HERO_BASE_ATTACK : 25;
        const baseDef = (typeof CFG !== 'undefined' && CFG.HERO_BASE_DEFENSE != null) ? CFG.HERO_BASE_DEFENSE : 5;
        const bonus = this.levelStatBonus(player.level || 1);
        const absAtk = Math.floor((player.absorbedAttack || 0) * 0.4);
        const absDef = Math.floor((player.absorbedDefense || 0) * 0.35);
        player.attack = baseAtk + bonus.attack + absAtk;
        player.defense = baseDef + bonus.defense + absDef;
        return { attack: player.attack, defense: player.defense, levelBonus: bonus };
    },

    // حساب ضرر سيف اللاعب (يشمل مكافأة المستوى عبر player.attack)
    playerSwordDamage(skills, absorbedAttack, heroLevel) {
        const swordSkill = (skills && skills.sword) || 1;
        const base = swordSkill * 18 + 12;
        const absorb = Math.floor((absorbedAttack || 0) * 0.4);
        const levelBonus = this.levelStatBonus(heroLevel || 1).attack;
        return base + absorb + levelBonus + Math.floor(Math.random() * 8);
    },

    // حساب ضرر قوس اللاعب
    playerBowDamage(skills, absorbedAttack, heroLevel) {
        const bowSkill = (skills && skills.bow) || 1;
        const base = bowSkill * 15 + 8;
        const absorb = Math.floor((absorbedAttack || 0) * 0.3);
        const levelBonus = Math.floor(this.levelStatBonus(heroLevel || 1).attack * 0.85);
        return base + absorb + levelBonus + Math.floor(Math.random() * 6);
    },

    /** ضرر العدو بعد خصم دفاع اللاعب (حد أدنى 1 إن كان الهجوم > 0) */
    applyDefense(rawDamage, player) {
        const raw = Math.max(0, Math.round(Number(rawDamage) || 0));
        if (raw <= 0) return 0;
        const def = Math.max(0, (player && player.defense) || 0);
        // كل نقطة دفاع تُخفّض ~0.45 ضرر، مع سقف تخفيض 70%
        const mitigated = Math.min(Math.floor(def * 0.45), Math.floor(raw * 0.7));
        return Math.max(1, raw - mitigated);
    },

    // الاكتساب عند قتل عدو
    absorb(playerSkills, enemySkills, ratio) {
        ratio = ratio || 0.5;
        const newSkills = Object.assign({}, playerSkills);
        for (const [skill, val] of Object.entries(enemySkills)) {
            newSkills[skill] = (newSkills[skill] || 0) + val * ratio;
        }
        return newSkills;
    },

    // الاكتساب عند القتل: يُعيد {skills, absorbedAttack, absorbedDefense, hpGain}
    absorbOnKill(player, enemy) {
        const newSkills = this.absorb(player.skills, enemy.skills || {}, 0.5);

        // نقاط اكتساب الهجوم
        let atkAbsorb = 0;
        for (const skill of this.OFFENSIVE_SKILLS) {
            if (enemy.skills && enemy.skills[skill]) {
                atkAbsorb += enemy.skills[skill] * 0.5;
            }
        }

        // نقاط اكتساب الدفاع
        let defAbsorb = 0;
        for (const skill of this.DEFENSIVE_SKILLS) {
            if (enemy.skills && enemy.skills[skill]) {
                defAbsorb += enemy.skills[skill] * 0.5;
            }
        }

        // استعادة صحة
        const hpGain = Math.floor(enemy.maxHp * 0.08);

        return {
            skills: newSkills,
            absorbedAttack: (player.absorbedAttack || 0) + atkAbsorb,
            absorbedDefense: (player.absorbedDefense || 0) + defAbsorb,
            hpGain
        };
    }
};

window.CharacterRules = CharacterRules;
