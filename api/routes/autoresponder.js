const express = require("express");
const router = express.Router({ mergeParams: true });
const Guild = require("../models/Guild");
const ActivityLog = require("../models/ActivityLog");
const { checkGuildPermission } = require("../middleware/auth");
const { getCachedUser } = require("../utils/discordCache");
const logger = require("../utils/logger");

// =======================
// Get Auto-Responder Settings
// =======================
router.get(
  "/guild/:id",
  checkGuildPermission("autoresponder"),
  async (req, res) => {
    const { id } = req.params;
    try {
      let guild = await Guild.findById(id);
      if (!guild) {
        guild = new Guild({ _id: id });
        await guild.save();
      }
      res.json({
        enabled: guild.autoResponder?.enabled || false,
        responses: guild.autoResponder?.responses || [],
      });
    } catch (error) {
      logger.error("GET AutoResponder Error:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  }
);

// =======================
// Create/Update Auto-Responder Config
// =======================
router.post(
  "/guild/:id",
  checkGuildPermission("autoresponder"),
  async (req, res) => {
    const { id } = req.params;
    const authHeader = req.headers.authorization;

    const {
      trigger,
      response,
      responseType,
      enabledRoles,
      disabledRoles,
      enabledChannels,
      disabledChannels,
      enabled,
    } = req.body;

    try {
      // Get user info for activity logging
      let user = null;
      if (authHeader) {
        user = await getCachedUser(authHeader.split(" ")[1]);
      }

      const guild = await Guild.findById(id);
      if (!guild) return res.status(404).json({ error: "Guild not found" });

      // Bulk update (Save System)
      if (req.body.responses && Array.isArray(req.body.responses)) {
        guild.autoResponder.responses = req.body.responses;
        if (enabled !== undefined) guild.autoResponder.enabled = enabled;
        await guild.save();

        if (user) {
          await new ActivityLog({
            guildId: id,
            userId: user.id,
            username: user.username,
            userAvatar: user.avatar
              ? `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png`
              : null,
            type: "autoresponder_bulk_update",
            action: "Updated Auto-Responder configuration",
          }).save();
        }

        return res.json({
          success: true,
          enabled: guild.autoResponder.enabled,
          responses: guild.autoResponder.responses,
        });
      }

      // Feature Toggle (Legacy)
      if (enabled !== undefined && trigger === undefined) {
        guild.autoResponder.enabled = enabled;
        await guild.save();

        if (user) {
          await new ActivityLog({
            guildId: id,
            userId: user.id,
            username: user.username,
            userAvatar: user.avatar
              ? `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png`
              : null,
            type: "feature_toggle",
            action: `${enabled ? "Enabled" : "Disabled"} Auto-Responder`,
          }).save();
        }

        return res.json({
          success: true,
          enabled: guild.autoResponder.enabled,
          responses: guild.autoResponder.responses,
        });
      }

      // Validate trigger and response
      if (!trigger || trigger.trim().length === 0) {
        return res.status(400).json({ error: "Trigger cannot be empty" });
      }
      if (!response || response.trim().length === 0) {
        return res.status(400).json({ error: "Response cannot be empty" });
      }
      if (trigger.length > 100) {
        return res
          .status(400)
          .json({ error: "Trigger must be 100 characters or less" });
      }
      if (response.length > 2000) {
        return res
          .status(400)
          .json({ error: "Response must be 2000 characters or less" });
      }

      // Add new response
      const newResponse = {
        trigger: trigger.trim(),
        response: response.trim(),
        responseType: responseType || "normal",
        enabledRoles: enabledRoles || [],
        disabledRoles: disabledRoles || [],
        enabledChannels: enabledChannels || [],
        disabledChannels: disabledChannels || [],
      };

      if (!guild.autoResponder) {
        guild.autoResponder = { enabled: false, responses: [] };
      }

      // Check duplications
      const exists = guild.autoResponder.responses.some(
        (r) => r.trigger.toLowerCase() === trigger.trim().toLowerCase()
      );
      if (exists) {
        return res.status(400).json({ error: "This trigger already exists!" });
      }

      // Limit check
      if (guild.autoResponder.responses.length >= 50) {
        return res
          .status(400)
          .json({ error: "Maximum of 50 auto-responses per server reached" });
      }

      guild.autoResponder.responses.push(newResponse);
      await guild.save();

      if (user) {
        await new ActivityLog({
          guildId: id,
          userId: user.id,
          username: user.username,
          userAvatar: user.avatar
            ? `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png`
            : null,
          type: "autoresponder_add",
          action: `Added auto-response trigger: ${trigger.trim()}`,
        }).save();
      }

      res.json({ success: true, responses: guild.autoResponder.responses });
    } catch (error) {
      logger.error("POST AutoResponder Error:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  }
);

// =======================
// Update Trigger
// =======================
router.patch(
  "/guild/:id/:triggerId",
  checkGuildPermission("autoresponder"),
  async (req, res) => {
    const { id, triggerId } = req.params;
    const updateData = req.body;
    const authHeader = req.headers.authorization;

    try {
      let user = null;
      if (authHeader) {
        user = await getCachedUser(authHeader.split(" ")[1]);
      }

      const guild = await Guild.findById(id);
      if (!guild) return res.status(404).json({ error: "Guild not found" });

      if (!guild.autoResponder || !guild.autoResponder.responses) {
        return res.status(404).json({ error: "No auto-responder configured" });
      }

      const index = guild.autoResponder.responses.findIndex(
        (r) => r._id.toString() === triggerId
      );
      if (index === -1)
        return res.status(404).json({ error: "Response not found" });

      // Validate updated trigger
      if (updateData.trigger !== undefined) {
        if (!updateData.trigger || updateData.trigger.trim().length === 0) {
          return res.status(400).json({ error: "Trigger cannot be empty" });
        }
        if (updateData.trigger.length > 100) {
          return res
            .status(400)
            .json({ error: "Trigger must be 100 characters or less" });
        }

        // Check duplications
        const exists = guild.autoResponder.responses.some(
          (r) =>
            r.trigger.toLowerCase() ===
              updateData.trigger.trim().toLowerCase() &&
            r._id.toString() !== triggerId
        );
        if (exists) {
          return res
            .status(400)
            .json({ error: "This trigger already exists!" });
        }
      }

      // Validate updated response
      if (updateData.response !== undefined) {
        if (!updateData.response || updateData.response.trim().length === 0) {
          return res.status(400).json({ error: "Response cannot be empty" });
        }
        if (updateData.response.length > 2000) {
          return res
            .status(400)
            .json({ error: "Response must be 2000 characters or less" });
        }
      }

      // Update fields
      Object.keys(updateData).forEach((key) => {
        if (
          guild.autoResponder.responses[index][key] !== undefined ||
          key === "trigger" ||
          key === "response"
        ) {
          const value =
            typeof updateData[key] === "string"
              ? updateData[key].trim()
              : updateData[key];
          guild.autoResponder.responses[index][key] = value;
        }
      });

      await guild.save();

      if (user) {
        await new ActivityLog({
          guildId: id,
          userId: user.id,
          username: user.username,
          userAvatar: user.avatar
            ? `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png`
            : null,
          type: "autoresponder_update",
          action: `Updated auto-response trigger: ${guild.autoResponder.responses[index].trigger}`,
        }).save();
      }

      res.json({ success: true, responses: guild.autoResponder.responses });
    } catch (error) {
      logger.error("PATCH AutoResponder Error:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  }
);

// =======================
// Delete Trigger
// =======================
router.delete(
  "/guild/:id/:triggerId",
  checkGuildPermission("autoresponder"),
  async (req, res) => {
    const { id, triggerId } = req.params;
    const authHeader = req.headers.authorization;

    try {
      let user = null;
      if (authHeader) {
        user = await getCachedUser(authHeader.split(" ")[1]);
      }

      const guild = await Guild.findById(id);
      if (!guild) return res.status(404).json({ error: "Guild not found" });

      if (!guild.autoResponder || !guild.autoResponder.responses) {
        return res.status(404).json({ error: "No auto-responder configured" });
      }

      const responseToDelete = guild.autoResponder.responses.find(
        (r) => r._id.toString() === triggerId
      );
      if (!responseToDelete)
        return res.status(404).json({ error: "Response not found" });

      guild.autoResponder.responses = guild.autoResponder.responses.filter(
        (r) => r._id.toString() !== triggerId
      );
      await guild.save();

      if (user) {
        await new ActivityLog({
          guildId: id,
          userId: user.id,
          username: user.username,
          userAvatar: user.avatar
            ? `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png`
            : null,
          type: "autoresponder_delete",
          action: `Deleted auto-response trigger: ${responseToDelete.trigger}`,
        }).save();
      }

      res.json({ success: true, responses: guild.autoResponder.responses });
    } catch (error) {
      logger.error("DELETE AutoResponder Error:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  }
);

module.exports = router;
