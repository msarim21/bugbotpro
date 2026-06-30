const BASE = '/api';

  function getToken() { return localStorage.getItem('bbp_token'); }

  async function req(method, path, body) {
    const opts = {
      method,
      headers: { 'Content-Type': 'application/json', ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}) },
    };
    if (body) opts.body = JSON.stringify(body);
    const res = await fetch(BASE + path, opts);
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || data.message || `HTTP ${res.status}`);
    return data;
  }

  export const api = {
    // Auth
    login: (b) => req('POST', '/auth/login', b),
    signup: (b) => req('POST', '/auth/signup', b),
    me: () => req('GET', '/auth/me'),

    // WA
    waStatus: () => req('GET', '/wa/status'),
    waPoll: () => req('GET', '/wa/poll'),
    waConnectQR: () => req('POST', '/wa/connect/qr'),
    waConnectPair: (phone) => req('POST', '/wa/connect/pair', { phone }),
    waDisconnect: () => req('POST', '/wa/disconnect'),
    waSend: (phone, message) => req('POST', '/wa/send', { phone, message }),
    waBan: (phone) => req('POST', '/wa/ban', { phone }),
    waBug: (phone, type, count) => req('POST', '/wa/bug', { phone, type, count }),
    waSpam: (phone, message, count) => req('POST', '/wa/spam', { phone, message, count }),
    waSessions: () => req('GET', '/wa/sessions'),
    waKillSession: (userId) => req('DELETE', `/wa/sessions/${userId}`),

    // Access
    stats: () => req('GET', '/access/stats'),
    webUsers: () => req('GET', '/access/users'),
    premiumList: () => req('GET', '/access/premium'),
    addPremium: (userId) => req('POST', '/access/premium', { userId }),
    removePremium: (userId) => req('DELETE', `/access/premium/${userId}`),
    resellerList: () => req('GET', '/access/resellers'),
    addReseller: (userId) => req('POST', '/access/resellers', { userId }),
    removeReseller: (userId) => req('DELETE', `/access/resellers/${userId}`),
    changeRole: (id, role) => req('PUT', `/access/user/${id}/role`, { role }),
    deleteUser: (id) => req('DELETE', `/access/user/${id}`),
  };
  