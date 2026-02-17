const {
  Client,
  GatewayIntentBits,
  Partials,
  Collection,
} = require("discord.js");
const config = require("../config.js");
const logger = require("./src/utils/logger");
const connectDB = require("./src/database/mongoose");
const startSchedulers = require("./src/utils/scheduler");

/**
 * Initialize Discord Client with necessary intents and partials.
 * Intents are required to receive specific events from Discord.
 */
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildPresences,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.GuildInvites,
    GatewayIntentBits.GuildMessageReactions,
  ],
  partials: [
    Partials.Message,
    Partials.Channel,
    Partials.Reaction,
    Partials.User,
    Partials.GuildMember,
  ],
});

// Attach commands collection and config to the client for easy access
client.commands = new Collection();
client.config = config;

/**
 * Main initialization block to start the bot.
 */
(async () => {
  try {
    // Establish database connection
    await connectDB();

    // Load command and event handlers to register listeners
    require("./src/handlers/commandHandler")(client);
    require("./src/handlers/eventHandler")(client);

    // Sync slash commands with Discord API
    const registerCommands = require("./src/utils/registerCommands");
    await registerCommands(client);

    // Initialize background cron jobs and tasks
    startSchedulers(client);

    // Authenticate with Discord
    await client.login(config.DISCORD_TOKEN);
  } catch (err) {
    logger.error(`Initialization failed: ${err.message}`);
    process.exit(1);
  }
})();

module.exports = client;
