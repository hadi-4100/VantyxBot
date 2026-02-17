const express = require("express");
const router = express.Router();
const Guild = require("../models/Guild");
const User = require("../models/User");
const InviteJoin = require("../models/InviteJoin");
const InviteCode = require("../models/InviteCode");
const ActivityLog = require("../models/ActivityLog");
const { checkGuildPermission } = require("../middleware/auth");
const { getCachedUser } = require("../utils/discordCache");
const logger = require("../utils/logger");

// =======================
// Get Invite Config
// =======================
router.get(
  "/:guildId/config",
  checkGuildPermission("invites"),
  async (req, res) => {
    try {
      const guild = await Guild.findById(req.params.guildId);
      if (!guild) return res.status(404).json({ error: "Guild not found" });
      res.json(guild.invites || {});
    } catch (err) {
      logger.error("Error fetching invite config:", err);
      res.status(500).json({ error: "Server error" });
    }
  }
);

// =======================
// Update Invite Config
// =======================
router.post(
  "/:guildId/config",
  checkGuildPermission("invites"),
  async (req, res) => {
    try {
      const { guildId } = req.params;
      const authHeader = req.headers.authorization;
      const user = await getCachedUser(
        authHeader ? authHeader.split(" ")[1] : null
      );

      const guild = await Guild.findById(guildId);
      if (!guild) return res.status(404).json({ error: "Guild not found" });

      guild.invites = {
        ...guild.invites,
        ...req.body,
      };

      await guild.save();

      // Log Activity
      if (user) {
        await new ActivityLog({
          guildId,
          userId: user.id,
          username: user.username,
          userAvatar: user.avatar
            ? `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png`
            : null,
          type: "invites_update",
          action: "Updated invites configuration",
          details: req.body,
        }).save();
      }

      res.json(guild.invites);
    } catch (err) {
      logger.error("Error updating invite config:", err);
      res.status(500).json({ error: "Server error" });
    }
  }
);

// =======================
// Get Invite Stats & Leaderboard
// =======================
router.get(
  "/:guildId/stats",
  checkGuildPermission("invites"),
  async (req, res) => {
    try {
      // Top 50 inviters
      const users = await User.find({ guildId: req.params.guildId })
        .sort({ "invites.regular": -1 })
        .limit(50);

      const leaderboard = users.map((u) => ({
        userId: u.userId,
        regular: u.invites.regular,
        fake: u.invites.fake,
        bonus: u.invites.bonus,
        leaves: u.invites.leaves,
        total: u.invites.regular + u.invites.bonus - u.invites.leaves,
      }));

      // Recent Joins (last 10)
      const recentJoins = await InviteJoin.find({ guildId: req.params.guildId })
        .sort({ joinedAt: -1 })
        .limit(10);

      // Invite Codes
      const codes = await InviteCode.find({ guildId: req.params.guildId }).sort(
        {
          uses: -1,
        }
      );

      res.json({
        leaderboard,
        recentJoins,
        codes,
      });
    } catch (err) {
      logger.error("Error fetching invite stats:", err);
      res.status(500).json({ error: "Server error" });
    }
  }
);

module.exports = router;
