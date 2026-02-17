const express = require("express");
const router = express.Router();
const Guild = require("../models/Guild");
const Warning = require("../models/Warning");
const ActivityLog = require("../models/ActivityLog");
const { checkGuildPermission } = require("../middleware/auth");
const { getCachedUser } = require("../utils/discordCache");
const config = require("../../config");
const logger = require("../utils/logger");

// =======================
// Get Warning Settings
// =======================
router.get("/guild/:id/settings", async (req, res) => {
  try {
    const guild = await Guild.findById(req.params.id);
    if (!guild) return res.status(404).json({ error: "Guild not found" });
    res.json(guild.warnings);
  } catch (error) {
    logger.error("Error fetching warning settings:", error);
    res.status(500).json({ error: "Failed to fetch settings" });
  }
});

// =======================
// Update Warning Settings
// =======================
router.post(
  "/guild/:id/settings",
  checkGuildPermission("warnings"),
  async (req, res) => {
    try {
      const { enabled, resetAfterDays } = req.body;
      const guildId = req.params.id;
      const authHeader = req.headers.authorization;

      const user = await getCachedUser(
        authHeader ? authHeader.split(" ")[1] : null
      );

      const oldGuild = await Guild.findById(guildId);
      const guild = await Guild.findByIdAndUpdate(
        guildId,
        {
          $set: {
            "warnings.enabled": enabled,
            "warnings.resetAfterDays": resetAfterDays,
          },
        },
        { new: true }
      );

      // Log activity
      if (user) {
        const changes = [];

        if (oldGuild.warnings.enabled !== enabled) {
          changes.push({
            type: "feature_toggle",
            action: `${enabled ? "Enabled" : "Disabled"} Warnings System`,
          });
        }

        if (oldGuild.warnings.resetAfterDays !== resetAfterDays) {
          changes.push({
            type: "warnings_update",
            action: `Updated warning reset period to ${
              resetAfterDays === 0 ? "never" : `${resetAfterDays} days`
            }`,
            details: {
              field: "resetAfterDays",
              oldValue: oldGuild.warnings.resetAfterDays,
              newValue: resetAfterDays,
            },
          });
        }

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
            details: change.details || {},
          }).save();
        }
      }

      res.json(guild.warnings);
    } catch (error) {
      logger.error("Error updating warning settings:", error);
      res.status(500).json({ error: "Failed to update settings" });
    }
  }
);

// =======================
// Get Warning Levels
// =======================
router.get(
  "/guild/:id/levels",
  checkGuildPermission("warnings"),
  async (req, res) => {
    try {
      const guild = await Guild.findById(req.params.id);
      if (!guild) return res.status(404).json({ error: "Guild not found" });
      res.json(
        guild.warnings.actions.sort((a, b) => a.threshold - b.threshold)
      );
    } catch (error) {
      logger.error("Error fetching warning levels:", error);
      res.status(500).json({ error: "Failed to fetch levels" });
    }
  }
);

// =======================
// Add/Update Warning Level
// =======================
router.post(
  "/guild/:id/levels",
  checkGuildPermission("warnings"),
  async (req, res) => {
    try {
      const { threshold, action, duration } = req.body;
      const guildId = req.params.id;
      const authHeader = req.headers.authorization;

      const user = await getCachedUser(
        authHeader ? authHeader.split(" ")[1] : null
      );

      const guild = await Guild.findById(guildId);
      if (!guild) return res.status(404).json({ error: "Guild not found" });

      const existingIndex = guild.warnings.actions.findIndex(
        (a) => a.threshold === threshold
      );

      let logAction = "";
      if (existingIndex > -1) {
        logAction = `Updated warning level ${threshold} (${action})`;
        guild.warnings.actions[existingIndex] = { threshold, action, duration };
      } else {
        logAction = `Added warning level ${threshold} (${action})`;
        guild.warnings.actions.push({ threshold, action, duration });
      }

      guild.warnings.actions.sort((a, b) => a.threshold - b.threshold);
      await guild.save();

      if (user) {
        await new ActivityLog({
          guildId,
          userId: user.id,
          username: user.username,
          userAvatar: user.avatar
            ? `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png`
            : null,
          type: "warnings_update",
          action: logAction,
          details: {
            threshold,
            action,
            duration,
          },
        }).save();
      }

      res.json(guild.warnings.actions);
    } catch (error) {
      logger.error("Error saving warning level:", error);
      res.status(500).json({ error: "Failed to save level" });
    }
  }
);

