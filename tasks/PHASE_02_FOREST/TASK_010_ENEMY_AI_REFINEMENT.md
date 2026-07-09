# TASK_010 — ENEMY_AI_REFINEMENT

## Objective
Enhance enemy AI with patrol patterns, pack behavior, territory systems, alert propagation, and swimming mechanics, controlling plain JS enemy entities drawn with Canvas 2D (extend `forest-entities.js`).

## Detailed Mechanics & User Stories

### Patrol System
- Each enemy has `{ homeX, homeY, patrolRadius }` — spawn location + wander range
- Wander within radius: pick random target point every 3-5 seconds, move toward it
- When player exits aggro range, enemy returns to patrol (move toward home point)

### Pack Behavior (Wolves)
- Wolves spawn in packs of 2-3 with shared `packId`
- If one wolf aggros, all pack members within 200px aggro and coordinate
- Pack flanking: one wolf attacks from front, others circle to sides
- Pack leader: one wolf per pack has 1.5x HP, slightly larger draw scale

### Territory System
- **Bear:** Large territory (300px). Chases for 400px then returns. Visual: red boundary on minimap.
- **Crocodile:** Water territory. Lunges at player within 150px of shore. Swims fast (2x speed in water).
- **Snake:** Dark forest only. Static ambush — stays still until player within 80px, then strikes.

### Alert System
- When enemy takes damage: 30% chance to emit alert (sound + "!" drawn above head with `ctx.fillText`)
- Enemies within 150px hear alert → move toward alert origin for 3 seconds to investigate
- If they spot player during investigation, aggro

### Enemy Memory
- If player hurts enemy and runs out of aggro range, enemy remembers direction for 10 seconds
- After 10s with no contact: return to patrol, reset memory

### Provoked System (Flee → Fight)
- Existing mechanic: flee animals attacked with bow → berserk mode
- Enhance: berserk mode adds 30% speed, 20% damage bonus, but also 20% damage taken penalty
- Visual: red tint via `ctx` fill/stroke color override, pulsing alpha `0.7 + Math.sin(time) * 0.3`

### Swimming Enemies (Crocodile)
- Crocodile has `swims: true` flag
- Moves faster in water tiles (2x speed)
- Can enter water from land and vice versa
- When player is near water edge: lunge attack (sudden speed burst toward player for 0.5s)

### New Enemy: Bat 🦇
| Property | Value |
|----------|-------|
| HP | 15 |
| Attack | 8 |
| Behavior | Swarm (3-5 attack together), nocturnal only |
| Habitat | Dark forest, spawns at night |
| Loot | `venomSac` (60%) needed for poison arrows |
| Movement | Fast, erratic (sinusoidal flight path) |

### Edge Cases
- **Enemy Stuck:** If enemy position change < 5px over 3 seconds, teleport to nearest open tile with puff smoke animation (particle array of grey circles fading out)
- **Enemy Limit:** Max 30 enemies alive. If exceeded, oldest idle enemy is despawned.
- **All Enemies Dead:** If all enemies in a zone are killed, no new spawns until player camps (rest).

## Canvas 2D Implementation Hints
```javascript
class Enemy {
  constructor(template) {
    this.template = template;
    this.x = template.homeX;
    this.y = template.homeY;
    this.homeX = template.homeX;
    this.homeY = template.homeY;
    this.patrolRadius = template.patrolRadius || 150;
    this.aggroRange = template.aggroRange;
    this.attackRange = template.attackRange;
    this.state = 'patrol'; // patrol | chase | attack | flee | return
    this.memoryTarget = null;
    this.memoryTimer = 0;
    this.alertTimer = 0;
    this.stuckTimer = 0;
    this.lastX = 0; this.lastY = 0;
    this.vx = 0; this.vy = 0;
    this.provoked = false;
    this.scale = template.isLeader ? 1.25 : 1;
  }

  update(dt, player, enemies) {
    switch (this.state) {
      case 'patrol': this.updatePatrol(dt); break;
      case 'chase': this.updateChase(dt, player); break;
      case 'attack': this.updateAttack(dt, player); break;
      case 'flee': this.updateFlee(dt, player); break;
      case 'return': this.updateReturn(dt); break;
    }

    const moved = Math.hypot(this.x - this.lastX, this.y - this.lastY);
    if (moved < 5) this.stuckTimer += dt; else this.stuckTimer = 0;
    if (this.stuckTimer > 3) this.teleportToNearestOpenTile();

    this.lastX = this.x; this.lastY = this.y;
    this.facing = Math.atan2(this.vy, this.vx);
  }

  draw(ctx, camera, ZOOM) {
    const sx = (this.x - camera.x) * ZOOM;
    const sy = (this.y - camera.y) * ZOOM;
    ctx.save();
    ctx.translate(sx, sy);
    ctx.rotate(this.facing);
    ctx.scale(this.scale, this.scale);
    if (this.provoked) {
      ctx.globalAlpha = 0.7 + Math.sin(Date.now() * 0.005) * 0.3;
      ctx.fillStyle = '#ff0000';
    }
    // draw body (existing forest-entities style)
    ctx.restore();
    if (this.alertTimer > 0) {
      ctx.fillStyle = '#ff0';
      ctx.font = '16px sans-serif';
      ctx.fillText('!', sx, sy - 24);
    }
  }

  setProvoked() {
    this.provoked = true;
  }
}

class WolfPack {
  constructor(members) {
    this.id = crypto.randomUUID();
    this.members = members;
    members.forEach(m => m.packId = this.id);
  }

  onMemberAggro(aggroMember, player) {
    this.members.forEach(m => {
      if (m !== aggroMember && Math.hypot(m.x - aggroMember.x, m.y - aggroMember.y) < 200) {
        m.aggro(player);
      }
    });
  }
}
```

## Verification & Acceptance Criteria
- [ ] Enemies patrol within their territory, return to home when player leaves aggro range
- [ ] Wolves attack in packs with coordinated movement
- [ ] Bear chases limited distance (400px) then returns
- [ ] Crocodile lunges from water at shore-close player
- [ ] Alert system: nearby enemies investigate damage location
- [ ] Enemy memory: chases for 10s then returns to patrol
- [ ] Provoked enemy has red aura + speed/damage bonuses and penalty
- [ ] Bats spawn only at night in dark forest, move in swarms
- [ ] Stuck detection teleports enemy after 3s with smoke puff
- [ ] Enemy limit of 30 enforced
