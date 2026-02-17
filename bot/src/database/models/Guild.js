const mongoose = require("mongoose");
const config = require("../../../../config");

const guildSchema = new mongoose.Schema({
  _id: String, // Guild ID
  name: { type: String, default: null },
  icon: { type: String, default: null },
  language: { type: String, default: config.DEFAULT_LANG },
  prefix: { type: String, default: config.BOT_PREFIX },

  // Welcome System
  welcome: {
    enabled: { type: Boolean, default: false },
    message: { type: String, default: "Welcome [user] to [server]!" },
    delivery: { type: String, enum: ["dm", "channel"], default: "channel" },
    channel: { type: String, default: null },

    // Auto-Role
    autorole: {
      enabled: { type: Boolean, default: false },
      roles: [{ type: String }], // Array of role IDs
    },
  },

  // Welcome Image System
  welcomeImage: {
    enabled: { type: Boolean, default: false },
    delivery: {
      type: String,
      enum: ["with_text", "before_text", "channel"],
      default: "with_text",
    },
    channel: { type: String, default: null },
    background: { type: String, default: null },
    bgMode: {
      type: String,
      enum: ["stretch", "cover", "contain"],
      default: "stretch",
    },
    elements: { type: Array, default: [] }, // Canvas elements
  },

  // Goodbye System
  goodbye: {
    enabled: { type: Boolean, default: false },
    message: { type: String, default: "Goodbye [user]!" },
    channel: { type: String, default: null },
  },

  // Level System
  leveling: {
    enabled: { type: Boolean, default: true },
    noXpRoles: [{ type: String }],
    noXpChannels: [{ type: String }],
    levelUpMessage: {
      enabled: { type: Boolean, default: true },
      channel: { type: String, default: null },
      message: {
        type: String,
        default:
          "🥳 **Congratulations**, [user]!\nYou climbed from level **[oldLevel]** to **[level]**. Keep it up!",
      },
    },
    roleRewards: [
      {
        _id: {
          type: String,
          default: () => Math.random().toString(36).substr(2, 9),
        },
        level: { type: Number, required: true },
        role: { type: String, required: true },
        removeWithHigher: { type: Boolean, default: false },
        dmMember: { type: Boolean, default: false },
        createdAt: { type: Date, default: Date.now },
      },
    ],
  },

  // Warning System
  warnings: {
    enabled: { type: Boolean, default: true },
    resetAfterDays: { type: Number, default: 0 }, // 0 = never
    actions: [
      {
        threshold: { type: Number, required: true },
        action: {
          type: String,
          enum: ["none", "mute", "timeout", "kick", "ban"],
          default: "none",
        },
        duration: { type: Number, default: 0 }, // For timeout/mute in ms
      },
    ],
  },

  // Logging Channels
  logs: {
    moderation: {
      enabled: { type: Boolean, default: false },
      channel: { type: String, default: null },
    },
    member: {
      enabled: { type: Boolean, default: false },
      channel: { type: String, default: null },
    },
    message: {
      enabled: { type: Boolean, default: false },
      channel: { type: String, default: null },
    },
    voice: {
      enabled: { type: Boolean, default: false },
      channel: { type: String, default: null },
    },
    server: {
      enabled: { type: Boolean, default: false },
      channel: { type: String, default: null },
    },
  },

  // Commands Settings
  commands: {
    disabledCategories: [{ type: String }],
    disabledCommands: [{ type: String }],
  },

  // Auto Moderation
  automod: {
    antiSpam: {
      enabled: { type: Boolean, default: false },
      actions: [{ type: String }], // 'block', 'timeout'
      timeoutDuration: { type: Number, default: 3600000 }, // 1 hour in ms
      excludedChannels: [{ type: String }],
      excludedRoles: [{ type: String }],
    },
    antiBadWords: {
      enabled: { type: Boolean, default: false },
      actions: [{ type: String }],
      timeoutDuration: { type: Number, default: 3600000 },
      excludedChannels: [{ type: String }],
      excludedRoles: [{ type: String }],
      words: [{ type: String }],
    },
    antiInvites: {
      enabled: { type: Boolean, default: false },
      actions: [{ type: String }],
      timeoutDuration: { type: Number, default: 3600000 },
      excludedChannels: [{ type: String }],
      excludedRoles: [{ type: String }],
    },
    antiLinks: {
      enabled: { type: Boolean, default: false },
      actions: [{ type: String }],
      timeoutDuration: { type: Number, default: 3600000 },
      excludedChannels: [{ type: String }],
      excludedRoles: [{ type: String }],
    },
  },

  // Auto-Responder
  autoResponder: {
    enabled: { type: Boolean, default: false },
    responses: [
      {
        _id: {
          type: String,
          default: () => Math.random().toString(36).substr(2, 9),
        },
        trigger: String,
        response: String,
        responseType: {
          type: String,
          enum: ["normal", "reply"],
          default: "normal",
        },
        enabledRoles: [{ type: String }],
        disabledRoles: [{ type: String }],
        enabledChannels: [{ type: String }],
        disabledChannels: [{ type: String }],
        createdAt: { type: Date, default: Date.now },
      },
    ],
  },

  // Invite System
  invites: {
    enabled: { type: Boolean, default: true },
    fakeThreshold: {
      enabled: { type: Boolean, default: false },
      days: { type: Number, default: 3 }, // Account must be older than this many days
    },
    rewards: [
      {
        _id: {
          type: String,
          default: () => Math.random().toString(36).substr(2, 9),
        },
        inviteCount: { type: Number, required: true },
        role: { type: String, required: true },
        removeWithHigher: { type: Boolean, default: false },
        dmMember: { type: Boolean, default: true },
        createdAt: { type: Date, default: Date.now },
      },
    ],
    blacklist: [{ type: String }], // Array of user IDs
  },

  // Giveaway System
  giveaways: {
    managerRoles: [{ type: String }], // Array of Role IDs
    embedColor: { type: String, default: "#338ac4" },
    endEmbedColor: { type: String, default: "#f04747" },
    reaction: { type: String, default: "🎉" }, // Custom Emoji or standard
    dmHost: { type: Boolean, default: false },
    dmWinners: { type: Boolean, default: true },
    joinButtonText: { type: String, default: "Join Giveaway" },
    winnerRole: { type: String, default: null }, // Role to give to winners
  },

  // Reaction Roles System
  reactionRoles: {
    enabled: { type: Boolean, default: false },
    messages: [
      {
        _id: {
          type: String,
          default: () => Math.random().toString(36).substr(2, 9),
        },
        channelId: { type: String, default: null },
        embedId: { type: String, default: null }, // Reference to the custom embed
        messageId: { type: String, default: null }, // ID of the sent message in Discord
        interactionType: {
          type: String,
          enum: ["buttons", "select"],
          default: "buttons",
        },
        allowMultiple: { type: Boolean, default: false },
        maxRoles: { type: Number, default: 1 },
        roles: [
          {
            _id: {
              type: String,
              default: () => Math.random().toString(36).substr(2, 9),
            },
            roleId: { type: String, required: true },
            label: { type: String, required: true },
            emoji: { type: String, default: null },
            description: { type: String, default: null },
          },
        ],
      },
    ],
  },
});

module.exports = mongoose.model("Guild", guildSchema);
