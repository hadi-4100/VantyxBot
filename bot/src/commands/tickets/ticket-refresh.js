const {
  SlashCommandBuilder,
  PermissionFlagsBits,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChannelType,
  MessageFlags,
} = require("discord.js");
const TicketSettings = require("../../database/models/TicketSettings");
const Embed = require("../../database/models/Embed");
const lang = require("../../utils/language");
const logger = require("../../utils/logger");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("ticket-refresh")
    .setDescription(
      "Forces an update of the Ticket Panel using the latest Dashboard settings"
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    const language = await lang.getLanguage(interaction.guildId);
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    try {
      // 1. Fetch Latest Settings
      const settings = await TicketSettings.findOne({
        guildId: interaction.guildId,
      });

      if (!settings || !settings.enabled) {
        return interaction.editReply(lang.get(language, "TICKET_DISABLED"));
      }

      // 2. Resolve Channel
      if (!settings.panelChannelId) {
        return interaction.editReply(lang.get(language, "TICKET_NO_CHANNEL"));
      }

      const channel = interaction.guild.channels.cache.get(
        settings.panelChannelId
      );
      if (!channel || channel.type !== ChannelType.GuildText) {
        return interaction.editReply(
          lang.get(language, "TICKET_INVALID_CHANNEL")
        );
      }

      // 3. Attempt to fetch existing message
      let existingMessage = null;
      if (settings.panelMessageId) {
        try {
          existingMessage = await channel.messages
            .fetch(settings.panelMessageId)
            .catch(() => null);
        } catch (e) {
          logger.warn(`Could not fetch existing panel message: ${e.message}`);
        }
      }

      // 4. Build the Embed (Fresh from DB)
      let panelEmbed;
      if (settings.panelEmbedId) {
        const customEmbed = await Embed.findOne({ _id: settings.panelEmbedId });
        if (customEmbed && customEmbed.embedData) {
          panelEmbed = new EmbedBuilder(customEmbed.embedData);
        }
      }

      // Fallback Default Embed
      if (!panelEmbed) {
        panelEmbed = new EmbedBuilder()
          .setTitle(lang.get(language, "TICKET_DEFAULT_TITLE"))
          .setDescription(lang.get(language, "TICKET_DEFAULT_DESC"))
          .setColor("#5865F2")
          .setFooter({ text: lang.get(language, "TICKET_FOOTER_PL") });
      }

      // 5. Build Buttons (Fresh from DB)
      const enabledTypes = settings.ticketTypes.filter((t) => t.enabled);
      if (enabledTypes.length === 0) {
        return interaction.editReply(lang.get(language, "TICKET_NO_TYPES"));
      }

      const rows = [];
      let currentRow = new ActionRowBuilder();

      for (const type of enabledTypes) {
        let style = ButtonStyle.Primary;
        switch (type.buttonStyle) {
          case "SECONDARY":
            style = ButtonStyle.Secondary;
            break;
          case "SUCCESS":
            style = ButtonStyle.Success;
            break;
          case "DANGER":
            style = ButtonStyle.Danger;
            break;
          default:
            style = ButtonStyle.Primary;
        }

        const btn = new ButtonBuilder()
          .setCustomId(`ticket:create:${type._id}`)
          .setLabel(type.buttonLabel || type.name)
          .setStyle(style);

        if (type.emoji) {
          btn.setEmoji(type.emoji);
        }

        if (currentRow.components.length >= 5) {
          rows.push(currentRow);
          currentRow = new ActionRowBuilder();
        }
        currentRow.addComponents(btn);
      }
      if (currentRow.components.length > 0) rows.push(currentRow);

      // 6. Execute Update or Create
      if (existingMessage) {
        await existingMessage.edit({
          content: null,
          embeds: [panelEmbed],
          components: rows,
        });

        await interaction.editReply(
          lang.get(language, "TICKET_PANEL_UPDATED", {
            channel: channel.toString(),
          })
        );
      } else {
        // Create new if missing
        const newMessage = await channel.send({
          embeds: [panelEmbed],
          components: rows,
        });

        // Save new ID
        settings.panelMessageId = newMessage.id;
        settings.installed = true;
        await settings.save();

        await interaction.editReply(
          lang.get(language, "TICKET_PANEL_RECREATED", {
            channel: channel.toString(),
          })
        );
      }
    } catch (error) {
      logger.error(error);
      interaction.editReply(lang.get(language, "ERROR"));
    }
  },
};
