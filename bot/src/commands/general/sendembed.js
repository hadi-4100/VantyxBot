const {
  SlashCommandBuilder,
  PermissionFlagsBits,
  MessageFlags,
  EmbedBuilder,
  ChannelType,
} = require("discord.js");
const EmbedModel = require("../../database/models/Embed");
const lang = require("../../utils/language");
const logger = require("../../utils/logger");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("sendembed")
    .setDescription("Send a custom embed created in the dashboard")
    .addStringOption((option) =>
      option
        .setName("code")
        .setDescription("The unique code of the embed (e.g. welcome_v1)")
        .setRequired(true)
        .setAutocomplete(true)
    )
    .addChannelOption((option) =>
      option
        .setName("channel")
        .setDescription(
          "The channel to send the embed to (defaults to current)"
        )
        .addChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),

  async autocomplete(interaction) {
    try {
      if (!interaction.guildId) return;

      const focusedValue = interaction.options.getFocused() || "";
      const embeds = await EmbedModel.find({
        guildId: interaction.guildId,
      })
        .select("code name")
        .limit(25)
        .lean();

      const filtered = embeds.filter(
        (e) =>
          (e.code &&
            e.code.toLowerCase().includes(focusedValue.toLowerCase())) ||
          (e.name && e.name.toLowerCase().includes(focusedValue.toLowerCase()))
      );

      await interaction.respond(
        filtered.map((e) => ({
          name: `${e.name || "Unnamed"} (${e.code})`,
          value: e.code,
        }))
      );
    } catch (error) {
      logger.error(`Autocomplete Error (sendembed): ${error.message}`);
    }
  },

  async execute(interaction) {
    const code = interaction.options.getString("code");
    const channel =
      interaction.options.getChannel("channel") || interaction.channel;
    const language = await lang.getLanguage(interaction.guildId);

    const embedDoc = await EmbedModel.findOne({
      guildId: interaction.guildId,
      code,
    });

    if (!embedDoc) {
      return interaction.reply({
        content: lang.get(language, "EMBED_NOT_FOUND"),
        flags: MessageFlags.Ephemeral,
      });
    }

    const { embedData } = embedDoc;

    try {
      const embed = new EmbedBuilder();

      if (embedData.title) embed.setTitle(embedData.title);
      if (embedData.description) embed.setDescription(embedData.description);
      if (embedData.url) embed.setURL(embedData.url);
      if (embedData.color) embed.setColor(embedData.color);

      if (embedData.author?.name) {
        embed.setAuthor({
          name: embedData.author.name,
          iconURL: embedData.author.icon_url || null,
          url: embedData.author.url || null,
        });
      }

      if (embedData.thumbnail?.url) embed.setThumbnail(embedData.thumbnail.url);
      if (embedData.image?.url) embed.setImage(embedData.image.url);

      if (embedData.footer?.text) {
        embed.setFooter({
          text: embedData.footer.text,
          iconURL: embedData.footer.icon_url || null,
        });
      }

      if (embedData.fields && embedData.fields.length > 0) {
        embed.addFields(
          embedData.fields.map((f) => ({
            name: f.name,
            value: f.value,
            inline: f.inline,
          }))
        );
      }

      // Check if bot can send in target channel
      if (
        !channel
          .permissionsFor(interaction.client.user)
          .has(PermissionFlagsBits.SendMessages)
      ) {
        return interaction.reply({
          content: lang.get(language, "EMBED_NO_PERM", {
            channel: channel.toString(),
          }),
          flags: MessageFlags.Ephemeral,
        });
      }

      await channel.send({ embeds: [embed] });

      await interaction.reply({
        content: lang.get(language, "EMBED_SENT", {
          code: code,
          channel: channel.toString(),
        }),
        flags: MessageFlags.Ephemeral,
      });
    } catch (error) {
      logger.error(`Error sending custom embed: ${error.message}`);
      interaction.reply({
        content: lang.get(language, "EMBED_ERROR"),
        flags: MessageFlags.Ephemeral,
      });
    }
  },
};
