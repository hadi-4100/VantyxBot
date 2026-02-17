const {
  SlashCommandBuilder,
  PermissionFlagsBits,
  MessageFlags,
  EmbedBuilder,
} = require("discord.js");
const lang = require("../../utils/language");
const { checkPermissions } = require("../../utils/permissions");
const logger = require("../../utils/logger");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("clear")
    .setDescription("Delete multiple messages")
    .addIntegerOption((option) =>
      option
        .setName("amount")
        .setDescription("Number of messages to delete (1-100)")
        .setRequired(true)
        .setMinValue(1)
        .setMaxValue(100)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),

  async execute(interaction) {
    const isAllowed = await checkPermissions(interaction, {
      permissions: [
        PermissionFlagsBits.ManageMessages,
        PermissionFlagsBits.ManageGuild,
      ],
    });
    if (!isAllowed) return;

    const language = await lang.getLanguage(interaction.guildId);
    const amount = interaction.options.getInteger("amount");

    try {
      const messages = await interaction.channel.bulkDelete(amount, true);

      const embed = new EmbedBuilder()
        .setColor("#00FFFF")
        .setTitle(lang.get(language, "CLEAR_TITLE"))
        .setDescription(
          lang.get(language, "CLEAR_SUCCESS", { amount: messages.size })
        )
        .addFields({
          name: lang.get(language, "CLEAR_AMOUNT"),
          value: lang.get(language, "CLEAR_MESSAGES", { count: messages.size }),
          inline: true,
        })
        .setTimestamp()
        .setFooter({
          text: interaction.guild.name,
          iconURL: interaction.guild.iconURL({ dynamic: true }),
        });

      await interaction.reply({
        embeds: [embed],
      });

      // Delete the reply after 5 seconds
      setTimeout(() => {
        interaction.deleteReply().catch(() => {});
      }, 5000);
    } catch (error) {
      logger.error(error);
      await interaction.reply({
        content: lang.get(language, "ERROR"),
        flags: MessageFlags.Ephemeral,
      });
    }
  },
};
