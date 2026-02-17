const { Events, EmbedBuilder } = require("discord.js");
const guildLogger = require("../../utils/guildLogger");
const lang = require("../../utils/language");

module.exports = {
  name: Events.VoiceStateUpdate,
  async execute(oldState, newState) {
    const guild = newState.guild;
    const member = newState.member;

    if (!guild || !member) return;
    const language = await lang.getLanguage(guild.id);

    let embed = new EmbedBuilder().setTimestamp().setColor("#0099ff");
    let action = "";

    if (!oldState.channelId && newState.channelId) {
      action = lang.get(language, "LOG_VOICE_JOINED");
      embed.setDescription(
        lang.get(language, "LOG_VOICE_JOINED_DESC", {
          user: member.user.tag,
          channel: newState.channel.name,
        })
      );
    } else if (oldState.channelId && !newState.channelId) {
      action = lang.get(language, "LOG_VOICE_LEFT");
      embed.setDescription(
        lang.get(language, "LOG_VOICE_LEFT_DESC", {
          user: member.user.tag,
          channel: oldState.channel.name,
        })
      );
    } else if (
      oldState.channelId &&
      newState.channelId &&
      oldState.channelId !== newState.channelId
    ) {
      action = lang.get(language, "LOG_VOICE_SWITCHED");
      embed.setDescription(
        lang.get(language, "LOG_VOICE_SWITCHED_DESC", {
          user: member.user.tag,
          oldChannel: oldState.channel.name,
          newChannel: newState.channel.name,
        })
      );
    } else {
      return;
    }

    embed.setTitle(lang.get(language, "LOG_VOICE_UPDATE_TITLE", { action }));
    await guildLogger.log(guild, "voice", embed);
  },
};
