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
    .setName("removeinvites")
    .setDescription(
      "Remove all invites tracked by the bot for the user but save them for restoration."
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addUserOption((option) =>
      option
        .setName("user")
        .setDescription("The user to remove invites from")
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
    if (!userData) {
      return sendTemporary(interaction, {
        content: lang.get(language, "USER_NO_DATA"),
        flags: MessageFlags.Ephemeral,
      });
    }

    // Save current to removed
    userData.removedInvites = {
      regular: userData.invites.regular,
      fake: userData.invites.fake,
      leaves: userData.invites.leaves,
      lastRemovedAt: new Date(),
    };

    // Reset current
    userData.invites.regular = 0;
    userData.invites.fake = 0;
    userData.invites.leaves = 0;

    await userData.save();

    const embed = new EmbedBuilder()
      .setTitle(lang.get(language, "INVITES_REMOVED_TITLE"))
      .setDescription(
        lang.get(language, "INVITES_REMOVED_DESC", { user: target.toString() })
      )
      .setColor("#4276f1")
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  },
};
