const mongoose = require("mongoose");

const activityLogSchema = new mongoose.Schema({
  guildId: { type: String, required: true, index: true },
  userId: { type: String, required: true },
  username: { type: String, required: true },
  userAvatar: { type: String },

  // Activity details
  type: {
    type: String,
    required: true,
    enum: [
      "settings_change",
      "feature_toggle",
      "channel_update",
      "role_update",
      "welcome_update",
      "goodbye_update",
      "leveling_update",
      "leveling_reward_add",
      "leveling_reward_update",
      "leveling_reward_delete",
      "language_change",
      "prefix_change",
      "warnings_update",
      "log_update",
      "autoresponder_add",
      "autoresponder_update",
      "autoresponder_delete",
      "autoresponder_bulk_update",
      "tickets_update",
      "invites_update",
      "reaction_role_update",
      "embed_create",
      "embed_update",
      "embed_delete",
      "giveaway_create",
      "giveaway_end",
      "giveaway_reroll",
      "giveaway_delete",
      "giveaway_update",
      "other",
    ],
  },

  action: { type: String, required: true }, // Human-readable description

  // Optional details for specific actions
  details: {
    type: mongoose.Schema.Types.Mixed,
    default: {},
  },

  timestamp: { type: Date, default: Date.now, index: true },
});

// Index for efficient queries (most recent first)
activityLogSchema.index({ guildId: 1, timestamp: -1 });

module.exports = mongoose.model("ActivityLog", activityLogSchema);
