const jwt = require('jsonwebtoken');
const config = require('../config/default');

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    // Provide guest identity if no token present
    req.user = { id: 'guest', email: 'guest@pdftoolkit.ai', role: 'guest' };
    return next();
  }

  jwt.verify(token, config.jwtSecret, (err, user) => {
    if (err) {
      req.user = { id: 'guest', email: 'guest@pdftoolkit.ai', role: 'guest' };
    } else {
      req.user = user;
    }
    next();
  });
};

const requireAuth = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access denied. Authentication token required.' });
  }

  jwt.verify(token, config.jwtSecret, (err, user) => {
    if (err) return res.status(403).json({ error: 'Invalid or expired token.' });
    req.user = user;
    next();
  });
};

module.exports = {
  authenticateToken,
  requireAuth
};
