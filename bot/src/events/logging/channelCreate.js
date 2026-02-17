const { Events, EmbedBuilder, ChannelType } = require("discord.js");
const { log } = require("../../utils/guildLogger");
const lang = require("../../utils/language");

module.exports = {
  name: Events.ChannelCreate,
  async execute(channel) {
    if (!channel.guild) return;
    const language = await lang.getLanguage(channel.guild.id);

    const embed = new EmbedBuilder()
      .setTitle(lang.get(language, "LOG_CHANNEL_CREATED_TITLE"))
      .setDescription(
        lang.get(language, "LOG_CHANNEL_CREATED_DESC", {
          channel: channel.toString(),
          name: channel.name,
        }),
      )
      .addFields(
        {
          name: lang.get(language, "LOG_TYPE_LABEL"),
          value: `${Object.keys(ChannelType).find(
            (key) => ChannelType[key] === channel.type,
          )}`,
          inline: true,
        },
        {
          name: lang.get(language, "LOG_ID_LABEL"),
          value: `${channel.id}`,
          inline: true,
        },
      )
      .setColor("#00FF00")
      .setTimestamp();

    await log(channel.guild, "server", embed);
  },
};
