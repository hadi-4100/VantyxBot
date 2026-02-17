const {
  SlashCommandBuilder,
  EmbedBuilder,
  PermissionFlagsBits,
  MessageFlags,
} = require("discord.js");
const User = require("../../database/models/User");
const { checkPermissions } = require("../../utils/permissions");
const lang = require("../../utils/language");
const { sendTemporary } = require("../../utils/messages");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("restoreinvites")
    .setDescription("Restore previously removed invites from the database.")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addUserOption((option) =>
      option
        .setName("user")
        .setDescription("The user to restore invites for")
        .setRequired(true)
    ),
  async execute(interaction) {
    const isAllowed = await checkPermissions(interaction, {
      permissions: [PermissionFlagsBits.ManageGuild],
    });
    if (!isAllowed) return;

    const language = await lang.getLanguage(interaction.guildId);
    const target = interaction.options.getUser("user");

    const userData = await User.findOne({
      guildId: interaction.guildId,
      userId: target.id,
    });
    if (
      !userData ||
      !userData.removedInvites ||
      (userData.removedInvites.regular === 0 &&
        userData.removedInvites.fake === 0 &&
        userData.removedInvites.leaves === 0)
    ) {
      return sendTemporary(interaction, {
        content: lang.get(language, "RESTORE_NO_DATA"),
        flags: MessageFlags.Ephemeral,
      });
    }

    // Restore
    userData.invites.regular += userData.removedInvites.regular;
    userData.invites.fake += userData.removedInvites.fake;
    userData.invites.leaves += userData.removedInvites.leaves;

    // Clear archived
    userData.removedInvites = {
      regular: 0,
      fake: 0,
      leaves: 0,
      lastRemovedAt: null,
    };

    await userData.save();

    const embed = new EmbedBuilder()
      .setTitle(lang.get(language, "RESTORE_TITLE"))
      .setDescription(
        lang.get(language, "RESTORE_DESC", { user: target.toString() })
      )
      .setColor("#4276f1")
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  },
};
