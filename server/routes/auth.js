'use strict';
  const express = require('express');
  const router = express.Router();
  const bcrypt = require('bcryptjs');
  const { findUserByEmailOrUsername, findUserByEmail, createUser, updateUser } = require('../db-service');
  const { generateToken, protect } = require('../middleware/auth');

  router.post('/signup', async (req, res) => {
    try {
      const { username, email, password } = req.body;
      if (!username || !email || !password) return res.status(400).json({ error: 'All fields required.' });
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.status(400).json({ error: 'Invalid email.' });
      if (username.length < 3 || username.length > 30) return res.status(400).json({ error: 'Username 3-30 chars.' });
      if (password.length < 6) return res.status(400).json({ error: 'Password min 6 chars.' });
      if (findUserByEmailOrUsername(email, username)) return res.status(409).json({ error: 'Email or username taken.' });
      const user = createUser(username, email, password);
      res.status(201).json({ token: generateToken(user.id), user: { id: user.id, username: user.username, email: user.email, role: user.role, active: user.active } });
    } catch (err) { console.error('Signup:', err); res.status(500).json({ error: 'Server error.' }); }
  });

  router.post('/login', async (req, res) => {
    try {
      const { email, password } = req.body;
      if (!email || !password) return res.status(400).json({ error: 'Email and password required.' });
      const user = findUserByEmail(email);
      if (!user || !bcrypt.compareSync(password, user.password)) return res.status(401).json({ error: 'Invalid credentials.' });
      if (user.banned) return res.status(403).json({ error: 'Account banned.' });
      updateUser(user.id, { lastActive: new Date().toISOString() });
      res.json({ token: generateToken(user.id), user: { id: user.id, username: user.username, email: user.email, role: user.role, active: user.active } });
    } catch (err) { console.error('Login:', err); res.status(500).json({ error: 'Server error.' }); }
  });

  router.get('/me', protect, (req, res) => {
    const { password, ...user } = req.user;
    res.json({ user });
  });

  module.exports = router;
  