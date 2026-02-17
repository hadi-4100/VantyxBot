const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const lang = require("../../utils/language");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("user")
    .setDescription("Shows information about yourself or a user")
    .addUserOption((option) =>
      option.setName("target").setDescription("The user")
    ),
  async execute(interaction) {
    const language = await lang.getLanguage(interaction.guildId);
    const target = interaction.options.getUser("target") || interaction.user;
    const member = await interaction.guild.members
      .fetch(target.id)
      .catch(() => null);

    const embed = new EmbedBuilder()
      .setColor(member ? member.displayHexColor : "#0099ff")
      .setTitle(lang.get(language, "USERINFO_TITLE"))
      .setThumbnail(target.displayAvatarURL({ dynamic: true, size: 1024 }))
      .addFields(
        {
          name: lang.get(language, "USERINFO_USERNAME"),
          value: target.tag,
          inline: true,
        },
        {
          name: lang.get(language, "USERINFO_ID"),
          value: target.id,
          inline: true,
        },
        {
          name: lang.get(language, "USERINFO_CREATED"),
          value: `<t:${Math.floor(target.createdTimestamp / 1000)}:R>`,
          inline: true,
        },
        {
          name: lang.get(language, "USERINFO_JOINED"),
          value: member
            ? `<t:${Math.floor(member.joinedTimestamp / 1000)}:R>`
            : lang.get(language, "USERINFO_NO"),
          inline: true,
        },
        {
          name: lang.get(language, "USERINFO_BOT"),
          value: target.bot
            ? lang.get(language, "USERINFO_YES")
            : lang.get(language, "USERINFO_NO"),
          inline: true,
        }
      );

    if (member) {
      const roles = member.roles.cache
        .filter((r) => r.id !== interaction.guild.id)
        .sort((a, b) => b.position - a.position)
        .map((r) => r.toString())
        .slice(0, 10); // Limit to 10 roles

      if (roles.length > 0) {
        embed.addFields({
          name: lang.get(language, "USERINFO_ROLES"),
          value: `${roles.join(", ")}${
            member.roles.cache.size > 11
              ? ` +${member.roles.cache.size - 11} more`
              : ""
          }`,
          inline: false,
        });
      }
    }

    await interaction.reply({ embeds: [embed] });
  },
};
