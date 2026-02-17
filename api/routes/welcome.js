const express = require("express");
const router = express.Router();
const Guild = require("../models/Guild");
const ActivityLog = require("../models/ActivityLog");
const { checkGuildPermission } = require("../middleware/auth");
const { getCachedUser } = require("../utils/discordCache");
const logger = require("../utils/logger");

// =======================
// Helper: Validate Snowflake
// =======================
const isValidSnowflake = (id) => /^\d{17,19}$/.test(id);

// =======================
// Get Welcome/Goodbye Settings
// =======================
router.get("/:guildId", checkGuildPermission("guild"), async (req, res) => {
  try {
    const { guildId } = req.params;
    let guild = await Guild.findById(guildId);
    if (!guild) {
      guild = new Guild({ _id: guildId });
      await guild.save();
    }
    res.json({
      welcome: guild.welcome || {},
      welcomeImage: guild.welcomeImage || {},
      goodbye: guild.goodbye || {},
    });
  } catch (err) {
    logger.error("Error fetching welcome settings:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// =======================
// Update Welcome/Goodbye Settings
// =======================
router.post("/:guildId", checkGuildPermission("guild"), async (req, res) => {
  try {
    const { guildId } = req.params;
    const update = req.body; // { welcome, welcomeImage, goodbye }
    const authHeader = req.headers.authorization;

    // Validation
    if (update.welcome) {
      if (update.welcome.channel && !isValidSnowflake(update.welcome.channel)) {
        return res.status(400).json({ error: "Invalid welcome channel ID" });
      }
      if (update.welcome.autorole?.roles) {
        if (!Array.isArray(update.welcome.autorole.roles)) {
          return res.status(400).json({ error: "Roles must be an array" });
        }
        if (update.welcome.autorole.roles.some((r) => !isValidSnowflake(r))) {
          return res
            .status(400)
            .json({ error: "Invalid role ID in auto-roles" });
        }
      }
    }
    if (
      update.welcomeImage?.channel &&
      !isValidSnowflake(update.welcomeImage.channel)
    ) {
      return res
        .status(400)
        .json({ error: "Invalid welcome image channel ID" });
    }
    if (update.goodbye?.channel && !isValidSnowflake(update.goodbye.channel)) {
      return res.status(400).json({ error: "Invalid goodbye channel ID" });
    }

    const guild = await Guild.findById(guildId);
    if (!guild) return res.status(404).json({ error: "Guild not found" });

    const oldSettings = {
      welcome: guild.welcome,
      welcomeImage: guild.welcomeImage,
      goodbye: guild.goodbye,
    };

    const changes = [];

    // Apply & Track Changes

    // --- Welcome ---
    if (update.welcome) {
      if (!guild.welcome) guild.welcome = {};

      // Enabled
      if (
        update.welcome.enabled !== undefined &&
        update.welcome.enabled !== oldSettings.welcome?.enabled
      ) {
        changes.push({
          type: "feature_toggle",
          action: `${
            update.welcome.enabled ? "Enabled" : "Disabled"
          } welcome messages`,
          details: {
            field: "welcome.enabled",
            oldValue: oldSettings.welcome?.enabled,
            newValue: update.welcome.enabled,
          },
        });
        guild.welcome.enabled = update.welcome.enabled;
      }
      // Message
      if (
        update.welcome.message !== undefined &&
        update.welcome.message !== oldSettings.welcome?.message
      ) {
        changes.push({
          type: "welcome_update",
          action: "Updated welcome message",
          details: {
            field: "welcome.message",
            oldValue: oldSettings.welcome?.message,
            newValue: update.welcome.message,
          },
        });
        guild.welcome.message = update.welcome.message;
      }
      // Channel
      if (
        update.welcome.channel !== undefined &&
        update.welcome.channel !== oldSettings.welcome?.channel
      ) {
        changes.push({
          type: "channel_update",
          action: "Updated welcome channel",
          details: {
            field: "welcome.channel",
            oldValue: oldSettings.welcome?.channel,
            newValue: update.welcome.channel,
          },
        });
        guild.welcome.channel = update.welcome.channel;
      }
      // Delivery
      if (
        update.welcome.delivery !== undefined &&
        update.welcome.delivery !== oldSettings.welcome?.delivery
      ) {
        guild.welcome.delivery = update.welcome.delivery;
      }

      // Auto-role
      if (update.welcome.autorole) {
        if (!guild.welcome.autorole) guild.welcome.autorole = {};

        if (
          update.welcome.autorole.enabled !== undefined &&
          update.welcome.autorole.enabled !==
            oldSettings.welcome?.autorole?.enabled
        ) {
          changes.push({
            type: "feature_toggle",
            action: `${
              update.welcome.autorole.enabled ? "Enabled" : "Disabled"
            } auto-role`,
            details: {
              field: "welcome.autorole.enabled",
              oldValue: oldSettings.welcome?.autorole?.enabled,
              newValue: update.welcome.autorole.enabled,
            },
          });
          guild.welcome.autorole.enabled = update.welcome.autorole.enabled;
        }
        if (update.welcome.autorole.roles !== undefined) {
          guild.welcome.autorole.roles = update.welcome.autorole.roles;
        }
      }
    }

    // --- Welcome Image ---
    if (update.welcomeImage) {
      if (!guild.welcomeImage) guild.welcomeImage = {};

      if (
        update.welcomeImage.enabled !== undefined &&
        update.welcomeImage.enabled !== oldSettings.welcomeImage?.enabled
      ) {
        changes.push({
          type: "feature_toggle",
          action: `${
            update.welcomeImage.enabled ? "Enabled" : "Disabled"
          } welcome image`,
          details: {
            field: "welcomeImage.enabled",
            oldValue: oldSettings.welcomeImage?.enabled,
            newValue: update.welcomeImage.enabled,
          },
        });
        guild.welcomeImage.enabled = update.welcomeImage.enabled;
      }

      // Update other fields directly
      const fields = [
        "delivery",
        "channel",
        "background",
        "bgMode",
        "elements",
      ];
      fields.forEach((f) => {
        if (update.welcomeImage[f] !== undefined)
          guild.welcomeImage[f] = update.welcomeImage[f];
      });
    }

    // --- Goodbye ---
    if (update.goodbye) {
      if (!guild.goodbye) guild.goodbye = {};

      if (
        update.goodbye.enabled !== undefined &&
        update.goodbye.enabled !== oldSettings.goodbye?.enabled
      ) {
        changes.push({
          type: "feature_toggle",
          action: `${
            update.goodbye.enabled ? "Enabled" : "Disabled"
          } goodbye messages`,
          details: {
            field: "goodbye.enabled",
            oldValue: oldSettings.goodbye?.enabled,
            newValue: update.goodbye.enabled,
          },
        });
        guild.goodbye.enabled = update.goodbye.enabled;
      }
      if (
        update.goodbye.message !== undefined &&
        update.goodbye.message !== oldSettings.goodbye?.message
      ) {
        changes.push({
          type: "goodbye_update",
          action: "Updated goodbye message",
          details: {
            field: "goodbye.message",
            oldValue: oldSettings.goodbye?.message,
            newValue: update.goodbye.message,
          },
        });
        guild.goodbye.message = update.goodbye.message;
      }
      if (
        update.goodbye.channel !== undefined &&
        update.goodbye.channel !== oldSettings.goodbye?.channel
      ) {
        changes.push({
          type: "channel_update",
          action: "Updated goodbye channel",
          details: {
            field: "goodbye.channel",
            oldValue: oldSettings.goodbye?.channel,
            newValue: update.goodbye.channel,
          },
        });
        guild.goodbye.channel = update.goodbye.channel;
      }
    }

    await guild.save();

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

    res.json({
      welcome: guild.welcome,
      welcomeImage: guild.welcomeImage,
      goodbye: guild.goodbye,
    });
  } catch (err) {
    logger.error("Error updating welcome settings:", err);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
