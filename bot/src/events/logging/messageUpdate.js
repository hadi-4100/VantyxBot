const { Events, EmbedBuilder } = require("discord.js");
const guildLogger = require("../../utils/guildLogger");
const lang = require("../../utils/language");

/**
 * Event: MessageUpdate
 * Logs when a user edits their message. captures both original and updated content.
 */
module.exports = {
  name: Events.MessageUpdate,
  async execute(oldMessage, newMessage) {
    // 1. Validation: Ensure we have a valid guild context and it's not a bot
    if (!oldMessage.guild || !oldMessage.author || oldMessage.author.bot)
      return;

    // Ignore updates where content didn't change (e.g., embed additions by Discord)
    if (oldMessage.content === newMessage.content) return;

    const language = await lang.getLanguage(oldMessage.guild.id);

    // 2. Build Logging Embed
    const embed = new EmbedBuilder()
      .setTitle(lang.get(language, "LOG_MESSAGE_EDITED_TITLE"))
      .setAuthor({
        name: oldMessage.author.tag,
        iconURL: oldMessage.author.displayAvatarURL({ dynamic: true }),
      })
      .setDescription(
        lang.get(language, "LOG_MESSAGE_EDITED_DESC", {
          user: oldMessage.author.toString(),
          channel: oldMessage.channel.toString(),
          oldContent: oldMessage.content || "*No content*",
          newContent: newMessage.content || "*No content*",
        }),
      )
      .setColor("#FFD700")
      .setTimestamp()
      .setFooter({ text: `User ID: ${oldMessage.author.id}` });

    // 3. Dispatch to Guild's message logs
    await guildLogger.log(oldMessage.guild, "message", embed);
  },
};
