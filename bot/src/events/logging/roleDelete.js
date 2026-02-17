const { Events, EmbedBuilder } = require("discord.js");
const { log } = require("../../utils/guildLogger");

module.exports = {
  name: Events.GuildRoleDelete,
  async execute(role) {
    if (!role.guild) return;
    const embed = new EmbedBuilder()
      .setTitle("Role Deleted")
      .setDescription(`Role \`${role.name}\` was deleted.`)
      .addFields({ name: "ID", value: `${role.id}`, inline: true })
      .setColor("#FF0000")
      .setTimestamp();

    await log(role.guild, "server", embed);
  },
};
