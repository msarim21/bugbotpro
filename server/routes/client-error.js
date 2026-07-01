const express = require('express');
  const router = express.Router();

  router.post('/log-client-error', (req, res) => {
    console.error('[CLIENT ERROR]', JSON.stringify(req.body, null, 2));
    res.json({ ok: true });
  });

  module.exports = router;
  