const {
  SlashCommandBuilder,
  MessageFlags,
  EmbedBuilder,
} = require("discord.js");
const lang = require("../../utils/language");
const User = require("../../database/models/User");
const Guild = require("../../database/models/Guild");
const {
  getXpProgress,
  formatXp,
  createProgressBar,
  getRankSuffix,
} = require("../../utils/leveling");
const logger = require("../../utils/logger");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("rank")
    .setDescription("View your or another member's rank")
    .addUserOption((option) =>
      option
        .setName("user")
        .setDescription("The user to check (leave empty for yourself)")
        .setRequired(false),
    ),

  async execute(interaction) {
    if (!interaction.inGuild()) {
      return interaction.reply({
        content: "This command can only be used in a server.",
        flags: MessageFlags.Ephemeral,
      });
    }

    const language = await lang.getLanguage(interaction.guildId);
    const targetUser = interaction.options.getUser("user") || interaction.user;

    try {
      const guildSettings = await Guild.findById(interaction.guildId);
      if (!guildSettings?.leveling?.enabled) {
        return interaction.reply({
          content: lang.get(language, "LEVELING_DISABLED"),
          flags: MessageFlags.Ephemeral,
        });
      }

      const userData = await User.findOne({
        guildId: interaction.guildId,
        userId: targetUser.id,
      });

      if (!userData || userData.xp === 0) {
        return interaction.reply({
          content:
            targetUser.id === interaction.user.id
              ? lang.get(language, "XP_NONE_SELF")
              : lang.get(language, "XP_NONE_OTHER", { user: targetUser.tag }),
          flags: MessageFlags.Ephemeral,
        });
      }

      await interaction.deferReply();

      const rank =
        (await User.countDocuments({
          guildId: interaction.guildId,
          xp: { $gt: userData.xp },
        })) + 1;

      const progress = getXpProgress(userData.xp, userData.level);
      const progressBar = createProgressBar(progress.percentage, 12);

      const embed = new EmbedBuilder()
        .setColor("#9B59B6")
        .setAuthor({
          name: lang.get(language, "RANK_TITLE", { user: targetUser.tag }),
          iconURL: targetUser.displayAvatarURL({ dynamic: true }),
        })
        .setThumbnail(targetUser.displayAvatarURL({ dynamic: true, size: 512 }))
        .addFields(
          {
            name: lang.get(language, "RANK_LABEL"),
            value: `**#${rank}** (${getRankSuffix(rank)})`,
            inline: true,
          },
          {
            name: lang.get(language, "LEVEL_LABEL"),
            value: `**${userData.level}**`,
            inline: true,
          },
          {
            name: lang.get(language, "TOTAL_XP_LABEL"),
            value: `**${formatXp(userData.xp)}**`,
            inline: true,
          },
          {
            name: lang.get(language, "PROGRESS_LABEL"),
            value: `${progressBar} **${progress.percentage}%**\n${formatXp(
              progress.current,
            )} / ${formatXp(progress.required)} XP`,
            inline: false,
          },
        )
        .setFooter({
          text: lang.get(language, "RANK_FOOTER", {
            guild: interaction.guild.name,
          }),
          iconURL: interaction.guild.iconURL({ dynamic: true }),
        })
        .setTimestamp();

      await interaction.editReply({ embeds: [embed] });
    } catch (error) {
      logger.error(error);
      const errorContent = lang.get(language, "ERROR");
      if (interaction.deferred || interaction.replied) {
        await interaction.followUp({
          content: errorContent,
          flags: MessageFlags.Ephemeral,
        });
      } else {
        await interaction.reply({
          content: errorContent,
          flags: MessageFlags.Ephemeral,
        });
      }
    }
  },
};
