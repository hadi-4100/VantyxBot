const mongoose = require("mongoose");

const GlobalCommandsSchema = new mongoose.Schema({
  commands: [
    {
      name: { type: String, required: true },
      description: { type: String, required: true },
      category: { type: String, required: true },
      options: [
        {
          name: { type: String, required: true },
          description: { type: String, required: true },
          type: { type: String, required: true },
          options: { type: Array, default: [] },
        },
      ],
    },
  ],
  lastUpdated: { type: Date, default: Date.now },
});

module.exports = mongoose.model("GlobalCommands", GlobalCommandsSchema);
