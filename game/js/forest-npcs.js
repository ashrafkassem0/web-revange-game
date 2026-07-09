'use strict';
// =========================================================
//  FOREST NPCs — حارس بوابة المدينة + تفاعل المهام
// =========================================================

/** حارس بوابة المدينة — يعطي سلسلة مهام الغابة */
const FOREST_GATE_GUARD = {
    id: 'forest_gate_guard',
    name: 'حارس البوابة',
    emoji: '🛡️',
    r: 18,
    interactRange: 58,
    // شمال البوابة قليلاً داخل المنطقة الآمنة
    get x() {
        return (typeof CITY_PORTAL !== 'undefined' ? CITY_PORTAL.x : 1600) - 48;
    },
    get y() {
        return (typeof CITY_PORTAL !== 'undefined' ? CITY_PORTAL.y : 3080) - 70;
    }
};

function isNearGateGuard() {
    if (typeof player === 'undefined' || !player) return false;
    return Math.hypot(player.x - FOREST_GATE_GUARD.x, player.y - FOREST_GATE_GUARD.y)
        < FOREST_GATE_GUARD.interactRange;
}

function interactGateGuard() {
    if (typeof ForestQuests === 'undefined' || !ForestQuests.openGiverDialogue) {
        if (typeof notify === 'function') notify('الحارس صامت الآن…', '#aaa');
        return;
    }
    ForestQuests.openGiverDialogue(FOREST_GATE_GUARD);
}

