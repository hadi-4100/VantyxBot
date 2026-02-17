const { Events, EmbedBuilder, ChannelType } = require("discord.js");
const { log } = require("../../utils/guildLogger");

module.exports = {
  name: Events.ChannelDelete,
  async execute(channel) {
    if (!channel.guild) return;

    const embed = new EmbedBuilder()
      .setTitle("Channel Deleted")
      .setDescription(`Channel \`${channel.name}\` was deleted.`)
      .addFields(
        {
          name: "Type",
          value: `${Object.keys(ChannelType).find(
            (key) => ChannelType[key] === channel.type
          )}`,
          inline: true,
        },
        { name: "ID", value: `${channel.id}`, inline: true }
      )
      .setColor("#FF0000")
      .setTimestamp();

    await log(channel.guild, "server", embed);
  },
};
