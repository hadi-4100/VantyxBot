const { Events } = require("discord.js");
const logger = require("../utils/logger");
const { updateGlobalStats } = require("../utils/stats");
const inviteTracker = require("../utils/inviteTracker");

/**
 * Event: ClientReady
 * Triggered when the bot successfully logs in and connects to Discord.
 */
module.exports = {
  name: Events.ClientReady,
  once: true,
  async execute(client) {
    logger.success(`Connection established! Online as ${client.user.tag}`);

    // Set initial presence
    client.user.setActivity("Vantyx System", { type: 0 });

    try {
      // 1. Perform initial global stats synchronization
      await updateGlobalStats(client, true);
      logger.info("Global statistics synchronized.");

      // 2. Synchronize invite cache across all guilds (staggered)
      logger.info("Starting background invite synchronization...");

      // Delay slightly to allow internal caches to stabilize
      setTimeout(async () => {
        let count = 0;
        for (const guild of client.guilds.cache.values()) {
          try {
            await inviteTracker.fetchInvites(guild);
            count++;
            // Prevent API rate limiting by adding a small delay between guilds
            await new Promise((res) => setTimeout(res, 500));
          } catch (err) {
            // Silently skip guilds where we lack permissions
          }
        }
        logger.success(`Invite cache synchronized for ${count} servers.`);
      }, 5000);
    } catch (error) {
      logger.error(`Post-startup initialization failed: ${error.message}`);
    }
  },
};
