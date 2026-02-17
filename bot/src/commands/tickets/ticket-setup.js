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
    .setName("ticket-setup")
    .setDescription("Installs the Ticket System (One-time setup)")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    const language = await lang.getLanguage(interaction.guildId);
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    try {
      const settings = await TicketSettings.findOne({
        guildId: interaction.guildId,
      });

      // 1. Check if settings exist and system is enabled
      if (!settings || !settings.enabled) {
        return interaction.editReply(lang.get(language, "TICKET_DISABLED"));
      }

      // 2. Validate Base Configuration
      const missing = [];
      if (!settings.panelChannelId) missing.push("Panel Channel");
      if (!settings.ticketsCategoryId) missing.push("Ticket Category");

      // Validate Ticket Types
      const enabledTypes = settings.ticketTypes.filter((t) => t.enabled);
      if (enabledTypes.length === 0)
        missing.push("At least one enabled Ticket Type");

      // Validate Embed Config
      if (missing.length > 0) {
        return interaction.editReply(
          lang.get(language, "TICKET_SETUP_INCOMPLETE", {
            missing: missing.map((m) => `• ${m}`).join("\n"),
          })
        );
      }

      // 3. System already installed check
      if (settings.installed && settings.panelMessageId) {
        try {
          const chCallback = await interaction.guild.channels
            .fetch(settings.panelChannelId)
            .catch(() => null);
          if (chCallback) {
            const msg = await chCallback.messages
              .fetch(settings.panelMessageId)
              .catch(() => null);
            if (msg) {
              return interaction.editReply(
                lang.get(language, "TICKET_ALREADY_INSTALLED")
              );
            }
          }
        } catch (e) {
          logger.warn(`Error checking existing ticket panel: ${e.message}`);
        }
      }

      // 4. Fetch Resources
      const panelChannel = interaction.guild.channels.cache.get(
        settings.panelChannelId
      );
      if (!panelChannel || panelChannel.type !== ChannelType.GuildText) {
        return interaction.editReply(
          lang.get(language, "TICKET_INVALID_CHANNEL")
        );
      }

      const category = interaction.guild.channels.cache.get(
        settings.ticketsCategoryId
      );
      if (!category || category.type !== ChannelType.GuildCategory) {
        return interaction.editReply(
          lang.get(language, "TICKET_INVALID_CATEGORY")
        );
      }

      // 5. Build Embed
      let panelEmbed;
      if (settings.panelEmbedId) {
        const customEmbed = await Embed.findOne({ _id: settings.panelEmbedId });
        if (customEmbed) {
          panelEmbed = new EmbedBuilder(customEmbed.embedData);
        }
      }

      if (!panelEmbed) {
        // Default Embed
        panelEmbed = new EmbedBuilder()
          .setTitle(lang.get(language, "TICKET_DEFAULT_TITLE"))
          .setDescription(lang.get(language, "TICKET_DEFAULT_DESC"))
          .setColor("#5865F2")
          .setFooter({ text: lang.get(language, "TICKET_FOOTER_PL") });
      }

      // 6. Build Buttons
      const rows = [];
      let currentRow = new ActionRowBuilder();

      for (const type of enabledTypes) {
        // Validate styling
        let style = ButtonStyle.Primary;
        if (type.buttonStyle === "SECONDARY") style = ButtonStyle.Secondary;
        else if (type.buttonStyle === "SUCCESS") style = ButtonStyle.Success;
        else if (type.buttonStyle === "DANGER") style = ButtonStyle.Danger;

        const btn = new ButtonBuilder()
          .setCustomId(`ticket:create:${type._id}`)
          .setLabel(type.buttonLabel || type.name)
          .setStyle(style);

        if (type.emoji) btn.setEmoji(type.emoji);

        if (currentRow.components.length >= 5) {
          rows.push(currentRow);
          currentRow = new ActionRowBuilder();
        }
        currentRow.addComponents(btn);
      }
      if (currentRow.components.length > 0) rows.push(currentRow);

      // 7. Send Panel
      const message = await panelChannel.send({
        embeds: [panelEmbed],
        components: rows,
      });

      // 8. Update Settings
      settings.installed = true;
      settings.panelMessageId = message.id;
      await settings.save();

      interaction.editReply(
        lang.get(language, "TICKET_SETUP_COMPLETE", {
          channel: panelChannel.toString(),
        })
      );
    } catch (error) {
      logger.error(error);
      interaction.editReply(lang.get(language, "ERROR"));
    }
  },
};
