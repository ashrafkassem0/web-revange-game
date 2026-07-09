const path = require('path');

// Load .env manually (no dotenv dependency needed for these few vars)
function loadEnv() {
  const envPath = path.join(__dirname, '..', '.env');
  try {
    const fs = require('fs');
    if (fs.existsSync(envPath)) {
      const lines = fs.readFileSync(envPath, 'utf-8').split('\n');
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) continue;
        const eqIdx = trimmed.indexOf('=');
        if (eqIdx === -1) continue;
        const key = trimmed.slice(0, eqIdx).trim();
        const val = trimmed.slice(eqIdx + 1).trim();
        if (!process.env[key]) process.env[key] = val;
      }
    }
  } catch { /* .env is optional */ }
}

loadEnv();

const config = {
  port: parseInt(process.env.PORT || '3001', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  jwtSecret: process.env.JWT_SECRET || 'dev-secret-change-in-production-' + require('crypto').randomBytes(8).toString('hex'),
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  dbPath: process.env.DB_PATH || path.join(__dirname, '..', 'data', 'revenge.db'),
  corsOrigin: process.env.CORS_ORIGIN || '*',
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000', 10),
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '60', 10),
    authMax: parseInt(process.env.AUTH_RATE_LIMIT_MAX || '30', 10),
  },
  auth: {
    bcryptRounds: 10,
    maxFailedLogins: 10,
    lockDurationMs: 15 * 60 * 1000, // 15 min
  }
};

module.exports = config;
