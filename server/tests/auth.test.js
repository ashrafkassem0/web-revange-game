const request = require('supertest');
const app = require('../src/app');
const db = require('../src/db');
const bcrypt = require('bcryptjs');

// Clean up before tests
beforeAll(() => {
  db.exec('DELETE FROM game_saves');
  db.exec('DELETE FROM users');
});

afterAll(() => {
  db.close();
});

describe('POST /api/v1/auth/register', () => {
  test('registers a new user', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({ username: 'testplayer', email: 'test@example.com', password: 'Password1' });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('token');
    expect(res.body.user.username).toBe('testplayer');
    expect(res.body.user.email).toBe('test@example.com');
  });

  test('rejects duplicate email', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({ username: 'another', email: 'test@example.com', password: 'Password1' });

    expect(res.status).toBe(409);
    expect(res.body.error).toContain('مستخدم');
  });

  test('rejects weak password', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({ username: 'weakuser', email: 'weak@example.com', password: 'short' });

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
  });

  test('rejects invalid email', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({ username: 'badmail', email: 'notanemail', password: 'Password1' });

    expect(res.status).toBe(400);
  });
});

describe('POST /api/v1/auth/login', () => {
  test('logs in with correct credentials', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'test@example.com', password: 'Password1' });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('token');
    expect(res.body.user.username).toBe('testplayer');
  });

  test('rejects wrong password', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'test@example.com', password: 'WrongPassword1' });

    expect(res.status).toBe(401);
    expect(res.body.error).toContain('غير صحيحة');
  });

  test('rejects non-existent email', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'nobody@example.com', password: 'Password1' });

    expect(res.status).toBe(401);
  });
});

describe('GET /api/v1/auth/me', () => {
  let token;

  beforeAll(async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'test@example.com', password: 'Password1' });
    token = res.body.token;
  });

  test('returns user profile with valid token', async () => {
    const res = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', 'Bearer ' + token);

    expect(res.status).toBe(200);
    expect(res.body.user.username).toBe('testplayer');
  });

  test('returns 401 without token', async () => {
    const res = await request(app).get('/api/v1/auth/me');
    expect(res.status).toBe(401);
  });

  test('returns 401 with invalid token', async () => {
    const res = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', 'Bearer invalidtoken');
    expect(res.status).toBe(401);
  });
});

describe('Game Save endpoints', () => {
  let token;

  beforeAll(async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'test@example.com', password: 'Password1' });
    token = res.body.token;
  });

  test('POST /api/v1/game/saves/1 creates a save', async () => {
    const res = await request(app)
      .post('/api/v1/game/saves/1')
      .set('Authorization', 'Bearer ' + token)
      .send({
        heroStats: { hp: 100, maxHp: 100, level: 1 },
        inventory: { items: [], gold: 0 },
        progress: { currentMap: 'forest' },
        timestamp: new Date().toISOString()
      });

    expect(res.status).toBe(200);
    expect(res.body.save.slot).toBe(1);
  });

  test('GET /api/v1/game/saves returns list', async () => {
    const res = await request(app)
      .get('/api/v1/game/saves')
      .set('Authorization', 'Bearer ' + token);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.saves)).toBe(true);
    expect(res.body.saves.length).toBeGreaterThanOrEqual(1);
  });

  test('GET /api/v1/game/saves/1 returns save', async () => {
    const res = await request(app)
      .get('/api/v1/game/saves/1')
      .set('Authorization', 'Bearer ' + token);

    expect(res.status).toBe(200);
    expect(res.body.save).toBeDefined();
  });

  test('DELETE /api/v1/game/saves/1 deletes save', async () => {
    const res = await request(app)
      .delete('/api/v1/game/saves/1')
      .set('Authorization', 'Bearer ' + token);

    expect(res.status).toBe(200);
    expect(res.body.message).toContain('الحذف');
  });
});

describe('Leaderboard endpoints', () => {
  test('GET /api/v1/game/leaderboard returns list', async () => {
    const res = await request(app)
      .get('/api/v1/game/leaderboard?limit=10');

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.entries)).toBe(true);
  });

  test('GET /api/v1/health returns ok', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });
});
