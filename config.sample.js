module.exports = {
  // --- Discord Application Details ---
  DISCORD_TOKEN: "YOUR_BOT_TOKEN",
  CLIENT_ID: "605009836547112963",
  CLIENT_SECRET: "YOUR_CLIENT_SECRET",

  // --- Database Connection ---
  // If using an external MongoDB (like Atlas), paste your URI here:
  MONGO_URI: "mongodb://localhost:27017/vantyx",

  // --- Dashboard & API ---
  // DASHBOARD_URL is used for OAuth redirects (must be accessible from user's browser)
  DASHBOARD_URL: "http://localhost:3000",
  // API_URL is used for server-side API calls
  API_URL: "http://localhost",
  API_PORT: 4000,

  // --- Bot Settings ---
  BOT_PREFIX: "!",
  OWNER_IDS: ["697435544812257342"],

  // --- Feature Settings ---
  DEFAULT_LANG: "en", // 'en' or 'ar'

  // --- Project version ---
  PROJECT_VERSION: "1.0",

  // --- Links ---
  LINKS: {
    SUPPORT: "https://discord.gg/4EbSFSJZqH",
    INVITE:
      "https://discord.com/api/oauth2/authorize?client_id=605009836547112963&permissions=8&scope=bot%20applications.commands",
    WEBSITE: "http://localhost:3000",
    TERMS: "/terms",
    PRIVACY: "/privacy",
    GITHUB: "https://github.com/Hadi-4100",
    X: "https://x.com/",
  },
};
