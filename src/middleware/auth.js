const jwt = require('jsonwebtoken');

module.exports = function requireAuth(req, res, next) {
  const match = /^Bearer (\S+)$/i.exec(req.get('Authorization') || '');
  if (!match) return res.status(401).json({ error: 'Thiếu token' });
  try {
    req.user = jwt.verify(match[1], process.env.JWT_SECRET, { algorithms: ['HS256'] });
  } catch {
    return res.status(401).json({ error: 'Token không hợp lệ hoặc đã hết hạn' });
  }
  next();
};
