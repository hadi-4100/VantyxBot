const GuildStats = require("../database/models/GuildStats");
const Stats = require("../database/models/Stats");
const logger = require("./logger");

/**
 * Utility for tracking guild-specific statistics.
 */

/**
 * Increments a specific stat for a guild (messages, joins, or leaves).
 * @param {string} guildId - The Discord guild ID
 * @param {'messages'|'joins'|'leaves'} type - The metric to increment
 * @param {number} memberCount - Current member count of the guild
 */
async function recordGuildStat(guild, type, memberCount) {
  try {
    const guildId = guild.id;
    const now = new Date();
    const currentHour = new Date(now).setMinutes(0, 0, 0);
    const today = now.toISOString().split("T")[0];

    let stats = await GuildStats.findOne({ guildId });
    if (!stats) {
      stats = new GuildStats({
        guildId,
        totalMembers: memberCount,
        hourlyStats: [],
        dailyStats: [],
      });
    }

    stats.totalMembers = memberCount;

    // 1. Update Hourly Stats
    let hourStat = stats.hourlyStats.find(
      (h) => new Date(h.hour).getTime() === currentHour,
    );
    if (hourStat) {
      hourStat[type]++;
    } else {
      stats.hourlyStats.push({
        hour: new Date(currentHour),
        messages: type === "messages" ? 1 : 0,
        joins: type === "joins" ? 1 : 0,
        leaves: type === "leaves" ? 1 : 0,
      });
    }

    // Retain only last 24 hours of data
    const hourCutoff = new Date(now - 24 * 60 * 60 * 1000);
    stats.hourlyStats = stats.hourlyStats.filter(
      (h) => new Date(h.hour) > hourCutoff,
    );

    // 2. Update Daily Stats
    let dayStat = stats.dailyStats.find((d) => d.date === today);
    if (dayStat) {
      if (type === "messages") dayStat.totalMessages++;
      if (type === "joins") dayStat.totalJoins++;
      if (type === "leaves") dayStat.totalLeaves++;
    } else {
      stats.dailyStats.push({
        date: today,
        totalMessages: type === "messages" ? 1 : 0,
        totalJoins: type === "joins" ? 1 : 0,
        totalLeaves: type === "leaves" ? 1 : 0,
        activeUsers: 0,
      });
    }

    // Retain only last 30 days of data
    if (stats.dailyStats.length > 30) {
      stats.dailyStats = stats.dailyStats.slice(-30);
    }

    stats.lastUpdated = now;
    await stats.save();
  } catch (error) {
    logger.error(`Failed to record guild stat (${type}): ${error.message}`);
  }
}

/**
 * Updates global bot statistics (Total Guilds, Users, etc.)
 * @param {Client} client - Discord client instance
 * @param {boolean} [isStartup] - Whether this is the initial startup update
 */
async function updateGlobalStats(client, isStartup = false) {
  try {
    const totalGuilds = client.guilds.cache.size;
    const totalUsers = client.guilds.cache.reduce(
      (acc, guild) => acc + (guild.memberCount || 0),
      0,
    );
    const averageResponseTime = Math.max(0, Math.round(client.ws.ping) || 0);

    const currentStats = await Stats.findById("global");
    const lastUpdate = currentStats?.lastUpdated
      ? new Date(currentStats.lastUpdated)
      : new Date();
    const isNewDay = lastUpdate.getDate() !== new Date().getDate();

    const updateData = {
      totalGuilds,
      totalUsers,
      lastUpdated: new Date(),
      averageResponseTime,
      activeServersCount: totalGuilds,
      guildIds: client.guilds.cache.map((g) => g.id),
      guildData: client.guilds.cache.map((g) => ({
        id: g.id,
        name: g.name,
        memberCount: g.memberCount,
        icon: g.icon,
      })),
    };

    if (isNewDay && currentStats) {
      updateData.previousGuilds = currentStats.totalGuilds || 0;
      updateData.previousUsers = currentStats.totalUsers || 0;
      updateData.previousCommands = currentStats.totalCommands || 0;
    }

    if (isStartup) {
      updateData.startTime = new Date();
    }

    await Stats.findOneAndUpdate(
      { _id: "global" },
      {
        $set: updateData,
        $setOnInsert: {
          totalCommands: 0,
          commandUsage: [],
          dailyCommands: [],
        },
      },
      { upsert: true },
    );
  } catch (error) {
    logger.error(`Global Stats Update Error: ${error.message}`);
  }
}

module.exports = { recordGuildStat, updateGlobalStats };
