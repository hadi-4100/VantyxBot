const {
  SlashCommandBuilder,
  PermissionFlagsBits,
  MessageFlags,
  EmbedBuilder,
} = require("discord.js");
const lang = require("../../utils/language");
const Warning = require("../../database/models/Warning");
const { checkPermissions } = require("../../utils/permissions");
const logger = require("../../utils/logger");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("warns")
    .setDescription("View a member's warnings")
    .addUserOption((option) =>
      option
        .setName("user")
        .setDescription("The user to check warnings for")
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

    try {
      await interaction.deferReply({ flags: MessageFlags.Ephemeral });

      const warnings = await Warning.find({
        guildId: interaction.guildId,
        userId: user.id,
      }).sort({ timestamp: -1 });

      const embed = new EmbedBuilder()
        .setColor("#3B82F6")
        .setTitle(lang.get(language, "WARNS_TITLE", { user: user.tag }))
        .setThumbnail(user.displayAvatarURL({ dynamic: true }))
        .setTimestamp()
        .setFooter({
          text: interaction.guild.name,
          iconURL: interaction.guild.iconURL({ dynamic: true }),
        });

      if (warnings.length === 0) {
        embed.setDescription(lang.get(language, "WARNS_NONE"));
      } else {
        const warningsList = warnings
          .map((warn, index) => {
            const moderator = interaction.guild.members.cache.get(
              warn.moderatorId
            );
            const date = new Date(warn.timestamp).toLocaleDateString();

            return (
              `**${lang.get(language, "WARNS_LIST", {
                number: index + 1,
              })}**\n` +
              `${lang.get(language, "WARNS_BY")}: ${
                moderator ? moderator.user.tag : "Unknown"
              }\n` +
              `${lang.get(language, "WARNS_REASON")}: ${warn.reason}\n` +
              `${lang.get(language, "WARNS_DATE")}: ${date}\n` +
              `ID: \`${warn._id}\``
            );
          })
          .join("\n\n");

        embed.setDescription(warningsList);
      }

      await interaction.editReply({
        embeds: [embed],
      });
    } catch (error) {
      logger.error(error);
      const errorContent = {
        content: lang.get(language, "ERROR"),
      };

      if (interaction.deferred || interaction.replied) {
        await interaction.editReply(errorContent).catch(() => {});
      } else {
        await interaction
          .reply({
            ...errorContent,
            flags: MessageFlags.Ephemeral,
          })
          .catch(() => {});
      }
    }
  },
};
