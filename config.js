module.exports = {
    ownerId:         process.env.OWNER_ID          || "7783413625",
    telegramBotToken: process.env.BOT_TOKEN         || "",
    sessionName:     process.env.SESSION_NAME       || "session",
    chanelid:        process.env.CHANNEL_ID         || "@cybersecpro7",
    chatgrupid:      process.env.GROUP_ID           || "@cybersecpro4",
    thumburl:        process.env.THUMB_URL          || "https://img.sanishtech.com/u/fd183ca273698d04dacfd39a1d610c97.jpg",
    // GitHub token validation (optional — set to skip validation)
    ghToken:         process.env.GH_TOKEN           || "",
    ghRepo:          process.env.GH_REPO            || "",
    ghFile:          process.env.GH_FILE            || "tokens.json",
};
