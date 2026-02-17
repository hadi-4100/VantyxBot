const mongoose = require("mongoose");

const EmbedSchema = new mongoose.Schema(
  {
    guildId: {
      type: String,
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    code: {
      type: String,
      required: true,
      trim: true,
    },
    embedData: {
      title: { type: String, maxLength: 256 },
      description: { type: String, maxLength: 4096 },
      url: { type: String },
      color: { type: Number },
      timestamp: { type: Date },
      footer: {
        text: { type: String, maxLength: 2048 },
        icon_url: { type: String },
      },
      image: {
        url: { type: String },
      },
      thumbnail: {
        url: { type: String },
      },
      author: {
        name: { type: String, maxLength: 256 },
        url: { type: String },
        icon_url: { type: String },
      },
      fields: [
        {
          name: { type: String, maxLength: 256 },
          value: { type: String, maxLength: 1024 },
          inline: { type: Boolean },
        },
      ],
    },
  },
  {
    timestamps: true,
  }
);

// Ensure code is unique per guild
EmbedSchema.index({ guildId: 1, code: 1 }, { unique: true });

module.exports = mongoose.model("Embed", EmbedSchema);
