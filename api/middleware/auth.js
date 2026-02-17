const Guild = require("../models/Guild");
const { getCachedUserGuilds } = require("../utils/discordCache");

/**
 * Middleware to verify user has permission to manage a guild system.
 * Checks for Manage Guild permission or system-specific roles.
 */
const checkGuildPermission = (system) => {
  return async (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: "No token provided" });
    }

    const guildId = req.params.guildId || req.params.id || req.body.guildId;
    if (!guildId) {
      return res.status(400).json({ error: "No guild ID provided" });
    }

    try {
      const token = authHeader.split(" ")[1];
      const userGuilds = await getCachedUserGuilds(token);

      const guild = userGuilds.find((g) => g.id === guildId);

      if (!guild) {
        return res.status(403).json({ error: "You are not in this guild" });
      }

      // Check for Manage Guild permission (0x20)
      const hasManageGuild = (guild.permissions & 0x20) === 0x20;
      if (hasManageGuild) return next();

      // Check for system-specific roles
      const guildSettings = await Guild.findById(guildId).lean();
      if (guildSettings) {
        try {
          const userRes = await fetch(
            `https://discord.com/api/v10/guilds/${guildId}/members/@me`,
            {
              headers: { Authorization: `Bearer ${token}` },
            }
          );

          if (userRes.ok) {
            const member = await userRes.json();
            const userRoles = member.roles || [];

            let allowedRoles = [];
            if (system === "giveaways") {
              allowedRoles = guildSettings.giveaways?.managerRoles || [];
            }

            if (allowedRoles.length > 0) {
              const hasRole = userRoles.some((roleId) =>
                allowedRoles.includes(roleId)
              );
              if (hasRole) return next();
            }
          }
        } catch (err) {
          // Continue to permission denied if role check fails
        }
      }

      return res.status(403).json({
        error: "You do not have permission to manage this system",
      });
    } catch (error) {
      return res
        .status(401)
        .json({ error: "Invalid token or session expired" });
    }
  };
};

module.exports = { checkGuildPermission };
