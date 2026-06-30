'use strict';
  const express = require('express');
  const router = express.Router();
  const fs = require('fs');
  const { protect, adminOnly } = require('../middleware/auth');
  const { getAllUsers, updateUser, deleteUser } = require('../db-service');

  router.use(protect, adminOnly);

  router.get('/users', (req, res) => {
    res.json({ users: getAllUsers() });
  });

  router.get('/stats', (req, res) => {
    const users = getAllUsers();
    let botAccess = { users: [] };
    try {
      const p = fs.existsSync('./database/access.json') ? './database/access.json' : './access.json';
      botAccess = JSON.parse(fs.readFileSync(p, 'utf8'));
    } catch(_) {}
    let settings = { freeMode: false };
    try {
      const p = fs.existsSync('./database/settings.json') ? './database/settings.json' : './settings.json';
      settings = JSON.parse(fs.readFileSync(p, 'utf8'));
    } catch(_) {}
    res.json({
      totalUsers: users.length,
      activeUsers: users.filter(u => u.active).length,
      bannedUsers: users.filter(u => u.banned).length,
      resellers: users.filter(u => u.role === 'reseller').length,
      admins: users.filter(u => u.role === 'admin').length,
      botAccessCount: Array.isArray(botAccess.users) ? botAccess.users.length : 0,
      freeMode: settings.freeMode || false,
    });
  });

  router.patch('/users/:id/activate', (req, res) => {
    const user = updateUser(req.params.id, { active: true });
    if (!user) return res.status(404).json({ error: 'User not found.' });
    res.json({ user });
  });

  router.patch('/users/:id/deactivate', (req, res) => {
    const user = updateUser(req.params.id, { active: false });
    if (!user) return res.status(404).json({ error: 'User not found.' });
    res.json({ user });
  });

  router.patch('/users/:id/ban', (req, res) => {
    const user = updateUser(req.params.id, { banned: true, active: false });
    if (!user) return res.status(404).json({ error: 'User not found.' });
    res.json({ user });
  });

  router.patch('/users/:id/unban', (req, res) => {
    const user = updateUser(req.params.id, { banned: false });
    if (!user) return res.status(404).json({ error: 'User not found.' });
    res.json({ user });
  });

  router.patch('/users/:id/make-reseller', (req, res) => {
    const user = updateUser(req.params.id, { role: 'reseller', active: true });
    if (!user) return res.status(404).json({ error: 'User not found.' });
    res.json({ user });
  });

  router.patch('/users/:id/make-user', (req, res) => {
    const user = updateUser(req.params.id, { role: 'user' });
    if (!user) return res.status(404).json({ error: 'User not found.' });
    res.json({ user });
  });

  router.delete('/users/:id', (req, res) => {
    if (req.params.id === req.user.id) return res.status(400).json({ error: 'Cannot delete yourself.' });
    const ok = deleteUser(req.params.id);
    if (!ok) return res.status(404).json({ error: 'User not found.' });
    res.json({ success: true });
  });

  module.exports = router;
  