const express = require("express");
const router = express.Router();
const DiscordOauth2 = require("discord-oauth2");
const config = require("../../config");
const Guild = require("../models/Guild");
const Stats = require("../models/Stats");
const ActivityLog = require("../models/ActivityLog");
const { checkGuildPermission } = require("../middleware/auth");
const { getCachedUserGuilds, getCachedUser } = require("../utils/discordCache");
const logger = require("../utils/logger");

const oauth = new DiscordOauth2();

// =======================
// Get User Guilds
// =======================
router.get("/", async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: "No token provided" });

  try {
    const guilds = await getCachedUserGuilds(authHeader.split(" ")[1]);
    const adminGuilds = guilds.filter((g) => (g.permissions & 0x20) === 0x20); // Manage Guild permission

    // Get bot's guilds from DB
    const stats = await Stats.findById("global");
    const botGuilds = stats ? stats.guildData || [] : [];
    const botGuildMap = new Map(botGuilds.map((g) => [g.id, g]));

    // Mark guilds where bot is added and add member count
    const enrichedGuilds = adminGuilds.map((guild) => {
      const botGuild = botGuildMap.get(guild.id);
      return {
        ...guild,
        botAdded: !!botGuild,
        memberCount: botGuild ? botGuild.memberCount : null,
      };
    });

    res.json(enrichedGuilds);
  } catch (error) {
    logger.error("Error fetching user guilds:", error);
    res.status(401).send("Invalid token");
  }
});

// =======================
// Get Guild Settings (General + Metadata)
// =======================
router.get("/:id", checkGuildPermission("guild"), async (req, res) => {
  const guildId = req.params.id;
  try {
    let guild = await Guild.findById(guildId);
    if (!guild) {
      guild = new Guild({ _id: guildId });
    }

    // If name or icon is missing in DB, fetch from Discord API
    if (!guild.name || !guild.icon) {
      try {
        const discordRes = await fetch(
          `https://discord.com/api/v10/guilds/${guildId}`,
          {
            headers: { Authorization: `Bot ${config.DISCORD_TOKEN}` },
          },
        );

        if (discordRes.ok) {
          const discordData = await discordRes.json();
          guild.name = discordData.name;
          guild.icon = discordData.icon;
          await guild.save();
        } else {
          logger.warn(
            `Discord API response not ok: ${discordRes.status} ${discordRes.statusText}`,
          );
        }
      } catch (err) {
        logger.error("Failed to fetch guild data from Discord:", err);
      }
    }
    res.json(guild);
  } catch (error) {
    logger.error("Error fetching guild settings:", error);
    res.status(500).json({ error: "Failed to fetch guild settings" });
  }
});

// =======================
// Get Guild Channels
// =======================
router.get("/:id/channels", checkGuildPermission("guild"), async (req, res) => {
  const guildId = req.params.id;

  try {
    const response = await fetch(
      `https://discord.com/api/v10/guilds/${guildId}/channels`,
      {
        headers: { Authorization: `Bot ${config.DISCORD_TOKEN}` },
      },
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      logger.error(`Discord API Error (${response.status}):`, errorData);
      throw new Error(
        `Failed to fetch channels: ${response.status} ${response.statusText}`,
      );
    }

    const channels = await response.json();
    // Return text channels (0) and announcement channels (5)
    const textChannels = channels.filter((c) => c.type === 0 || c.type === 5);
    res.json(textChannels);
  } catch (error) {
    logger.error("Error fetching channels:", error.message);
    res
      .status(500)
      .json({ error: "Failed to fetch channels", details: error.message });
  }
});

// =======================
// Get Guild Categories
// =======================
router.get(
  "/:id/categories",
  checkGuildPermission("guild"),
  async (req, res) => {
    const guildId = req.params.id;

    try {
      const response = await fetch(
        `https://discord.com/api/v10/guilds/${guildId}/channels`,
        {
          headers: { Authorization: `Bot ${config.DISCORD_TOKEN}` },
        },
      );

      if (!response.ok) {
        throw new Error(
          `Failed to fetch channels: ${response.status} ${response.statusText}`,
        );
      }

      const channels = await response.json();
      // Return category channels (4)
      const categoryChannels = channels.filter((c) => c.type === 4);
      res.json(categoryChannels);
    } catch (error) {
      logger.error("Error fetching categories:", error.message);
      res
        .status(500)
        .json({ error: "Failed to fetch categories", details: error.message });
    }
  },
);

// =======================
// Get Guild Roles
// =======================
router.get("/:id/roles", checkGuildPermission("guild"), async (req, res) => {
  const guildId = req.params.id;

  try {
    const response = await fetch(
      `https://discord.com/api/v10/guilds/${guildId}/roles`,
      {
        headers: { Authorization: `Bot ${config.DISCORD_TOKEN}` },
      },
    );

    if (!response.ok) {
      throw new Error(
        `Failed to fetch roles: ${response.status} ${response.statusText}`,
      );
    }

    const roles = await response.json();
    // Filter out @everyone and managed roles
    const filteredRoles = roles.filter((r) => r.id !== guildId && !r.managed);
    res.json(filteredRoles);
  } catch (error) {
    logger.error("Error fetching roles:", error.message);
    res
      .status(500)
      .json({ error: "Failed to fetch roles", details: error.message });
  }
});

