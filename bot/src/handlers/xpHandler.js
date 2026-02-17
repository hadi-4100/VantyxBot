/**
 * XP Handler
 * Processes XP gains, level-up events, and reward assignments.
 */

const User = require("../database/models/User");
const Guild = require("../database/models/Guild");
const {
  getRandomXp,
  isSpamMessage,
  canGainXp,
  getLevelFromXp,
  calculateInteractionTime,
  XP_COOLDOWN,
} = require("../utils/leveling");
const logger = require("../utils/logger");
const { xpCooldownCache } = require("../utils/cache");
const lang = require("../utils/language");

/**
 * Handles XP calculation and persistence when a user sends a message.
 * @param {Message} message - Discord message instance
 * @param {Object} [providedSettings] - Optional cached guild settings
 * @returns {Promise<Object|null>} - Level up data if occurred, otherwise null
 */
async function handleXpGain(message, providedSettings = null) {
  try {
    const { guild, author, member, channel, content } = message;
    const guildId = guild.id;
    const userId = author.id;

    // Fast check: Verify memory cache cooldown before database operations
    const cacheKey = `${guildId}-${userId}`;
    const lastXpTime = xpCooldownCache.get(cacheKey);
    if (lastXpTime && Date.now() - lastXpTime < XP_COOLDOWN) {
      return null;
    }

    // Resolve guild settings
    const guildSettings =
      providedSettings || (await Guild.findById(guildId).lean());

    // Skip if leveling is disabled or settings are missing
    if (!guildSettings?.leveling?.enabled) {
      return null;
    }

    // Skip if user has a blacklisted role
    const noXpRoles = guildSettings.leveling.noXpRoles || [];
    if (
      noXpRoles.length > 0 &&
      noXpRoles.some((roleId) => member.roles.cache.has(roleId))
    ) {
      return null;
    }

    // Skip if channel is blacklisted
    const noXpChannels = guildSettings.leveling.noXpChannels || [];
    if (noXpChannels.includes(channel.id)) {
      return null;
    }

    // Skip if message is identified as spam
    if (isSpamMessage(userId, content)) {
      return null;
    }

    // Retrieve or initialize user record
    let user = await User.findOne({ guildId, userId });
    if (!user) {
      user = new User({
        guildId,
        userId,
        lastMessage: new Date(),
        xp: 0,
        level: 0,
      });
    }

    // Database-level cooldown verification
    if (!canGainXp(user.lastXpGain)) {
      user.lastMessage = new Date(); // Still track interaction time
      await user.save();
      return null;
    }

    // Update interaction time metrics
    const interactionTime = calculateInteractionTime(user.lastMessage);
    user.totalInteractionTime += interactionTime;

    const oldLevel = user.level;
    const xpGain = getRandomXp();
    user.xp += xpGain;

    // Determine new level and level-up status
    const newLevel = getLevelFromXp(user.xp);
    const leveledUp = newLevel > oldLevel;

    // Update timestamps and save user data
    user.level = newLevel;
    user.lastMessage = new Date();
    user.lastXpGain = new Date();
    await user.save();

    // Update in-memory cooldown cache
    xpCooldownCache.set(cacheKey, Date.now());

    if (leveledUp) {
      return { leveledUp, oldLevel, newLevel, user, guildSettings };
    }

    return null;
  } catch (error) {
    logger.error(`XP Gain Processing Error: ${error.message}`);
    return null;
  }
}

/**
 * Handles the level-up event, including announcements and reward assignments.
 * @param {Client} client - Discord client instance
 * @param {Message} message - Original triggering message
 * @param {Object} levelUpData - Data provided by handleXpGain
 */
async function handleLevelUp(client, message, levelUpData) {
  try {
    const { oldLevel, newLevel, user, guildSettings } = levelUpData;
    const { member, author, guild, channel } = message;
    const language = await lang.getLanguage(guild.id);

    // 1. Send Level-Up Announcement
    if (guildSettings.leveling.levelUpMessage?.enabled) {
      const template =
        guildSettings.leveling.levelUpMessage.message ||
        lang.get(language, "LEVEL_UP_DEFAULT_MESSAGE");
      const levelUpMsg = template
        .replace(/\[user\]/g, `<@${user.userId}>`)
        .replace(/\[oldLevel\]/g, oldLevel.toString())
        .replace(/\[level\]/g, newLevel.toString());

      const customChannelId = guildSettings.leveling.levelUpMessage.channel;
      const targetChannel =
        (customChannelId && guild.channels.cache.get(customChannelId)) ||
        channel;

      await targetChannel.send(levelUpMsg).catch((err) => {
        logger.error(`Announcement Failed: ${err.message}`);
      });
    }

    // 2. Process Role Rewards
    const roleRewards = guildSettings.leveling.roleRewards || [];
    if (roleRewards.length > 0) {
      // Find rewards applicable for the levels gained
      const achievements = roleRewards
        .filter((r) => r.level > oldLevel && r.level <= newLevel)
        .sort((a, b) => a.level - b.level);

      for (const reward of achievements) {
        try {
          const role = guild.roles.cache.get(reward.role);
          if (!role) continue;

          // Assign new role
          await member.roles.add(role).catch((err) => {
            logger.error(
              `Role Assignment Failed (${role.name}): ${err.message}`,
            );
          });

          // Cleanup: Remove lower-tier roles if configured
          const redundantRewards = roleRewards.filter(
            (r) => r.level < reward.level && r.removeWithHigher,
          );
          for (const redundant of redundantRewards) {
            const redundantRole = guild.roles.cache.get(redundant.role);
            if (redundantRole && member.roles.cache.has(redundantRole.id)) {
              await member.roles.remove(redundantRole).catch((err) => {
                logger.error(`Redundant Role Removal Failed: ${err.message}`);
              });
            }
          }

          // Direct Message notification
          if (reward.dmMember) {
            const dmTitle = lang.get(language, "LEVEL_UP_DM_TITLE", {
              user: author.username,
            });
            const dmBody = lang.get(language, "LEVEL_UP_DM_BODY", {
              guild: guild.name,
              oldLevel,
              newLevel,
              role: role.name,
            });

            await member.send(`>>> ${dmTitle}\n\n${dmBody}`).catch(() => {
              logger.warn(`Could not DM user ${author.tag}`);
            });
          }
        } catch (err) {
          logger.error(
            `Reward Processing Error (Level ${reward.level}): ${err.message}`,
          );
        }
      }
    }
  } catch (error) {
    logger.error(`Level Up Handler Error: ${error.message}`);
  }
}

module.exports = {
  handleXpGain,
  handleLevelUp,
};
