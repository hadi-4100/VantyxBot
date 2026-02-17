const {
  SlashCommandBuilder,
  PermissionFlagsBits,
  ChannelType,
  MessageFlags,
} = require("discord.js");
const giveawayUtils = require("../../utils/giveaway");
const Giveaway = require("../../database/models/Giveaway");
const ms = require("ms");
const { checkPermissions } = require("../../utils/permissions");
const Guild = require("../../database/models/Guild");
const lang = require("../../utils/language");
const logger = require("../../utils/logger");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("giveaway")
    .setDescription("Manage the giveaway system")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    // --- CREATE ---
    .addSubcommand((sub) =>
      sub
        .setName("create")
        .setDescription("Start a new giveaway")
        .addStringOption((opt) =>
          opt
            .setName("prize")
            .setDescription("The prize to win")
            .setRequired(true),
        )
        .addIntegerOption((opt) =>
          opt
            .setName("winners")
            .setDescription("Number of winners")
            .setRequired(true)
            .setMinValue(1),
        )
        .addStringOption((opt) =>
          opt
            .setName("duration")
            .setDescription("Duration (e.g. 1m, 1h, 1d)")
            .setRequired(true),
        )
        .addChannelOption((opt) =>
          opt
            .setName("channel")
            .setDescription("Channel to post in")
            .addChannelTypes(ChannelType.GuildText),
        )
        .addRoleOption((opt) =>
          opt.setName("req_role").setDescription("Required role to join"),
        )
        .addIntegerOption((opt) =>
          opt.setName("req_level").setDescription("Minimum level to join"),
        )
        .addIntegerOption((opt) =>
          opt.setName("req_invites").setDescription("Minimum invites to join"),
        ),
    )
    // --- DROP ---
    .addSubcommand((sub) =>
      sub
        .setName("drop")
        .setDescription("Start a drop giveaway (First to click wins)")
        .addStringOption((opt) =>
          opt
            .setName("prize")
            .setDescription("The prize to win")
            .setRequired(true),
        )
        .addIntegerOption((opt) =>
          opt
            .setName("winners")
            .setDescription("Number of winners")
            .setRequired(true)
            .setMinValue(1),
        )
        .addChannelOption((opt) =>
          opt
            .setName("channel")
            .setDescription("Channel to post in")
            .addChannelTypes(ChannelType.GuildText),
        )
        .addRoleOption((opt) =>
          opt.setName("req_role").setDescription("Required role to join"),
        )
        .addIntegerOption((opt) =>
          opt.setName("req_level").setDescription("Minimum level to join"),
        )
        .addIntegerOption((opt) =>
          opt.setName("req_invites").setDescription("Minimum invites to join"),
        ),
    )
    // --- END ---
    .addSubcommand((sub) =>
      sub
        .setName("end")
        .setDescription("End a giveaway immediately")
        .addStringOption((opt) =>
          opt
            .setName("message_id")
            .setDescription("Message ID of the giveaway")
            .setRequired(true),
        ),
    )
    // --- REROLL ---
    .addSubcommand((sub) =>
      sub
        .setName("reroll")
        .setDescription("Reroll a winner for an ended giveaway")
        .addStringOption((opt) =>
          opt
            .setName("message_id")
            .setDescription("Message ID of the giveaway")
            .setRequired(true),
        ),
    )
    // --- DELETE ---
    .addSubcommand((sub) =>
      sub
        .setName("delete")
        .setDescription("Delete a giveaway from database")
        .addStringOption((opt) =>
          opt
            .setName("message_id")
            .setDescription("Message ID of the giveaway")
            .setRequired(true),
        ),
    )
    // --- EDIT ---
    .addSubcommand((sub) =>
      sub
        .setName("edit")
        .setDescription("Edit a running giveaway")
        .addStringOption((opt) =>
          opt
            .setName("message_id")
            .setDescription("Message ID of the giveaway")
            .setRequired(true),
        )
        .addStringOption((opt) =>
          opt.setName("new_prize").setDescription("New prize name"),
        )
        .addIntegerOption((opt) =>
          opt.setName("new_winners").setDescription("New number of winners"),
        )
        .addStringOption((opt) =>
          opt
            .setName("new_time")
            .setDescription("New time (e.g. old: 1h new: 30m )"),
        ),
    ),

  async execute(interaction) {
    const guildSettings = await Guild.findById(interaction.guildId).lean();
    const isAllowed = await checkPermissions(interaction, {
      permissions: [PermissionFlagsBits.ManageGuild],
      roles: guildSettings?.giveaways?.managerRoles || [],
    });

    if (!isAllowed) return;

    const language = await lang.getLanguage(interaction.guildId);
    const sub = interaction.options.getSubcommand();

    // --- CREATE & DROP ---
    if (sub === "create" || sub === "drop") {
      await interaction.deferReply({ flags: MessageFlags.Ephemeral });

      const prize = interaction.options.getString("prize");
      const winners = interaction.options.getInteger("winners");
      const channel =
        interaction.options.getChannel("channel") || interaction.channel;
      const role = interaction.options.getRole("req_role");
      const level = interaction.options.getInteger("req_level");
      const invites = interaction.options.getInteger("req_invites");

      let duration = 0;
      if (sub === "create") {
        const durationStr = interaction.options.getString("duration");
        if (!ms(durationStr) || ms(durationStr) < 60000) {
          return interaction.editReply(
            lang.get(language, "GIVEAWAY_INVALID_DURATION"),
          );
        }
        duration = ms(durationStr);
      }

      await giveawayUtils.start(interaction.client, interaction, {
        duration,
        prize,
        winnerCount: winners,
        channel,
        type: sub === "drop" ? "drop" : "normal",
        requirements: {
          role: role?.id,
          level,
          invites,
        },
      });

      return interaction.editReply(
        lang.get(language, "GIVEAWAY_CREATED", {
          type: sub.toUpperCase(),
          channel: channel.toString(),
        }),
      );
    }
    // --- END ---
    if (sub === "end") {
      await interaction.deferReply({ flags: MessageFlags.Ephemeral });
      const messageId = interaction.options.getString("message_id");
      const success = await giveawayUtils.end(interaction.client, messageId);
      if (success)
        return interaction.editReply(
          lang.get(language, "GIVEAWAY_ENDED_SUCCESS"),
        );
      return interaction.editReply(lang.get(language, "GIVEAWAY_ENDED_FAIL"));
    }

    // --- REROLL ---
    if (sub === "reroll") {
      await interaction.deferReply({ flags: MessageFlags.Ephemeral });
      const messageId = interaction.options.getString("message_id");
      const res = await giveawayUtils.reroll(interaction.client, messageId);
      if (res.success)
        return interaction.editReply(
          lang.get(language, "GIVEAWAY_REROLL_SUCCESS_CMD"),
        );
      return interaction.editReply(
        lang.get(language, "GIVEAWAY_REROLL_FAIL", { error: res.error }),
      );
    }

    // --- DELETE ---
    if (sub === "delete") {
      await interaction.deferReply({ flags: MessageFlags.Ephemeral });
      const messageId = interaction.options.getString("message_id");
      const giveaway = await Giveaway.findOneAndDelete({ messageId });

      if (giveaway) {
        const channel = await interaction.client.channels
          .fetch(giveaway.channelId)
          .catch(() => null);
        if (channel) {
          const msg = await channel.messages.fetch(messageId).catch(() => null);
          if (msg) await msg.delete().catch(() => {});
        }
        return interaction.editReply(
          lang.get(language, "GIVEAWAY_DELETED_SUCCESS"),
        );
      }
      return interaction.editReply(lang.get(language, "GIVEAWAY_NOT_FOUND"));
    }

    // --- EDIT ---
    if (sub === "edit") {
      await interaction.deferReply({ flags: MessageFlags.Ephemeral });
      const messageId = interaction.options.getString("message_id");
      const newPrize = interaction.options.getString("new_prize");
      const newWinners = interaction.options.getInteger("new_winners");
      const newTimeStr = interaction.options.getString("new_time");

      const giveaway = await Giveaway.findOne({ messageId, ended: false });
      if (!giveaway)
        return interaction.editReply(
          lang.get(language, "GIVEAWAY_ACTIVE_NOT_FOUND"),
        );

      let updates = [];
      if (newPrize) {
        giveaway.prize = newPrize;
        updates.push(
          lang.get(language, "GIVEAWAY_UPDATE_PRIZE", { prize: newPrize }),
        );
      }
      if (newWinners) {
        giveaway.winnerCount = newWinners;
        updates.push(
          lang.get(language, "GIVEAWAY_UPDATE_WINNERS", {
            winners: newWinners,
          }),
        );
      }
      if (newTimeStr) {
        const remainingMs = ms(newTimeStr);
        if (remainingMs) {
          giveaway.endAt = Date.now() + remainingMs;
          updates.push(
            lang.get(language, "GIVEAWAY_UPDATE_TIME", { time: newTimeStr }),
          );
        }
      }

      await giveaway.save();

      // Update Embed
      const channel = await interaction.client.channels
        .fetch(giveaway.channelId)
        .catch(() => null);
      if (channel) {
        const msg = await channel.messages.fetch(messageId).catch(() => null);
        if (msg) {
          const bonusText = lang.get(language, "GIVEAWAY_NORMAL_BONUS", {
            time: Math.floor(giveaway.endAt / 1000),
          });

          const newEmbed = {
            ...msg.embeds[0].data,
            description: lang.get(language, "GIVEAWAY_DESC", {
              prize: giveaway.prize,
              host: giveaway.hostedBy,
              winners: giveaway.winnerCount,
              bonus: bonusText,
            }),
          };
          await msg.edit({ embeds: [newEmbed] });
        }
      }

      return interaction.editReply(
        lang.get(language, "GIVEAWAY_UPDATED", { updates: updates.join("\n") }),
      );
    }
  },
};
