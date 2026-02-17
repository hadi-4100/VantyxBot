const { SlashCommandBuilder } = require("discord.js");
const User = require("../../database/models/User");
const Guild = require("../../database/models/Guild");
const { formatXp } = require("../../utils/leveling");
const lang = require("../../utils/language");
const { renderLeaderboard } = require("../../utils/leaderboard");

const TIME_FILTERS = {
  ALL_TIME: "all_time",
  MONTH: "month",
  WEEK: "week",
  TODAY: "today",
};

module.exports = {
  data: new SlashCommandBuilder()
    .setName("level-leaderboard")
    .setDescription("View the server XP/Level leaderboard")
    .addStringOption((opt) =>
      opt
        .setName("filter")
        .setDescription("Time period to view")
        .addChoices(
          { name: "🏆 All Time", value: TIME_FILTERS.ALL_TIME },
          { name: "📅 This Month", value: TIME_FILTERS.MONTH },
          { name: "📆 This Week", value: TIME_FILTERS.WEEK },
          { name: "📍 Today", value: TIME_FILTERS.TODAY },
        ),
    ),

  async execute(interaction) {
    await interaction.deferReply();
    const language = await lang.getLanguage(interaction.guildId);
    const timeFilter =
      interaction.options.getString("filter") || TIME_FILTERS.ALL_TIME;

    const guildSettings = await Guild.findById(interaction.guildId);
    if (!guildSettings || !guildSettings.leveling?.enabled) {
      return interaction.editReply({
        content: lang.get(language, "LB_XP_DISABLED"),
      });
    }

    // For now, keeping the filters but they all show total XP as in the original code
    const allUsers = await User.find({ guildId: interaction.guildId })
      .sort({ xp: -1 })
      .limit(100);

    if (allUsers.length === 0) {
      return interaction.editReply({
        content: lang.get(language, "LB_XP_NONE"),
      });
    }

    const lbName = lang.get(language, "XP_LB_NAME");
    await renderLeaderboard(
      interaction,
      allUsers,
      lbName,
      language,
      (userData) => {
        return lang.get(language, "LB_XP_LINE", {
          level: userData.level,
          xp: formatXp(userData.xp),
        });
      },
    );
  },
};
