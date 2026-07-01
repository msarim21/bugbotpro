'use strict';
const {
  default: makeWASocket,
  DisconnectReason,
  fetchLatestBaileysVersion,
  initAuthCreds,
  Browsers,
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
  // Kill any existing socket
  if (waClients[userId]?.sock) {
    try { waClients[userId].sock.end(); } catch (_) {}
    delete waClients[userId];
  }

  const { state, saveCreds, clearSession } = useJsonAuthState(userId);

  // Pair code always starts with a clean slate so creds.registered is never
  // left over from a previous failed attempt (which would make requestPairingCode throw).
  if (usePairCode && phone) {
    clearSession();
    state.creds = initAuthCreds();
    await saveCreds();
  } else if (!state.creds || !state.creds.noiseKey) {
    state.creds = initAuthCreds();
    await saveCreds();
  }

  // fetchLatestBaileysVersion already falls back to a bundled safe version on
  // network failure — do NOT add a custom timeout+fallback here, because a
  // wrong version causes WA to immediately close the connection.
  const { version } = await fetchLatestBaileysVersion();
  console.log('[WA] Using WA version:', version.join('.'));

  const sock = makeWASocket({
    version,
    logger,
    auth: state,
    printQRInTerminal: false,
    // Standard Ubuntu Chrome user-agent — custom names get flagged by WA
    browser: Browsers.ubuntu('Chrome'),
    connectTimeoutMs: 60000,
    defaultQueryTimeoutMs: 60000,
    generateHighQualityLinkPreview: false,
    markOnlineOnConnect: false,
    // Prevent WA from seeing us as a bot by using the same keep-alive as WA Web
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

    // In QR mode only — suppress QR when doing pair code
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
  // requestPairingCode internally waits for the WA noise handshake via
  // waitForConnection(), so calling it right after makeWASocket is correct.
  // We await it so the route gets the code synchronously in the response.
  if (usePairCode && phone) {
    const cleanPhone = String(phone).replace(/[^0-9]/g, '');
    console.log('[WA] Requesting pair code for', cleanPhone, '— userId:', userId);
    try {
      // 25s keeps us within Heroku's 30s HTTP timeout
      const code = await Promise.race([
        sock.requestPairingCode(cleanPhone),
        new Promise((_, rej) =>
          setTimeout(() => rej(new Error('Pair code request timed out — please retry')), 25000)
        ),
      ]);
      if (waClients[userId]) {
        waClients[userId].pairCode = code;
        console.log('[WA] Pair code:', code, '— userId:', userId);
      }
    } catch (e) {
      console.error('[WA] Pair code error:', e.message, '— userId:', userId);
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
