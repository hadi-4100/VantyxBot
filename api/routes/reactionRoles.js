const express = require("express");
const router = express.Router();
const Guild = require("../models/Guild");
const ActivityLog = require("../models/ActivityLog");
const { checkGuildPermission } = require("../middleware/auth");
const { getCachedUser } = require("../utils/discordCache");
const logger = require("../utils/logger");

// =======================
// Get Reaction Role Settings
// =======================
router.get("/:id", checkGuildPermission("guild"), async (req, res) => {
  try {
    const guildId = req.params.id;
    let guild = await Guild.findById(guildId);
    if (!guild) {
      guild = new Guild({ _id: guildId });
      await guild.save();
    }
    res.json(guild.reactionRoles || { enabled: false, messages: [] });
  } catch (error) {
    logger.error("Error fetching reaction roles:", error);
    res.status(500).json({ error: "Failed to fetch reaction roles" });
  }
});

// =======================
// Update Reaction Role Settings
// =======================
router.post("/:id", checkGuildPermission("guild"), async (req, res) => {
  try {
    const guildId = req.params.id;
    const { enabled, messages } = req.body;
    const authHeader = req.headers.authorization;

    // Validation
    if (messages && messages.length > 3) {
      return res
        .status(400)
        .json({ error: "Maximum 3 reaction role messages allowed" });
    }

    if (messages && messages.length > 0) {
      for (const msg of messages) {
        if (!msg.roles || msg.roles.length === 0) {
          return res.status(400).json({
            error: "Each reaction role message must have at least one role",
          });
        }
        if (!msg.channelId) {
          return res.status(400).json({
            error: "Each reaction role message must have a target channel",
          });
        }
      }
    }

    const guild = await Guild.findByIdAndUpdate(
      guildId,
      {
        $set: {
          "reactionRoles.enabled": enabled,
          "reactionRoles.messages": messages,
        },
      },
      { new: true, upsert: true }
    );

    // Activity Log
    const user = await getCachedUser(
      authHeader ? authHeader.split(" ")[1] : null
    );
    if (user) {
      await new ActivityLog({
        guildId,
        userId: user.id,
        username: user.username,
        userAvatar: user.avatar
          ? `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png`
          : null,
        type: "reaction_role_update",
        action: "Updated reaction roles configuration",
        details: { enabled, messagesCount: messages ? messages.length : 0 },
      }).save();
    }

    res.json(guild.reactionRoles);
  } catch (error) {
    logger.error("Error updating reaction roles:", error);
    res.status(500).json({ error: "Failed to update reaction roles" });
  }
});

module.exports = router;
