const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const lang = require("../../utils/language");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("roles")
    .setDescription("Get a list of server roles and member counts"),
  async execute(interaction) {
    const language = await lang.getLanguage(interaction.guildId);
    const roles = interaction.guild.roles.cache
      .sort((a, b) => b.position - a.position)
      .filter((r) => r.id !== interaction.guild.id);

    const rolesList = roles
      .map((r) => `${r.toString()} - ${r.members.size} members`)
      .join("\n");

    const embed = new EmbedBuilder()
      .setColor("#0099ff")
      .setTitle(lang.get(language, "ROLES_TITLE"))
      .setDescription(
        rolesList.length > 4000
          ? rolesList.substring(0, 4000) + "..."
          : rolesList
      )
      .setFooter({
        text: lang.get(language, "ROLES_COUNT", { count: roles.size }),
      });

    await interaction.reply({ embeds: [embed] });
  },
};
