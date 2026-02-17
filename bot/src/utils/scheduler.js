const logger = require("./logger");
const ActiveMute = require("../database/models/ActiveMute");
const Guild = require("../database/models/Guild");
const Warning = require("../database/models/Warning");
const { updateGlobalStats } = require("./stats");
const giveaway = require("./giveaway");

/**
 * Starts all periodic background tasks for the bot.
 * @param {import("discord.js").Client} client
 */
function startSchedulers(client) {
  /**
   * 1. Global Stats Heartbeat (Every 1 Minute)
   * Keeps track of guild count, user count, and API latency.
   */
  setInterval(async () => {
    await updateGlobalStats(client);
  }, 60000);

  /**
   * 2. Giveaway Monitor (Every 5 Seconds)
   * Checks for giveaways that have reached their end time.
   */
  setInterval(async () => {
    try {
      await giveaway.checkGiveaways(client);
    } catch (err) {
      logger.error(`Giveaway Scheduler Error: ${err.message}`);
    }
  }, 5000);

  /**
   * 3. Mute Expiration Checker (Every 1 Minute)
   * Automatically removes the mute role from users when their time window expires.
   */
  setInterval(async () => {
    try {
      const expiredMutes = await ActiveMute.find({
        expiresAt: { $lte: new Date() },
      });

      for (const mute of expiredMutes) {
        try {
          const guild = client.guilds.cache.get(mute.guildId);
          if (!guild) {
            await ActiveMute.deleteOne({ _id: mute._id });
            continue;
          }

          const member = await guild.members
            .fetch(mute.userId)
            .catch(() => null);
          if (member && member.roles.cache.has(mute.roleId)) {
            await member.roles.remove(
              mute.roleId,
              "Mute duration expired (Timed out by System)",
            );
          }

          await ActiveMute.deleteOne({ _id: mute._id });
        } catch (err) {
          logger.error(
            `Failed to process expired mute for user ${mute.userId}: ${err.message}`,
          );
        }
      }
    } catch (err) {
      logger.error(`Mute Expiration Checker Error: ${err.message}`);
    }
  }, 60000);

  /**
   * 4. Auto-Warning Reset (Every 1 Hour)
   * Purges old warnings for guilds that have a reset window configured.
   */
  setInterval(async () => {
    try {
      const guilds = await Guild.find({
        "warnings.resetAfterDays": { $gt: 0 },
      }).lean();

      for (const guild of guilds) {
        try {
          const resetMs = guild.warnings.resetAfterDays * 24 * 60 * 60 * 1000;
          const cutoff = new Date(Date.now() - resetMs);

          const result = await Warning.deleteMany({
            guildId: guild._id,
            timestamp: { $lt: cutoff },
          });

          if (result.deletedCount > 0) {
            logger.info(
              `Cleaned ${result.deletedCount} expired warnings for guild ${guild._id}`,
            );
          }
        } catch (err) {
          logger.error(
            `Warning Reset Failed for Guild ${guild._id}: ${err.message}`,
          );
        }
      }
    } catch (err) {
      logger.error(`Warning Reset Scheduler Error: ${err.message}`);
    }
  }, 3600000);
}

module.exports = startSchedulers;
