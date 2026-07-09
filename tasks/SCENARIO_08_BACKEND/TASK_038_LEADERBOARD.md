# TASK_038 — LEADERBOARD (OPTIONAL)

## Objective
Add an optional leaderboard and player stats display for competitive motivation.

## API Endpoints

| Method | Path | Auth | Response |
|--------|------|------|----------|
| GET | `/api/v1/leaderboard?limit=20&offset=0` | No | `{ entries: [{ rank, username, level, totalKills, totalDistance, completed }] }` |
| GET | `/api/v1/leaderboard/me` | Yes | `{ rank, entry }` |
| GET | `/api/v1/players/:id/profile` | No | `{ username, level, totalKills, achievements, totalPlayMs }` |

## Leaderboard Rules
- Ranked by `hero_level DESC`, tiebreaker `total_kills DESC`
- Only players who completed at least the intro are included
- Updated after every sync (live)
- Top 3: gold/silver/bronze crown icons 👑🥈🥉
- Player's own entry highlighted in blue

## Privacy
- `leaderboard_opt_out` column in `users` table
- Toggle in settings: "المشاركة في لوحة المتصدرين"
- If opted out: `/leaderboard/me` returns `{ rank: null }`

## Client UI (Pixi.js overlay)
- Main menu button "🏆 لوحة المتصدرين"
- Scrollable table: rank, crown, username, level, kills, completion badge
- Loading skeleton (PIXI.Graphics animated bars) while fetching
- Refresh button
- Empty state: "بانتظار المزيد من الأبطال..."

## Edge Cases
- **Too Few Players:** If < 3 entries, show placeholder text
- **Tie:** Use total kills → total play time as subsequent tiebreakers
- **Offline:** Show cached last-known leaderboard from localStorage

## Verification & Acceptance Criteria
- [ ] Leaderboard endpoint returns correct ordering by level → kills
- [ ] Player's own entry highlighted in blue
- [ ] Top 3 have crown icons (gold/silver/bronze)
- [ ] Profile endpoint returns public player stats
- [ ] Opt-out removes player from leaderboard
- [ ] Leaderboard with <3 entries shows placeholder
- [ ] Loading state shows skeleton animation
- [ ] Client UI refreshes on demand
