const express = require("express");
const router = express.Router();
const DiscordOauth2 = require("discord-oauth2");
const config = require("../../config");
const logger = require("../utils/logger");
const DashboardUser = require("../models/DashboardUser");

const oauth = new DiscordOauth2({
  clientId: config.CLIENT_ID,
  clientSecret: config.CLIENT_SECRET,
  redirectUri: `${config.DASHBOARD_URL}/login`,
});

const { getCachedUser } = require("../utils/discordCache");

const ONE_MONTH_MS = 30 * 24 * 60 * 60 * 1000;

// =======================
// Get OAuth Configuration
// =======================
router.get("/config", (req, res) => {
  res.json({
    clientId: config.CLIENT_ID,
    redirectUri: `${config.DASHBOARD_URL}/login`,
  });
});

// =======================
// Exchange Code for Token
// =======================
router.post("/token", async (req, res) => {
  const { code } = req.body;

  if (!code) {
    return res.status(400).json({ error: "No code provided" });
  }

  try {
    const token = await oauth.tokenRequest({
      code,
      scope: "identify guilds",
      grantType: "authorization_code",
    });

    res.cookie("access_token", token.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: ONE_MONTH_MS,
      sameSite: "lax",
    });

    const user = await getCachedUser(token.access_token);
    if (user) {
      await DashboardUser.findOneAndUpdate(
        { userId: user.id },
        {
          $setOnInsert: { firstLogin: new Date() },
          $set: { lastLogin: new Date() },
        },
        { upsert: true, new: true },
      );
    }

    res.json(token);
  } catch (error) {
    logger.error("OAuth Exchange Error:", error);
    res.status(400).json({
      error: "Invalid code or expired authorization",
      details: error.message,
    });
  }
});

// =======================
// Get Current User
// =======================
router.get("/user", async (req, res) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ error: "No token provided" });
  }

  try {
    const token = authHeader.split(" ")[1];
    const user = await getCachedUser(token);
    res.json(user);
  } catch (error) {
    // Expected error when token expires, so maybe warn or fine
    res.status(401).json({ error: "Invalid token" });
  }
});

// =======================
// Logout User
// =======================
router.post("/logout", (req, res) => {
  res.clearCookie("access_token", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
  });

  res.json({ success: true, message: "Logged out successfully" });
});

module.exports = router;
