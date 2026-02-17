const {
  SlashCommandBuilder,
  PermissionFlagsBits,
  MessageFlags,
  EmbedBuilder,
} = require("discord.js");
const lang = require("../../utils/language");
const { checkPermissions, checkHierarchy } = require("../../utils/permissions");
const { sendTemporary } = require("../../utils/messages");
const logger = require("../../utils/logger");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("ban")
    .setDescription("Ban a member from the server")
    .addUserOption((option) =>
      option.setName("user").setDescription("The user to ban").setRequired(true)
    )
    .addStringOption((option) =>
      option.setName("reason").setDescription("The reason for the ban")
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),

  async execute(interaction) {
    const isAllowed = await checkPermissions(interaction, {
      permissions: [
        PermissionFlagsBits.BanMembers,
        PermissionFlagsBits.ManageGuild,
      ],
    });
    if (!isAllowed) return;

    const language = await lang.getLanguage(interaction.guildId);
    const user = interaction.options.getUser("user");
    const reason =
      interaction.options.getString("reason") ||
      lang.get(language, "BAN_NO_REASON");
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

    // Check if user is trying to ban themselves
    if (user.id === interaction.user.id) {
      return sendTemporary(interaction, {
        content: lang.get(language, "BAN_SELF"),
        flags: MessageFlags.Ephemeral,
      });
    }

    // Check if user is trying to ban the bot
    if (user.id === interaction.client.user.id) {
      return sendTemporary(interaction, {
        content: lang.get(language, "BAN_BOT"),
        flags: MessageFlags.Ephemeral,
      });
    }

    if (!member) {
      return sendTemporary(interaction, {
        content: lang.get(language, "ERROR"),
        flags: MessageFlags.Ephemeral,
      });
    }

    if (!member.bannable) {
      return sendTemporary(interaction, {
        content: lang.get(language, "BAN_CANNOT"),
        flags: MessageFlags.Ephemeral,
      });
    }

    try {
      await interaction.deferReply();
      await member.ban({ reason });

      const embed = new EmbedBuilder()
        .setColor("#FF0000")
        .setTitle(lang.get(language, "BAN_TITLE"))
        .setDescription(lang.get(language, "BAN_SUCCESS", { user: user.tag }))
        .addFields(
          {
            name: lang.get(language, "BAN_USER"),
            value: `${user.tag} (${user.id})`,
            inline: true,
          },
          {
            name: lang.get(language, "BAN_MODERATOR"),
            value: interaction.user.tag,
            inline: true,
          },
          {
            name: lang.get(language, "BAN_REASON"),
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

      await interaction.editReply({ embeds: [embed] });
    } catch (error) {
      logger.error(error);
      const errorContent = {
        content: lang.get(language, "ERROR"),
        flags: MessageFlags.Ephemeral,
      };

      await sendTemporary(interaction, errorContent);
    }
  },
};
