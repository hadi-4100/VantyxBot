const { Events, PermissionFlagsBits } = require("discord.js");
const Guild = require("../database/models/Guild");
const logger = require("../utils/logger");
const lang = require("../utils/language");
const { getCachedGuild, cacheGuild } = require("../utils/cache");
const { handleXpGain, handleLevelUp } = require("../handlers/xpHandler");
const { recordGuildStat } = require("../utils/stats");

// In-memory spam tracker (userId -> Array<{timestamp, messageId}>)
const spamTracker = new Map();
const SPAM_THRESHOLD = 5; // Message count threshold
const SPAM_WINDOW = 5000; // 5-second window

/**
 * Event: MessageCreate
 * Main handler for all non-bot text messages. Processes statistics, auto-moderation,
 * auto-responders, and leveling.
 */
module.exports = {
  name: Events.MessageCreate,
  async execute(message) {
    if (message.author.bot || !message.guild) return;

    try {
      // 1. Update Guild Statistics
      await recordGuildStat(
        message.guild,
        "messages",
        message.guild.memberCount,
      );

      // 2. Load Guild Settings
      let settings = getCachedGuild(message.guild.id);
      if (!settings) {
        settings = await Guild.findById(message.guild.id).lean();
        if (settings) cacheGuild(message.guild.id, settings);
      }
      if (!settings) return;

      // 3. Process Auto-Moderation (Bypass for Admins)
      const isHandledByAutoMod = await handleAutoModeration(message, settings);
      if (isHandledByAutoMod) return;

      // 4. Process Auto-Responder
      const isHandledByResponder = await handleAutoResponder(message, settings);
      if (isHandledByResponder) return;

      // 5. Process Leveling (XP Gain)
      const levelUpData = await handleXpGain(message, settings);
      if (levelUpData?.leveledUp) {
        await handleLevelUp(message.client, message, levelUpData);
      }
    } catch (error) {
      logger.error(`Message Event Error: ${error.message}`);
    }
  },
};

/**
 * Processes automated moderation checks (Spam, Bad Words, Invites, Links).
 * Returns true if the message was handled (e.g., deleted), false otherwise.
 */
async function handleAutoModeration(message, settings) {
  if (!settings.automod) return false;

  const { member, channel, content, author } = message;
  const { antiSpam, antiBadWords, antiInvites, antiLinks } = settings.automod;
  const language = settings.language;

  // Bypass if member has elevated permissions
  if (
    member.permissions.has(PermissionFlagsBits.ManageGuild) ||
    member.permissions.has(PermissionFlagsBits.Administrator)
  ) {
    return false;
  }

  const isExcluded = (module) => {
    if (!module?.enabled) return true;
    if (module.excludedChannels?.includes(channel.id)) return true;
    if (module.excludedRoles?.some((rid) => member.roles.cache.has(rid)))
      return true;
    return false;
  };

  const punish = async (module, reason) => {
    const actions = module.actions || [];
    if (actions.includes("block")) {
      await message.delete().catch(() => {});
    }
    if (actions.includes("timeout")) {
      const duration = module.timeoutDuration || 3600000;
      await member.timeout(duration, reason).catch(() => {});
    }
    return true;
  };

  // Anti-Spam
  if (!isExcluded(antiSpam)) {
    const userId = author.id;
    const now = Date.now();

    if (!spamTracker.has(userId)) spamTracker.set(userId, []);
    const history = spamTracker
      .get(userId)
      .filter((e) => now - e.timestamp < SPAM_WINDOW);
    history.push({ timestamp: now, id: message.id });
    spamTracker.set(userId, history);

    if (history.length >= SPAM_THRESHOLD) {
      if (antiSpam.actions?.includes("block")) {
        const ids = history.map((e) => e.id);
        await channel.bulkDelete(ids, true).catch(() => {});
      }
      if (antiSpam.actions?.includes("timeout")) {
        await member
          .timeout(
            antiSpam.timeoutDuration || 3600000,
            lang.get(language, "AUTOMOD_SPAM"),
          )
          .catch(() => {});
      }
      spamTracker.set(userId, []);
      return true;
    }
  }

  // Anti-BadWords
  if (!isExcluded(antiBadWords)) {
    const words = antiBadWords.words || [];
    const lowerContent = content.toLowerCase();
    if (
      words.some((w) =>
        new RegExp(`\\b${w.toLowerCase()}\\b`, "i").test(lowerContent),
      )
    ) {
      return await punish(antiBadWords, lang.get(language, "AUTOMOD_BADWORD"));
    }
  }

  // Anti-Invites
  if (!isExcluded(antiInvites)) {
    const inviteRegex =
      /(https?:\/\/)?(www\.)?(discord\.(gg|io|me|li)|discordapp\.com\/invite)\/.+/gi;
    if (inviteRegex.test(content)) {
      return await punish(antiInvites, lang.get(language, "AUTOMOD_INVITE"));
    }
  }

  // Anti-Links
  if (!isExcluded(antiLinks)) {
    const linkRegex = /(https?:\/\/[^\s]+)/gi;
    if (linkRegex.test(content)) {
      return await punish(antiLinks, lang.get(language, "AUTOMOD_LINK"));
    }
  }

  return false;
}

/**
 * Processes the auto-responder module based on triggers and filters.
 */
async function handleAutoResponder(message, settings) {
  const { autoResponder, language } = settings;
  if (!autoResponder?.enabled || !autoResponder.responses?.length) return false;

  const content = message.content.toLowerCase();
  const { member, channel, author } = message;

  for (const resp of autoResponder.responses) {
    if (!content.includes(resp.trigger.toLowerCase())) continue;

    // Filters
    if (
      resp.enabledChannels?.length &&
      !resp.enabledChannels.includes(channel.id)
    )
      continue;
    if (resp.disabledChannels?.includes(channel.id)) continue;
    if (
      resp.enabledRoles?.length &&
      !resp.enabledRoles.some((r) => member.roles.cache.has(r))
    )
      continue;
    if (resp.disabledRoles?.some((r) => member.roles.cache.has(r))) continue;

    const reply = resp.response
      .replace(/\[user\]/g, `<@${author.id}>`)
      .replace(/\[userName\]/g, author.username);

    if (resp.responseType === "reply") {
      await message.reply(reply).catch(() => {});
    } else {
      await channel.send(reply).catch(() => {});
    }

    return true; // Stop at first match
  }

  return false;
}
