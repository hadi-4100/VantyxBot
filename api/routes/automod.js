const express = require("express");
const router = express.Router();
const Guild = require("../models/Guild");
const ActivityLog = require("../models/ActivityLog");
const { checkGuildPermission } = require("../middleware/auth");
const { getCachedUser } = require("../utils/discordCache");
const logger = require("../utils/logger");

// =======================
// Helper: Default Settings
// =======================
const getDefaultAutomod = () => ({
  antiSpam: {
    enabled: false,
    actions: [],
    timeoutDuration: 3600000,
    excludedChannels: [],
    excludedRoles: [],
  },
  antiBadWords: {
    enabled: false,
    actions: [],
    timeoutDuration: 3600000,
    excludedChannels: [],
    excludedRoles: [],
    words: [],
  },
  antiInvites: {
    enabled: false,
    actions: [],
    timeoutDuration: 3600000,
    excludedChannels: [],
    excludedRoles: [],
  },
  antiLinks: {
    enabled: false,
    actions: [],
    timeoutDuration: 3600000,
    excludedChannels: [],
    excludedRoles: [],
  },
});

// =======================
// Get Automod Settings
// =======================
router.get("/guild/:id", checkGuildPermission("automod"), async (req, res) => {
  try {
    const guildId = req.params.id;
    let guild = await Guild.findById(guildId);

    if (!guild) {
      guild = new Guild({ _id: guildId });
      await guild.save();
    }

    // Initialize automod if missing
    if (!guild.automod) {
      guild.automod = getDefaultAutomod();
      await guild.save();
    }

    res.json(guild.automod);
  } catch (error) {
    logger.error("Error fetching automod settings:", error);
    res.status(500).json({ error: "Failed to fetch automod settings" });
  }
});

// =======================
// Update Automod Settings
// =======================
router.post("/guild/:id", checkGuildPermission("automod"), async (req, res) => {
  try {
    const guildId = req.params.id;
    const updates = req.body;
    const authHeader = req.headers.authorization;

    // Get user info for activity logging
    let user = null;
    if (authHeader) {
      user = await getCachedUser(authHeader.split(" ")[1]);
    }

    let guild = await Guild.findById(guildId);
    if (!guild) {
      guild = new Guild({ _id: guildId });
    }

    if (!guild.automod) {
      guild.automod = getDefaultAutomod();
    }

    // Track changes for activity log
    const changes = [];
    const modules = ["antiSpam", "antiBadWords", "antiInvites", "antiLinks"];

    modules.forEach((module) => {
      if (updates[module]) {
        const oldSettings = guild.automod[module];
        const newSettings = updates[module];

        // Check enabled/disabled toggle
        if (
          newSettings.enabled !== undefined &&
          newSettings.enabled !== oldSettings.enabled
        ) {
          changes.push({
            type: "feature_toggle",
            action: `${
              newSettings.enabled ? "Enabled" : "Disabled"
            } ${module.replace("anti", "Anti-")}`,
            details: {
              field: `automod.${module}.enabled`,
              value: newSettings.enabled,
            },
          });
        }

        // Check other setting changes
        const otherKeys = Object.keys(newSettings).filter(
          (k) => k !== "enabled"
        );
        if (otherKeys.length > 0) {
          if (
            newSettings.enabled === oldSettings.enabled ||
            newSettings.enabled === undefined
          ) {
            changes.push({
              type: "settings_change",
              action: `Updated settings for ${module.replace("anti", "Anti-")}`,
              details: {
                field: `automod.${module}`,
                updates: newSettings,
              },
            });
          }
        }

        // Apply updates
        guild.automod[module] = {
          ...guild.automod[module],
          ...newSettings,
        };
      }
    });

    await guild.save();

    // Log activity
    if (user && changes.length > 0) {
      for (const change of changes) {
        const activity = new ActivityLog({
          guildId,
          userId: user.id,
          username: user.username,
          userAvatar: user.avatar
            ? `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png`
            : null,
          type: change.type,
          action: change.action,
          details: change.details,
        });
        await activity.save();
      }
    }

    res.json({ success: true, automod: guild.automod });
  } catch (error) {
    logger.error("Error updating automod settings:", error);
    res.status(500).json({ error: "Failed to update automod settings" });
  }
});

module.exports = router;
