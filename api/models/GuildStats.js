const mongoose = require("mongoose");

const guildStatsSchema = new mongoose.Schema({
  guildId: { type: String, required: true, index: true },

  // Hourly statistics (last 24 hours)
  hourlyStats: [
    {
      hour: { type: Date, required: true },
      messages: { type: Number, default: 0 },
      joins: { type: Number, default: 0 },
      leaves: { type: Number, default: 0 },
    },
  ],

  // Daily statistics (last 30 days)
  dailyStats: [
    {
      date: { type: String, required: true }, // YYYY-MM-DD format
      totalMessages: { type: Number, default: 0 },
      totalJoins: { type: Number, default: 0 },
      totalLeaves: { type: Number, default: 0 },
      activeUsers: { type: Number, default: 0 },
    },
  ],

  // Current totals
  totalMembers: { type: Number, default: 0 },

  // Last updated timestamp
  lastUpdated: { type: Date, default: Date.now },
});

// Index for efficient queries
guildStatsSchema.index({ guildId: 1, "hourlyStats.hour": -1 });
guildStatsSchema.index({ guildId: 1, "dailyStats.date": -1 });

module.exports = mongoose.model("GuildStats", guildStatsSchema);
