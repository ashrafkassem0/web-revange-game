const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');
const config = require('./config');

// Ensure data directory exists
fs.mkdirSync(path.dirname(config.dbPath), { recursive: true });

const db = new Database(config.dbPath);

// Performance & safety pragmas
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');
db.pragma('synchronous = NORMAL');
db.pragma('cache_size = -64000');

// Run migrations on startup
function runMigrations() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      last_login_at TEXT,
      leaderboard_opt_out INTEGER DEFAULT 0,
      failed_login_attempts INTEGER DEFAULT 0,
      locked_until TEXT
    );

    CREATE TABLE IF NOT EXISTS game_saves (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      slot INTEGER DEFAULT 1,
      hero_level INTEGER DEFAULT 1,
      hero_xp INTEGER DEFAULT 0,
      current_map TEXT DEFAULT 'forest',
      total_kills INTEGER DEFAULT 0,
      total_distance REAL DEFAULT 0,
      completed_game INTEGER DEFAULT 0,
      hero_stats TEXT DEFAULT '{}',
      inventory TEXT DEFAULT '{}',
      progress TEXT DEFAULT '{}',
      world_state TEXT,
      meta TEXT DEFAULT '{}',
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      UNIQUE(user_id, slot)
    );

    CREATE TABLE IF NOT EXISTS leaderboard_scores (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      username TEXT NOT NULL,
      score INTEGER DEFAULT 0,
      level INTEGER DEFAULT 1,
      enemies_killed INTEGER DEFAULT 0,
      play_time INTEGER DEFAULT 0,
      submitted_at TEXT DEFAULT (datetime('now')),
      UNIQUE(user_id)
    );
  `);

  // Schema migrations for existing databases
  // Rename last_login → last_login_at if old column exists
  try {
    const oldCol = db.prepare("SELECT name FROM pragma_table_info('users') WHERE name = 'last_login'").get();
    if (oldCol) {
      db.exec('ALTER TABLE users RENAME COLUMN last_login TO last_login_at');
    }
  } catch {}
  try {
    const missingCol = db.prepare("SELECT name FROM pragma_table_info('users') WHERE name = 'last_login_at'").get();
    if (!missingCol) {
      db.exec('ALTER TABLE users ADD COLUMN last_login_at TEXT');
    }
  } catch {}
  // Add failed_login_attempts, locked_until if missing
  try { const c = db.prepare("SELECT name FROM pragma_table_info('users') WHERE name = 'failed_login_attempts'").get(); if (!c) db.exec('ALTER TABLE users ADD COLUMN failed_login_attempts INTEGER DEFAULT 0'); } catch {}
  try { const c = db.prepare("SELECT name FROM pragma_table_info('users') WHERE name = 'locked_until'").get(); if (!c) db.exec('ALTER TABLE users ADD COLUMN locked_until TEXT'); } catch {}
  try { const c = db.prepare("SELECT name FROM pragma_table_info('users') WHERE name = 'updated_at'").get(); if (!c) db.exec('ALTER TABLE users ADD COLUMN updated_at TEXT DEFAULT (datetime("now"))'); } catch {}
  try { const c = db.prepare("SELECT name FROM pragma_table_info('users') WHERE name = 'leaderboard_opt_out'").get(); if (!c) db.exec('ALTER TABLE users ADD COLUMN leaderboard_opt_out INTEGER DEFAULT 0'); } catch {}

  // Create indexes (IF NOT EXISTS for indexes requires separate exec)
  try { db.exec('CREATE INDEX IF NOT EXISTS idx_game_saves_user ON game_saves(user_id)'); } catch {}
  try { db.exec('CREATE INDEX IF NOT EXISTS idx_game_saves_lb ON game_saves(hero_level DESC, total_kills DESC)'); } catch {}
  try { db.exec('CREATE INDEX IF NOT EXISTS idx_leaderboard_score ON leaderboard_scores(score DESC)'); } catch {}
}

runMigrations();

module.exports = db;
