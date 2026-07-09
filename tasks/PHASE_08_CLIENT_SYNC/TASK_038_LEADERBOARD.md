# TASK_038 — LEADERBOARD

## Objective
Add an **HTML leaderboard panel** on the main menu that consumes the **existing** leaderboard API (server already implemented with 034–036). Client UI only — do not rebuild the backend.

## Architecture (must follow)
- Button on `game/index.html`: «لوحة المتصدرين»
- Modal/panel: HTML table + loading/empty states
- `fetch('/api/v1/leaderboard?limit=20')` (adjust path to match `server` routes)
- Optional: highlight current user if logged in (TASK_037)
- Opt-out toggle can live in settings if API exposes `leaderboard_opt_out`
- **No Pixi**

## Detailed Mechanics & User Stories

### Panel contents
- Rank, username, level, kills (and completion if API returns it)
- Top 3 visual emphasis (CSS, not images required)
- Refresh button
- Loading skeleton or spinner
- Empty: «بانتظار المزيد من الأبطال...»
- Offline: show last cached JSON from `localStorage` if present

### Privacy
- If settings opt-out exists, call the matching user update endpoint; otherwise document as follow-up
- Logged-out users can still view public board

### Out of scope
- Re-implementing SQL / Express leaderboard services
- Profile pages beyond a simple row expand (optional)

## Implementation Hints
```javascript
async function openLeaderboard() {
  panel.classList.remove('hidden');
  showSkeleton();
  try {
    const res = await fetch('/api/v1/leaderboard?limit=20');
    const data = await res.json();
    renderRows(data.entries || data);
    localStorage.setItem('revenge_leaderboard_cache', JSON.stringify(data));
  } catch {
    renderRows(JSON.parse(localStorage.getItem('revenge_leaderboard_cache') || 'null'));
  }
}
```

Match field names to `server/src/services/leaderboard.service.js`.

## Verification & Acceptance Criteria
- [ ] Main menu opens leaderboard panel
- [ ] Data loads from existing API
- [ ] Loading and empty states work
- [ ] Offline falls back to cache when possible
- [ ] Own row highlighted when logged in (if auth present)
- [ ] HTML/CSS only — zero Pixi
