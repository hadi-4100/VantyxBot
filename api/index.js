const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const config = require("../config");
const logger = require("./utils/logger");
const path = require("path");

const app = express();

// CORS Configuration
app.use(
  cors({
    origin: config.DASHBOARD_URL || "http://localhost:3000",
    credentials: true,
  }),
);

// Static File Serving
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Body Parsing Middleware
app.use(bodyParser.json({ limit: "50mb" }));
app.use(bodyParser.urlencoded({ limit: "50mb", extended: true }));
app.use(cookieParser());

// API Routes
app.use("/auth", require("./routes/auth"));
app.use("/guilds", require("./routes/guilds"));
app.use("/commands", require("./routes/commands"));
app.use("/stats", require("./routes/stats"));
app.use("/logs", require("./routes/logs"));
app.use("/welcome", require("./routes/welcome"));
app.use("/automod", require("./routes/automod"));
app.use("/warnings", require("./routes/warnings"));
app.use("/auto-responder", require("./routes/autoresponder"));
app.use("/leveling", require("./routes/leveling"));
app.use("/invites", require("./routes/invites"));
app.use("/embeds", require("./routes/embeds"));
app.use("/giveaways", require("./routes/giveaways"));
app.use("/profile", require("./routes/profile"));
app.use("/tickets", require("./routes/tickets"));
app.use("/reaction-roles", require("./routes/reactionRoles"));

// Health Check Route
app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok", timestamp: new Date().toISOString() });
});

// Database Connection & Server Startup
mongoose
  .connect(config.MONGO_URI)
  .then(() => {
    logger.db("API Connected to MongoDB");

    app.listen(config.API_PORT, "0.0.0.0", () => {
      logger.success(`API running on port ${config.API_PORT}`);
    });
  })
  .catch((err) => {
    logger.error("API MongoDB Connection Error:", err);
    process.exit(1);
  });
