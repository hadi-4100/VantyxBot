const { SlashCommandBuilder } = require("discord.js");
const User = require("../../database/models/User");
const InviteJoin = require("../../database/models/InviteJoin");
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
    .setName("invite-leaderboard")
    .setDescription("View the server invite leaderboard")
    .addStringOption((opt) =>
      opt
        .setName("filter")
        .setDescription("Time period to view")
        .addChoices(
          { name: "🏆 All Time (Net Total)", value: TIME_FILTERS.ALL_TIME },
          { name: "📅 This Month (Joins)", value: TIME_FILTERS.MONTH },
          { name: "📆 This Week (Joins)", value: TIME_FILTERS.WEEK },
          { name: "📍 Today (Joins)", value: TIME_FILTERS.TODAY },
        ),
    ),

  async execute(interaction) {
    await interaction.deferReply();
    const language = await lang.getLanguage(interaction.guildId);
    const timeFilter =
      interaction.options.getString("filter") || TIME_FILTERS.ALL_TIME;

    let sortedUsers = [];
    const now = new Date();

    if (timeFilter === TIME_FILTERS.ALL_TIME) {
      const allUsers = await User.find({ guildId: interaction.guildId });
      sortedUsers = allUsers
        .map((u) => ({
          userId: u.userId,
          score:
            (u.invites?.regular || 0) +
            (u.invites?.bonus || 0) -
            (u.invites?.leaves || 0),
          data: u.invites,
        }))
        .filter((u) => u.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, 100);
    } else {
      let startDate = new Date();
      if (timeFilter === TIME_FILTERS.MONTH)
        startDate.setMonth(now.getMonth() - 1);
      else if (timeFilter === TIME_FILTERS.WEEK)
        startDate.setDate(now.getDate() - 7);
      else if (timeFilter === TIME_FILTERS.TODAY)
        startDate.setHours(0, 0, 0, 0);

      const joins = await InviteJoin.aggregate([
        {
          $match: {
            guildId: interaction.guildId,
            joinedAt: { $gte: startDate },
            isFake: false,
          },
        },
        { $group: { _id: "$inviterId", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 100 },
      ]);

      sortedUsers = joins
        .filter((j) => j._id !== "VANITY")
        .map((j) => ({
          userId: j._id,
          score: j.count,
          data: { regular: j.count },
        }));
    }

    if (sortedUsers.length === 0) {
      return interaction.editReply({
        content: lang.get(language, "LB_INVITE_NONE"),
      });
    }

    const lbName = lang.get(language, "INVITE_LB_NAME");
    await renderLeaderboard(
      interaction,
      sortedUsers,
      lbName,
      language,
      (userData) => {
        if (timeFilter === TIME_FILTERS.ALL_TIME) {
          return lang.get(language, "LB_INVITE_LINE_ALL", {
            score: userData.score,
            regular: userData.data.regular || 0,
            bonus: userData.data.bonus || 0,
            leaves: userData.data.leaves || 0,
          });
        } else {
          return lang.get(language, "LB_INVITE_LINE_PERIOD", {
            score: userData.score,
          });
        }
      },
    );
  },
};
