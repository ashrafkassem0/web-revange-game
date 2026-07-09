const db = require('../db');

const GameService = {
  listSaves(userId) {
    return db.prepare(
      'SELECT slot, hero_level, current_map, total_kills, completed_game, updated_at FROM game_saves WHERE user_id = ? ORDER BY slot'
    ).all(userId);
  },

  getSave(userId, slot) {
    return db.prepare('SELECT * FROM game_saves WHERE user_id = ? AND slot = ?').get(userId, slot);
  },

  saveGame(userId, slot, data) {
    const existing = db.prepare('SELECT id, updated_at FROM game_saves WHERE user_id = ? AND slot = ?').get(userId, slot);

    const now = new Date().toISOString();
    const clientTimestamp = data.timestamp || now;

    // Conflict detection: Last Write Wins
    if (existing && clientTimestamp < existing.updated_at) {
      const serverSave = db.prepare('SELECT * FROM game_saves WHERE id = ?').get(existing.id);
      return { conflict: true, serverSave: parseSaveRow(serverSave) };
    }

    const heroStats = data.heroStats || {};
    const inventory = data.inventory || {};
    const progress = data.progress || {};
    const worldState = data.worldState || null;
    const meta = data.meta || {};

    const insertData = {
      user_id: userId,
      slot,
      hero_level: progress.heroLevel || heroStats.level || 1,
      hero_xp: heroStats.xp || 0,
      current_map: progress.currentMap || 'forest',
      total_kills: meta.totalKills || 0,
      total_distance: meta.totalDistance || 0,
      completed_game: progress.completedGame ? 1 : 0,
      hero_stats: JSON.stringify(heroStats),
      inventory: JSON.stringify(inventory),
      progress: JSON.stringify(progress),
      world_state: worldState ? JSON.stringify(worldState) : null,
      meta: JSON.stringify(meta),
      updated_at: now,
    };

    if (existing) {
      db.prepare(`
        UPDATE game_saves SET
          hero_level = ?, hero_xp = ?, current_map = ?, total_kills = ?,
          total_distance = ?, completed_game = ?, hero_stats = ?, inventory = ?,
          progress = ?, world_state = ?, meta = ?, updated_at = ?
        WHERE user_id = ? AND slot = ?
      `).run(
        insertData.hero_level, insertData.hero_xp, insertData.current_map, insertData.total_kills,
        insertData.total_distance, insertData.completed_game, insertData.hero_stats, insertData.inventory,
        insertData.progress, insertData.world_state, insertData.meta, insertData.updated_at,
        userId, slot
      );
    } else {
      db.prepare(`
        INSERT INTO game_saves (user_id, slot, hero_level, hero_xp, current_map, total_kills,
          total_distance, completed_game, hero_stats, inventory, progress, world_state, meta, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        insertData.user_id, insertData.slot, insertData.hero_level, insertData.hero_xp,
        insertData.current_map, insertData.total_kills, insertData.total_distance,
        insertData.completed_game, insertData.hero_stats, insertData.inventory,
        insertData.progress, insertData.world_state, insertData.meta, insertData.updated_at
      );
    }

    const saved = db.prepare('SELECT * FROM game_saves WHERE user_id = ? AND slot = ?').get(userId, slot);
    return { save: parseSaveRow(saved) };
  },

  deleteSave(userId, slot) {
    const result = db.prepare('DELETE FROM game_saves WHERE user_id = ? AND slot = ?').run(userId, slot);
    if (result.changes === 0) throw { status: 404, message: 'لم يتم العثور على الحفظ' };
    return { message: 'تم الحذف' };
  },

  bulkSync(userId, saves) {
    const results = [];
    for (const item of saves) {
      const { slot, data, timestamp } = item;
      const existing = db.prepare('SELECT * FROM game_saves WHERE user_id = ? AND slot = ?').get(userId, slot);

      if (!existing || timestamp >= existing.updated_at) {
        this.saveGame(userId, slot, data);
        const fresh = db.prepare('SELECT * FROM game_saves WHERE user_id = ? AND slot = ?').get(userId, slot);
        results.push({ slot, data: parseSaveRow(fresh) });
      } else {
        results.push({ slot, data: parseSaveRow(existing) });
      }
    }
    return { saves: results };
  },
};

function parseSaveRow(row) {
  if (!row) return null;
  return {
    id: row.id,
    userId: row.user_id,
    slot: row.slot,
    heroLevel: row.hero_level,
    heroXp: row.hero_xp,
    currentMap: row.current_map,
    totalKills: row.total_kills,
    totalDistance: row.total_distance,
    completedGame: !!row.completed_game,
    heroStats: safeParse(row.hero_stats),
    inventory: safeParse(row.inventory),
    progress: safeParse(row.progress),
    worldState: safeParse(row.world_state),
    meta: safeParse(row.meta),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function safeParse(str) {
  if (!str) return {};
  try { return JSON.parse(str); } catch { return {}; }
}

module.exports = GameService;
