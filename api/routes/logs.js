const express = require("express");
const router = express.Router();
const Guild = require("../models/Guild");
const ActivityLog = require("../models/ActivityLog");
const { checkGuildPermission } = require("../middleware/auth");
const { getCachedUser } = require("../utils/discordCache");
const logger = require("../utils/logger");

// =======================
// Get Log Settings
// =======================
router.get("/:guildId", checkGuildPermission("guild"), async (req, res) => {
  try {
    const { guildId } = req.params;
    let guild = await Guild.findById(guildId);
    if (!guild) {
      guild = new Guild({ _id: guildId });
      await guild.save();
    }
    res.json({ logs: guild.logs || {} });
  } catch (err) {
    logger.error("Error fetching log settings:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// =======================
// Update Log Settings
// =======================
router.post("/:guildId", checkGuildPermission("guild"), async (req, res) => {
  try {
    const { guildId } = req.params;
    const { logs } = req.body;
    const authHeader = req.headers.authorization;

    if (!logs) {
      return res.status(400).json({ error: "Missing logs settings" });
    }

    const guild = await Guild.findById(guildId);
    if (!guild) {
      return res.status(404).json({ error: "Guild not found" });
    }

    const oldLogs = guild.logs || {};

    // Merge updates
    const logCategories = [
      "moderation",
      "member",
      "message",
      "voice",
      "server",
    ];
    const changes = [];

    // Ensure logs object exists
    if (!guild.logs) guild.logs = {};

    for (const category of logCategories) {
      if (logs[category]) {
        // Initialize category if not exists
        if (!guild.logs[category]) guild.logs[category] = {};

        // Check enabled toggle
        if (
          logs[category].enabled !== undefined &&
          logs[category].enabled !== oldLogs[category]?.enabled
        ) {
          changes.push({
            type: "log_update",
            action: `${
              logs[category].enabled ? "Enabled" : "Disabled"
            } ${category} logs`,
            details: {
              field: `logs.${category}.enabled`,
              oldValue: oldLogs[category]?.enabled,
              newValue: logs[category].enabled,
            },
          });
          guild.logs[category].enabled = logs[category].enabled;
        }

        // Check channel update
        if (
          logs[category].channel !== undefined &&
          logs[category].channel !== oldLogs[category]?.channel
        ) {
          changes.push({
            type: "log_update",
            action: `Updated ${category} logs channel`,
            details: {
              field: `logs.${category}.channel`,
              oldValue: oldLogs[category]?.channel,
              newValue: logs[category].channel,
            },
          });
          guild.logs[category].channel = logs[category].channel;
        }
      }
    }

    await guild.save();

    // Log Activity
    const user = await getCachedUser(
      authHeader ? authHeader.split(" ")[1] : null
    );
    if (user && changes.length > 0) {
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

    res.json({ logs: guild.logs });
  } catch (err) {
    logger.error("Error updating log settings:", err);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
