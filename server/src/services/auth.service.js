const db = require('../db');
const { hashPassword, verifyPassword } = require('../utils/hash');
const { generateToken } = require('../utils/token');
const config = require('../config');

const AuthService = {
  async register(username, email, password) {
    const existing = db.prepare(
      'SELECT id FROM users WHERE email = ? OR username = ?'
    ).get(email, username);

    if (existing) {
      const conflict = db.prepare('SELECT email, username FROM users WHERE id = ?').get(existing.id);
      if (conflict.email === email) {
        throw { status: 409, message: 'البريد الإلكتروني مستخدم بالفعل' };
      }
      throw { status: 409, message: 'اسم المستخدم مستخدم بالفعل' };
    }

    const hash = await hashPassword(password);
    const result = db.prepare(
      'INSERT INTO users (username, email, password_hash, last_login_at) VALUES (?, ?, ?, datetime(\'now\'))'
    ).run(username, email, hash);

    const userId = result.lastInsertRowid;
    const token = generateToken(userId, username);

    // Create initial save slot
    db.prepare(
      'INSERT INTO game_saves (user_id, slot, current_map) VALUES (?, 1, \'intro\')'
    ).run(userId);

    return {
      user: { id: userId, username, email, createdAt: new Date().toISOString() },
      token,
    };
  },

  async login(email, password) {
    const user = db.prepare(
      'SELECT id, username, email, password_hash, failed_login_attempts, locked_until FROM users WHERE email = ?'
    ).get(email);

    if (!user) {
      throw { status: 401, message: 'البريد الإلكتروني أو كلمة المرور غير صحيحة' };
    }

    // Check account lock
    if (user.locked_until) {
      const lockTime = new Date(user.locked_until).getTime();
      if (Date.now() < lockTime) {
        const remaining = Math.ceil((lockTime - Date.now()) / 60000);
        throw { status: 423, message: `الحساب مقفل، حاول بعد ${remaining} دقيقة` };
      }
      // Lock expired, reset
      db.prepare('UPDATE users SET failed_login_attempts = 0, locked_until = NULL WHERE id = ?').run(user.id);
    }

    const valid = await verifyPassword(password, user.password_hash);
    if (!valid) {
      const attempts = (user.failed_login_attempts || 0) + 1;
      if (attempts >= config.auth.maxFailedLogins) {
        const lockUntil = new Date(Date.now() + config.auth.lockDurationMs).toISOString();
        db.prepare('UPDATE users SET failed_login_attempts = ?, locked_until = ? WHERE id = ?').run(attempts, lockUntil, user.id);
        throw { status: 423, message: 'الحساب مقفل، حاول بعد 15 دقيقة' };
      }
      db.prepare('UPDATE users SET failed_login_attempts = ? WHERE id = ?').run(attempts, user.id);
      throw { status: 401, message: 'البريد الإلكتروني أو كلمة المرور غير صحيحة' };
    }

    // Successful login
    db.prepare('UPDATE users SET failed_login_attempts = 0, locked_until = NULL, last_login_at = datetime(\'now\') WHERE id = ?').run(user.id);

    const token = generateToken(user.id, user.username);

    return {
      user: { id: user.id, username: user.username, email: user.email },
      token,
    };
  },

  refresh(userId, username) {
    const user = db.prepare('SELECT id FROM users WHERE id = ?').get(userId);
    if (!user) throw { status: 401, message: 'المستخدم غير موجود' };
    return { token: generateToken(userId, username) };
  },

  getProfile(userId) {
    const user = db.prepare(
      'SELECT id, username, email, created_at, last_login_at, leaderboard_opt_out FROM users WHERE id = ?'
    ).get(userId);
    if (!user) throw { status: 404, message: 'المستخدم غير موجود' };
    return { user };
  },
};

module.exports = AuthService;
