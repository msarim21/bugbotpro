'use strict';
  require('dotenv').config();
  const express = require('express');
  const cors = require('cors');
  const path = require('path');
  const compression = require('compression');
  const rateLimit = require('express-rate-limit');
  const fs = require('fs');

  const app = express();
  const PORT = process.env.PORT || 3000;

  process.on('uncaughtException', err => console.error('[CRASH]', err.message, err.stack));
  process.on('unhandledRejection', (r) => console.error('[REJECT]', r));

  app.use(compression());
  app.use(cors({ origin: true, credentials: true }));
  app.use(express.json({ limit: '5mb' }));
  app.use(express.urlencoded({ extended: true }));

  app.use('/api/', rateLimit({ windowMs: 15 * 60 * 1000, max: 200, standardHeaders: true, legacyHeaders: false }));

  app.use('/api/auth', require('./routes/auth'));
  app.use('/api/admin', require('./routes/admin'));
  app.use('/api/dashboard', require('./routes/dashboard'));
  app.get('/api/health', (_, res) => res.json({ status: 'ok', time: new Date().toISOString() }));

  const clientBuild = path.join(__dirname, '..', 'client', 'dist');
  if (fs.existsSync(clientBuild)) {
    app.use(express.static(clientBuild, { maxAge: '1d' }));
    app.get('*', (req, res) => {
      if (!req.path.startsWith('/api')) {
        res.sendFile(path.join(clientBuild, 'index.html'));
      }
    });
  } else {
    app.get('/', (_, res) => res.json({ message: 'BugBotPro API — web panel build not found', status: 'api-only' }));
  }

  const { ensureAdminExists } = require('./db-service');
  ensureAdminExists();

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[SERVER] BugBotPro Web Panel running on port ${PORT}`);
  });
  