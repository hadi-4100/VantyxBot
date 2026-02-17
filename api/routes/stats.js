const express = require("express");
const router = express.Router();
const Stats = require("../models/Stats");
const GuildStats = require("../models/GuildStats");
const ActivityLog = require("../models/ActivityLog");
const logger = require("../utils/logger");

// Cache for global stats
let globalStatsCache = null;
let lastCacheUpdate = 0;
const CACHE_DURATION = 60 * 1000; // 1 minute

// =======================
// Get Global Stats
// =======================
router.get("/", async (req, res) => {
  try {
    if (globalStatsCache && Date.now() - lastCacheUpdate < CACHE_DURATION) {
      return res.json(globalStatsCache);
    }

    const stats = await Stats.findById("global");
    if (!stats) {
      return res.json({
        totalGuilds: 0,
        totalUsers: 0,
        totalCommands: 0,
        uptime: 0,
        trends: {
          guilds: { value: "+0%", isPositive: true },
          users: { value: "+0%", isPositive: true },
          commands: { value: "+0%", isPositive: true },
        },
        chartData: { labels: [], data: [] },
        topCommands: [],
        performance: { ping: "0ms", activeServers: 0 },
      });
    }

    const isOnline =
      Date.now() - new Date(stats.lastUpdated).getTime() < 2 * 60 * 1000;
    const uptime = isOnline ? Date.now() - stats.startTime : 0;

    const calculateTrend = (current, previous) => {
      if (!previous) return { value: "+0%", isPositive: true };
      const diff = current - previous;
      const percentage = (diff / previous) * 100;
      return {
        value: `${diff >= 0 ? "+" : ""}${percentage.toFixed(1)}%`,
        isPositive: diff >= 0,
      };
    };

    const last7Days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split("T")[0];
      const found = (stats.dailyCommands || []).find((c) => c.date === dateStr);
      last7Days.push({
        date: dateStr,
        count: found ? found.count : 0,
        label: d.toLocaleDateString("en-US", { weekday: "short" }),
      });
    }

    const chartLabels = last7Days.map((d) => d.label);
    const chartValues = last7Days.map((d) => d.count);

    const topCommands = (stats.commandUsage || [])
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)
      .map((cmd, index) => ({
        name: cmd.command,
        count:
          cmd.count >= 1000 ? `${(cmd.count / 1000).toFixed(1)}k` : cmd.count,
        percent:
          stats.totalCommands > 0
            ? Math.round((cmd.count / stats.totalCommands) * 100)
            : 0,
        rank: index + 1,
      }));

    const responseData = {
      totalGuilds: stats.totalGuilds,
      totalUsers: stats.totalUsers,
      totalCommands: stats.totalCommands,
      uptime: uptime,
      trends: {
        guilds: calculateTrend(stats.totalGuilds, stats.previousGuilds),
        users: calculateTrend(stats.totalUsers, stats.previousUsers),
        commands: calculateTrend(stats.totalCommands, stats.previousCommands),
      },
      chartData: {
        labels: chartLabels,
        data: chartValues,
      },
      topCommands: topCommands,
      performance: {
        ping: `${stats.averageResponseTime || 0}ms`,
        activeServers: stats.activeServersCount || stats.totalGuilds,
      },
    };

    globalStatsCache = responseData;
    lastCacheUpdate = Date.now();

    res.json(responseData);
  } catch (err) {
    logger.error(err);
    res.status(500).json({ error: "Server Error" });
  }
});

