const express = require("express");
const router = express.Router();
const Guild = require("../models/Guild");
const User = require("../models/User");
const ActivityLog = require("../models/ActivityLog");
const { checkGuildPermission } = require("../middleware/auth");
const { getCachedUser } = require("../utils/discordCache");
const logger = require("../utils/logger");

// =======================
// Get Leveling Settings
// =======================
router.get(
  "/:guildId/settings",
  checkGuildPermission("leveling"),
  async (req, res) => {
    try {
      const { guildId } = req.params;

      const guild = await Guild.findById(guildId);
      if (!guild) {
        return res.status(404).json({ error: "Guild not found" });
      }

      res.json({
        success: true,
        data: guild.leveling || {
          enabled: true,
          noXpRoles: [],
          noXpChannels: [],
          levelUpMessage: {
            enabled: true,
            channel: null,
            message:
              "🥳 **Congratulations**, [user]!\nYou climbed from level **[oldLevel]** to **[level]**. Keep it up!",
          },
          roleRewards: [],
        },
      });
    } catch (error) {
      logger.error("Error fetching leveling settings:", error);
      res.status(500).json({
        error: "Failed to fetch leveling settings",
        message: error.message,
      });
    }
  }
);

// =======================
// Update Leveling Settings
// =======================
router.put(
  "/:guildId/settings",
  checkGuildPermission("leveling"),
  async (req, res) => {
    try {
      const { guildId } = req.params;
      const { enabled, noXpRoles, noXpChannels, levelUpMessage, roleRewards } =
        req.body;
      const authHeader = req.headers.authorization;

      if (typeof enabled !== "boolean" && enabled !== undefined) {
        return res.status(400).json({ error: "Invalid 'enabled' value" });
      }

      const guild = await Guild.findById(guildId);
      if (!guild) {
        return res.status(404).json({ error: "Guild not found" });
      }

      if (enabled !== undefined) {
        guild.leveling.enabled = enabled;
      }

      if (noXpRoles !== undefined) {
        if (!Array.isArray(noXpRoles)) {
          return res.status(400).json({ error: "noXpRoles must be an array" });
        }
        guild.leveling.noXpRoles = noXpRoles;
      }

      if (noXpChannels !== undefined) {
        if (!Array.isArray(noXpChannels)) {
          return res
            .status(400)
            .json({ error: "noXpChannels must be an array" });
        }
        guild.leveling.noXpChannels = noXpChannels;
      }

      if (levelUpMessage !== undefined) {
        if (levelUpMessage.enabled !== undefined) {
          guild.leveling.levelUpMessage.enabled = levelUpMessage.enabled;
        }
        if (levelUpMessage.channel !== undefined) {
          guild.leveling.levelUpMessage.channel = levelUpMessage.channel;
        }
        if (levelUpMessage.message !== undefined) {
          guild.leveling.levelUpMessage.message = levelUpMessage.message;
        }
      }

      if (roleRewards !== undefined) {
        if (!Array.isArray(roleRewards)) {
          return res
            .status(400)
            .json({ error: "roleRewards must be an array" });
        }
        guild.leveling.roleRewards = roleRewards;
      }

      await guild.save();

      // Log Activity
      const user = await getCachedUser(
        authHeader ? authHeader.split(" ")[1] : null
      );
      if (user) {
        await new ActivityLog({
          guildId,
          userId: user.id,
          username: user.username,
          userAvatar: user.avatar
            ? `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png`
            : null,
          type: "leveling_update",
          action: "Updated leveling system settings",
          details: { enabled: guild.leveling.enabled },
        }).save();
      }

      res.json({
        success: true,
        message: "Leveling settings updated successfully",
        data: guild.leveling,
      });
    } catch (error) {
      logger.error("Error updating leveling settings:", error);
      res.status(500).json({
        error: "Failed to update leveling settings",
        message: error.message,
      });
    }
  }
);

