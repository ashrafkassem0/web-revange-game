# TASK_017 — CITY_PORTAL_INTEGRATION

## Objective
Fully integrate the city with the forest portal system and Death Valley gate, ensuring seamless bidirectional travel with Canvas 2D visuals and CSS fade transitions (same pattern as `navigateTo` / `.fade-overlay` in `shared.js` and the existing city forest portal).

## Detailed Mechanics & User Stories

### Forest → City Portal (existing, refine)
- Portal location: forest south end (1600, 3080), glowing stone archway
- Visual: Canvas 2D arch + radial glow pulse + particle array (blue/gold sparkles floating upward), same style as city `drawForestPortal`
- Press E → HTML dialogue/confirm panel with "اذهب إلى المدينة" / "البقاء في الغابة"
- On confirm: save forest state, `navigateTo('../city/index.html')` (or SceneManager equivalent)

### City → Forest North Gate
- Location: top-center of city map
- Same visual style as forest portal
- Press E → "العودة إلى الغابة"
- Save city state, navigate back. Player appears at forest portal position.

### City → Death Valley South Gate
- Location: bottom-center of city map
- Initially: chained gate drawn with `ctx` (chain lines/rects) with pulsing red glow
- Locked state: E shows "الطريق إلى وادي الموت مغلق" with condition hint "أكمل مهام المدينة أولاً"
- After Quest 3 completion: chains break animation (chain pieces fall via particle/object array + burst), gate swings open
- Open state: E → "اذهب إلى وادي الموت" → save → navigate to Death Valley

### Transition Screen
- CSS `.fade-overlay` fades to black (800ms) — existing `navigateTo` in `shared.js`
- Loading text: "جاري عبور البوابة..." (HTML overlay or canvas text during fade)
- Load target scene → fade in

### State Handoff
```javascript
// Forest → City
GameState.saveForestState({ position: {x, y}, enemies, resources, ... });
navigateTo('../city/index.html'); // arriveAt north_gate via saved flag

// City → Forest
GameState.save('cityState', { completedQuests, spokenNpcs, ... });
navigateTo('../forest/index.html'); // arriveAt city_portal
```

### Edge Cases
- **Portal Blocked in Combat:** If enemies within 200px, E does nothing. "لا يمكنك المغادرة أثناء المعركة!" notification.
- **Double Activation:** Debounce portal interaction (1s cooldown). `_portalCooldown` flag.
- **Death Valley Locked:** South gate shows chain visual + locked message. After unlock, chain drawing removed permanently.
- **Return Travel:** Portal visual same both ways. Player agency always respected (never forced).

## Canvas 2D Implementation Hints
```javascript
// Portal as plain object + draw function (match city drawForestPortal)
const portals = [];

function createPortal(x, y, type) {
  return {
    x, y, type, // 'forest_city' | 'city_forest' | 'city_deathvalley'
    locked: type === 'city_deathvalley' && !GameState.load('completedCity'),
    particles: Array.from({ length: 20 }, () => ({
      x: Math.random() * 60 - 30,
      y: Math.random() * 120 - 60,
      vx: (Math.random() - 0.5) * 0.5,
      vy: -Math.random() * 0.5,
      alpha: 0.8
    })),
    pulse: 0
  };
}

function drawPortal(ctx, portal, camera) {
  const x = portal.x - camera.x;
  const y = portal.y - camera.y;
  const pulse = 0.7 + 0.3 * Math.sin(Date.now() * 0.003);

  // Arch
  ctx.fillStyle = '#6a6050';
  ctx.beginPath();
  ctx.ellipse(x, y - 48, 41, 22, 0, Math.PI, Math.PI * 2);
  ctx.fill();

  // Glow
  const color = portal.type === 'city_deathvalley'
    ? `rgba(220,80,80,${0.6 * pulse})`
    : `rgba(80,220,120,${0.6 * pulse})`;
  const grd = ctx.createRadialGradient(x, y - 38, 4, x, y - 38, 30);
  grd.addColorStop(0, color);
  grd.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = grd;
  ctx.beginPath();
  ctx.ellipse(x, y - 38, 28, 18, 0, 0, Math.PI * 2);
  ctx.fill();

  // Sparkle particles (plain JS array)
  for (const p of portal.particles) {
    ctx.fillStyle = `rgba(136,204,255,${p.alpha * pulse})`;
    ctx.beginPath();
    ctx.arc(x + p.x, y + p.y, 2, 0, Math.PI * 2);
    ctx.fill();
  }

  // Locked chains
  if (portal.locked) {
    ctx.strokeStyle = '#888';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(x - 20, y - 60); ctx.lineTo(x + 20, y - 20);
    ctx.moveTo(x + 20, y - 60); ctx.lineTo(x - 20, y - 20);
    ctx.stroke();
  }
}

function updatePortal(portal, dt) {
  for (const p of portal.particles) {
    p.x += p.vx;
    p.y += p.vy;
    p.alpha -= 0.01;
    if (p.alpha <= 0) {
      p.x = Math.random() * 60 - 30;
      p.y = 30;
      p.alpha = 0.8;
      p.vy = -(Math.random() * 0.5 + 0.2);
    }
  }
}

function unlockSouthGate(portal) {
  portal.locked = false;
  // Spawn falling chain pieces as temporary particles
  portal.breakParticles = Array.from({ length: 12 }, () => ({
    x: portal.x + (Math.random() - 0.5) * 40,
    y: portal.y - 40,
    vy: 1 + Math.random() * 3,
    alpha: 1
  }));
}

// Transition uses existing shared.js navigateTo + .fade-overlay (800ms)
```

## Verification & Acceptance Criteria
- [ ] Forest portal opens city scene with correct arrival position
- [ ] City north gate returns to forest at correct position
- [ ] State persists correctly on round trip (inventory, position, world state)
- [ ] Portal visual effects (glow, sparkles) display via Canvas 2D
- [ ] Fade transition plays (800ms)
- [ ] Portal blocked during combat with notification
- [ ] Debounce prevents double activation
- [ ] South gate chains visual until city completion
- [ ] South gate unlock animation (chains break)
- [ ] Death Valley navigation works after unlock
