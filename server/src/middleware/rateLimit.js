const config = require('../config');

const ipWindow = new Map();

function createRateLimiter(windowMs, maxRequests, label = 'general') {
  return (req, res, next) => {
    const ip = req.ip || req.connection.remoteAddress || 'unknown';
    const key = `${label}:${ip}`;
    const now = Date.now();
    const windowStart = now - windowMs;

    if (!ipWindow.has(key)) {
      ipWindow.set(key, []);
    }

    const timestamps = ipWindow.get(key).filter(t => t > windowStart);
    timestamps.push(now);
    ipWindow.set(key, timestamps);

    if (timestamps.length > maxRequests) {
      return res.status(429).json({
        error: 'طلبات كثيرة جداً، حاول لاحقاً',
        retryAfter: Math.ceil(windowMs / 1000),
      });
    }

    next();
  };
}

const authRateLimit = createRateLimiter(60000, 5, 'auth');
const registerRateLimit = createRateLimiter(60000, 30, 'register');
const generalRateLimit = createRateLimiter(config.rateLimit.windowMs, config.rateLimit.max);

module.exports = { createRateLimiter, authRateLimit, registerRateLimit, generalRateLimit };
