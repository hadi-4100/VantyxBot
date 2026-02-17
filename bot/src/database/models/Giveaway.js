const mongoose = require("mongoose");

const giveawaySchema = new mongoose.Schema({
  messageId: String,
  channelId: String,
  guildId: String,
  startAt: Number,
  endAt: Number,
  ended: { type: Boolean, default: false },
  winnerCount: Number,
  prize: String,
  hostedBy: String,
  entries: [String], // Array of User IDs
  winners: [String], // Array of User IDs
  type: { type: String, enum: ["normal", "drop"], default: "normal" },
  requirements: {
    role: { type: String, default: null }, // Role ID required
    level: { type: Number, default: null }, // Min Level required
    invites: { type: Number, default: null }, // Min Invites required
    serverName: { type: String, default: null }, // Server name restriction (optional)
  },
  paused: { type: Boolean, default: false },
  action: { type: String, default: null }, // Sync action: start, end, edit, delete, reroll
});

module.exports = mongoose.model("Giveaway", giveawaySchema);
