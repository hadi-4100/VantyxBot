const {
  SlashCommandBuilder,
  EmbedBuilder,
  PermissionFlagsBits,
  MessageFlags,
} = require("discord.js");
const User = require("../../database/models/User");
const { checkRewards } = require("../../utils/inviteTracker");
const { checkPermissions } = require("../../utils/permissions");
const lang = require("../../utils/language");
const { sendTemporary } = require("../../utils/messages");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("removebonus")
    .setDescription("Remove bonus invites from a user.")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addUserOption((option) =>
      option
        .setName("user")
        .setDescription("The user to remove bonus from")
        .setRequired(true)
    )
    .addIntegerOption((option) =>
      option
        .setName("amount")
        .setDescription("Amount of bonus invites to remove")
        .setRequired(true)
    ),
  async execute(interaction) {
    const isAllowed = await checkPermissions(interaction, {
      permissions: [PermissionFlagsBits.ManageGuild],
    });
    if (!isAllowed) return;

    const language = await lang.getLanguage(interaction.guildId);
    const target = interaction.options.getUser("user");
    const amount = interaction.options.getInteger("amount");

    let userData = await User.findOne({
      guildId: interaction.guildId,
      userId: target.id,
    });
    if (!userData) {
      return sendTemporary(interaction, {
        content: lang.get(language, "USER_NO_DATA"),
        flags: MessageFlags.Ephemeral,
      });
    }

    userData.invites.bonus = Math.max(0, userData.invites.bonus - amount);
    await userData.save();

    const total =
      userData.invites.regular +
      userData.invites.bonus -
      userData.invites.leaves;
    await checkRewards(interaction.guild, target.id, total);

    const embed = new EmbedBuilder()
      .setTitle(lang.get(language, "BONUS_REMOVED_TITLE"))
      .setDescription(
        lang.get(language, "BONUS_REMOVED_DESC", {
          amount,
          user: target.toString(),
          total: userData.invites.bonus,
        })
      )
      .setColor("#f14242");

    await interaction.reply({ embeds: [embed] });
  },
};
