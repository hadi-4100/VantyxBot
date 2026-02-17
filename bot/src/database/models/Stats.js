const mongoose = require("mongoose");

const statsSchema = new mongoose.Schema({
  _id: { type: String, default: "global" },
  totalGuilds: { type: Number, default: 0 },
  totalUsers: { type: Number, default: 0 },
  totalCommands: { type: Number, default: 0 },
  startTime: { type: Number, default: Date.now() },
  lastUpdated: { type: Date, default: Date.now },

  // Previous stats for percentage calculations
  previousGuilds: { type: Number, default: 0 },
  previousUsers: { type: Number, default: 0 },
  previousCommands: { type: Number, default: 0 },

  // Command usage tracking
  commandUsage: [
    {
      command: String,
      count: { type: Number, default: 0 },
    },
  ],

  // Daily command history (last 7 days)
  dailyCommands: [
    {
      date: String,
      count: { type: Number, default: 0 },
    },
  ],

  // Performance metrics
  averageResponseTime: { type: Number, default: 0 },
  activeServersCount: { type: Number, default: 0 },

  // List of all guild IDs the bot is in (for dashboard checking)
  guildIds: [{ type: String }],

  // Detailed guild data for dashboard
  guildData: [
    {
      id: String,
      name: String,
      memberCount: Number,
      icon: String,
    },
  ],
});

module.exports = mongoose.model("Stats", statsSchema);
