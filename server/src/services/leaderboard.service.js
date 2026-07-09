const db = require('../db');

const LeaderboardService = {
  getLeaderboard(limit = 20, offset = 0) {
    limit = Math.min(limit, 100);
    const entries = db.prepare(`
      SELECT u.username, gs.hero_level AS level, gs.total_kills, gs.total_distance,
             gs.completed_game, gs.updated_at
      FROM game_saves gs
      JOIN users u ON u.id = gs.user_id
      WHERE u.leaderboard_opt_out = 0 AND gs.completed_game >= 0
      ORDER BY gs.hero_level DESC, gs.total_kills DESC
      LIMIT ? OFFSET ?
    `).all(limit, offset);

    return entries.map((entry, idx) => ({
      rank: offset + idx + 1,
      username: entry.username,
      level: entry.level,
      totalKills: entry.total_kills,
      totalDistance: entry.total_distance,
      completed: !!entry.completed_game,
      updatedAt: entry.updated_at,
    }));
  },

  getMyRank(userId) {
    const user = db.prepare('SELECT leaderboard_opt_out FROM users WHERE id = ?').get(userId);
    if (!user || user.leaderboard_opt_out) return { rank: null, entry: null };

    const entry = db.prepare(`
      SELECT u.username, gs.hero_level AS level, gs.total_kills, gs.total_distance,
             gs.completed_game, gs.updated_at
      FROM game_saves gs
      JOIN users u ON u.id = gs.user_id
      WHERE gs.user_id = ?
    `).get(userId);

    if (!entry) return { rank: null, entry: null };

    const rank = db.prepare(`
      SELECT COUNT(*) + 1 AS rank FROM game_saves gs
      JOIN users u ON u.id = gs.user_id
      WHERE u.leaderboard_opt_out = 0
        AND (gs.hero_level > ? OR (gs.hero_level = ? AND gs.total_kills > ?))
    `).get(entry.level, entry.level, entry.total_kills);

    return {
      rank: rank.rank,
      entry: {
        username: entry.username,
        level: entry.level,
        totalKills: entry.total_kills,
        totalDistance: entry.total_distance,
        completed: !!entry.completed_game,
      },
    };
  },

  getPlayerProfile(targetUserId) {
    const user = db.prepare('SELECT id, username, created_at FROM users WHERE id = ?').get(targetUserId);
    if (!user) return null;

    const save = db.prepare(`
      SELECT hero_level, total_kills, total_distance, completed_game, meta
      FROM game_saves WHERE user_id = ? ORDER BY slot LIMIT 1
    `).get(targetUserId);

    if (!save) {
      return { username: user.username, level: 0, totalKills: 0, totalDistance: 0, achievements: [], totalPlayMs: 0 };
    }

    const meta = safeParse(save.meta);
    return {
      username: user.username,
      level: save.hero_level,
      totalKills: save.total_kills,
      totalDistance: save.total_distance,
      completed: !!save.completed_game,
      achievements: meta.achievements || [],
      totalPlayMs: meta.totalPlayMs || 0,
    };
  },

  submitScore(userId, username, score, level, enemiesKilled, playTime) {
    const existing = db.prepare('SELECT id, score FROM leaderboard_scores WHERE user_id = ?').get(userId);
    if (existing) {
      if (score > existing.score) {
        db.prepare('UPDATE leaderboard_scores SET score = ?, level = ?, enemies_killed = ?, play_time = ?, submitted_at = datetime(\'now\') WHERE user_id = ?')
          .run(score, level, enemiesKilled, playTime, userId);
      }
    } else {
      db.prepare('INSERT INTO leaderboard_scores (user_id, username, score, level, enemies_killed, play_time) VALUES (?, ?, ?, ?, ?, ?)')
        .run(userId, username, score, level, enemiesKilled, playTime);
    }
  },
};

function safeParse(str) {
  if (!str) return {};
  try { return JSON.parse(str); } catch { return {}; }
}

module.exports = LeaderboardService;
