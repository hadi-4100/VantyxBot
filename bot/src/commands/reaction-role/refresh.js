const {
  SlashCommandBuilder,
  PermissionFlagsBits,
  MessageFlags,
} = require("discord.js");
const Guild = require("../../database/models/Guild");
const { checkPermissions } = require("../../utils/permissions");
const {
  createComponents,
  getDiscordEmbed,
} = require("../../utils/reactionRoleUtils");
const logger = require("../../utils/logger");
const lang = require("../../utils/language");
const { sendTemporary } = require("../../utils/messages");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("reaction-role-refresh")
    .setDescription("Sync existing reaction role messages with dashboard")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

  async execute(interaction) {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    const isAllowed = await checkPermissions(interaction, {
      permissions: [PermissionFlagsBits.ManageGuild],
    });
    if (!isAllowed) return;

    const language = await lang.getLanguage(interaction.guildId);
    const guildSettings = await Guild.findById(interaction.guildId);

    if (!guildSettings?.reactionRoles?.enabled) {
      return sendTemporary(interaction, {
        content: lang.get(language, "RR_DISABLED"),
        flags: MessageFlags.Ephemeral,
      });
    }

    const { messages } = guildSettings.reactionRoles;
    if (!messages || messages.length === 0) {
      return sendTemporary(interaction, {
        content: lang.get(language, "RR_NO_CONFIG"),
        flags: MessageFlags.Ephemeral,
      });
    }

    const results = [];
    for (let i = 0; i < messages.length; i++) {
      const config = messages[i];

      if (!config.messageId || !config.channelId) {
        results.push(lang.get(language, "RR_NOT_DEPLOYED", { i: i + 1 }));
        continue;
      }

      let channel;
      try {
        channel = await interaction.guild.channels.fetch(config.channelId);
      } catch (err) {
        results.push(lang.get(language, "RR_CHANNEL_ERROR", { i: i + 1 }));
        continue;
      }

      try {
        const discordEmbed = await getDiscordEmbed(interaction, config);
        const components = createComponents(config, language);

        const message = await channel.messages.fetch(config.messageId);
        await message.edit({
          embeds: [discordEmbed],
          components: [components],
        });

        results.push(
          lang.get(language, "RR_REFRESH_SUCCESS", {
            i: i + 1,
            channel: channel.toString(),
          }),
        );
      } catch (err) {
        logger.error("RR Refresh Error Details:", err);
        results.push(lang.get(language, "RR_REFRESH_ERROR", { i: i + 1 }));
      }
    }

    await interaction.editReply({
      content: lang.get(language, "RR_REFRESH_RESULTS", {
        results: results.join("\n"),
      }),
    });
  },
};
