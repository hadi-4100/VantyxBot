const { Events } = require("discord.js");
const inviteTracker = require("../utils/inviteTracker");
const logger = require("../utils/logger");
const { updateGlobalStats } = require("../utils/stats");

/**
 * Event: GuildCreate
 * Triggered when the bot joins a new server or when a server is created.
 */
module.exports = {
  name: Events.GuildCreate,
  async execute(guild) {
    logger.info(
      `New connection: Joined guild "${guild.name}" (ID: ${guild.id})`,
    );

    try {
      // 1. Initialize invite cache for the new guild
      await inviteTracker.fetchInvites(guild);
      logger.info(`Invite synchronization completed for "${guild.name}".`);

      // 2. Refresh global bot statistics
      await updateGlobalStats(guild.client);
    } catch (error) {
      logger.error(
        `Failed to initialize settings for guild "${guild.id}": ${error.message}`,
      );
    }
  },
};
