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
      "leveling_update",
      "language_change",
      "prefix_change",
      "other",
    ],
  },

  action: { type: String, required: true }, // Human-readable description

  // Optional details for specific actions
  details: {
    field: String, // What was changed
    oldValue: mongoose.Schema.Types.Mixed,
    newValue: mongoose.Schema.Types.Mixed,
  },

  timestamp: { type: Date, default: Date.now, index: true },
});

// Index for efficient queries (most recent first)
activityLogSchema.index({ guildId: 1, timestamp: -1 });

module.exports = mongoose.model("ActivityLog", activityLogSchema);
