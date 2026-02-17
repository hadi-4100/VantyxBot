const express = require("express");
const router = express.Router();
const Giveaway = require("../models/Giveaway");
const Warning = require("../models/Warning");
const User = require("../models/User");
const DashboardUser = require("../models/DashboardUser");
const Stats = require("../models/Stats");
const { getCachedUser, getCachedUserGuilds } = require("../utils/discordCache");
const logger = require("../utils/logger");

// =======================
// Get Profile Stats
// =======================
router.get("/stats", async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: "No token provided" });

  try {
    const token = authHeader.split(" ")[1];
    const user = await getCachedUser(token);
    if (!user) return res.status(401).json({ error: "User not found" });

    const userId = user.id;

    // 1. Giveaway Stats
    const giveawayStats = await Giveaway.aggregate([
      {
        $facet: {
          participated: [{ $match: { entries: userId } }, { $count: "count" }],
          won: [{ $match: { winners: userId } }, { $count: "count" }],
        },
      },
    ]);

    // 2. Moderation Stats
    const warningCount = await Warning.countDocuments({ userId });

    // 3. Engagement Stats (XP/Levels)
    const xpStats = await User.aggregate([
      { $match: { userId } },
      {
        $group: {
          _id: "$userId",
          totalXp: { $sum: "$xp" },
          avgLevel: { $avg: "$level" },
          highestLevel: { $max: "$level" },
          guildsCount: { $count: {} },
        },
      },
    ]);

    // 4. Milestone Stats (First Login)
    const dbUser = await DashboardUser.findOne({ userId });

    // 5. Admin Server Count (Bot installed + Admin permission)
    const guilds = await getCachedUserGuilds(token);
    const adminGuilds = guilds.filter((g) => (g.permissions & 0x20) === 0x20);

    const globalStats = await Stats.findById("global");
    const botGuilds = globalStats ? globalStats.guildData || [] : [];
    const botGuildIds = new Set(botGuilds.map((g) => g.id));

    const adminServersWithBot = adminGuilds.filter((g) =>
      botGuildIds.has(g.id),
    ).length;

    res.json({
      giveaways: {
        participated: giveawayStats[0]?.participated[0]?.count || 0,
        won: giveawayStats[0]?.won[0]?.count || 0,
      },
      moderation: {
        totalWarnings: warningCount,
      },
      engagement: {
        totalXp: xpStats[0]?.totalXp || 0,
        avgLevel: Math.round(xpStats[0]?.avgLevel || 0),
        highestLevel: xpStats[0]?.highestLevel || 0,
        guildsActive: xpStats[0]?.guildsCount || 0,
      },
      milestones: {
        firstLogin: dbUser?.firstLogin || null,
        lastLogin: dbUser?.lastLogin || null,
      },
      admin: {
        managedServers: adminServersWithBot,
      },
    });
  } catch (error) {
    logger.error("Error fetching profile stats:", error);
    res.status(500).json({ error: "Failed to fetch profile statistics" });
  }
});

module.exports = router;