// =======================
// Get Guild Emojis
// =======================
router.get("/:id/emojis", checkGuildPermission("guild"), async (req, res) => {
  const guildId = req.params.id;

  try {
    const response = await fetch(
      `https://discord.com/api/v10/guilds/${guildId}/emojis`,
      {
        headers: { Authorization: `Bot ${config.DISCORD_TOKEN}` },
      },
    );

    if (!response.ok) {
      throw new Error(
        `Failed to fetch emojis: ${response.status} ${response.statusText}`,
      );
    }

    const emojis = await response.json();
    res.json(emojis);
  } catch (error) {
    logger.error("Error fetching emojis:", error.message);
    res.status(500).json({ error: "Failed to fetch emojis" });
  }
});

// =======================
// Get Guild Members (List)
// =======================
router.get("/:id/members", checkGuildPermission("guild"), async (req, res) => {
  const guildId = req.params.id;
  const limit = Math.min(parseInt(req.query.limit) || 1000, 1000);
  const after = req.query.after || "0";

  try {
    const response = await fetch(
      `https://discord.com/api/v10/guilds/${guildId}/members?limit=${limit}&after=${after}`,
      {
        headers: { Authorization: `Bot ${config.DISCORD_TOKEN}` },
      },
    );

    if (!response.ok) {
      throw new Error(
        `Failed to fetch members: ${response.status} ${response.statusText}`,
      );
    }

    const members = await response.json();

    // Transform to include user info in a cleaner format
    const transformedMembers = members.map((member) => ({
      id: member.user.id,
      username: member.user.username,
      discriminator: member.user.discriminator,
      avatar: member.user.avatar,
      displayName:
        member.nick || member.user.global_name || member.user.username,
      bot: member.user.bot || false,
      roles: member.roles,
    }));

    res.json(transformedMembers);
  } catch (error) {
    logger.error("Error fetching members:", error.message);
    res
      .status(500)
      .json({ error: "Failed to fetch members", details: error.message });
  }
});

// =======================
// Get Guild Member (Single)
// =======================
router.get(
  "/:id/members/:userId",
  checkGuildPermission("giveaways"),
  async (req, res) => {
    const guildId = req.params.id;
    const userId = req.params.userId;

    try {
      const response = await fetch(
        `https://discord.com/api/v10/guilds/${guildId}/members/${userId}`,
        {
          headers: { Authorization: `Bot ${config.DISCORD_TOKEN}` },
        },
      );

      if (!response.ok) {
        // If not found in guild, try fetching global user info
        const userResponse = await fetch(
          `https://discord.com/api/v10/users/${userId}`,
          {
            headers: { Authorization: `Bot ${config.DISCORD_TOKEN}` },
          },
        );
        if (userResponse.ok) {
          const user = await userResponse.json();
          return res.json({ user });
        }
        throw new Error("Member not found");
      }

      const member = await response.json();
      res.json(member);
    } catch (error) {
      res.status(404).json({ error: "Member not found" });
    }
  },
);

// =======================
// Update General Guild Settings (Language, Prefix)
// =======================
router.post("/:id", checkGuildPermission("guild"), async (req, res) => {
  const guildId = req.params.id;
  const update = req.body;
  const authHeader = req.headers.authorization;

  try {
    // Get user info for activity logging
    let user = null;
    if (authHeader) {
      user = await getCachedUser(authHeader.split(" ")[1]);
    }

    const oldGuild = await Guild.findById(guildId);
    const oldSettings = oldGuild ? oldGuild.toObject() : {};

    // Filter update to only allowed fields to avoid accidental overwrites of moved settings
    const safeUpdate = {};
    if (update.language) safeUpdate.language = update.language;
    if (update.prefix) safeUpdate.prefix = update.prefix;

    const guild = await Guild.findByIdAndUpdate(
      guildId,
      { $set: safeUpdate },
      {
        new: true,
        upsert: true,
      },
    );

    if (user) {
      const changes = [];

      // Check language change
      if (safeUpdate.language && safeUpdate.language !== oldSettings.language) {
        changes.push({
          type: "language_change",
          action: `Changed language to ${safeUpdate.language.toUpperCase()}`,
          details: {
            field: "language",
            oldValue: oldSettings.language,
            newValue: safeUpdate.language,
          },
        });
      }

      // Check prefix change
      if (safeUpdate.prefix && safeUpdate.prefix !== oldSettings.prefix) {
        changes.push({
          type: "prefix_change",
          action: `Changed prefix to "${safeUpdate.prefix}"`,
          details: {
            field: "prefix",
            oldValue: oldSettings.prefix,
            newValue: safeUpdate.prefix,
          },
        });
      }

      for (const change of changes) {
        await new ActivityLog({
          guildId,
          userId: user.id,
          username: user.username,
          userAvatar: user.avatar
            ? `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png`
            : null,
          type: change.type,
          action: change.action,
          details: change.details,
        }).save();
      }
    }

    res.json(guild);
  } catch (error) {
    logger.error("Error updating guild settings:", error);
    res.status(500).json({ error: "Failed to update settings" });
  }
});

module.exports = router;
