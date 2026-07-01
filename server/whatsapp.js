'use strict';
const {
  default: makeWASocket,
  DisconnectReason,
  fetchLatestBaileysVersion,
  initAuthCreds,
} = require('@whiskeysockets/baileys');
const { Boom } = require('@hapi/boom');
const pino = require('pino');
const { useJsonAuthState, listStoredSessions } = require('./session-store');

const logger = pino({ level: 'silent' });
const waClients = {};

function getStatus(userId) {
  const c = waClients[userId];
  if (!c) return { connected: false, status: 'disconnected', phone: null, qr: null, pairCode: null, pairCodeError: null };
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
  if (waClients[userId]?.sock) {
    try { waClients[userId].sock.end(); } catch (_) {}
    delete waClients[userId];
  }

  const { state, saveCreds, clearSession } = useJsonAuthState(userId);

  // Pair code always needs a completely fresh session.
  // A stale creds.registered=true causes requestPairingCode to throw silently.
  if (usePairCode && phone) {
    clearSession();
    state.creds = initAuthCreds();
    await saveCreds();
  } else if (!state.creds || !state.creds.noiseKey) {
    state.creds = initAuthCreds();
    await saveCreds();
  }

  // fetchLatestBaileysVersion handles its own errors and falls back to the
  // bundled safe version — do NOT wrap it with a custom timeout+fallback because
  // a wrong WA version causes an immediate "Connection Closed" from WA servers.
  const { version } = await fetchLatestBaileysVersion();
  console.log('[WA] version:', version.join('.'), 'userId:', userId);

  const sock = makeWASocket({
    version,
    logger,
    auth: state,
    printQRInTerminal: false,
    // Standard Ubuntu/Chrome browser string — custom names get flagged by WA
    browser: ['Ubuntu', 'Chrome', '20.0.04'],
    connectTimeoutMs: 60000,
    defaultQueryTimeoutMs: 60000,
    generateHighQualityLinkPreview: false,
    markOnlineOnConnect: false,
    keepAliveIntervalMs: 25000,
  });

  waClients[userId] = {
    sock,
    status: 'connecting',
    phone: null,
    qr: null,
    pairCode: null,
    pairCodeError: null,
  };

  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('connection.update', ({ connection, lastDisconnect, qr }) => {
    const client = waClients[userId];
    if (!client) return;

    if (qr && !usePairCode) {
      client.qr = qr;
      client.status = 'qr';
    }

    if (connection === 'open') {
      client.status = 'open';
      client.qr = null;
      client.pairCode = null;
      const jid = sock.user?.id || '';
      client.phone = jid.split(':')[0].split('@')[0];
      console.log('[WA] Connected:', userId, client.phone);
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
        client.status = 'reconnecting';
        console.log('[WA] Disconnected (code', statusCode, '), retrying in 5s:', userId);
        setTimeout(() => {
          if (waClients[userId]?.status === 'reconnecting') {
            connectUser(userId, { usePairCode: false }).catch(() => {});
          }
        }, 5000);
      }
    }
  });

  // ── PAIR CODE ─────────────────────────────────────────────────────────────
  // requestPairingCode internally awaits the WA noise handshake via
  // waitForConnection() — calling it right after makeWASocket is the correct
  // approach per Baileys docs. We await it here so the HTTP route returns the
  // code synchronously in its response (no polling needed).
  // 25 s timeout stays inside Heroku's 30 s H12 request limit.
  if (usePairCode && phone) {
    const cleanPhone = String(phone).replace(/[^0-9]/g, '');
    console.log('[WA] requestPairingCode for', cleanPhone, 'userId:', userId);
    try {
      const code = await Promise.race([
        sock.requestPairingCode(cleanPhone),
        new Promise((_, rej) =>
          setTimeout(() => rej(new Error('Pair code request timed out — please retry')), 25000)
        ),
      ]);
      if (waClients[userId]) {
        waClients[userId].pairCode = code;
        console.log('[WA] Pair code:', code, 'userId:', userId);
      }
    } catch (e) {
      console.error('[WA] Pair code error:', e.message, 'userId:', userId);
      if (waClients[userId]) {
        waClients[userId].pairCodeError = e.message;
        waClients[userId].status = 'error';
      }
      throw e;
    }
  }
  // ─────────────────────────────────────────────────────────────────────────

  return sock;
}

function disconnectUser(userId) {
  if (waClients[userId]?.sock) {
    try { waClients[userId].sock.end(); } catch (_) {}
  }
  delete waClients[userId];
  const { clearSession } = useJsonAuthState(userId);
  clearSession();
  console.log('[WA] Session cleared:', userId);
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

async function restoreAllSessions() {
  const userIds = listStoredSessions();
  console.log('[WA] Restoring', userIds.length, 'sessions...');
  for (const uid of userIds) {
    try {
      await connectUser(uid, { usePairCode: false });
      await new Promise(r => setTimeout(r, 2000));
    } catch (e) {
      console.error('[WA] Restore failed for', uid, ':', e.message);
    }
  }
}

module.exports = {
  connectUser, disconnectUser, sendWAMessage, blockJid,
  getStatus, getAllSessions, restoreAllSessions, waClients,
};
