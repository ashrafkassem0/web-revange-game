const express = require('express');
const cors = require('cors');
const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const path = require('path');

// ===== Config =====
const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || crypto.randomBytes(32).toString('hex');
const SALT_ROUNDS = 10;
const DB_PATH = path.join(__dirname, 'data', 'revenge.db');

// ===== Database =====
const fs = require('fs');
fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// Create tables
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now')),
    last_login TEXT
  );

  CREATE TABLE IF NOT EXISTS saves (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL UNIQUE,
    save_data TEXT,
    save_timestamp INTEGER,
    updated_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS leaderboard (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    username TEXT NOT NULL,
    score INTEGER NOT NULL DEFAULT 0,
    level INTEGER NOT NULL DEFAULT 1,
    enemies_killed INTEGER NOT NULL DEFAULT 0,
    play_time INTEGER NOT NULL DEFAULT 0,
    submitted_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE INDEX IF NOT EXISTS idx_leaderboard_score ON leaderboard(score DESC);
  CREATE INDEX IF NOT EXISTS idx_saves_user ON saves(user_id);
`);

// ===== App =====
const app = express();
app.use(cors());
app.use(express.json({ limit: '5mb' }));

// ===== Middleware =====
function authenticate(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'مطلوب توثيق الدخول' });
  }
  try {
    const token = header.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);
    req.userId = decoded.userId;
    req.username = decoded.username;
    next();
  } catch {
    return res.status(401).json({ error: 'رمز الدخول غير صالح' });
  }
}

// ===== Validation (Zod schemas) =====
const { z } = require('zod');

const registerSchema = z.object({
  username: z.string().min(2, 'اسم المستخدم قصير جداً').max(30, 'اسم المستخدم طويل جداً')
    .regex(/^[a-zA-Z0-9_\u0600-\u06FF]+$/, 'اسم المستخدم يحتوي على أحرف غير مسموحة'),
  email: z.string().email('البريد الإلكتروني غير صحيح'),
  password: z.string().min(6, 'كلمة المرور قصيرة جداً').max(100),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1, 'كلمة المرور مطلوبة'),
});

// ===== Routes =====

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: Date.now() });
});

// ==== Auth Routes ====
app.post('/api/v1/auth/register', async (req, res) => {
  try {
    const data = registerSchema.parse(req.body);

    // Check existing user
    const existing = db.prepare('SELECT id FROM users WHERE email = ? OR username = ?').get(data.email, data.username);
    if (existing) {
      return res.status(409).json({ error: 'البريد الإلكتروني أو اسم المستخدم موجود مسبقاً' });
    }

    const hash = await bcrypt.hash(data.password, SALT_ROUNDS);
    const result = db.prepare('INSERT INTO users (username, email, password_hash, last_login) VALUES (?, ?, ?, datetime("now"))').run(data.username, data.email, hash);

    const token = jwt.sign({ userId: result.lastInsertRowid, username: data.username }, JWT_SECRET, { expiresIn: '7d' });

    // Create initial save
    db.prepare('INSERT INTO saves (user_id, save_data, save_timestamp) VALUES (?, ?, ?)').run(result.lastInsertRowid, '{}', Date.now());

    res.status(201).json({
      token,
      user: { id: result.lastInsertRowid, username: data.username, email: data.email }
    });
  } catch (e) {
    if (e instanceof z.ZodError) {
      return res.status(400).json({ error: e.errors[0].message });
    }
    console.error('Register error:', e);
    res.status(500).json({ error: 'خطأ في الخادم' });
  }
});

app.post('/api/v1/auth/login', async (req, res) => {
  try {
    const data = loginSchema.parse(req.body);

    const user = db.prepare('SELECT id, username, email, password_hash FROM users WHERE email = ?').get(data.email);
    if (!user) {
      return res.status(401).json({ error: 'البريد الإلكتروني أو كلمة المرور غير صحيحة' });
    }

    const valid = await bcrypt.compare(data.password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ error: 'البريد الإلكتروني أو كلمة المرور غير صحيحة' });
    }

    db.prepare('UPDATE users SET last_login = datetime("now") WHERE id = ?').run(user.id);

    const token = jwt.sign({ userId: user.id, username: user.username }, JWT_SECRET, { expiresIn: '7d' });

    res.json({
      token,
      user: { id: user.id, username: user.username, email: user.email }
    });
  } catch (e) {
    if (e instanceof z.ZodError) {
      return res.status(400).json({ error: e.errors[0].message });
    }
    console.error('Login error:', e);
    res.status(500).json({ error: 'خطأ في الخادم' });
  }
});

app.get('/api/v1/auth/me', authenticate, (req, res) => {
  const user = db.prepare('SELECT id, username, email, created_at, last_login FROM users WHERE id = ?').get(req.userId);
  if (!user) return res.status(404).json({ error: 'المستخدم غير موجود' });
  res.json({ user });
});

// ==== Game State Routes ====
app.post('/api/v1/game/save', authenticate, (req, res) => {
  try {
    const saveData = req.body.saveData;
    if (!saveData) return res.status(400).json({ error: 'لا توجد بيانات للحفظ' });

    const timestamp = Date.now();

    // Check existing save
    const existing = db.prepare('SELECT id, save_timestamp FROM saves WHERE user_id = ?').get(req.userId);

    // Last Write Wins: if server timestamp is newer, accept
    if (existing && existing.save_timestamp > (saveData.saveTimestamp || 0)) {
      // Server data is newer, send it back
      const serverSave = db.prepare('SELECT save_data FROM saves WHERE user_id = ?').get(req.userId);
      return res.status(409).json({
        error: 'البيانات على الخادم أحدث',
        serverSave: JSON.parse(serverSave.save_data)
      });
    }

    const str = JSON.stringify(saveData);
    if (existing) {
      db.prepare('UPDATE saves SET save_data = ?, save_timestamp = ?, updated_at = datetime("now") WHERE user_id = ?').run(str, timestamp, req.userId);
    } else {
      db.prepare('INSERT INTO saves (user_id, save_data, save_timestamp) VALUES (?, ?, ?)').run(req.userId, str, timestamp);
    }

    res.json({ success: true, timestamp });
  } catch (e) {
    console.error('Save error:', e);
    res.status(500).json({ error: 'خطأ في الحفظ' });
  }
});

app.get('/api/v1/game/load', authenticate, (req, res) => {
  try {
    const save = db.prepare('SELECT save_data, save_timestamp FROM saves WHERE user_id = ?').get(req.userId);
    if (!save) {
      return res.json({ saveData: null });
    }
    res.json({ saveData: JSON.parse(save.save_data), saveTimestamp: save.save_timestamp });
  } catch (e) {
    console.error('Load error:', e);
    res.status(500).json({ error: 'خطأ في التحميل' });
  }
});

app.post('/api/v1/game/sync', authenticate, (req, res) => {
  try {
    const op = req.body;
    if (!op || !op.operation) {
      return res.status(400).json({ error: 'عملية غير صالحة' });
    }
    // Process sync operation
    // For now, just acknowledge
    res.json({ success: true, id: op.id });
  } catch (e) {
    res.status(500).json({ error: 'خطأ في المزامنة' });
  }
});

// ==== Leaderboard Routes ====
app.get('/api/v1/leaderboard', (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 50, 100);
    const entries = db.prepare(`
      SELECT username, score, level, enemies_killed, play_time, submitted_at
      FROM leaderboard
      ORDER BY score DESC
      LIMIT ?
    `).all(limit);
    res.json({ leaderboard: entries });
  } catch (e) {
    console.error('Leaderboard error:', e);
    res.status(500).json({ error: 'خطأ في لوحة المتصدرين' });
  }
});

app.post('/api/v1/leaderboard/submit', authenticate, (req, res) => {
  try {
    const { score, level, enemiesKilled, playTime } = req.body;
    if (typeof score !== 'number') return res.status(400).json({ error: 'النتيجة مطلوبة' });

    // Check if user already has an entry
    const existing = db.prepare('SELECT id FROM leaderboard WHERE user_id = ?').get(req.userId);
    if (existing) {
      const current = db.prepare('SELECT score FROM leaderboard WHERE user_id = ?').get(req.userId);
      if (score > current.score) {
        db.prepare('UPDATE leaderboard SET score = ?, level = ?, enemies_killed = ?, play_time = ?, submitted_at = datetime("now") WHERE user_id = ?')
          .run(score, level || 1, enemiesKilled || 0, playTime || 0, req.userId);
      }
    } else {
      db.prepare('INSERT INTO leaderboard (user_id, username, score, level, enemies_killed, play_time) VALUES (?, ?, ?, ?, ?, ?)')
        .run(req.userId, req.username, score, level || 1, enemiesKilled || 0, playTime || 0);
    }

    res.json({ success: true });
  } catch (e) {
    console.error('Submit error:', e);
    res.status(500).json({ error: 'خطأ في إرسال النتيجة' });
  }
});

// ==== Static files (production) ====
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '..', 'game-v2')));
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'game-v2', 'index.html'));
  });
}

// ===== Start =====
app.listen(PORT, () => {
  console.log(`╔══════════════════════════════════════╗`);
  console.log(`║   الانتقام — Revenge Server v2.0    ║`);
  console.log(`╠══════════════════════════════════════╣`);
  console.log(`║  Port: ${PORT}                        `);
  console.log(`║  API: http://localhost:${PORT}/api/v1  `);
  console.log(`╚══════════════════════════════════════╝`);
});
