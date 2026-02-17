const mongoose = require("mongoose");

const TicketSchema = new mongoose.Schema({
  guildId: { type: String, required: true },
  channelId: { type: String, required: true, unique: true },
  userId: { type: String, required: true },
  typeId: { type: String, required: true }, // ref to ticketTypes._id
  status: { type: String, enum: ["OPEN", "CLOSED"], default: "OPEN" },
  claimedBy: { type: String, default: null }, // User ID of staff
  createdAt: { type: Date, default: Date.now },
  closedAt: { type: Date, default: null },
  transcriptUrl: { type: String, default: null },
});

module.exports = mongoose.model("Ticket", TicketSchema);
