const { Events, EmbedBuilder } = require("discord.js");
const { log } = require("../../utils/guildLogger");

module.exports = {
  name: Events.GuildRoleCreate,
  async execute(role) {
    if (!role.guild) return;
    const embed = new EmbedBuilder()
      .setTitle("Role Created")
      .setDescription(`Role ${role} (\`${role.name}\`) was created.`)
      .addFields({ name: "ID", value: `${role.id}`, inline: true })
      .setColor("#00FF00")
      .setTimestamp();

    await log(role.guild, "server", embed);
  },
};
