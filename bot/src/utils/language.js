const en = require("../locales/en");
const ar = require("../locales/ar");
const Guild = require("../database/models/Guild");
const config = require("../../../config");

const cache = new Map();

async function getLanguage(guildId) {
  if (cache.has(guildId)) return cache.get(guildId);

  const guildData = await Guild.findById(guildId).lean();
  const lang = guildData ? guildData.language : config.DEFAULT_LANG;
  cache.set(guildId, lang);
  return lang;
}

function get(lang, key, args = {}) {
  const locale = lang === "ar" ? ar : en;
  let text = locale[key] || en[key] || key;

  for (const [k, v] of Object.entries(args)) {
    text = text.replace(new RegExp(`{${k}}`, "g"), v);
  }

  return text;
}

module.exports = {
  getLanguage,
  get,
  setLanguage: (guildId, lang) => cache.set(guildId, lang),
};
