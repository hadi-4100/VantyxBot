const express = require("express");
const router = express.Router();
const Giveaway = require("../models/Giveaway");
const ActivityLog = require("../models/ActivityLog");
const { checkGuildPermission } = require("../middleware/auth");
const { getCachedUser } = require("../utils/discordCache");
const logger = require("../utils/logger");

// =======================
// Get All Giveaways
// =======================
router.get("/:guildId", checkGuildPermission("giveaways"), async (req, res) => {
  try {
    const { guildId } = req.params;
    const giveaways = await Giveaway.find({ guildId }).sort({ startAt: -1 });
    res.json(giveaways);
  } catch (err) {
    logger.error("Error fetching giveaways:", err);
    res.status(500).json({ error: "Failed to fetch giveaways" });
  }
});

// =======================
// Create Giveaway
// =======================
router.post(
  "/:guildId/create",
  checkGuildPermission("giveaways"),
  async (req, res) => {
    try {
      const { guildId } = req.params;
      const {
        prize,
        winnerCount,
        duration,
        channelId,
        requirements,
        type,
        hostedBy,
      } = req.body;
      const authHeader = req.headers.authorization;

      if (!prize || !winnerCount || !duration || !channelId) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      const endAt = Date.now() + duration;

      const giveaway = new Giveaway({
        guildId,
        channelId,
        prize,
        winnerCount,
        startAt: Date.now(),
        endAt,
        hostedBy: hostedBy || "Dashboard",
        type: type || "normal",
        requirements: requirements || {},
        entries: [],
        messageId: null, // Will be set by bot
        action: "start", // Pending start
      });

      await giveaway.save();

      // Log Activity
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
          type: "giveaway_create",
          action: `Created giveaway: ${prize}`,
          details: { id: giveaway._id, prize, channelId },
        }).save();
      }

      res.status(201).json(giveaway);
    } catch (err) {
      logger.error("Error creating giveaway:", err);
      res.status(500).json({ error: "Failed to create giveaway" });
    }
  }
);

// =======================
// End Giveaway
// =======================
router.post(
  "/:guildId/:id/end",
  checkGuildPermission("giveaways"),
  async (req, res) => {
    try {
      const { id, guildId } = req.params;
      const authHeader = req.headers.authorization;

      await Giveaway.findByIdAndUpdate(id, { action: "end" });

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
          type: "giveaway_end",
          action: "Ended giveaway manually",
          details: { id },
        }).save();
      }

      res.json({ success: true });
    } catch (err) {
      logger.error("Error ending giveaway:", err);
      res.status(500).json({ error: "Failed to end giveaway" });
    }
  }
);

// =======================
// Reroll Giveaway
// =======================
router.post(
  "/:guildId/:id/reroll",
  checkGuildPermission("giveaways"),
  async (req, res) => {
    try {
      const { id, guildId } = req.params;
      const authHeader = req.headers.authorization;

      await Giveaway.findByIdAndUpdate(id, { action: "reroll" });

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
          type: "giveaway_reroll",
          action: "Rerolled giveaway winners",
          details: { id },
        }).save();
      }

      res.json({ success: true });
    } catch (err) {
      logger.error("Error rerolling giveaway:", err);
      res.status(500).json({ error: "Failed to reroll giveaway" });
    }
  }
);

// =======================
// Delete Giveaway
// =======================
router.delete(
  "/:guildId/:id",
  checkGuildPermission("giveaways"),
  async (req, res) => {
    try {
      const { id, guildId } = req.params;
      const authHeader = req.headers.authorization;

      // Mark for deletion by bot
      await Giveaway.findByIdAndUpdate(id, { action: "delete" });

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
          type: "giveaway_delete",
          action: "Deleted giveaway",
          details: { id },
        }).save();
      }

      res.json({ success: true });
    } catch (err) {
      logger.error("Error deleting giveaway:", err);
      res.status(500).json({ error: "Failed to delete giveaway" });
    }
  }
);

// =======================
// Edit Giveaway
// =======================
router.patch(
  "/:guildId/:id",
  checkGuildPermission("giveaways"),
  async (req, res) => {
    try {
      const { id, guildId } = req.params;
      const updates = req.body;
      const authHeader = req.headers.authorization;

      // Mark for edit by bot
      await Giveaway.findByIdAndUpdate(id, { ...updates, action: "edit" });

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
          type: "giveaway_update",
          action: "Updated giveaway settings",
          details: { id, updates },
        }).save();
      }

      res.json({ success: true });
    } catch (err) {
      logger.error("Error editing giveaway:", err);
      res.status(500).json({ error: "Failed to edit giveaway" });
    }
  }
);

module.exports = router;
