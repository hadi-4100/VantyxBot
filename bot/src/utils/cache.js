const { Collection } = require("discord.js");

// Guild Settings Cache
// Key: GuildID, Value: { data: Object, expires: Number }
const guildSettingsCache = new Collection();
const SETTINGS_TTL = 60 * 1000; // 1 minute cache for settings

// XP Cooldown Cache
// Key: GuildID_UserID, Value: Number (Timestamp of last XP gain)
// We use memory cache to avoid DB reads on every message for cooldown checks
const xpCooldownCache = new Collection();

// Guild Stats Buffer
// Key: GuildID, Value: Object (Pending stats updates)
const statsBuffer = new Collection();

/**
 * Get cached guild settings
 * @param {string} guildId
 * @returns {Object|null}
 */
function getCachedGuild(guildId) {
  const cached = guildSettingsCache.get(guildId);
  if (cached && cached.expires > Date.now()) {
    return cached.data;
  }
  return null;
}

/**
 * Cache guild settings
 * @param {string} guildId
 * @param {Object} data
 */
function cacheGuild(guildId, data) {
  guildSettingsCache.set(guildId, {
    data,
    expires: Date.now() + SETTINGS_TTL,
  });
}

/**
 * Invalidate cached guild settings
 * Call this when updating settings via commands or dashboard
 * @param {string} guildId
 */
function invalidateGuildCache(guildId) {
  guildSettingsCache.delete(guildId);
}

module.exports = {
  guildSettingsCache,
  xpCooldownCache,
  statsBuffer,
  getCachedGuild,
  cacheGuild,
  invalidateGuildCache,
  SETTINGS_TTL,
};
