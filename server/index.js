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
  process.on('unhandledRejection', r => console.error('[REJECT]', r));

  app.use(compression());
  app.use(cors({ origin: true, credentials: true }));
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true }));

  const apiLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 300, standardHeaders: true, legacyHeaders: false });
  app.use('/api/', apiLimiter);

  // Routes
  app.use('/api/auth', require('./routes/auth'));
  app.use('/api/admin', require('./routes/admin'));
  app.use('/api/dashboard', require('./routes/dashboard'));
  app.use('/api/wa', require('./routes/whatsapp'));
  app.use('/api/access', require('./routes/access'));
  app.use('/api/log-client-error', require('./routes/client-error'));
  app.get('/api/health', (_, res) => res.json({ status: 'ok', time: new Date().toISOString() }));

  // Serve React build
  const clientBuild = path.join(__dirname, '..', 'client', 'dist');
  if (fs.existsSync(clientBuild)) {
    app.use(express.static(clientBuild, { maxAge: '1d' }));
    app.get('*', (req, res) => {
      if (!req.path.startsWith('/api')) res.sendFile(path.join(clientBuild, 'index.html'));
    });
  } else {
    app.get('/', (_, res) => res.send(`<!DOCTYPE html>
  <html><head><title>BugBotPro</title><style>
  body{background:#000;color:#0f0;font-family:monospace;display:flex;align-items:center;justify-content:center;height:100vh;margin:0}
  .loader{text-align:center}
  .dots{display:flex;gap:8px;justify-content:center;margin:20px 0}
  .dot{width:10px;height:10px;background:#0f0;border-radius:50%;animation:pulse 1s infinite}
  .dot:nth-child(2){animation-delay:.2s}
  .dot:nth-child(3){animation-delay:.4s}
  @keyframes pulse{0%,100%{opacity:.3}50%{opacity:1}}
  p{font-size:14px;opacity:.6}
  </style></head><body>
  <div class="loader"><h1>⚡ BugBotPro</h1><div class="dots"><div class="dot"></div><div class="dot"></div><div class="dot"></div></div><p>Starting up... dyno is waking up ⏰</p><p><small>Heroku Eco — first load may take 10-15 seconds</small></p></div>
  </body></html>`));
  }

  const { ensureAdminExists } = require('./db-service');
  ensureAdminExists();

  // Restore WA sessions
  const wa = require('./whatsapp');
  wa.restoreAllSessions().catch(e => console.error('[WA] Restore error:', e.message));

  // ─── Keep Alive: ping self every 10 min to prevent Eco dyno sleep ───
  const APP_URL = process.env.APP_URL || (process.env.HEROKU_APP_NAME ? `https://${process.env.HEROKU_APP_NAME}.herokuapp.com` : null);
  if (APP_URL) {
    setInterval(() => {
      fetch(`${APP_URL}/api/health`).then(() => console.log('[KEEPALIVE] Ping sent')).catch(() => {});
    }, 10 * 60 * 1000); // every 10 minutes
    console.log('[KEEPALIVE] Auto-ping enabled:', APP_URL);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[SERVER] BugBotPro Web Panel running on port ${PORT}`);
  });
  