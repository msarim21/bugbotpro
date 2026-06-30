// server.js — Heroku web dyno entry point
// Starts HTTP keep-alive server, self-pings every 20 min, then spawns the bot.
// This lets the bot run on free/eco dynos without sleeping.

const http   = require('http');
const https  = require('https');
const { spawn } = require('child_process');

const PORT    = process.env.PORT || 3000;
const APP_URL = (process.env.APP_URL || '').replace(/\/$/, '');

// ─── 1. Keep-alive HTTP server ───────────────────────────────────────────────
const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('BugBotPro is alive! 🤖\n');
});
server.listen(PORT, () => {
  console.log('[keepalive] HTTP server on port', PORT);
});

// ─── 2. Self-ping every 20 minutes (prevents eco dyno sleep) ────────────────
function ping() {
  if (!APP_URL) return;
  const mod = APP_URL.startsWith('https') ? https : http;
  mod.get(APP_URL + '/ping', (res) => {
    console.log(`[keepalive] Ping → ${res.statusCode}`);
  }).on('error', (e) => {
    console.warn('[keepalive] Ping failed:', e.message);
  });
}
setInterval(ping, 20 * 60 * 1000); // every 20 minutes

// ─── 3. Start the Telegram bot ───────────────────────────────────────────────
console.log('[server] Starting cyber.js bot...');
const bot = spawn('node', ['cyber.js'], { stdio: 'inherit', env: process.env });

bot.on('exit', (code, signal) => {
  console.log(`[bot] Exited code=${code} signal=${signal}. Restarting in 5s...`);
  setTimeout(() => {
    const restarted = spawn('node', ['cyber.js'], { stdio: 'inherit', env: process.env });
    restarted.on('exit', (c) => { console.log('[bot] Restart exited', c); process.exit(c ?? 1); });
  }, 5000);
});

process.on('SIGTERM', () => { bot.kill('SIGTERM'); server.close(); });
process.on('SIGINT',  () => { bot.kill('SIGINT');  server.close(); });
