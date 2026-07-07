'use strict';
// ===== قواعد القتال والاكتساب =====

const CharacterRules = {
    OFFENSIVE_SKILLS: ['sword', 'bow', 'bite', 'tusks', 'fangs', 'claw', 'whip', 'physicalPower', 'punch', 'poison'],
    DEFENSIVE_SKILLS: ['physicalPower', 'pushPower', 'endurance', 'climbing', 'stealth'],

    // حساب ضرر سيف اللاعب
    playerSwordDamage(skills, absorbedAttack) {
        const swordSkill = skills.sword || 1;
        const base = swordSkill * 18 + 12;
        const bonus = Math.floor((absorbedAttack || 0) * 0.4);
        return base + bonus + Math.floor(Math.random() * 8);
    },

    // حساب ضرر قوس اللاعب
    playerBowDamage(skills, absorbedAttack) {
        const bowSkill = skills.bow || 1;
        const base = bowSkill * 15 + 8;
        const bonus = Math.floor((absorbedAttack || 0) * 0.3);
        return base + bonus + Math.floor(Math.random() * 6);
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
