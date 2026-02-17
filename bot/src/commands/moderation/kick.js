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
    .setName("kick")
    .setDescription("Kick a member from the server")
    .addUserOption((option) =>
      option
        .setName("user")
        .setDescription("The user to kick")
        .setRequired(true)
    )
    .addStringOption((option) =>
      option.setName("reason").setDescription("The reason for the kick")
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers),

  async execute(interaction) {
    const isAllowed = await checkPermissions(interaction, {
      permissions: [
        PermissionFlagsBits.KickMembers,
        PermissionFlagsBits.ManageGuild,
      ],
    });
    if (!isAllowed) return;

    const language = await lang.getLanguage(interaction.guildId);
    const user = interaction.options.getUser("user");
    const reason =
      interaction.options.getString("reason") ||
      lang.get(language, "KICK_NO_REASON");
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
        content: lang.get(language, "KICK_SELF"),
        flags: MessageFlags.Ephemeral,
      });
    }

    if (user.id === interaction.client.user.id) {
      return sendTemporary(interaction, {
        content: lang.get(language, "KICK_BOT"),
        flags: MessageFlags.Ephemeral,
      });
    }

    if (!member) {
      return sendTemporary(interaction, {
        content: lang.get(language, "ERROR"),
        flags: MessageFlags.Ephemeral,
      });
    }

    if (!member.kickable) {
      return sendTemporary(interaction, {
        content: lang.get(language, "KICK_CANNOT"),
        flags: MessageFlags.Ephemeral,
      });
    }

    try {
      await interaction.deferReply();
      await member.kick(reason);

      const embed = new EmbedBuilder()
        .setColor("#FFA500")
        .setTitle(lang.get(language, "KICK_TITLE"))
        .setDescription(lang.get(language, "KICK_SUCCESS", { user: user.tag }))
        .addFields(
          {
            name: lang.get(language, "KICK_USER"),
            value: `${user.tag} (${user.id})`,
            inline: true,
          },
          {
            name: lang.get(language, "KICK_MODERATOR"),
            value: interaction.user.tag,
            inline: true,
          },
          {
            name: lang.get(language, "KICK_REASON"),
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

      if (interaction.deferred || interaction.replied) {
        await interaction.editReply(errorContent).catch(() => {});
      } else {
        await interaction.reply(errorContent).catch(() => {});
      }
    }
  },
};