// =======================
// Get Guild-Specific Stats
// =======================
router.get("/guild/:id", async (req, res) => {
  try {
    const guildId = req.params.id;
    let guildStats = await GuildStats.findOne({ guildId });

    if (!guildStats) {
      guildStats = new GuildStats({
        guildId,
        hourlyStats: [],
        dailyStats: [],
        totalMembers: 0,
      });
      await guildStats.save();
    }

    const getDayKey = (date) => {
      return date.toISOString().split("T")[0];
    };

    const now = new Date();
    const last7Days = [];

    for (let i = 6; i >= 0; i--) {
      const day = new Date(now);
      day.setDate(day.getDate() - i);

      const dayKey = getDayKey(day);

      last7Days.push({
        dayKey: dayKey,
        label: day.toLocaleDateString("en-US", {
          weekday: "short",
          timeZone: "UTC",
        }),
        messages: 0,
        joins: 0,
        leaves: 0,
      });
    }

    const previous7Days = [];
    for (let i = 13; i >= 7; i--) {
      const day = new Date(now);
      day.setDate(day.getDate() - i);

      const dayKey = getDayKey(day);

      previous7Days.push({
        dayKey: dayKey,
        messages: 0,
        joins: 0,
        leaves: 0,
      });
    }

    // Populate data from dailyStats (which stores 30 days of data)
    if (guildStats.dailyStats) {
      guildStats.dailyStats.forEach((stat) => {
        // Check last 7 days
        const dayStat = last7Days.find((d) => d.dayKey === stat.date);
        if (dayStat) {
          dayStat.messages = stat.totalMessages || 0;
          dayStat.joins = stat.totalJoins || 0;
          dayStat.leaves = stat.totalLeaves || 0;
        }

        // Check previous 7 days
        const prevDayStat = previous7Days.find((d) => d.dayKey === stat.date);
        if (prevDayStat) {
          prevDayStat.messages = stat.totalMessages || 0;
          prevDayStat.joins = stat.totalJoins || 0;
          prevDayStat.leaves = stat.totalLeaves || 0;
        }
      });
    }

    const stats7d = last7Days.reduce(
      (acc, curr) => ({
        messages: acc.messages + curr.messages,
        joins: acc.joins + curr.joins,
        leaves: acc.leaves + curr.leaves,
      }),
      { messages: 0, joins: 0, leaves: 0 },
    );

    const statsPrevious7d = previous7Days.reduce(
      (acc, curr) => ({
        messages: acc.messages + curr.messages,
        joins: acc.joins + curr.joins,
        leaves: acc.leaves + curr.leaves,
      }),
      { messages: 0, joins: 0, leaves: 0 },
    );

    const calculateTrend = (current, previous) => {
      if (current === 0 && previous === 0)
        return { value: 0, isPositive: true };
      if (previous === 0) return { value: 100, isPositive: true };
      const diff = current - previous;
      const percentage = Math.round((diff / previous) * 100);
      return { value: percentage, isPositive: diff >= 0 };
    };

    const trends = {
      messages: calculateTrend(stats7d.messages, statsPrevious7d.messages),
      joins: calculateTrend(stats7d.joins, statsPrevious7d.joins),
      leaves: calculateTrend(stats7d.leaves, statsPrevious7d.leaves),
    };

    const recentActivity = await ActivityLog.find({ guildId })
      .sort({ timestamp: -1 })
      .lean();

    const formattedActivity = recentActivity.map((activity) => ({
      id: activity._id.toString(),
      type: activity.type,
      user: activity.username,
      userId: activity.userId,
      userAvatar: activity.userAvatar,
      action: activity.action,
      timestamp: activity.timestamp.toISOString(),
      details: activity.details,
    }));

    res.json({
      guildId,
      last7Days: {
        messages: stats7d.messages,
        joins: stats7d.joins,
        leaves: stats7d.leaves,
        totalMembers: guildStats.totalMembers,
      },
      trends,
      charts: {
        messages: {
          labels: last7Days.map((d) => d.label),
          data: last7Days.map((d) => d.messages),
        },
        memberflow: {
          labels: last7Days.map((d) => d.label),
          joins: last7Days.map((d) => d.joins),
          leaves: last7Days.map((d) => d.leaves),
        },
      },
      recentActivity: formattedActivity,
    });
  } catch (err) {
    logger.error(err);
    res.status(500).json({ error: "Server Error" });
  }
});

module.exports = router;
