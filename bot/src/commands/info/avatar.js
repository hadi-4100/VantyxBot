const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const lang = require("../../utils/language");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("avatar")
    .setDescription("Get a user's avatar")
    .addUserOption((option) =>
      option.setName("target").setDescription("The user")
    ),
  async execute(interaction) {
    const language = await lang.getLanguage(interaction.guildId);
    const target = interaction.options.getUser("target") || interaction.user;

    const isAnimated = target.avatar?.startsWith("a_");

    const embed = new EmbedBuilder()
      .setColor("#0099ff")
      .setTitle(lang.get(language, "AVATAR_TITLE", { user: target.tag }))
      .setImage(target.displayAvatarURL({ extension: isAnimated ? "gif" : "png", size: 1024 }))
      .setDescription(
        `[${lang.get(language, "AVATAR_LINK")}](${target.displayAvatarURL({
          extension: isAnimated ? "gif" : "png",
          size: 1024,
        })})`
      );

    await interaction.reply({ embeds: [embed] });
  },
};
