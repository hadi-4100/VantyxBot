const {
  SlashCommandBuilder,
  PermissionFlagsBits,
  MessageFlags,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ComponentType,
} = require("discord.js");
const Guild = require("../../database/models/Guild");
const { checkPermissions } = require("../../utils/permissions");
const lang = require("../../utils/language");
const { sendTemporary } = require("../../utils/messages");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("reaction-role-reset")
    .setDescription("Remove reaction role messages from the server")
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

    // Confirmation Flow
    const confirmRow = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("rr_reset_confirm")
        .setLabel("Confirm Reset")
        .setStyle(ButtonStyle.Danger),
      new ButtonBuilder()
        .setCustomId("rr_reset_cancel")
        .setLabel("Cancel")
        .setStyle(ButtonStyle.Secondary),
    );

    const response = await interaction.reply({
      content: lang.get(language, "RR_RESET_CONFIRM"),
      components: [confirmRow],
      flags: MessageFlags.Ephemeral,
    });

    const collector = response.createMessageComponentCollector({
      componentType: ComponentType.Button,
      time: 15000,
    });

    collector.on("collect", async (i) => {
      if (i.customId === "rr_reset_confirm") {
        await i.deferUpdate();

        const results = [];
        for (const config of messages) {
          if (config.messageId && config.channelId) {
            const channel = interaction.guild.channels.cache.get(
              config.channelId,
            );
            if (channel) {
              try {
                const msg = await channel.messages.fetch(config.messageId);
                await msg.delete();
                results.push(
                  lang.get(language, "RR_DELETED", {
                    channel: channel.toString(),
                  }),
                );
              } catch (e) {
                results.push(
                  lang.get(language, "RR_DELETE_ERROR", {
                    channel: channel.toString(),
                  }),
                );
              }
            }
          }
        }

        // Clear message IDs in Database
        for (const config of messages) {
          config.messageId = null;
        }
        await guildSettings.save();

        await i.editReply({
          content: lang.get(language, "RR_RESET_COMPLETE", {
            results:
              results.length > 0
                ? results.join("\n")
                : lang.get(language, "RR_NO_ACTIVE"),
          }),
          components: [],
        });
      } else {
        await i.update({
          content: lang.get(language, "RR_RESET_CANCEL"),
          components: [],
        });
      }
      collector.stop();
    });

    collector.on("end", (collected) => {
      if (collected.size === 0) {
        interaction
          .editReply({
            content: lang.get(language, "RR_RESET_TIMEOUT"),
            components: [],
          })
          .catch(() => {});
      }
    });
  },
};
