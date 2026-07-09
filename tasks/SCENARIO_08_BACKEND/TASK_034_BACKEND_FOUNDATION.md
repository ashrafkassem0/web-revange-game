# TASK_034 — BACKEND_FOUNDATION

## Objective
Set up a Node.js + Express + SQLite backend server for user authentication and game state persistence.

## Tech Stack
- **Runtime:** Node.js 20 LTS
- **Framework:** Express.js
- **Database:** SQLite via `better-sqlite3` (sync, fast, zero-config)
- **ORM:** Knex.js (migrations, queries)
- **Auth:** `jsonwebtoken` + `bcrypt`
- **Validation:** Zod
- **Deploy:** Ready for any Node.js host (Railway, Render, Fly.io, VPS)

## Project Structure
```
server/
├── package.json
├── .env.example
├── knexfile.js
├── migrations/
│   ├── 001_users.js
│   └── 002_game_saves.js
├── src/
│   ├── index.js
│   ├── app.js
│   ├── config.js
│   ├── middleware/
│   │   ├── auth.js
│   │   ├── validate.js
│   │   └── rateLimit.js
│   ├── routes/
│   │   ├── auth.routes.js
│   │   └── game.routes.js
│   ├── controllers/
│   │   ├── auth.controller.js
│   │   └── game.controller.js
│   ├── services/
│   │   ├── auth.service.js
│   │   └── game.service.js
│   └── utils/
│       ├── hash.js
│       └── token.js
└── tests/
    ├── auth.test.js
    └── game.test.js
```

## Database Schema

### 001_users
```sql
CREATE TABLE users (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  username      TEXT    NOT NULL UNIQUE,
  email         TEXT    NOT NULL UNIQUE,
  password_hash TEXT    NOT NULL,
  created_at    TEXT    NOT NULL DEFAULT (datetime('now')),
  updated_at    TEXT    NOT NULL DEFAULT (datetime('now')),
  last_login_at TEXT,
  leaderboard_opt_out INTEGER NOT NULL DEFAULT 0
);
```

### 002_game_saves
```sql
CREATE TABLE game_saves (
  id                INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id           INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  slot              INTEGER NOT NULL DEFAULT 1,
  -- Query-friendly denormalised fields
  hero_level        INTEGER NOT NULL DEFAULT 1,
  hero_xp           INTEGER NOT NULL DEFAULT 0,
  current_map       TEXT    NOT NULL DEFAULT 'forest',
  total_kills       INTEGER NOT NULL DEFAULT 0,
  total_distance    REAL    NOT NULL DEFAULT 0.0,
  completed_game    INTEGER NOT NULL DEFAULT 0,
  -- Full state as JSON
  hero_stats        TEXT    NOT NULL DEFAULT '{}',
  inventory         TEXT    NOT NULL DEFAULT '{}',
  progress          TEXT    NOT NULL DEFAULT '{}',
  world_state       TEXT,
  meta              TEXT    NOT NULL DEFAULT '{}',
  -- Timestamps
  created_at        TEXT    NOT NULL DEFAULT (datetime('now')),
  updated_at        TEXT    NOT NULL DEFAULT (datetime('now')),
  UNIQUE(user_id, slot)
);
CREATE INDEX idx_game_saves_user ON game_saves(user_id);
CREATE INDEX idx_game_saves_lb ON game_saves(hero_level DESC, total_kills DESC);
```

## Key Design Decisions
- **JSON columns** (`hero_stats`, `inventory`, `world_state`): avoid schema migrations as game state evolves rapidly. Game already works with JS objects — serialise on save, parse on load.
- **Denormalised query fields** (`hero_level`, `total_kills`): enable fast leaderboard queries without parsing JSON.
- **SQLite**: zero ops, single file, perfect for solo-dev/small-scale. Easy migration to PostgreSQL later (only query syntax changes).
- **CORS**: restrict to game origin only.
- **Rate limiting**: 30 req/min for auth, 60 req/min for game state.

## .env.example
```
PORT=3001
JWT_SECRET=your-secret-key-change-in-production
JWT_EXPIRES_IN=7d
DB_PATH=./data/revenge.db
CORS_ORIGIN=http://localhost:5500
NODE_ENV=development
```

## Verification & Acceptance Criteria
- [ ] `npm install` installs all dependencies
- [ ] `npm run migrate` creates tables in SQLite database
- [ ] `npm start` boots server on configured port
- [ ] All endpoints return `Content-Type: application/json`
- [ ] CORS headers allow game origin only
- [ ] Rate limiter blocks >60 req/min with 429 status
- [ ] `.env.example` documents all required environment variables
- [ ] Test suite passes (`npm test`)
