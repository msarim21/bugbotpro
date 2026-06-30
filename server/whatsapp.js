'use strict';
  const {
    default: makeWASocket,
    DisconnectReason,
    fetchLatestBaileysVersion,
    initAuthCreds,
    BufferJSON,
  } = require('@ranstech/baileys');
  const { Boom } = require('@hapi/boom');
  const pino = require('pino');
  const { useJsonAuthState, listStoredSessions } = require('./session-store');

  const logger = pino({ level: 'silent' });

  // In-memory map: userId -> { sock, status, qr, pairCode, phone }
  const waClients = {};

  function getStatus(userId) {
    const c = waClients[userId];
    if (!c) return { connected: false, status: 'disconnected', phone: null, qr: null, pairCode: null };
    return {
      connected: c.status === 'open',
      status: c.status || 'connecting',
      phone: c.phone || null,
      qr: c.qr || null,
      pairCode: c.pairCode || null,
      pairCodeError: c.pairCodeError || null,
    };
  }

  function getAllSessions() {
    return Object.entries(waClients).map(([uid, c]) => ({
      userId: uid, status: c.status, phone: c.phone, connected: c.status === 'open',
    }));
  }

  async function connectUser(userId, { usePairCode = false, phone = null } = {}) {
    // Disconnect existing sock if any
    if (waClients[userId]?.sock) {
      try { waClients[userId].sock.end(); } catch (_) {}
    }

    const { state, saveCreds, clearSession, hasExistingSession } = useJsonAuthState(userId);

    // If no stored session, initialize fresh creds
    if (!state.creds || !state.creds.noiseKey) {
      try {
        const freshCreds = initAuthCreds();
        state.creds = freshCreds;
        await saveCreds();
      } catch (_) {}
    }

    const { version } = await fetchLatestBaileysVersion();

    const sock = makeWASocket({
      version,
      logger,
      auth: state,
      printQRInTerminal: false,
      browser: ['BugBotPro', 'Chrome', '120.0'],
      connectTimeoutMs: 60000,
      defaultQueryTimeoutMs: 30000,
      generateHighQualityLinkPreview: false,
    });

    waClients[userId] = { sock, status: 'connecting', phone, qr: null, pairCode: null, pairCodeError: null };

    // Pair code mode — request after socket is ready
    if (usePairCode && phone && !hasExistingSession()) {
      setTimeout(async () => {
        try {
          const cleanPhone = String(phone).replace(/[^0-9]/g, '');
          const code = await sock.requestPairingCode(cleanPhone);
          if (waClients[userId]) {
            waClients[userId].pairCode = code;
            waClients[userId].pairCodeError = null;
          }
        } catch (e) {
          if (waClients[userId]) waClients[userId].pairCodeError = e.message;
        }
      }, 2000);
    }

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', ({ connection, lastDisconnect, qr }) => {
      if (!waClients[userId]) return;

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
        console.log('[WA] Connected:', userId, waClients[userId].phone);
      }

      if (connection === 'close') {
        const statusCode = lastDisconnect?.error
          ? new Boom(lastDisconnect.error).output?.statusCode : 0;
        const loggedOut = statusCode === DisconnectReason.loggedOut;

        if (loggedOut) {
          clearSession();
          delete waClients[userId];
          console.log('[WA] Logged out, session cleared:', userId);
        } else {
          if (waClients[userId]) waClients[userId].status = 'reconnecting';
          console.log('[WA] Disconnected, reconnecting in 5s:', userId);
          setTimeout(() => {
            if (!waClients[userId] || waClients[userId].status === 'reconnecting') {
              connectUser(userId, { usePairCode: false });
            }
          }, 5000);
        }
      }
    });

    return sock;
  }

  function disconnectUser(userId) {
    if (waClients[userId]?.sock) {
      try { waClients[userId].sock.end(); } catch (_) {}
    }
    delete waClients[userId];

    // Clear stored session
    const { clearSession } = useJsonAuthState(userId);
    clearSession();
    console.log('[WA] Session cleared for:', userId);
  }

  async function sendWAMessage(userId, jid, content) {
    const c = waClients[userId];
    if (!c || c.status !== 'open') throw new Error('WhatsApp not connected');
    return await c.sock.sendMessage(jid, content);
  }

  async function blockJid(userId, jid) {
    const c = waClients[userId];
    if (!c || c.status !== 'open') throw new Error('WhatsApp not connected');
    await c.sock.updateBlockStatus(jid, 'block');
  }

  // Restore all saved sessions on server startup
  async function restoreAllSessions() {
    const userIds = listStoredSessions();
    console.log('[WA] Restoring', userIds.length, 'saved sessions...');
    for (const uid of userIds) {
      try {
        await connectUser(uid, { usePairCode: false });
        await new Promise(r => setTimeout(r, 2000)); // stagger connections
      } catch (e) {
        console.error('[WA] Restore failed for', uid, e.message);
      }
    }
  }

  module.exports = {
    connectUser, disconnectUser, sendWAMessage, blockJid,
    getStatus, getAllSessions, restoreAllSessions, waClients,
  };
  