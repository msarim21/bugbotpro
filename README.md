# ⚡ BugBotPro — WhatsApp Web Dashboard

  > **Telegram ki zaroorat nahi!** Website se seedha WhatsApp tools chalao.

  [![Deploy](https://www.herokucdn.com/deploy/button.svg)](https://heroku.com/deploy?template=https://github.com/msarim21/bugbotpro)

  ---

  ## 🌐 Features

  | Feature | Description |
  |---------|-------------|
  | 📱 **WhatsApp Pairing** | QR Code ya 8-digit Pair Code se connect karo |
  | 🔥 **Ban Tool** | Multi-vector ban — WA block + crash messages |
  | 💥 **Bug Sender** | WhatsApp crash/freeze karo (4 types) |
  | 📨 **Spam Sender** | Same message baar baar bhejo (max 100) |
  | ✉️ **Message Send** | Kisi bhi number pe directly message |
  | ⚙️ **Admin Panel** | Web users, premium, resellers manage karo |
  | 👑 **Premium System** | Access control — premium/reseller system |
  | 📱 **Multi-Session** | Multiple WhatsApp accounts ek saath |
  | 🔄 **Auto-Reconnect** | Heroku restart ke baad auto connect |

  ---

  ## 🚀 Heroku Pe Deploy Karo

  ### Step 1 — Heroku App Banao
  [heroku.com](https://heroku.com) → **New → Create new app**

  ### Step 2 — GitHub Connect Karo
  - **Deploy tab** → Deployment method → **GitHub**
  - `msarim21/bugbotpro` search karo → Connect
  - **Enable Automatic Deploys** ON karo

  ### Step 3 — Config Vars Set Karo ⚠️
  **Settings → Config Vars → Reveal Config Vars:**

  ```
  JWT_SECRET          = any-random-long-string
  ADMIN_EMAIL         = admin@yourmail.com
  ADMIN_PASSWORD      = yourpassword
  NPM_CONFIG_PRODUCTION = false
  ```

  ### Step 4 — Deploy
  **Deploy tab → Manual Deploy → Deploy Branch**

  Build ~3-5 minute leta hai (React build hota hai).

  ### Step 5 — Website Kholo
  ```
  https://your-app-name.herokuapp.com
  ```

  **Pehla signup karne wala automatically ADMIN ban jaata hai.**

  ---

  ## 🌐 Website Structure

  ```
  /           Landing Page
  /signup     Register (pehla user = admin)
  /login      Login
  /dashboard  Main Hub — WA status + quick links
  /pairing    WhatsApp Connect (QR / Pair Code)
  /tools      Attack Tools — Ban / Bug / Spam / Send
  /admin      Admin Panel (sirf admin ke liye)
  ```

  ---

  ## 📁 Project Structure

  ```
  bugbotpro/
  ├── server/
  │   ├── index.js          # Express server entry
  │   ├── whatsapp.js       # Baileys multi-user WA engine
  │   ├── session-store.js  # JSON session store (Heroku safe)
  │   ├── db-service.js     # Web users JSON database
  │   ├── middleware/
  │   │   └── auth.js       # JWT middleware
  │   └── routes/
  │       ├── auth.js       # Login / Signup / Me
  │       ├── whatsapp.js   # WA connect, ban, bug, spam, send
  │       └── access.js     # Premium, resellers, user management
  ├── client/               # React + Vite + TailwindCSS
  │   └── src/
  │       ├── pages/
  │       │   ├── Landing.jsx
  │       │   ├── Login.jsx
  │       │   ├── Signup.jsx
  │       │   ├── Dashboard.jsx
  │       │   ├── Pairing.jsx   # WhatsApp connect page
  │       │   ├── Tools.jsx     # Ban/Bug/Spam/Send
  │       │   └── Admin.jsx     # Admin panel
  │       ├── api.js            # Central API helper
  │       └── contexts/
  │           └── AuthContext.jsx
  ├── database/             # JSON storage (auto-created)
  │   ├── webusers.json     # Web panel users
  │   ├── wa_sessions.json  # WhatsApp sessions (auto)
  │   ├── access.json       # Premium users
  │   └── resellers.json    # Resellers
  ├── Procfile              # web: node server/index.js
  ├── app.json              # Heroku config
  └── package.json
  ```

  ---

  ## 🔧 Local Chalana (Development)

  ```bash
  # Clone karo
  git clone https://github.com/msarim21/bugbotpro
  cd bugbotpro

  # .env file banao
  cp .env.example .env
  # .env mein values fill karo

  # Server dependencies install
  npm install

  # Client build karo
  cd client && npm install --legacy-peer-deps && npm run build
  cd ..

  # Server start karo
  npm start
  ```

  Open karo: `http://localhost:3000`

  ---

  ## ⚙️ Environment Variables

  | Variable | Required | Description |
  |----------|----------|-------------|
  | `JWT_SECRET` | ✅ Yes | JWT token secret (koi bhi random string) |
  | `ADMIN_EMAIL` | No | Auto-create admin account |
  | `ADMIN_PASSWORD` | No | Admin account password |
  | `APP_URL` | No | Heroku URL (for keepalive) |
  | `NPM_CONFIG_PRODUCTION` | ✅ Heroku | `false` hona zaroori hai React build ke liye |

  ---

  ## 🛡️ API Endpoints

  ### Auth
  ```
  POST /api/auth/signup    Register
  POST /api/auth/login     Login
  GET  /api/auth/me        Profile
  ```

  ### WhatsApp
  ```
  GET  /api/wa/status           WA connection status
  POST /api/wa/connect/qr       QR code se connect
  POST /api/wa/connect/pair     Pair code se connect { phone }
  POST /api/wa/disconnect       Disconnect + session clear
  GET  /api/wa/poll             Live status polling
  POST /api/wa/send             Message bhejo { phone, message }
  POST /api/wa/ban              Ban karo { phone }
  POST /api/wa/bug              Bug bhejo { phone, type, count }
  POST /api/wa/spam             Spam karo { phone, message, count }
  GET  /api/wa/sessions         All sessions (admin)
  DEL  /api/wa/sessions/:uid    Kill session (admin)
  ```

  ### Access Management (Admin)
  ```
  GET  /api/access/users         Web panel users
  GET  /api/access/premium       Premium users list
  POST /api/access/premium       Premium add { userId }
  DEL  /api/access/premium/:id   Premium remove
  GET  /api/access/resellers     Resellers list
  POST /api/access/resellers     Reseller add { userId }
  DEL  /api/access/resellers/:id Reseller remove
  PUT  /api/access/user/:id/role Role change { role }
  DEL  /api/access/user/:id      User delete
  ```

  ---

  ## 💡 Notes

  - **Heroku Ephemeral FS:** WhatsApp sessions `database/wa_sessions.json` mein save hoti hain — dyno restart ke baad auto-reconnect hota hai
  - **First User = Admin:** Pehla signup karne wala automatically admin ban jaata hai
  - **Multi-user:** Har web user ka alag WhatsApp session hota hai
  - **Bug Types:** `basic` | `crash` | `freeze` | `heavy`

  ---

  ## 📞 Stack

  - **Backend:** Node.js + Express 4
  - **WhatsApp:** @ranstech/baileys
  - **Frontend:** React 18 + Vite + TailwindCSS
  - **Auth:** JWT (jsonwebtoken)
  - **Storage:** JSON files (no MongoDB/PostgreSQL needed)
  - **Deploy:** Heroku (eco dyno)

  ---

  *Made with ⚡ — No Telegram needed*
  