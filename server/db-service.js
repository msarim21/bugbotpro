'use strict';
  const fs = require('fs');
  const path = require('path');
  const bcrypt = require('bcryptjs');
  const { v4: uuidv4 } = require('uuid');

  const DB_DIR = path.join(process.cwd(), 'database');
  const DB_PATH = path.join(DB_DIR, 'webusers.json');

  function loadDB() {
    try {
      if (!fs.existsSync(DB_DIR)) fs.mkdirSync(DB_DIR, { recursive: true });
      if (!fs.existsSync(DB_PATH)) { fs.writeFileSync(DB_PATH, JSON.stringify({ users: [] }, null, 2)); return { users: [] }; }
      return JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
    } catch { return { users: [] }; }
  }

  function saveDB(data) {
    if (!fs.existsSync(DB_DIR)) fs.mkdirSync(DB_DIR, { recursive: true });
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
  }

  function findUserById(id) { return loadDB().users.find(u => u.id === String(id)) || null; }
  function findUserByEmail(email) { return loadDB().users.find(u => u.email.toLowerCase() === email.toLowerCase()) || null; }
  function findUserByEmailOrUsername(email, username) {
    return loadDB().users.find(u => u.email.toLowerCase() === email.toLowerCase() || u.username.toLowerCase() === username.toLowerCase()) || null;
  }

  function createUser(username, email, password) {
    const db = loadDB();
    const user = {
      id: uuidv4(), username, email,
      password: bcrypt.hashSync(password, 12),
      role: db.users.length === 0 ? 'admin' : 'user',
      banned: false, active: db.users.length === 0,
      createdAt: new Date().toISOString(), lastActive: new Date().toISOString(),
    };
    db.users.push(user); saveDB(db); return user;
  }

  function getAllUsers() { return loadDB().users.map(({ password, ...u }) => u); }

  function updateUser(id, updates) {
    const db = loadDB();
    const idx = db.users.findIndex(u => u.id === String(id));
    if (idx === -1) return null;
    db.users[idx] = { ...db.users[idx], ...updates }; saveDB(db);
    const { password, ...safe } = db.users[idx]; return safe;
  }

  function deleteUser(id) {
    const db = loadDB();
    const idx = db.users.findIndex(u => u.id === String(id));
    if (idx === -1) return false;
    db.users.splice(idx, 1); saveDB(db); return true;
  }

  function ensureAdminExists() {
    const adminEmail = process.env.ADMIN_EMAIL;
    const adminPassword = process.env.ADMIN_PASSWORD;
    if (!adminEmail || !adminPassword) return;
    if (findUserByEmail(adminEmail)) return;
    const user = createUser('admin', adminEmail, adminPassword);
    updateUser(user.id, { role: 'admin', active: true });
    console.log('[DB] Admin created:', adminEmail);
  }

  module.exports = { findUserById, findUserByEmail, findUserByEmailOrUsername, createUser, getAllUsers, updateUser, deleteUser, ensureAdminExists };
  