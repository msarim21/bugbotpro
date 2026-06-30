'use strict';
  const express = require('express');
  const router = express.Router();
  const fs = require('fs');
  const { protect, adminOnly } = require('../middleware/auth');
  const { getAllUsers, updateUser, deleteUser } = require('../db-service');

  router.use(protect, adminOnly);

  router.get('/users', (_, res) => res.json({ users: getAllUsers() }));

  router.get('/stats', (_, res) => {
    const users = getAllUsers();
    let botAccess = { users: [] };
    let settings = { freeMode: false };
    try { botAccess = JSON.parse(fs.readFileSync(fs.existsSync('./database/access.json') ? './database/access.json' : './access.json', 'utf8')); } catch(_) {}
    try { settings = JSON.parse(fs.readFileSync(fs.existsSync('./database/settings.json') ? './database/settings.json' : './settings.json', 'utf8')); } catch(_) {}
    res.json({
      totalUsers: users.length, activeUsers: users.filter(u => u.active).length,
      bannedUsers: users.filter(u => u.banned).length, resellers: users.filter(u => u.role === 'reseller').length,
      admins: users.filter(u => u.role === 'admin').length,
      botAccessCount: Array.isArray(botAccess.users) ? botAccess.users.length : 0,
      freeMode: settings.freeMode || false,
    });
  });

  router.patch('/users/:id/activate', (req, res) => { const u = updateUser(req.params.id, { active: true }); u ? res.json({ user: u }) : res.status(404).json({ error: 'Not found.' }); });
  router.patch('/users/:id/deactivate', (req, res) => { const u = updateUser(req.params.id, { active: false }); u ? res.json({ user: u }) : res.status(404).json({ error: 'Not found.' }); });
  router.patch('/users/:id/ban', (req, res) => { const u = updateUser(req.params.id, { banned: true, active: false }); u ? res.json({ user: u }) : res.status(404).json({ error: 'Not found.' }); });
  router.patch('/users/:id/unban', (req, res) => { const u = updateUser(req.params.id, { banned: false }); u ? res.json({ user: u }) : res.status(404).json({ error: 'Not found.' }); });
  router.patch('/users/:id/make-reseller', (req, res) => { const u = updateUser(req.params.id, { role: 'reseller', active: true }); u ? res.json({ user: u }) : res.status(404).json({ error: 'Not found.' }); });
  router.patch('/users/:id/make-user', (req, res) => { const u = updateUser(req.params.id, { role: 'user' }); u ? res.json({ user: u }) : res.status(404).json({ error: 'Not found.' }); });
  router.delete('/users/:id', (req, res) => {
    if (req.params.id === req.user.id) return res.status(400).json({ error: 'Cannot delete yourself.' });
    deleteUser(req.params.id) ? res.json({ success: true }) : res.status(404).json({ error: 'Not found.' });
  });

  module.exports = router;
  