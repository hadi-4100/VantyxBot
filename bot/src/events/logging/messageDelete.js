const { Events, EmbedBuilder } = require("discord.js");
const guildLogger = require("../../utils/guildLogger");
const lang = require("../../utils/language");

module.exports = {
  name: Events.MessageDelete,
  async execute(message) {
    if (!message.guild || !message.author) return;
    if (message.author.bot) return;

    const language = await lang.getLanguage(message.guild.id);

    const embed = new EmbedBuilder()
      .setTitle(lang.get(language, "LOG_MESSAGE_DELETED_TITLE"))
      .setDescription(
        lang.get(language, "LOG_MESSAGE_DELETED_DESC", {
          tag: message.author.tag,
          channel: message.channel.toString(),
          content: message.content || lang.get(language, "LOG_NO_CONTENT"),
        })
      )
      .setColor("#FF0000")
      .setTimestamp();

    await guildLogger.log(message.guild, "message", embed);
  },
};
