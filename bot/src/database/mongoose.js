const mongoose = require("mongoose");
const config = require("../../../config.js");
const logger = require("../utils/logger");

module.exports = async () => {
  try {
    await mongoose.connect(config.MONGO_URI, {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
    });
    logger.db("Connected to Vantyx MongoDB");
  } catch (err) {
    logger.error(`MongoDB Connection Error: ${err.message}`);
    process.exit(1);
  }
};
