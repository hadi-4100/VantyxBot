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
    .setName("reaction-role-deploy")
    .setDescription("Deploy only new reaction role messages")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

  async execute(interaction) {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    const isAllowed = await checkPermissions(interaction, {
      permissions: [PermissionFlagsBits.ManageGuild],
    });
    if (!isAllowed) return;

    const language = await lang.getLanguage(interaction.guildId);
    const guildId = interaction.guildId;
    const guildSettings = await Guild.findById(guildId);

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
    let updated = false;

    for (let i = 0; i < messages.length; i++) {
      const config = messages[i];

      if (!config.channelId || !config.roles?.length) {
        results.push(lang.get(language, "RR_CONFIG_INCOMPLETE", { i: i + 1 }));
        continue;
      }

      let channel;
      try {
        channel = await interaction.guild.channels.fetch(config.channelId);
      } catch (err) {
        results.push(lang.get(language, "RR_CHANNEL_ERROR", { i: i + 1 }));
        continue;
      }

      let alreadyExists = false;
      if (config.messageId) {
        try {
          await channel.messages.fetch(config.messageId);
          alreadyExists = true;
        } catch (err) {
          config.messageId = null;
        }
      }

      if (alreadyExists) {
        results.push(
          lang.get(language, "RR_ALREADY_EXISTS", {
            i: i + 1,
            channel: channel.toString(),
          }),
        );
        continue;
      }

      try {
        const discordEmbed = await getDiscordEmbed(interaction, config);
        const components = createComponents(config, language);

        const message = await channel.send({
          embeds: [discordEmbed],
          components: [components],
        });

        config.messageId = message.id;
        updated = true;
        results.push(
          lang.get(language, "RR_DEPLOY_SUCCESS", {
            i: i + 1,
            channel: channel.toString(),
          }),
        );
      } catch (err) {
        logger.error("RR Deploy Error:", err);
        results.push(lang.get(language, "RR_DEPLOY_ERROR", { i: i + 1 }));
      }
    }

    if (updated) {
      await guildSettings.save();
    }

    await interaction.editReply({
      content: lang.get(language, "RR_RESULTS_TITLE", {
        results: results.join("\n"),
      }),
    });
  },
};
