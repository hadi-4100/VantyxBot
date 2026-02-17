const { Events, EmbedBuilder } = require("discord.js");
const { log } = require("../../utils/guildLogger");

module.exports = {
  name: Events.GuildEmojiCreate,
  async execute(emoji) {
    if (!emoji.guild) return;
    const embed = new EmbedBuilder()
      .setTitle("Emoji Created")
      .setDescription(`Emoji ${emoji} (\`${emoji.name}\`) was created.`)
      .setThumbnail(emoji.imageURL())
      .addFields({ name: "ID", value: `${emoji.id}`, inline: true })
      .setColor("#00FF00")
      .setTimestamp();

    await log(emoji.guild, "server", embed);
  },
};
