'use strict';
  const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion, makeInMemoryStore } = require('@ranstech/baileys');
  const { Boom } = require('@hapi/boom');
  const pino = require('pino');
  const path = require('path');
  const fs = require('fs');

  const logger = pino({ level: 'silent' });
  const SESSION_DIR = path.join(process.cwd(), 'database', 'sessions');
  if (!fs.existsSync(SESSION_DIR)) fs.mkdirSync(SESSION_DIR, { recursive: true });

  // In-memory WA clients map: userId -> { sock, status, qr, pairCode, phone }
  const waClients = {};

  function getSessionPath(userId) {
    return path.join(SESSION_DIR, `user_${userId}`);
  }

  function getStatus(userId) {
    const c = waClients[userId];
    if (!c) return { connected: false, status: 'disconnected', phone: null };
    return { connected: c.status === 'open', status: c.status || 'connecting', phone: c.phone || null, qr: c.qr || null, pairCode: c.pairCode || null };
  }

  function getAllSessions() {
    return Object.entries(waClients).map(([uid, c]) => ({
      userId: uid, status: c.status, phone: c.phone, connected: c.status === 'open'
    }));
  }

  async function connectUser(userId, { usePairCode = false, phone = null } = {}) {
    // Disconnect existing
    if (waClients[userId]?.sock) {
      try { waClients[userId].sock.end(); } catch(_) {}
    }

    const sessionPath = getSessionPath(userId);
    const { state, saveCreds } = await useMultiFileAuthState(sessionPath);
    const { version } = await fetchLatestBaileysVersion();

    const sock = makeWASocket({
      version,
      logger,
      auth: state,
      printQRInTerminal: false,
      browser: ['BugBotPro', 'Chrome', '120.0'],
      connectTimeoutMs: 60000,
      defaultQueryTimeoutMs: 30000,
    });

    waClients[userId] = { sock, status: 'connecting', phone, qr: null, pairCode: null };

    // Pair code mode
    if (usePairCode && phone && !sock.authState.creds.registered) {
      await new Promise(r => setTimeout(r, 1500));
      try {
        const code = await sock.requestPairingCode(phone.replace(/[^0-9]/g, ''));
        waClients[userId].pairCode = code;
      } catch(e) {
        waClients[userId].pairCode = null;
        waClients[userId].pairCodeError = e.message;
      }
    }

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', ({ connection, lastDisconnect, qr }) => {
      if (qr) {
        waClients[userId].qr = qr;
        waClients[userId].status = 'qr';
      }
      if (connection === 'open') {
        waClients[userId].status = 'open';
        waClients[userId].qr = null;
        waClients[userId].pairCode = null;
        const jid = sock.user?.id || '';
        waClients[userId].phone = jid.split(':')[0].split('@')[0];
      }
      if (connection === 'close') {
        const code = lastDisconnect?.error ? new Boom(lastDisconnect.error).output?.statusCode : 0;
        const shouldReconnect = code !== DisconnectReason.loggedOut;
        waClients[userId].status = 'disconnected';
        if (shouldReconnect) {
          setTimeout(() => connectUser(userId, { usePairCode: false }), 3000);
        } else {
          delete waClients[userId];
        }
      }
    });

    return sock;
  }

  function disconnectUser(userId) {
    if (waClients[userId]?.sock) {
      try { waClients[userId].sock.end(); } catch(_) {}
      delete waClients[userId];
    }
    // Clear session files
    const sessionPath = getSessionPath(userId);
    if (fs.existsSync(sessionPath)) fs.rmSync(sessionPath, { recursive: true, force: true });
  }

  async function sendWAMessage(userId, jid, content) {
    const c = waClients[userId];
    if (!c || c.status !== 'open') throw new Error('WhatsApp not connected');
    await c.sock.sendMessage(jid, content);
  }

  async function blockJid(userId, jid) {
    const c = waClients[userId];
    if (!c || c.status !== 'open') throw new Error('WhatsApp not connected');
    await c.sock.updateBlockStatus(jid, 'block');
  }

  async function reportJid(userId, jid) {
    const c = waClients[userId];
    if (!c || c.status !== 'open') throw new Error('WhatsApp not connected');
    await c.sock.sendMessage(jid, { text: 'report' });
  }

  // Auto-reconnect existing sessions on startup
  async function restoreAllSessions() {
    if (!fs.existsSync(SESSION_DIR)) return;
    const dirs = fs.readdirSync(SESSION_DIR).filter(d => d.startsWith('user_'));
    for (const dir of dirs) {
      const userId = dir.replace('user_', '');
      try {
        await connectUser(userId, { usePairCode: false });
      } catch(e) {
        console.error('[WA] Failed to restore session for', userId, e.message);
      }
    }
  }

  module.exports = { connectUser, disconnectUser, sendWAMessage, blockJid, reportJid, getStatus, getAllSessions, restoreAllSessions, waClients };
  