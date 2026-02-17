const { EmbedBuilder } = require("discord.js");
const Guild = require("../database/models/Guild");

async function log(guild, category, embed) {
  const guildData = await Guild.findById(guild.id).lean();
  if (!guildData || !guildData.logs || !guildData.logs[category]) return;

  const logSetting = guildData.logs[category];

  // Handle both old (string) and new (object) formats
  let channelId;
  if (typeof logSetting === "string") {
    channelId = logSetting;
  } else {
    if (!logSetting.enabled) return;
    channelId = logSetting.channel;
  }

  if (!channelId) return;

  const channel = guild.channels.cache.get(channelId);

  if (channel) {
    await channel
      .send({ embeds: [embed] })
      .catch((err) =>
        console.error(`Failed to send log to ${channel.name}:`, err)
      );
  }
}

module.exports = { log };
