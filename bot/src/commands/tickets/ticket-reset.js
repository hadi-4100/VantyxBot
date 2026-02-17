const {
  SlashCommandBuilder,
  PermissionFlagsBits,
  MessageFlags,
} = require("discord.js");
const TicketSettings = require("../../database/models/TicketSettings");
const Ticket = require("../../database/models/Ticket");
const lang = require("../../utils/language");
const { sendTemporary } = require("../../utils/messages");
const logger = require("../../utils/logger");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("ticket-reset")
    .setDescription("Resets the Ticket System (Admin Only)")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });
    const language = await lang.getLanguage(interaction.guildId);

    try {
      const {
        ActionRowBuilder,
        ButtonBuilder,
        ButtonStyle,
        ComponentType,
      } = require("discord.js");

      const confirmBtn = new ButtonBuilder()
        .setCustomId("confirm_reset")
        .setLabel("Confirm Reset")
        .setStyle(ButtonStyle.Danger);

      const cancelBtn = new ButtonBuilder()
        .setCustomId("cancel_reset")
        .setLabel("Cancel")
        .setStyle(ButtonStyle.Secondary);

      const row = new ActionRowBuilder().addComponents(confirmBtn, cancelBtn);

      const response = await interaction.editReply({
        content: lang.get(language, "TICKET_RESET_CONFIRM"),
        components: [row],
      });

      const collector = response.createMessageComponentCollector({
        componentType: ComponentType.Button,
        time: 15000,
      });

      collector.on("collect", async (i) => {
        if (i.user.id !== interaction.user.id)
          return sendTemporary(i, {
            content: lang.get(language, "TICKET_NOT_YOURS"),
            flags: MessageFlags.Ephemeral,
          });

        if (i.customId === "cancel_reset") {
          await i.update({
            content: lang.get(language, "TICKET_RESET_CANCEL"),
            components: [],
          });
          return;
        }

        if (i.customId === "confirm_reset") {
          await i.update({
            content: lang.get(language, "TICKET_RESETTING"),
            components: [],
          });

          const settings = await TicketSettings.findOne({
            guildId: interaction.guildId,
          });
          if (!settings) {
            return interaction.followUp({
              content: lang.get(language, "TICKET_NO_SETTINGS"),
              flags: MessageFlags.Ephemeral,
            });
          }

          // Delete Panel Message
          if (settings.panelChannelId && settings.panelMessageId) {
            try {
              const channel = await interaction.guild.channels.fetch(
                settings.panelChannelId
              );
              if (channel) {
                const msg = await channel.messages
                  .fetch(settings.panelMessageId)
                  .catch(() => null);
                if (msg) await msg.delete();
              }
            } catch (e) {
              logger.error(`Failed to delete panel message: ${e.message}`);
            }
          }

          // Delete Ticket Channels & DB Records
          const tickets = await Ticket.find({ guildId: interaction.guildId });
          for (const t of tickets) {
            try {
              const ch = await interaction.guild.channels
                .fetch(t.channelId)
                .catch(() => null);
              if (ch) await ch.delete();
            } catch (e) {
              logger.error(`Failed to delete ticket channel: ${e.message}`);
            }
          }

          await Ticket.deleteMany({ guildId: interaction.guildId });

          // Reset Settings
          settings.installed = false;
          settings.panelMessageId = null;
          await settings.save();

          await interaction.followUp({
            content: lang.get(language, "TICKET_RESET_COMPLETE"),
            flags: MessageFlags.Ephemeral,
          });
        }
      });
    } catch (error) {
      logger.error(error);
      interaction.editReply({
        content: lang.get(language, "ERROR"),
      });
    }
  },
};
