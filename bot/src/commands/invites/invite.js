const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const User = require("../../database/models/User");
const lang = require("../../utils/language");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("invite")
    .setDescription("Invite system commands")
    .addUserOption((option) =>
      option
        .setName("show")
        .setDescription("Shows the number of invites of a user.")
        .setRequired(false)
    ),

  async execute(interaction) {
    const target = interaction.options.getUser("user") || interaction.user;
    const language = await lang.getLanguage(interaction.guildId);

    const userData = await User.findOne({
      guildId: interaction.guildId,
      userId: target.id,
    });

    const regular = userData?.invites?.regular || 0;
    const fake = userData?.invites?.fake || 0;
    const bonus = userData?.invites?.bonus || 0;
    const leaves = userData?.invites?.leaves || 0;
    const total = regular + bonus - leaves;

    const embed = new EmbedBuilder()
      .setTitle(lang.get(language, "INVITE_TITLE", { user: target.username }))
      .setThumbnail(target.displayAvatarURL())
      .addFields(
        {
          name: lang.get(language, "INVITE_TOTAL"),
          value: `**${total}**`,
          inline: true,
        },
        {
          name: lang.get(language, "INVITE_REGULAR"),
          value: `${regular}`,
          inline: true,
        },
        {
          name: lang.get(language, "INVITE_FAKE"),
          value: `${fake}`,
          inline: true,
        },
        {
          name: lang.get(language, "INVITE_LEAVES"),
          value: `${leaves}`,
          inline: true,
        },
        {
          name: lang.get(language, "INVITE_BONUS"),
          value: `${bonus}`,
          inline: true,
        }
      )
      .setColor("#4276f1")
      .setFooter({
        text: interaction.guild.name,
        iconURL: interaction.guild.iconURL(),
      })
      .setTimestamp();

    return interaction.reply({ embeds: [embed] });
  },
};
