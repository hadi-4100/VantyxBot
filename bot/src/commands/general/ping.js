const { SlashCommandBuilder } = require('discord.js');
const lang = require('../../utils/language');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ping')
        .setDescription('Replies with Pong!'),
    async execute(interaction) {
        const language = await lang.getLanguage(interaction.guildId);
        const response = lang.get(language, 'PING_RESPONSE', { latency: Math.abs(Date.now() - interaction.createdTimestamp), api: Math.round(interaction.client.ws.ping) });
        await interaction.reply(response);
    },
};
