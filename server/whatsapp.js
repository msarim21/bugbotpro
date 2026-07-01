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
  // Kill existing socket
  if (waClients[userId]?.sock) {
    try { waClients[userId].sock.end(); } catch (_) {}
    delete waClients[userId];
  }

  const { state, saveCreds, clearSession } = useJsonAuthState(userId);

  // If requesting a pair code — always start with a clean session
  // so Baileys never sees a stale creds.registered = true
  if (usePairCode && phone) {
    clearSession();
    state.creds = initAuthCreds();
    await saveCreds();
  } else if (!state.creds || !state.creds.noiseKey) {
    state.creds = initAuthCreds();
    await saveCreds();
  }

  // Fetch WA version with fallback so Heroku network timeouts don't block startup
  let version;
  try {
    const result = await Promise.race([
      fetchLatestBaileysVersion(),
      new Promise((_, rej) => setTimeout(() => rej(new Error('version fetch timeout')), 8000)),
    ]);
    version = result.version;
  } catch (_) {
    version = [2, 3000, 1015920675]; // safe fallback
  }

  const sock = makeWASocket({
    version,
    logger,
    auth: state,
    printQRInTerminal: false,
    browser: ['BugBotPro', 'Chrome', '122.0'],
    connectTimeoutMs: 60000,
    defaultQueryTimeoutMs: 60000,
    generateHighQualityLinkPreview: false,
    markOnlineOnConnect: false,
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

    // QR mode only — in pair code mode we suppress the QR
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
      const code = lastDisconnect?.error
        ? new Boom(lastDisconnect.error).output?.statusCode : 0;
      const loggedOut = code === DisconnectReason.loggedOut;

      if (loggedOut) {
        clearSession();
        delete waClients[userId];
        console.log('[WA] Logged out, session cleared:', userId);
      } else {
        client.status = 'reconnecting';
        console.log('[WA] Disconnected (code', code, '), retrying in 5s:', userId);
        setTimeout(() => {
          if (waClients[userId]?.status === 'reconnecting') {
            connectUser(userId, { usePairCode: false });
          }
        }, 5000);
      }
    }
  });

  // ── PAIR CODE ─────────────────────────────────────────────────────────────
  // Await requestPairingCode here (not fire-and-forget).
  // Baileys internally waits for the noise handshake before sending the IQ,
  // so we don't need any explicit delay or event-handler trick.
  // A 25-second timeout keeps us within Heroku's 30-second HTTP limit.
  if (usePairCode && phone) {
    const cleanPhone = String(phone).replace(/[^0-9]/g, '');
    console.log('[WA] requestPairingCode for', cleanPhone, userId);
    try {
      const code = await Promise.race([
        sock.requestPairingCode(cleanPhone),
        new Promise((_, rej) =>
          setTimeout(() => rej(new Error('Pair code timed out — check phone number and retry')), 25000)
        ),
      ]);
      if (waClients[userId]) {
        waClients[userId].pairCode = code;
        console.log('[WA] Pair code ready:', code, 'for', userId);
      }
    } catch (e) {
      console.error('[WA] Pair code error for', userId, ':', e.message);
      if (waClients[userId]) {
        waClients[userId].pairCodeError = e.message;
        waClients[userId].status = 'error';
      }
      throw e; // bubble up so the route can return a proper error
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

async function restoreAllSessions() {
  const userIds = listStoredSessions();
  console.log('[WA] Restoring', userIds.length, 'saved sessions...');
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
