const express = require('express');
const cors = require('cors');
const path = require('path');
const config = require('./config');
const authRoutes = require('./routes/auth.routes');
const gameRoutes = require('./routes/game.routes');
const setupSwagger = require('./swagger');
const { generalRateLimit } = require('./middleware/rateLimit');

const app = express();

// Trust proxy for rate limiting behind reverse proxy
app.set('trust proxy', 1);

// CORS
app.use(cors({
  origin: config.corsOrigin === '*' ? '*' : config.corsOrigin.split(',').map(s => s.trim()),
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Body parsing
app.use(express.json({ limit: '1mb' })); // 1MB payload limit per TASK_036
app.use(express.urlencoded({ extended: false }));

// General rate limiting
app.use('/api/', generalRateLimit);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), uptime: process.uptime() });
});

// API Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/game', gameRoutes);

// Swagger docs
setupSwagger(app);

// Serve static files
app.use(express.static(path.join(__dirname, '..', '..', 'game-v2')));
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api/')) return next();
  res.sendFile(path.join(__dirname, '..', '..', 'game-v2', 'index.html'));
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'المسار غير موجود' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'خطأ داخلي في الخادم' });
});

module.exports = app;
