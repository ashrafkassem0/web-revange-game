const { verifyToken } = require('../utils/token');

function authMiddleware(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'غير مصرح به' });
  }
  try {
    const token = header.split(' ')[1];
    const decoded = verifyToken(token);
    req.user = decoded;
    req.userId = decoded.sub;
    next();
  } catch {
    return res.status(401).json({ error: 'انتهت صلاحية الجلسة' });
  }
}

function optionalAuth(req, res, next) {
  const header = req.headers.authorization;
  if (header && header.startsWith('Bearer ')) {
    try {
      const token = header.split(' ')[1];
      req.user = verifyToken(token);
      req.userId = req.user.sub;
    } catch { /* not authenticated */ }
  }
  next();
}

module.exports = { authMiddleware, optionalAuth };
