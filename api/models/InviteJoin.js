const mongoose = require("mongoose");

const inviteJoinSchema = new mongoose.Schema({
  guildId: { type: String, required: true },
  inviterId: { type: String, required: true },
  userId: { type: String, required: true },
  code: { type: String, required: true },
  isFake: { type: Boolean, default: false },
  isLeave: { type: Boolean, default: false },
  joinedAt: { type: Date, default: Date.now },
  leftAt: { type: Date, default: null },
});

// Index for faster queries
inviteJoinSchema.index({ guildId: 1, inviterId: 1 });
inviteJoinSchema.index({ guildId: 1, userId: 1 });

module.exports = mongoose.model("InviteJoin", inviteJoinSchema);
