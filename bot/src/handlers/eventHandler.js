const path = require("path");
const logger = require("../utils/logger");
const { glob } = require("glob");

/**
 * Recursively loads all events from the events directory.
 * Registers them as 'on' or 'once' listeners on the Discord client.
 */
module.exports = async (client) => {
  const eventsPath = path.join(__dirname, "../events/**/*.js");

  // Use glob to find all .js files in the events folder recursively
  const eventFiles = await glob(eventsPath.replace(/\\/g, "/"));

  for (const filePath of eventFiles) {
    const event = require(filePath);

    if (!event.name || !event.execute) {
      logger.warn(
        `Missing required "name" or "execute" property at ${filePath}`,
      );
      continue;
    }

    if (event.once) {
      client.once(event.name, (...args) => event.execute(...args, client));
    } else {
      client.on(event.name, (...args) => event.execute(...args, client));
    }

    logger.info(`Loaded event: ${event.name}`);
  }
};
