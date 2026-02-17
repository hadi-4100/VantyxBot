const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  guildId: String,
  userId: String,
  xp: { type: Number, default: 0 },
  level: { type: Number, default: 0 },
  lastMessage: { type: Date, default: Date.now },
  lastXpGain: { type: Date, default: null },
  totalInteractionTime: { type: Number, default: 0 },

  // Invite Tracking
  invites: {
    regular: { type: Number, default: 0 },
    fake: { type: Number, default: 0 },
    bonus: { type: Number, default: 0 },
    leaves: { type: Number, default: 0 },
  },
  removedInvites: {
    regular: { type: Number, default: 0 },
    fake: { type: Number, default: 0 },
    leaves: { type: Number, default: 0 },
    lastRemovedAt: { type: Date, default: null },
  },
  invitedBy: { type: String, default: null },
  inviteCode: { type: String, default: null }, // The code they used to join
});

module.exports = mongoose.model("User", userSchema);
