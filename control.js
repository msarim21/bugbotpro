const fs = require("fs");
  const config = require("./config");

  function getDB() {
    try {
      if (fs.existsSync("./storage/resellers.json")) return JSON.parse(fs.readFileSync("./storage/resellers.json"));
      if (fs.existsSync("./resellers.json"))         return JSON.parse(fs.readFileSync("./resellers.json"));
    } catch (_) {}
    return { users: [] };
  }

  function isOwner(userId) {
    if (userId === undefined || userId === null) return false;
    return String(userId) === String(config.ownerId);
  }

  function isReseller(userId) {
    if (userId === undefined || userId === null) return false;
    const db = getDB();
    return db.users.includes(String(userId));
  }

  // READ FREE MODE
  function isFreeMode() {
    let settingsPath = fs.existsSync("./database/settings.json") ? "./database/settings.json"
      : fs.existsSync("./settings.json") ? "./settings.json" : null;
    if (!settingsPath) return false;
    try {
      const settings = JSON.parse(fs.readFileSync(settingsPath, "utf8"));
      return settings.freeMode === true;
    } catch (_) { return false; }
  }

  // CEK AKSES
  function hasAccess(userId) {
    if (userId === undefined || userId === null) return false;

    let _sp = fs.existsSync("./database/settings.json") ? "./database/settings.json"
      : fs.existsSync("./settings.json") ? "./settings.json" : null;
    const settings = _sp ? JSON.parse(fs.readFileSync(_sp, "utf8")) : { freeMode: false };

    if (settings.freeMode) return true;
    if (isOwner(userId)) return true;
    if (isReseller(userId)) return true;

    let _ap = fs.existsSync("./database/access.json") ? "./database/access.json"
      : fs.existsSync("./storage/access.json") ? "./storage/access.json"
      : fs.existsSync("./access.json") ? "./access.json" : null;
    let accessDb = _ap ? JSON.parse(fs.readFileSync(_ap, "utf8")) : { users: [] };

    const users = Array.isArray(accessDb.users) ? accessDb.users : [];
    if (users.includes(String(userId))) return true;

    return false;
  }

  function addReseller(targetId) {
    const db = getDB();
    if (!db.users.includes(targetId)) {
      db.users.push(targetId);
      const _rp = fs.existsSync("./storage/resellers.json") ? "./storage/resellers.json" : "./resellers.json";
      fs.writeFileSync(_rp, JSON.stringify(db, null, 2));
    }
  }

  function removeReseller(targetId) {
    const db = getDB();
    db.users = db.users.filter(id => id !== targetId);
    const _rp = fs.existsSync("./storage/resellers.json") ? "./storage/resellers.json" : "./resellers.json";
    fs.writeFileSync(_rp, JSON.stringify(db, null, 2));
  }

  module.exports = {
    isOwner,
    isReseller,
    isFreeMode,
    hasAccess,
    addReseller,
    removeReseller
  };
  