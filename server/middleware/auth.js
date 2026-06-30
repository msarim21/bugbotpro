'use strict';
  const jwt = require('jsonwebtoken');
  const { findUserById } = require('../db-service');
  const JWT_SECRET = process.env.JWT_SECRET || 'bugbotpro_change_this_secret';

  const protect = async (req, res, next) => {
    try {
      let token;
      if (req.headers.authorization && req.headers.authorization.startsWith('Bearer'))
        token = req.headers.authorization.split(' ')[1];
      if (!token) return res.status(401).json({ error: 'No token provided.' });
      const decoded = jwt.verify(token, JWT_SECRET);
      const user = findUserById(decoded.id);
      if (!user) return res.status(401).json({ error: 'User not found.' });
      if (user.banned) return res.status(403).json({ error: 'Account banned.' });
      req.user = user; next();
    } catch { return res.status(401).json({ error: 'Invalid or expired token.' }); }
  };

  const adminOnly = (req, res, next) => {
    if (req.user && req.user.role === 'admin') return next();
    return res.status(403).json({ error: 'Admin access required.' });
  };

  const generateToken = (id) => jwt.sign({ id: String(id) }, JWT_SECRET, { expiresIn: '7d' });
  module.exports = { protect, adminOnly, generateToken };
  