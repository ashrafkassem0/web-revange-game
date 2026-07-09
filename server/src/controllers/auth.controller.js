const AuthService = require('../services/auth.service');

const AuthController = {
  async register(req, res) {
    try {
      const { username, email, password } = req.validated;
      const result = await AuthService.register(username, email, password);
      res.status(201).json(result);
    } catch (e) {
      res.status(e.status || 500).json({ error: e.message || 'خطأ في الخادم' });
    }
  },

  async login(req, res) {
    try {
      const { email, password } = req.validated;
      const result = await AuthService.login(email, password);
      res.json(result);
    } catch (e) {
      res.status(e.status || 500).json({ error: e.message || 'خطأ في الخادم' });
    }
  },

  async refresh(req, res) {
    try {
      const result = AuthService.refresh(req.user.sub, req.user.username);
      res.json(result);
    } catch (e) {
      res.status(e.status || 500).json({ error: e.message || 'خطأ في الخادم' });
    }
  },

  async logout(req, res) {
    // With JWT, logout is client-side (discard token)
    // Server can maintain a blacklist if needed
    res.json({ message: 'تم تسجيل الخروج' });
  },

  async me(req, res) {
    try {
      const result = AuthService.getProfile(req.user.sub);
      res.json(result);
    } catch (e) {
      res.status(e.status || 500).json({ error: e.message || 'خطأ في الخادم' });
    }
  },
};

module.exports = AuthController;
