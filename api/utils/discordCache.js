const DiscordOauth2 = require("discord-oauth2");

const oauth = new DiscordOauth2();
const userGuildsCache = new Map();
const userCache = new Map();

const CACHE_TTL = 5 * 60 * 1000; // 5 minutes
const MAX_CACHE_SIZE = 2000;

/**
 * Fetches user guilds with in-memory caching to reduce Discord API calls.
 * @param {string} token - Discord OAuth2 access token
 * @returns {Promise<Array>} List of user guilds
 */
async function getCachedUserGuilds(token) {
  if (!token) return [];

  const cached = userGuildsCache.get(token);

  if (cached && cached.timestamp > Date.now() - CACHE_TTL) {
    return cached.data;
  }

  try {
    const guilds = await oauth.getUserGuilds(token);
    userGuildsCache.set(token, {
      data: guilds,
      timestamp: Date.now(),
    });

    cleanupCache(userGuildsCache);

    return guilds;
  } catch (error) {
    if (
      (error.message?.includes("timed out") || error.code === 500) &&
      cached
    ) {
      return cached.data;
    }
    throw error;
  }
}

/**
 * Fetches user info with in-memory caching.
 * @param {string} token - Discord OAuth2 access token
 * @returns {Promise<Object>} User info
 */
async function getCachedUser(token) {
  if (!token) return null;

  const cached = userCache.get(token);

  if (cached && cached.timestamp > Date.now() - CACHE_TTL) {
    return cached.data;
  }

  try {
    const user = await oauth.getUser(token);
    userCache.set(token, {
      data: user,
      timestamp: Date.now(),
    });

    cleanupCache(userCache);

    return user;
  } catch (error) {
    if (
      (error.message?.includes("timed out") || error.code === 500) &&
      cached
    ) {
      return cached.data;
    }
    throw error;
  }
}

function cleanupCache(cache) {
  if (cache.size > MAX_CACHE_SIZE) {
    const now = Date.now();
    for (const [key, value] of cache.entries()) {
      if (value.timestamp < now - CACHE_TTL) {
        cache.delete(key);
      }
    }
  }
}

module.exports = { getCachedUserGuilds, getCachedUser };