// =======================
// Delete Warning Level
// =======================
router.delete(
  "/guild/:id/levels/:threshold",
  checkGuildPermission("warnings"),
  async (req, res) => {
    try {
      const guildId = req.params.id;
      const threshold = parseInt(req.params.threshold);
      const authHeader = req.headers.authorization;

      const user = await getCachedUser(
        authHeader ? authHeader.split(" ")[1] : null
      );

      const guild = await Guild.findById(guildId);
      if (!guild) return res.status(404).json({ error: "Guild not found" });

      const deletedLevel = guild.warnings.actions.find(
        (a) => a.threshold === threshold
      );
      guild.warnings.actions = guild.warnings.actions.filter(
        (a) => a.threshold !== threshold
      );
      await guild.save();

      if (user && deletedLevel) {
        await new ActivityLog({
          guildId,
          userId: user.id,
          username: user.username,
          userAvatar: user.avatar
            ? `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png`
            : null,
          type: "warnings_update",
          action: `Deleted warning level ${threshold} (${deletedLevel.action})`,
          details: {
            threshold,
            action: deletedLevel.action,
          },
        }).save();
      }

      res.json({ success: true });
    } catch (error) {
      logger.error("Error deleting warning level:", error);
      res.status(500).json({ error: "Failed to delete level" });
    }
  }
);

// =======================
// Get Users with Warnings
// =======================
router.get(
  "/guild/:id/users",
  checkGuildPermission("warnings"),
  async (req, res) => {
    try {
      const warnings = await Warning.find({ guildId: req.params.id });

      const userWarnings = {};
      warnings.forEach((w) => {
        if (!userWarnings[w.userId]) {
          userWarnings[w.userId] = {
            userId: w.userId,
            count: 0,
            lastWarning: w.timestamp,
            warnings: [],
          };
        }
        userWarnings[w.userId].count++;
        if (w.timestamp > userWarnings[w.userId].lastWarning) {
          userWarnings[w.userId].lastWarning = w.timestamp;
        }
        userWarnings[w.userId].warnings.push(w);
      });

      const users = Object.values(userWarnings);
      const populatedUsers = await Promise.all(
        users.map(async (u) => {
          try {
            const response = await fetch(
              `https://discord.com/api/v10/users/${u.userId}`,
              {
                headers: { Authorization: `Bot ${config.DISCORD_TOKEN}` },
              }
            );
            if (response.ok) {
              const discordUser = await response.json();
              return { ...u, user: discordUser };
            }
            return {
              ...u,
              user: { username: "Unknown User", discriminator: "0000" },
            };
          } catch (e) {
            return {
              ...u,
              user: { username: "Unknown User", discriminator: "0000" },
            };
          }
        })
      );

      res.json(populatedUsers);
    } catch (error) {
      logger.error("Error fetching warned users:", error);
      res.status(500).json({ error: "Failed to fetch users" });
    }
  }
);

// =======================
// Get User Details
// =======================
router.get(
  "/guild/:id/users/:userId/details",
  checkGuildPermission("warnings"),
  async (req, res) => {
    try {
      const warnings = await Warning.find({
        guildId: req.params.id,
        userId: req.params.userId,
      }).sort({ timestamp: -1 });

      const populatedWarnings = await Promise.all(
        warnings.map(async (w) => {
          try {
            const response = await fetch(
              `https://discord.com/api/v10/users/${w.moderatorId}`,
              {
                headers: { Authorization: `Bot ${config.DISCORD_TOKEN}` },
              }
            );
            const moderator = response.ok
              ? await response.json()
              : { username: "Unknown" };
            return { ...w.toObject(), moderator };
          } catch (e) {
            return { ...w.toObject(), moderator: { username: "Unknown" } };
          }
        })
      );

      res.json(populatedWarnings);
    } catch (error) {
      logger.error("Error fetching warning details:", error);
      res.status(500).json({ error: "Failed to fetch details" });
    }
  }
);