// =======================
// Get Role Rewards
// =======================
router.get(
  "/:guildId/rewards",
  checkGuildPermission("leveling"),
  async (req, res) => {
    try {
      const { guildId } = req.params;

      const guild = await Guild.findById(guildId);
      if (!guild) {
        return res.status(404).json({ error: "Guild not found" });
      }

      res.json({
        success: true,
        data: guild.leveling?.roleRewards || [],
      });
    } catch (error) {
      logger.error("Error fetching role rewards:", error);
      res.status(500).json({
        error: "Failed to fetch role rewards",
        message: error.message,
      });
    }
  }
);

// =======================
// Add Role Reward
// =======================
router.post(
  "/:guildId/rewards",
  checkGuildPermission("leveling"),
  async (req, res) => {
    try {
      const { guildId } = req.params;
      const { level, role, removeWithHigher, dmMember } = req.body;
      const authHeader = req.headers.authorization;

      if (!level || !role) {
        return res.status(400).json({ error: "Level and role are required" });
      }

      if (typeof level !== "number" || level < 1) {
        return res
          .status(400)
          .json({ error: "Level must be a positive number" });
      }

      const guild = await Guild.findById(guildId);
      if (!guild) {
        return res.status(404).json({ error: "Guild not found" });
      }

      const existingLevel = guild.leveling.roleRewards.find(
        (r) => r.level === level
      );
      const existingRole = guild.leveling.roleRewards.find(
        (r) => r.role === role
      );

      if (existingLevel) {
        return res.status(400).json({
          error: `A reward for level ${level} already exists!`,
        });
      }

      if (existingRole) {
        return res.status(400).json({
          error: "This role is already assigned to another level reward!",
        });
      }

      const newReward = {
        _id: Math.random().toString(36).substr(2, 9),
        level,
        role,
        removeWithHigher: removeWithHigher || false,
        dmMember: dmMember || false,
        createdAt: new Date(),
      };

      guild.leveling.roleRewards.push(newReward);
      await guild.save();

      // Log Activity
      const user = await getCachedUser(
        authHeader ? authHeader.split(" ")[1] : null
      );
      if (user) {
        await new ActivityLog({
          guildId,
          userId: user.id,
          username: user.username,
          userAvatar: user.avatar
            ? `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png`
            : null,
          type: "leveling_reward_add",
          action: `Added role reward for level ${level}`,
          details: { level, role },
        }).save();
      }

      res.json({
        success: true,
        message: "Role reward added successfully",
        data: newReward,
      });
    } catch (error) {
      logger.error("Error adding role reward:", error);
      res.status(500).json({
        error: "Failed to add role reward",
        message: error.message,
      });
    }
  }
);

// =======================
// Update Role Reward
// =======================
router.put(
  "/:guildId/rewards/:rewardId",
  checkGuildPermission("leveling"),
  async (req, res) => {
    try {
      const { guildId, rewardId } = req.params;
      const { level, role, removeWithHigher, dmMember } = req.body;
      const authHeader = req.headers.authorization;

      const guild = await Guild.findById(guildId);
      if (!guild) {
        return res.status(404).json({ error: "Guild not found" });
      }

      const reward = guild.leveling.roleRewards.find((r) => r._id === rewardId);
      if (!reward) {
        return res.status(404).json({ error: "Reward not found" });
      }

      if (level !== undefined) {
        if (typeof level !== "number" || level < 1) {
          return res
            .status(400)
            .json({ error: "Level must be a positive number" });
        }

        const existingReward = guild.leveling.roleRewards.find(
          (r) => r.level === level && r._id !== rewardId
        );

        if (existingReward) {
          return res.status(400).json({
            error: `A reward for level ${level} already exists!`,
          });
        }

        reward.level = level;
      }

      if (role !== undefined) {
        const roleConflict = guild.leveling.roleRewards.find(
          (r) => r.role === role && r._id !== rewardId
        );

        if (roleConflict) {
          return res.status(400).json({
            error: "This role is already assigned to another level reward!",
          });
        }
        reward.role = role;
      }

      if (removeWithHigher !== undefined) {
        reward.removeWithHigher = removeWithHigher;
      }

      if (dmMember !== undefined) {
        reward.dmMember = dmMember;
      }

      await guild.save();

      // Log Activity
      const user = await getCachedUser(
        authHeader ? authHeader.split(" ")[1] : null
      );
      if (user) {
        await new ActivityLog({
          guildId,
          userId: user.id,
          username: user.username,
          userAvatar: user.avatar
            ? `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png`
            : null,
          type: "leveling_reward_update",
          action: `Updated role reward for level ${reward.level}`,
          details: { rewardId },
        }).save();
      }

      res.json({
        success: true,
        message: "Role reward updated successfully",
        data: reward,
      });
    } catch (error) {
      logger.error("Error updating role reward:", error);
      res.status(500).json({
        error: "Failed to update role reward",
        message: error.message,
      });
    }
  }
);

