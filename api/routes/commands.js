const express = require("express");
const router = express.Router();
const Guild = require("../models/Guild");
const GlobalCommands = require("../models/GlobalCommands");
const ActivityLog = require("../models/ActivityLog");
const { checkGuildPermission } = require("../middleware/auth");
const { getCachedUser } = require("../utils/discordCache");
const logger = require("../utils/logger");

// Cache for global commands
let globalCommandsCache = null;
let lastCommandsUpdate = 0;
const CACHE_DURATION = 60 * 1000; // 1 minute

// =======================
// Get Global Commands
// =======================
router.get("/", async (req, res) => {
  try {
    // Return cached data if available and fresh
    if (
      globalCommandsCache &&
      Date.now() - lastCommandsUpdate < CACHE_DURATION
    ) {
      return res.json(globalCommandsCache);
    }

    const globalCommands = await GlobalCommands.findOne({});

    if (!globalCommands || !globalCommands.commands.length) {
      return res.json({});
    }

    const commandsByCategory = {};

    for (const cmd of globalCommands.commands) {
      const category =
        (cmd.category || "General").charAt(0).toUpperCase() +
        (cmd.category || "General").slice(1).toLowerCase();

      if (!commandsByCategory[category]) {
        commandsByCategory[category] = [];
      }

      // Map options recursively
      const mapOptions = (options) => {
        return options.map((opt) => ({
          name: opt.name,
          description: opt.description || "",
          type: opt.type,
          required: opt.required || false,
          choices: opt.choices || undefined,
          options: opt.options ? mapOptions(opt.options) : [],
        }));
      };

      commandsByCategory[category].push({
        name: cmd.name,
        description: cmd.description,
        category: category,
        options: mapOptions(cmd.options || []),
      });
    }

    // Update cache
    globalCommandsCache = commandsByCategory;
    lastCommandsUpdate = Date.now();

    return res.json(commandsByCategory);
  } catch (error) {
    logger.error("Error fetching commands:", error);
    res.status(500).json({ error: "Failed to fetch commands" });
  }
});

// =======================
// Get Guild Command Settings
// =======================
router.get("/guild/:id", checkGuildPermission("commands"), async (req, res) => {
  try {
    const guildId = req.params.id;
    let guild = await Guild.findById(guildId);

    if (!guild) {
      guild = new Guild({ _id: guildId });
      await guild.save();
    }

    // Initialize commands settings if not exists
    if (!guild.commands) {
      guild.commands = {
        disabledCategories: [],
        disabledCommands: [],
      };
      await guild.save();
    }

    res.json({
      disabledCategories: guild.commands?.disabledCategories || [],
      disabledCommands: guild.commands?.disabledCommands || [],
    });
  } catch (error) {
    logger.error("Error fetching guild commands:", error);
    res.status(500).json({ error: "Failed to fetch guild commands" });
  }
});

// =======================
// Update Guild Command Settings
// =======================
router.post(
  "/guild/:id",
  checkGuildPermission("commands"),
  async (req, res) => {
    try {
      const guildId = req.params.id;
      const { disabledCategories, disabledCommands } = req.body;
      const authHeader = req.headers.authorization;

      // Get user info for activity logging
      let user = null;
      if (authHeader) {
        user = await getCachedUser(authHeader.split(" ")[1]);
      }

      // Get old settings
      let guild = await Guild.findById(guildId);
      if (!guild) {
        guild = new Guild({ _id: guildId });
      }

      const oldDisabledCategories = guild.commands?.disabledCategories || [];
      const oldDisabledCommands = guild.commands?.disabledCommands || [];

      // Update settings
      guild.commands = {
        disabledCategories: disabledCategories || [],
        disabledCommands: disabledCommands || [],
      };

      await guild.save();

      // Log activity
      if (user) {
        const changes = [];

        // Check for category changes
        const addedCategories = disabledCategories.filter(
          (cat) => !oldDisabledCategories.includes(cat),
        );
        const removedCategories = oldDisabledCategories.filter(
          (cat) => !disabledCategories.includes(cat),
        );

        for (const cat of addedCategories) {
          changes.push({
            type: "feature_toggle",
            action: `Disabled ${cat} category`,
            details: {
              field: "commands.disabledCategories",
              category: cat,
              enabled: false,
            },
          });
        }

        for (const cat of removedCategories) {
          changes.push({
            type: "feature_toggle",
            action: `Enabled ${cat} category`,
            details: {
              field: "commands.disabledCategories",
              category: cat,
              enabled: true,
            },
          });
        }

        // Check for command changes
        const addedCommands = disabledCommands.filter(
          (cmd) => !oldDisabledCommands.includes(cmd),
        );
        const removedCommands = oldDisabledCommands.filter(
          (cmd) => !disabledCommands.includes(cmd),
        );

        for (const cmd of addedCommands) {
          changes.push({
            type: "settings_change",
            action: `Disabled /${cmd} command`,
            details: {
              field: "commands.disabledCommands",
              command: cmd,
              enabled: false,
            },
          });
        }

        for (const cmd of removedCommands) {
          changes.push({
            type: "settings_change",
            action: `Enabled /${cmd} command`,
            details: {
              field: "commands.disabledCommands",
              command: cmd,
              enabled: true,
            },
          });
        }

        // Save all activity logs
        for (const change of changes) {
          await new ActivityLog({
            guildId,
            userId: user.id,
            username: user.username,
            userAvatar: user.avatar
              ? `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png`
              : null,
            type: change.type,
            action: change.action,
            details: change.details,
          }).save();
        }
      }

      res.json({
        success: true,
        disabledCategories: guild.commands.disabledCategories,
        disabledCommands: guild.commands.disabledCommands,
      });
    } catch (error) {
      logger.error("Error updating guild commands:", error);
      res.status(500).json({ error: "Failed to update guild commands" });
    }
  },
);

module.exports = router;
