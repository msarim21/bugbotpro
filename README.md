# 🦠 BugBotPro — Telegram WhatsApp Bot

A Telegram bot for managing WhatsApp sessions and sending automated messages. Built with **grammy** (Telegram) and **@ranstech/baileys** (WhatsApp).

---

## ✨ Features

- 🔐 **Multi-user WhatsApp pairing** — each user pairs their own number via QR/code
- 👥 **Premium / Reseller system** — owner-controlled access tiers
- 📢 **Group management** — bot approves/rejects group requests via owner
- ⏱️ **Cooldown system** — per-user rate limiting on commands
- 🔄 **Auto session restore** — reconnects WhatsApp sessions on restart
- 🛡️ **Free / Paid mode** — toggle via `settings.json`

---

## 🚀 Heroku Deploy

### One-click deploy

[![Deploy](https://www.herokucdn.com/deploy/button.svg)](https://heroku.com/deploy?template=https://github.com/msarim21/bugbotpro)

### Manual deploy

```bash
# Clone
git clone https://github.com/msarim21/bugbotpro
cd bugbotpro

# Login to Heroku
heroku login
heroku create your-app-name

# Set required environment variables
heroku config:set BOT_TOKEN="your_telegram_bot_token"
heroku config:set OWNER_ID="your_telegram_user_id"
heroku config:set CHANNEL_ID="@yourchannel"
heroku config:set GROUP_ID="@yourgroup"

# Deploy
git push heroku main

# Scale worker dyno (bot runs as background worker, not web server)
heroku ps:scale worker=1
heroku ps:scale web=0

# View logs
heroku logs --tail
```

---

## ⚙️ Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `BOT_TOKEN` | ✅ | Telegram bot token from [@BotFather](https://t.me/BotFather) |
| `OWNER_ID` | ✅ | Your Telegram user ID (get from [@userinfobot](https://t.me/userinfobot)) |
| `CHANNEL_ID` | ❌ | Your Telegram channel username e.g. `@mychannel` |
| `GROUP_ID` | ❌ | Your Telegram group username e.g. `@mygroup` |
| `THUMB_URL` | ❌ | Thumbnail image URL for bot messages |
| `GH_TOKEN` | ❌ | GitHub token for bot token validation (optional feature) |
| `GH_REPO` | ❌ | GitHub repo for token validation e.g. `owner/repo` |

---

## 🖥️ Local Setup

```bash
# Install dependencies
npm install

# Create .env file
cp .env.example .env
# Edit .env with your credentials

# Run bot
npm start
```

---

## 📁 Folder Structure

```
bugbotpro/
├── cyber.js         # Main bot file — Telegram + WhatsApp logic
├── config.js        # Configuration (reads from env vars)
├── control.js       # Access control — premium/reseller/owner checks
├── sumemek.js       # Cooldown management module
├── database/        # Persistent data (access list, settings)
│   ├── access.json  # Premium user list
│   └── settings.json# Bot settings (freeMode etc.)
├── storage/         # Runtime data (resellers, cooldowns)
├── sessions/        # WhatsApp session files (auto-created, NOT committed)
├── Procfile         # Heroku process definition
├── app.json         # Heroku one-click deploy manifest
└── package.json     # Node.js dependencies
```

---

## 🤖 Bot Commands

| Command | Access | Description |
|---------|--------|-------------|
| `/start` | All | Show main menu |
| `/reqpair <number>` | All | Pair WhatsApp number |
| `/bug <number>` | Premium | Send bug to WhatsApp number |
| `/cyber-group <invite>` | Premium | Send bug to WhatsApp group |
| `/setgroupsender` | Group | Set WhatsApp sender for this group |
| `/addpremium <id>` | Owner | Add premium user |
| `/delpremium <id>` | Owner | Remove premium user |
| `/addreseller <id>` | Owner | Add reseller |
| `/delreseller <id>` | Owner | Remove reseller |
| `/approvegroup <chatId>` | Owner | Approve bot in a group |
| `/rejectgroup <chatId>` | Owner | Remove bot from a group |
| `/approvedgroups` | Owner | List all approved groups |
| `/freemode` | Owner | Toggle free/paid mode |
| `/clearsender` | Owner | Clear all WhatsApp sessions |

---

## 🔒 Security Notes

- **Never commit your `BOT_TOKEN`** — always use environment variables
- WhatsApp session files in `sessions/` are excluded from git via `.gitignore`
- Runtime data files (`cooldown.json`, `pairCodes.json`) are also excluded

---

## 📞 Support

- Telegram: [@gamechanger2007](https://t.me/gamechanger2007)
- Channel: [@cybersecpro7](https://t.me/cybersecpro7)