// =======================
// Delete Role Reward
// =======================
router.delete(
  "/:guildId/rewards/:rewardId",
  checkGuildPermission("leveling"),
  async (req, res) => {
    try {
      const { guildId, rewardId } = req.params;
      const authHeader = req.headers.authorization;

      const guild = await Guild.findById(guildId);
      if (!guild) {
        return res.status(404).json({ error: "Guild not found" });
      }

      const rewardIndex = guild.leveling.roleRewards.findIndex(
        (r) => r._id === rewardId
      );

      if (rewardIndex === -1) {
        return res.status(404).json({ error: "Reward not found" });
      }

      const deletedLevel = guild.leveling.roleRewards[rewardIndex].level;
      guild.leveling.roleRewards.splice(rewardIndex, 1);
      await guild.save();

      // Log Activity
      const user = await getCachedUser(
        authHeader ? authHeader.split(" ")[1] : null
      );
      if (user) {
        await new ActivityLog({
          guildId,
          userId: user.id,
          username: user.username,
          userAvatar: user.avatar
            ? `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png`
            : null,
          type: "leveling_reward_delete",
          action: `Deleted role reward for level ${deletedLevel}`,
          details: { rewardId, level: deletedLevel },
        }).save();
      }

      res.json({
        success: true,
        message: "Role reward deleted successfully",
      });
    } catch (error) {
      logger.error("Error deleting role reward:", error);
      res.status(500).json({
        error: "Failed to delete role reward",
        message: error.message,
      });
    }
  }
);

// =======================
// Get Leaderboard
// =======================
router.get("/:guildId/leaderboard", async (req, res) => {
  try {
    const { guildId } = req.params;
    const { limit = 100, offset = 0 } = req.query;

    const users = await User.find({ guildId })
      .sort({ xp: -1 })
      .skip(parseInt(offset))
      .limit(parseInt(limit));

    const total = await User.countDocuments({ guildId });

    res.json({
      success: true,
      data: {
        users,
        total,
        limit: parseInt(limit),
        offset: parseInt(offset),
      },
    });
  } catch (error) {
    logger.error("Error fetching leaderboard:", error);
    res.status(500).json({
      error: "Failed to fetch leaderboard",
      message: error.message,
    });
  }
});

// =======================
// Get User Rank
// =======================
router.get("/:guildId/user/:userId", async (req, res) => {
  try {
    const { guildId, userId } = req.params;

    const user = await User.findOne({ guildId, userId });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const allUsers = await User.find({ guildId }).sort({ xp: -1 });
    const rank = allUsers.findIndex((u) => u.userId === userId) + 1;

    res.json({
      success: true,
      data: {
        ...user.toObject(),
        rank,
      },
    });
  } catch (error) {
    logger.error("Error fetching user data:", error);
    res.status(500).json({
      error: "Failed to fetch user data",
      message: error.message,
    });
  }
});

module.exports = router;
