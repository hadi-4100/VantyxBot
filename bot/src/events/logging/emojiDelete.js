const { Events, EmbedBuilder } = require("discord.js");
const { log } = require("../../utils/guildLogger");

module.exports = {
  name: Events.GuildEmojiDelete,
  async execute(emoji) {
    if (!emoji.guild) return;
    const embed = new EmbedBuilder()
      .setTitle("Emoji Deleted")
      .setDescription(`Emoji \`${emoji.name}\` was deleted.`)
      .setThumbnail(emoji.imageURL())
      .addFields({ name: "ID", value: `${emoji.id}`, inline: true })
      .setColor("#FF0000")
      .setTimestamp();

    await log(emoji.guild, "server", embed);
  },
};
