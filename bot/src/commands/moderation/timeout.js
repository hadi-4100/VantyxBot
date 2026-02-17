const {
  SlashCommandBuilder,
  PermissionFlagsBits,
  MessageFlags,
  EmbedBuilder,
} = require("discord.js");
const lang = require("../../utils/language");
const ms = require("ms");
const { checkPermissions, checkHierarchy } = require("../../utils/permissions");
const { sendTemporary } = require("../../utils/messages");
const logger = require("../../utils/logger");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("timeout")
    .setDescription("Timeout a member temporarily")
    .addUserOption((option) =>
      option
        .setName("user")
        .setDescription("The user to timeout")
        .setRequired(true)
    )
    .addStringOption((option) =>
      option
        .setName("duration")
        .setDescription("Duration (e.g., 10m, 1h, 1d)")
        .setRequired(true)
    )
    .addStringOption((option) =>
      option.setName("reason").setDescription("The reason for the timeout")
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

  async execute(interaction) {
    const isAllowed = await checkPermissions(interaction, {
      permissions: [
        PermissionFlagsBits.ModerateMembers,
        PermissionFlagsBits.ManageGuild,
      ],
    });
    if (!isAllowed) return;

    const language = await lang.getLanguage(interaction.guildId);
    const user = interaction.options.getUser("user");
    const duration = interaction.options.getString("duration");
    const reason =
      interaction.options.getString("reason") ||
      lang.get(language, "TIMEOUT_NO_REASON");
    const member = await interaction.guild.members
      .fetch(user.id)
      .catch(() => null);

    // Hierarchy Check
    if (member && !checkHierarchy(interaction.member, member)) {
      return sendTemporary(interaction, {
        content: lang.get(language, "HIERARCHY_ERROR"),
        flags: MessageFlags.Ephemeral,
      });
    }

    if (user.id === interaction.user.id) {
      return sendTemporary(interaction, {
        content: lang.get(language, "TIMEOUT_SELF"),
        flags: MessageFlags.Ephemeral,
      });
    }

    if (user.id === interaction.client.user.id) {
      return sendTemporary(interaction, {
        content: lang.get(language, "TIMEOUT_BOT"),
        flags: MessageFlags.Ephemeral,
      });
    }

    if (!member) {
      return sendTemporary(interaction, {
        content: lang.get(language, "ERROR"),
        flags: MessageFlags.Ephemeral,
      });
    }

    if (!member.moderatable) {
      return sendTemporary(interaction, {
        content: lang.get(language, "TIMEOUT_CANNOT"),
        flags: MessageFlags.Ephemeral,
      });
    }

    const timeMs = ms(duration);
    if (!timeMs || timeMs > 2419200000) {
      return sendTemporary(interaction, {
        content: lang.get(language, "ERROR"),
        flags: MessageFlags.Ephemeral,
      });
    }

    try {
      await member.timeout(timeMs, reason);

      const embed = new EmbedBuilder()
        .setColor("#FFFF00")
        .setTitle(lang.get(language, "TIMEOUT_TITLE"))
        .setDescription(
          lang.get(language, "TIMEOUT_SUCCESS", { user: user.tag })
        )
        .addFields(
          {
            name: lang.get(language, "TIMEOUT_USER"),
            value: `${user.tag} (${user.id})`,
            inline: true,
          },
          {
            name: lang.get(language, "TIMEOUT_MODERATOR"),
            value: interaction.user.tag,
            inline: true,
          },
          {
            name: lang.get(language, "TIMEOUT_DURATION"),
            value: duration,
            inline: true,
          },
          {
            name: lang.get(language, "TIMEOUT_REASON"),
            value: reason,
            inline: false,
          }
        )
        .setThumbnail(user.displayAvatarURL({ dynamic: true }))
        .setTimestamp()
        .setFooter({
          text: interaction.guild.name,
          iconURL: interaction.guild.iconURL({ dynamic: true }),
        });

      await interaction.reply({ embeds: [embed] });
    } catch (error) {
      logger.error(error);
      await sendTemporary(interaction, {
        content: lang.get(language, "ERROR"),
        flags: MessageFlags.Ephemeral,
      });
    }
  },
};
