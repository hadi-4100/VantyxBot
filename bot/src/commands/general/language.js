const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const lang = require('../../utils/language');
const Guild = require('../../database/models/Guild');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('language')
        .setDescription('Change the bot\'s language.')
        .addStringOption(option =>
            option.setName('lang')
                .setDescription('The language to set')
                .setRequired(true)
                .addChoices(
                    { name: 'English', value: 'en' },
                    { name: 'Arabic', value: 'ar' }
                ))
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),
    async execute(interaction) {
        const newLang = interaction.options.getString('lang');
        
        await Guild.findByIdAndUpdate(interaction.guildId, { language: newLang }, { upsert: true });
        lang.setLanguage(interaction.guildId, newLang);
        
        const response = lang.get(newLang, 'LANGUAGE_CHANGED');
        await interaction.reply(response);
    },
};
