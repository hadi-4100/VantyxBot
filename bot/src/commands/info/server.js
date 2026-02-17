const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const lang = require("../../utils/language");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("server")
    .setDescription("Shows information about the server"),
  async execute(interaction) {
    const language = await lang.getLanguage(interaction.guildId);
    const guild = interaction.guild;
    const owner = await guild.fetchOwner();

    const embed = new EmbedBuilder()
      .setColor("#0099ff")
      .setTitle(lang.get(language, "SERVERINFO_TITLE"))
      .setThumbnail(guild.iconURL({ dynamic: true }))
      .addFields(
        {
          name: lang.get(language, "SERVERINFO_OWNER"),
          value: `${owner.user.tag}`,
          inline: true,
        },
        {
          name: lang.get(language, "SERVERINFO_CREATED"),
          value: `<t:${Math.floor(guild.createdTimestamp / 1000)}:R>`,
          inline: true,
        },
        {
          name: lang.get(language, "SERVERINFO_MEMBERS"),
          value: `${guild.memberCount}`,
          inline: true,
        },
        {
          name: lang.get(language, "SERVERINFO_CHANNELS"),
          value: `${guild.channels.cache.size}`,
          inline: true,
        },
        {
          name: lang.get(language, "SERVERINFO_ROLES"),
          value: `${guild.roles.cache.size}`,
          inline: true,
        },
        {
          name: lang.get(language, "SERVERINFO_BOOSTS"),
          value: `${guild.premiumSubscriptionCount}`,
          inline: true,
        },
        {
          name: lang.get(language, "SERVERINFO_ID"),
          value: guild.id,
          inline: true,
        }
      );

    if (guild.bannerURL()) {
      embed.setImage(guild.bannerURL({ size: 1024 }));
    }

    await interaction.reply({ embeds: [embed] });
  },
};
