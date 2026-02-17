const mongoose = require("mongoose");

const inviteCodeSchema = new mongoose.Schema({
  guildId: { type: String, required: true },
  code: { type: String, required: true, unique: true },
  userId: { type: String, required: true }, // Creator
  uses: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
});

inviteCodeSchema.index({ guildId: 1, userId: 1 });

module.exports = mongoose.model("InviteCode", inviteCodeSchema);
