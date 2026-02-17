const mongoose = require("mongoose");

const dashboardUserSchema = new mongoose.Schema({
  userId: { type: String, required: true, unique: true },
  firstLogin: { type: Date, default: Date.now },
  lastLogin: { type: Date, default: Date.now },
  notificationsEnabled: { type: Boolean, default: true },
  bio: { type: String, default: "" },
});

module.exports = mongoose.model("DashboardUser", dashboardUserSchema);
