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
    .setName("unmute")
    .setDescription("Unmute a member (remove Muted role)")
    .addUserOption((option) =>
      option
        .setName("user")
        .setDescription("The user to unmute")
        .setRequired(true)
    )
    .addStringOption((option) =>
      option.setName("reason").setDescription("Reason for unmute")
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
    const reason =
      interaction.options.getString("reason") ||
      lang.get(language, "UNMUTE_REASON_DEFAULT");
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

    if (!member) {
      return sendTemporary(interaction, {
        content: lang.get(language, "ERROR"),
        flags: MessageFlags.Ephemeral,
      });
    }

    if (!member.manageable) {
      return sendTemporary(interaction, {
        content: lang.get(language, "TIMEOUT_CANNOT"),
        flags: MessageFlags.Ephemeral,
      });
    }

    await interaction.deferReply();

    try {
      const muteRole = interaction.guild.roles.cache.find(
        (r) => r.name.toLowerCase() === "muted"
      );

      if (!muteRole || !member.roles.cache.has(muteRole.id)) {
        return sendTemporary(interaction, {
          content: lang.get(language, "UNMUTE_NOT_MUTED"),
        });
      }

      await member.roles.remove(muteRole, reason);

      const embed = new EmbedBuilder()
        .setColor("#00FF00")
        .setTitle(lang.get(language, "UNMUTE_TITLE"))
        .setDescription(
          lang.get(language, "UNMUTE_SUCCESS_TEXT", { user: user.tag })
        );

      await interaction.editReply({ embeds: [embed] });
    } catch (error) {
      logger.error(error);
      await sendTemporary(interaction, {
        content: lang.get(language, "ERROR"),
      });
    }
  },
};