// =======================
// Remove Warning
// =======================
router.post(
  "/guild/:id/users/:userId/remove",
  checkGuildPermission("warnings"),
  async (req, res) => {
    try {
      const { warningId } = req.body;
      if (warningId) {
        await Warning.findByIdAndDelete(warningId);
      } else {
        const latest = await Warning.findOne({
          guildId: req.params.id,
          userId: req.params.userId,
        }).sort({ timestamp: -1 });
        if (latest) await Warning.findByIdAndDelete(latest._id);
      }
      res.json({ success: true });
    } catch (error) {
      logger.error("Error removing warning:", error);
      res.status(500).json({ error: "Failed to remove warning" });
    }
  }
);

// =======================
// Remove All Warnings
// =======================
router.post(
  "/guild/:id/users/:userId/removeAll",
  checkGuildPermission("warnings"),
  async (req, res) => {
    try {
      await Warning.deleteMany({
        guildId: req.params.id,
        userId: req.params.userId,
      });
      res.json({ success: true });
    } catch (error) {
      logger.error("Error removing all warnings:", error);
      res.status(500).json({ error: "Failed to remove warnings" });
    }
  }
);

// =======================
// Add Warning
// =======================
router.post(
  "/guild/:id/addWarning",
  checkGuildPermission("warnings"),
  async (req, res) => {
    try {
      const { userId, moderatorId, reason } = req.body;

      const warning = new Warning({
        guildId: req.params.id,
        userId,
        moderatorId,
        reason,
      });
      await warning.save();

      // Check punishments
      const guild = await Guild.findById(req.params.id);
      if (guild.warnings.enabled) {
        const count = await Warning.countDocuments({
          guildId: req.params.id,
          userId,
        });

        const punishment = guild.warnings.actions.find(
          (a) => a.threshold === count
        );

        if (punishment && punishment.action !== "none") {
          logger.info(
            `Triggering punishment: ${punishment.action} for user ${userId}`
          );
        }
      }

      res.json({ success: true, warning });
    } catch (error) {
      logger.error("Error adding warning:", error);
      res.status(500).json({ error: "Failed to add warning" });
    }
  }
);

// =======================
// Batch Update Actions
// =======================
router.post(
  "/guild/:id/batch-update",
  checkGuildPermission("warnings"),
  async (req, res) => {
    try {
      const { actions } = req.body;
      const guildId = req.params.id;
      const authHeader = req.headers.authorization;

      const user = await getCachedUser(
        authHeader ? authHeader.split(" ")[1] : null
      );
      const activityLogs = [];

      for (const action of actions) {
        if (action.type === "removeLast") {
          const latest = await Warning.findOne({
            guildId,
            userId: action.userId,
          }).sort({ timestamp: -1 });
          if (latest) {
            await Warning.findByIdAndDelete(latest._id);
            activityLogs.push({
              action: `Removed last warning for user ${action.userId}`,
              details: { userId: action.userId, type: "removeLast" },
            });
          }
        } else if (action.type === "clearAll") {
          const count = await Warning.countDocuments({
            guildId,
            userId: action.userId,
          });
          await Warning.deleteMany({
            guildId,
            userId: action.userId,
          });
          activityLogs.push({
            action: `Cleared all ${count} warnings for user ${action.userId}`,
            details: { userId: action.userId, type: "clearAll", count },
          });
        } else if (action.type === "removeSpecific") {
          await Warning.findByIdAndDelete(action.warningId);
          activityLogs.push({
            action: `Removed specific warning for user ${action.userId}`,
            details: {
              userId: action.userId,
              warningId: action.warningId,
              type: "removeSpecific",
            },
          });
        }
      }

      if (user && activityLogs.length > 0) {
        for (const log of activityLogs) {
          await new ActivityLog({
            guildId,
            userId: user.id,
            username: user.username,
            userAvatar: user.avatar
              ? `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png`
              : null,
            type: "warnings_update",
            action: log.action,
            details: log.details,
          }).save();
        }
      }

      res.json({ success: true });
    } catch (error) {
      logger.error("Error processing batch updates:", error);
      res.status(500).json({ error: "Failed to process batch updates" });
    }
  }
);

module.exports = router;
