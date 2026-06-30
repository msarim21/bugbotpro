'use strict';
  const fs = require('fs');
  const path = require('path');

  const DB_DIR = path.join(process.cwd(), 'database');
  const STORE_PATH = path.join(DB_DIR, 'wa_sessions.json');

  function loadStore() {
    try {
      if (!fs.existsSync(DB_DIR)) fs.mkdirSync(DB_DIR, { recursive: true });
      if (!fs.existsSync(STORE_PATH)) { fs.writeFileSync(STORE_PATH, '{}'); return {}; }
      return JSON.parse(fs.readFileSync(STORE_PATH, 'utf8'));
    } catch { return {}; }
  }

  function saveStore(data) {
    if (!fs.existsSync(DB_DIR)) fs.mkdirSync(DB_DIR, { recursive: true });
    fs.writeFileSync(STORE_PATH, JSON.stringify(data, null, 2));
  }

  // Returns { state, saveCreds } compatible with Baileys useMultiFileAuthState API
  function useJsonAuthState(userId) {
    const store = loadStore();
    const key = String(userId);

    let creds = store[key]?.creds || null;
    let keys  = store[key]?.keys  || {};

    function saveState() {
      const all = loadStore();
      all[key] = { creds, keys };
      saveStore(all);
    }

    const state = {
      creds: creds || {},
      keys: {
        get: (type, ids) => {
          const res = {};
          for (const id of ids) {
            const val = (keys[type] || {})[id];
            if (val !== undefined) res[id] = val;
          }
          return res;
        },
        set: (data) => {
          for (const [category, values] of Object.entries(data)) {
            if (!keys[category]) keys[category] = {};
            if (values) Object.assign(keys[category], values);
          }
          saveState();
        },
      },
    };

    async function saveCreds() {
      saveState();
    }

    function initCreds(newCreds) {
      creds = newCreds;
      saveState();
    }

    function clearSession() {
      const all = loadStore();
      delete all[key];
      saveStore(all);
    }

    function hasExistingSession() {
      const s = loadStore();
      return !!(s[key] && s[key].creds && s[key].creds.me);
    }

    return { state, saveCreds, initCreds, clearSession, hasExistingSession };
  }

  function listStoredSessions() {
    const store = loadStore();
    return Object.keys(store).filter(k => store[k]?.creds?.me);
  }

  module.exports = { useJsonAuthState, listStoredSessions };
  