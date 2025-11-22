const jwt = require('jsonwebtoken');

module.exports = function auth(requiredAdmin = false) {
  return (req, res, next) => {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;
    if (!token) return res.status(401).json({ error: 'Token mancante' });
    try {
      const payload = jwt.verify(token, process.env.JWT_SECRET || 'devsecret');
      req.user = payload;
      if (requiredAdmin && !payload.isAdmin) return res.status(403).json({ error: 'Admin richiesto' });
      next();
    } catch (e) {
      return res.status(401).json({ error: 'Token invalido' });
    }
  };
}