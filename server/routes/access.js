'use strict';
  const express = require('express');
  const router = express.Router();
  const fs = require('fs');
  const path = require('path');
  const { protect } = require('../middleware/auth');
  const { findAllUsers, findUserById, updateUser, deleteUser } = require('../db-service');

  function loadJson(file, def) {
    const p1 = path.join(process.cwd(), 'database', file);
    const p2 = path.join(process.cwd(), file);
    try { if (fs.existsSync(p1)) return JSON.parse(fs.readFileSync(p1, 'utf8')); } catch(_){}
    try { if (fs.existsSync(p2)) return JSON.parse(fs.readFileSync(p2, 'utf8')); } catch(_){}
    return def;
  }
  function saveJson(file, data) {
    const dir = path.join(process.cwd(), 'database');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, file), JSON.stringify(data, null, 2));
  }

  // GET /api/access/users — web panel users (admin)
  router.get('/users', protect, (req, res) => {
    if (req.user.role !== 'admin') return res.status(403).json({ ok: false, error: 'Admin only' });
    const users = findAllUsers();
    res.json({ ok: true, users });
  });

  // GET /api/access/premium — premium access list
  router.get('/premium', protect, (req, res) => {
    if (req.user.role !== 'admin') return res.status(403).json({ ok: false, error: 'Admin only' });
    const db = loadJson('access.json', { users: [] });
    res.json({ ok: true, users: db.users || [] });
  });

  // POST /api/access/premium — add premium
  router.post('/premium', protect, async (req, res) => {
    if (req.user.role !== 'admin') return res.status(403).json({ ok: false, error: 'Admin only' });
    const { userId } = req.body;
    if (!userId) return res.status(400).json({ ok: false, error: 'userId required' });
    const db = loadJson('access.json', { users: [] });
    if (!db.users.includes(String(userId))) db.users.push(String(userId));
    saveJson('access.json', db);
    res.json({ ok: true, message: 'Premium access granted' });
  });

  // DELETE /api/access/premium/:userId — remove premium
  router.delete('/premium/:userId', protect, (req, res) => {
    if (req.user.role !== 'admin') return res.status(403).json({ ok: false, error: 'Admin only' });
    const db = loadJson('access.json', { users: [] });
    db.users = db.users.filter(u => u !== String(req.params.userId));
    saveJson('access.json', db);
    res.json({ ok: true, message: 'Premium access removed' });
  });

  // GET /api/access/resellers — reseller list
  router.get('/resellers', protect, (req, res) => {
    if (req.user.role !== 'admin') return res.status(403).json({ ok: false, error: 'Admin only' });
    const db = loadJson('resellers.json', { users: [] });
    res.json({ ok: true, users: db.users || [] });
  });

  // POST /api/access/resellers — add reseller
  router.post('/resellers', protect, (req, res) => {
    if (req.user.role !== 'admin') return res.status(403).json({ ok: false, error: 'Admin only' });
    const { userId } = req.body;
    if (!userId) return res.status(400).json({ ok: false, error: 'userId required' });
    const db = loadJson('resellers.json', { users: [] });
    if (!db.users.includes(String(userId))) db.users.push(String(userId));
    saveJson('resellers.json', db);
    res.json({ ok: true, message: 'Reseller added' });
  });

  // DELETE /api/access/resellers/:userId — remove reseller
  router.delete('/resellers/:userId', protect, (req, res) => {
    if (req.user.role !== 'admin') return res.status(403).json({ ok: false, error: 'Admin only' });
    const db = loadJson('resellers.json', { users: [] });
    db.users = db.users.filter(u => u !== String(req.params.userId));
    saveJson('resellers.json', db);
    res.json({ ok: true, message: 'Reseller removed' });
  });

  // PUT /api/access/user/:id/role — change web user role
  router.put('/user/:id/role', protect, async (req, res) => {
    if (req.user.role !== 'admin') return res.status(403).json({ ok: false, error: 'Admin only' });
    const { role } = req.body;
    if (!['admin','user'].includes(role)) return res.status(400).json({ ok: false, error: 'Invalid role' });
    const updated = updateUser(req.params.id, { role });
    if (!updated) return res.status(404).json({ ok: false, error: 'User not found' });
    res.json({ ok: true, user: updated });
  });

  // DELETE /api/access/user/:id — delete web user
  router.delete('/user/:id', protect, (req, res) => {
    if (req.user.role !== 'admin') return res.status(403).json({ ok: false, error: 'Admin only' });
    if (req.params.id === req.user.id) return res.status(400).json({ ok: false, error: 'Cannot delete yourself' });
    deleteUser(req.params.id);
    res.json({ ok: true, message: 'User deleted' });
  });

  // GET /api/access/stats — dashboard stats
  router.get('/stats', protect, (req, res) => {
    const premiumDb = loadJson('access.json', { users: [] });
    const resellersDb = loadJson('resellers.json', { users: [] });
    const webUsers = findAllUsers();
    res.json({
      ok: true,
      stats: {
        premiumCount: (premiumDb.users || []).length,
        resellerCount: (resellersDb.users || []).length,
        webUserCount: webUsers.length,
      }
    });
  });

  module.exports = router;
  