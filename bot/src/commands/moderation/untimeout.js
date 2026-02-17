const {
  SlashCommandBuilder,
  PermissionFlagsBits,
  MessageFlags,
  EmbedBuilder,
} = require("discord.js");
const lang = require("../../utils/language");
const { checkPermissions, checkHierarchy } = require("../../utils/permissions");
const { sendTemporary } = require("../../utils/messages");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("untimeout")
    .setDescription("Removes a timeout from a member")
    .addUserOption((option) =>
      option
        .setName("user")
        .setDescription("The user to untimeout")
        .setRequired(true)
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

    if (!member.isCommunicationDisabled()) {
      return sendTemporary(interaction, {
        content: lang.get(language, "UNTIMEOUT_NOT_TIMED_OUT"),
        flags: MessageFlags.Ephemeral,
      });
    }

    await member.timeout(null);

    const embed = new EmbedBuilder()
      .setColor("#00FF00")
      .setTitle(lang.get(language, "UNTIMEOUT_TITLE"))
      .setDescription(
        lang.get(language, "UNTIMEOUT_SUCCESS", { user: user.tag })
      );

    await interaction.reply({ embeds: [embed] });
  },
};
