const express = require("express");
const router = express.Router();
const TicketSettings = require("../models/TicketSettings");
const ActivityLog = require("../models/ActivityLog");
const { checkGuildPermission } = require("../middleware/auth");
const { getCachedUser } = require("../utils/discordCache");
const logger = require("../utils/logger");

// =======================
// Get Ticket Settings
// =======================
router.get("/:guildId", checkGuildPermission("tickets"), async (req, res) => {
  try {
    const { guildId } = req.params;
    let settings = await TicketSettings.findOne({ guildId });

    if (!settings) {
      settings = new TicketSettings({
        guildId,
        ticketTypes: [
          {
            name: "Support",
            buttonLabel: "Open Ticket",
            emoji: "🎫",
            buttonStyle: "PRIMARY",
            enabled: true,
          },
        ],
        limits: { maxOpenTickets: 1 },
      });
      await settings.save();
    }

    res.json(settings);
  } catch (err) {
    logger.error("Error fetching ticket settings:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// =======================
// Update Ticket Settings
// =======================
router.put("/:guildId", checkGuildPermission("tickets"), async (req, res) => {
  try {
    const { guildId } = req.params;
    const updateData = req.body;
    const authHeader = req.headers.authorization;

    const user = await getCachedUser(
      authHeader ? authHeader.split(" ")[1] : null
    );

    // Sanitize ticket types
    if (updateData.ticketTypes) {
      updateData.ticketTypes = updateData.ticketTypes.map((type) => {
        const sanitizedType = {
          ...type,
          buttonStyle: type.buttonStyle || "PRIMARY",
          enabled: type.enabled !== undefined ? type.enabled : true,
        };

        if (
          sanitizedType._id &&
          typeof sanitizedType._id === "string" &&
          sanitizedType._id.startsWith("temp_")
        ) {
          delete sanitizedType._id;
        }

        return sanitizedType;
      });
    }

    let settings = await TicketSettings.findOne({ guildId });
    if (!settings) {
      settings = new TicketSettings({ guildId });
    }

    if (updateData.ticketTypes) settings.ticketTypes = updateData.ticketTypes;
    if (updateData.limits) settings.limits = updateData.limits;
    if (Object.prototype.hasOwnProperty.call(updateData, "panelEmbedId")) {
      settings.panelEmbedId = updateData.panelEmbedId;
    }

    await settings.save();

    // Log Activity
    if (user) {
      await new ActivityLog({
        guildId,
        userId: user.id,
        username: user.username,
        userAvatar: user.avatar
          ? `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png`
          : null,
        type: "tickets_update",
        action: "Updated ticket system settings",
        details: { ticketTypesCount: settings.ticketTypes.length },
      }).save();
    }

    res.json(settings);
  } catch (err) {
    logger.error("Error updating ticket settings:", err);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
