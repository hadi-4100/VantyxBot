const mongoose = require("mongoose");

const ticketTypeSchema = new mongoose.Schema({
  name: { type: String, required: true },
  emoji: { type: String, default: "🎟" },
  buttonLabel: { type: String, required: true },
  buttonStyle: { type: String, default: "PRIMARY" }, // PRIMARY, SECONDARY, SUCCESS, DANGER
  description: { type: String },
  enabled: { type: Boolean, default: true },
  categoryId: { type: String }, // Optional override
  supportRoleIds: [{ type: String }],
  namingScheme: { type: String, default: "ticket-{totalTickets}" },
  welcomeMessage: { type: String }, // Custom welcome message
});

const limitsSchema = new mongoose.Schema({
  maxOpenTickets: { type: Number, default: 3 },
});

const autoRulesSchema = new mongoose.Schema({
  closeAfterMinutes: { type: Number, default: null }, // Null = disabled
});

const TicketSettingsSchema = new mongoose.Schema({
  guildId: { type: String, required: true, unique: true },
  enabled: { type: Boolean, default: false },
  installed: { type: Boolean, default: false },
  panelChannelId: { type: String, default: null },
  panelMessageId: { type: String, default: null },
  ticketsCategoryId: { type: String, default: null },
  panelEmbedId: { type: String, default: null }, // If null, use default
  ticketTypes: [ticketTypeSchema],
  limits: limitsSchema,
  autoRules: autoRulesSchema,
  updatedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("TicketSettings", TicketSettingsSchema);