function drawGateGuard(camX, camY) {
    const g = FOREST_GATE_GUARD;
    const sx = g.x - camX;
    const sy = g.y - camY;
    const W = (typeof canvas !== 'undefined' ? canvas.width : 800) / (typeof ZOOM !== 'undefined' ? ZOOM : 1.5);
    const H = (typeof canvas !== 'undefined' ? canvas.height : 600) / (typeof ZOOM !== 'undefined' ? ZOOM : 1.5);
    if (sx < -60 || sx > W + 60 || sy < -80 || sy > H + 60) return;

    const near = isNearGateGuard();
    ctx.save();

    // ظل
    ctx.beginPath();
    ctx.ellipse(sx, sy + 12, 14, 5, 0, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.fill();

    // جسم / درع
    ctx.fillStyle = '#3a4a58';
    ctx.beginPath();
    ctx.roundRect(sx - 10, sy - 8, 20, 22, 3);
    ctx.fill();
    ctx.fillStyle = '#2a3540';
    ctx.fillRect(sx - 10, sy + 6, 20, 4);

    // رأس
    ctx.beginPath();
    ctx.arc(sx, sy - 14, 9, 0, Math.PI * 2);
    ctx.fillStyle = '#c8a070';
    ctx.fill();
    // خوذة
    ctx.beginPath();
    ctx.arc(sx, sy - 16, 9, Math.PI, Math.PI * 2);
    ctx.fillStyle = '#5a6a78';
    ctx.fill();
    ctx.fillStyle = '#4a5a68';
    ctx.fillRect(sx - 9, sy - 16, 18, 4);

    // رمح
    ctx.strokeStyle = '#8a7040';
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(sx + 12, sy + 14);
    ctx.lineTo(sx + 16, sy - 28);
    ctx.stroke();
    ctx.fillStyle = '#c0c8d0';
    ctx.beginPath();
    ctx.moveTo(sx + 16, sy - 28);
    ctx.lineTo(sx + 12, sy - 20);
    ctx.lineTo(sx + 20, sy - 20);
    ctx.closePath();
    ctx.fill();

    // إيموجي صغير
    ctx.font = '12px serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(g.emoji, sx - 1, sy + 2);

    // لوحة الاسم
    ctx.font = 'bold 10px Cairo, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    ctx.lineWidth = 3;
    ctx.strokeStyle = 'rgba(0,0,0,0.75)';
    ctx.strokeText(g.name, sx, sy - 28);
    ctx.fillStyle = '#ffd060';
    ctx.fillText(g.name, sx, sy - 28);

    // علامة مهمة ! / ? / …
    let marker = null;
    if (typeof ForestQuests !== 'undefined' && ForestQuests.getGiverMarker) {
        marker = ForestQuests.getGiverMarker();
    }
    if (marker) {
        const isDim = marker === '…';
        const pulse = isDim ? 0.55 : (0.75 + Math.sin(Date.now() * 0.006) * 0.25);
        ctx.globalAlpha = pulse;
        ctx.font = isDim ? 'bold 16px Cairo, sans-serif' : 'bold 18px Cairo, sans-serif';
        ctx.strokeStyle = 'rgba(0,0,0,0.85)';
        ctx.lineWidth = 4;
        ctx.strokeText(marker, sx, sy - 42);
        ctx.fillStyle = isDim ? '#c8b880' : '#ffd060';
        ctx.fillText(marker, sx, sy - 42);
        ctx.globalAlpha = 1;
    }

    // تلميح التفاعل
    if (near) {
        ctx.beginPath();
        ctx.arc(sx, sy, g.r + 8, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(255,208,96,0.55)';
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.font = 'bold 11px Cairo';
        ctx.strokeStyle = 'rgba(0,0,0,0.85)';
        ctx.lineWidth = 3;
        let hint = '[E] تحدث';
        if (marker === '?') hint = '[E] تسليم المهمة';
        else if (marker === '!') hint = '[E] مهمة جديدة';
        else if (marker === '…') hint = '[E] تقدم المهمة';
        ctx.strokeText(hint, sx, sy + 28);
        ctx.fillStyle = '#ffe9a0';
        ctx.fillText(hint, sx, sy + 28);
    }

    ctx.restore();
}

if (typeof window !== 'undefined') {
    window.FOREST_GATE_GUARD = FOREST_GATE_GUARD;
    window.isNearGateGuard = isNearGateGuard;
    window.interactGateGuard = interactGateGuard;
    window.drawGateGuard = drawGateGuard;
}

// =========================================================
//  لوحة الصيد — TASK_043
// =========================================================

/** لوحة خشبية قرب مخيم البداية (جنوب الخريطة) */
const HUNT_BOARD = {
    id: 'hunt_board',
    name: 'لوحة الصيد',
    r: 22,
    interactRange: 52,
    x: 1520,
    y: 2740
};

function isNearHuntBoard() {
    if (typeof player === 'undefined' || !player) return false;
    return Math.hypot(player.x - HUNT_BOARD.x, player.y - HUNT_BOARD.y) < HUNT_BOARD.interactRange;
}

function interactHuntBoard() {
    if (typeof ForestQuests === 'undefined' || !ForestQuests.openHuntBoardModal) {
        if (typeof notify === 'function') notify('اللوحة فارغة الآن…', '#aaa');
        return;
    }
    ForestQuests.openHuntBoardModal();
}

function drawHuntBoard(camX, camY) {
    const b = HUNT_BOARD;
    const sx = b.x - camX;
    const sy = b.y - camY;
    const W = (typeof canvas !== 'undefined' ? canvas.width : 800) / (typeof ZOOM !== 'undefined' ? ZOOM : 1.5);
    const H = (typeof canvas !== 'undefined' ? canvas.height : 600) / (typeof ZOOM !== 'undefined' ? ZOOM : 1.5);
    if (sx < -80 || sx > W + 80 || sy < -100 || sy > H + 80) return;

    const near = isNearHuntBoard();
    ctx.save();

    // ظل
    ctx.beginPath();
    ctx.ellipse(sx, sy + 18, 22, 6, 0, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(0,0,0,0.32)';
    ctx.fill();

    // عمودان
    ctx.fillStyle = '#5a3a1a';
    ctx.fillRect(sx - 18, sy - 6, 5, 28);
    ctx.fillRect(sx + 13, sy - 6, 5, 28);

    // لوح خشبي
    const grad = ctx.createLinearGradient(sx - 26, sy - 34, sx + 26, sy + 8);
    grad.addColorStop(0, '#8a5a28');
    grad.addColorStop(0.45, '#6e4520');
    grad.addColorStop(1, '#4a3014');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.roundRect(sx - 26, sy - 36, 52, 40, 3);
    ctx.fill();
    ctx.strokeStyle = 'rgba(30,18,8,0.75)';
    ctx.lineWidth = 2;
    ctx.stroke();

    // مسامير / خطوط خشب
    ctx.strokeStyle = 'rgba(40,24,10,0.35)';
    ctx.lineWidth = 1;
    for (let i = 0; i < 3; i++) {
        const ly = sy - 28 + i * 10;
        ctx.beginPath();
        ctx.moveTo(sx - 22, ly);
        ctx.lineTo(sx + 22, ly);
        ctx.stroke();
    }
    ctx.fillStyle = '#c8a060';
    ctx.beginPath();
    ctx.arc(sx - 20, sy - 30, 1.6, 0, Math.PI * 2);
    ctx.arc(sx + 20, sy - 30, 1.6, 0, Math.PI * 2);
    ctx.arc(sx - 20, sy - 2, 1.6, 0, Math.PI * 2);
    ctx.arc(sx + 20, sy - 2, 1.6, 0, Math.PI * 2);
    ctx.fill();

    // عنوان
    ctx.font = 'bold 9px Cairo, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.lineWidth = 3;
    ctx.strokeStyle = 'rgba(0,0,0,0.7)';
    ctx.strokeText(b.name, sx, sy - 16);
    ctx.fillStyle = '#ffd060';
    ctx.fillText(b.name, sx, sy - 16);

    // علامة ! / ? / …
    let marker = null;
    if (typeof ForestQuests !== 'undefined' && ForestQuests.getBoardMarker) {
        marker = ForestQuests.getBoardMarker();
    }
    if (marker) {
        const isDim = marker === '…';
        const pulse = isDim ? 0.55 : (0.75 + Math.sin(Date.now() * 0.006) * 0.25);
        ctx.globalAlpha = pulse;
        ctx.font = isDim ? 'bold 16px Cairo, sans-serif' : 'bold 18px Cairo, sans-serif';
        ctx.strokeStyle = 'rgba(0,0,0,0.85)';
        ctx.lineWidth = 4;
        ctx.strokeText(marker, sx, sy - 48);
        ctx.fillStyle = isDim ? '#c8b880' : '#ffd060';
        ctx.fillText(marker, sx, sy - 48);
        ctx.globalAlpha = 1;
    }

    if (near) {
        ctx.beginPath();
        ctx.arc(sx, sy, b.r + 6, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(255,208,96,0.5)';
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.font = 'bold 11px Cairo';
        ctx.strokeStyle = 'rgba(0,0,0,0.85)';
        ctx.lineWidth = 3;
        let hint = '[E] لوحة الصيد';
        if (marker === '?') hint = '[E] تسليم الصيد';
        else if (marker === '!') hint = '[E] صيود متاحة';
        else if (marker === '…') hint = '[E] تقدم الصيد';
        ctx.strokeText(hint, sx, sy + 34);
        ctx.fillStyle = '#ffe9a0';
        ctx.fillText(hint, sx, sy + 34);
    }

    ctx.restore();
}

if (typeof window !== 'undefined') {
    window.HUNT_BOARD = HUNT_BOARD;
    window.isNearHuntBoard = isNearHuntBoard;
    window.interactHuntBoard = interactHuntBoard;
    window.drawHuntBoard = drawHuntBoard;
}
