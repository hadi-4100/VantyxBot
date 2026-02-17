const fs = require("fs");
const path = require("path");
const logger = require("../utils/logger");
const GlobalCommands = require("../database/models/GlobalCommands");

/**
 * Loads and registers all commands from the commands directory.
 * Also synchronizes the command list with the database for the dashboard.
 */
module.exports = async (client) => {
  const commandsPath = path.join(__dirname, "../commands");

  if (!fs.existsSync(commandsPath)) {
    logger.warn("Commands directory not found.");
    return;
  }

  const commandFolders = fs.readdirSync(commandsPath);

  for (const folder of commandFolders) {
    const folderPath = path.join(commandsPath, folder);
    if (!fs.lstatSync(folderPath).isDirectory()) continue;

    const commandFiles = fs
      .readdirSync(folderPath)
      .filter((file) => file.endsWith(".js"));

    for (const file of commandFiles) {
      const filePath = path.join(folderPath, file);
      const command = require(filePath);

      // Verify command structure before loading
      if ("data" in command && "execute" in command) {
        command.category = folder;
        client.commands.set(command.data.name, command);
        logger.info(`Loaded command: ${command.data.name}`);
      } else {
        logger.warn(
          `Missing required "data" or "execute" property at ${filePath}`,
        );
      }
    }
  }

  // Map commands to a clean format for database synchronization
  const commandsList = client.commands.map((cmd) => {
    const data = cmd.data.toJSON ? cmd.data.toJSON() : cmd.data;

    return {
      name: data.name,
      description: data.description,
      category: cmd.category || "General",
      options: (data.options || []).map((opt) => cleanOption(opt)),
    };
  });

  /**
   * Recursively cleans command options for database storage.
   */
  function cleanOption(opt) {
    return {
      name: opt.name,
      description: opt.description || "",
      type: opt.type,
      options: (opt.options || []).map((sub) => cleanOption(sub)),
      choices: opt.choices || undefined,
      min_value: opt.min_value || undefined,
      max_value: opt.max_value || undefined,
      required: opt.required || false,
      channel_types: opt.channel_types || undefined,
    };
  }

  try {
    // Sync the local command list with the database to keep the dashboard updated
    await GlobalCommands.deleteMany({});
    await GlobalCommands.create({ commands: commandsList });
    logger.info(`Synchronized ${commandsList.length} commands with database`);
  } catch (error) {
    logger.error(`Database command sync failed: ${error.message}`);
  }
};
