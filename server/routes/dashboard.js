'use strict';
  const express = require('express');
  const router = express.Router();
  const fs = require('fs');
  const { protect } = require('../middleware/auth');

  router.use(protect);

  router.get('/status', (req, res) => {
    const user = req.user;
    let botAccess = { users: [] };
    try { botAccess = JSON.parse(fs.readFileSync(fs.existsSync('./database/access.json') ? './database/access.json' : './access.json', 'utf8')); } catch(_) {}
    const hasBotAccess = user.role === 'admin' || (Array.isArray(botAccess.users) && botAccess.users.includes(String(user.id)));
    let pairCodes = {};
    try { pairCodes = JSON.parse(fs.readFileSync('./database/pairCodes.json', 'utf8')); } catch(_) {}
    const myNumbers = Object.keys(pairCodes).filter(k => pairCodes[k]?.userId === String(user.id));
    res.json({ user: { id: user.id, username: user.username, email: user.email, role: user.role, active: user.active }, hasBotAccess, pairedNumbers: myNumbers, totalPaired: myNumbers.length });
  });

  module.exports = router;
  