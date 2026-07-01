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
  if (waClients[userId]?.sock) {
    try { waClients[userId].sock.end(); } catch (_) {}
    delete waClients[userId];
  }

  const { state, saveCreds, clearSession, hasExistingSession } = useJsonAuthState(userId);

  if (!state.creds || !state.creds.noiseKey) {
    try {
      state.creds = initAuthCreds();
      await saveCreds();
    } catch (_) {}
  }

  const { version } = await fetchLatestBaileysVersion();

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

  // ─── PAIR CODE ───────────────────────────────────────────────────────────────
  // Must be called right after makeWASocket — Baileys internally waits for the
  // WA-server handshake before sending the pair-code IQ, so no setTimeout needed.
  // This is the ONLY correct place to call it; calling it inside connection.update
  // is too late and the request races against the QR exchange.
  if (usePairCode && phone && !hasExistingSession()) {
    const cleanPhone = String(phone).replace(/[^0-9]/g, '');
    console.log('[WA] Requesting pair code for phone:', cleanPhone, 'userId:', userId);

    sock.requestPairingCode(cleanPhone)
      .then(code => {
        if (waClients[userId]) {
          waClients[userId].pairCode = code;
          waClients[userId].pairCodeError = null;
          console.log('[WA] Pair code generated:', code, 'for userId:', userId);
        }
      })
      .catch(err => {
        console.error('[WA] Pair code failed for', userId, ':', err.message);
        if (waClients[userId]) {
          waClients[userId].pairCodeError = err.message;
        }
      });
  }
  // ─────────────────────────────────────────────────────────────────────────────

  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('connection.update', ({ connection, lastDisconnect, qr }) => {
    const client = waClients[userId];
    if (!client) return;

    // In pair-code mode we never display the QR — just keep status as 'connecting'
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
        console.log('[WA] Disconnected (code', statusCode, '), retrying in 5s for:', userId);
        setTimeout(() => {
          if (waClients[userId]?.status === 'reconnecting') {
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
