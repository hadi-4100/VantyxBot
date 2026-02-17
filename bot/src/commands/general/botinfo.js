const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const lang = require('../../utils/language');
const { version: discordVersion } = require('discord.js');

function formatUptime(ms) {
  if (!ms || ms < 0) return '0s';

  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days}d ${hours % 24}h`;
  if (hours > 0) return `${hours}h ${minutes % 60}m`;
  if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
  return `${seconds}s`;
}

function formatBytes(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('botinfo')
    .setDescription('Display bot information and statistics'),
  async execute(interaction) {
    const language = await lang.getLanguage(interaction.guildId);
    const client = interaction.client;

    // Calculate total users across all guilds
    const totalUsers = client.guilds.cache.reduce((acc, guild) => acc + guild.memberCount, 0);

    const embed = new EmbedBuilder()
      .setColor('#0099ff')
      .setTitle(lang.get(language, 'BOTINFO_TITLE'))
      .setThumbnail(client.user.displayAvatarURL({ dynamic: true, size: 1024 }))
      .addFields(
        {
          name: lang.get(language, 'BOTINFO_NAME'),
          value: client.user.username,
          inline: true,
        },
        {
          name: lang.get(language, 'BOTINFO_ID'),
          value: client.user.id,
          inline: true,
        },
        {
          name: lang.get(language, 'BOTINFO_CREATED'),
          value: `<t:${Math.floor(client.user.createdTimestamp / 1000)}:R>`,
          inline: true,
        },
        {
          name: lang.get(language, 'BOTINFO_UPTIME'),
          value: formatUptime(client.uptime),
          inline: true,
        },
        {
          name: lang.get(language, 'BOTINFO_SERVERS'),
          value: client.guilds.cache.size.toString(),
          inline: true,
        },
        {
          name: lang.get(language, 'BOTINFO_USERS'),
          value: totalUsers.toString(),
          inline: true,
        },
        {
          name: lang.get(language, 'BOTINFO_MEMORY'),
          value: formatBytes(process.memoryUsage().heapUsed),
          inline: true,
        },
        {
          name: lang.get(language, 'BOTINFO_NODE'),
          value: process.version,
          inline: true,
        },
        {
          name: lang.get(language, 'BOTINFO_DISCORDJS'),
          value: discordVersion,
          inline: true,
        },
        {
          name: lang.get(language, 'BOTINFO_PING'),
          value: `${Math.round(client.ws.ping)}ms`,
          inline: true,
        }
      )
      .setFooter({ text: 'Vantyx Bot', iconURL: client.user.displayAvatarURL() })
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  },
};
