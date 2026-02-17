const {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
  EmbedBuilder,
} = require("discord.js");
const Embed = require("../database/models/Embed");
const lang = require("./language");
const logger = require("./logger");

/**
 * Creates the Discord components (buttons or select menu) for a reaction role message
 * @param {Object} config - Message configuration from DB
 * @param {String} language - The language code to use for strings
 * @returns {ActionRowBuilder}
 */
function createComponents(config, language = "en") {
  if (config.interactionType === "buttons") {
    const row = new ActionRowBuilder();
    config.roles.forEach((r) => {
      const button = new ButtonBuilder()
        .setCustomId(`rr:${config._id}:${r.roleId}`)
        .setLabel(r.label)
        .setStyle(ButtonStyle.Secondary);

      if (r.emoji) {
        button.setEmoji(r.emoji);
      }
      row.addComponents(button);
    });
    return row;
  } else {
    // Select Menu
    const select = new StringSelectMenuBuilder()
      .setCustomId(`rr:${config._id}:select`)
      .setPlaceholder(lang.get(language, "RR_SELECT_PLACEHOLDER"))
      .setMinValues(0)
      .setMaxValues(
        config.allowMultiple
          ? Math.min(config.maxRoles, config.roles.length)
          : 1
      );

    config.roles.forEach((r) => {
      const option = new StringSelectMenuOptionBuilder()
        .setLabel(r.label)
        .setValue(r.roleId);

      if (r.emoji) option.setEmoji(r.emoji);
      if (r.description) option.setDescription(r.description);

      select.addOptions(option);
    });

    return new ActionRowBuilder().addComponents(select);
  }
}

/**
 * Gets the Discord embed for a reaction role message, falling back to default if not set
 * @param {Interaction} interaction - The Discord interaction
 * @param {Object} config - Message configuration from DB
 * @returns {EmbedBuilder}
 */
async function getDiscordEmbed(interaction, config) {
  const language = await lang.getLanguage(interaction.guildId);

  if (config.embedId && config.embedId !== "none") {
    try {
      const customEmbed = await Embed.findOne({
        guildId: interaction.guildId,
        _id: config.embedId,
      }).lean();

      if (customEmbed && customEmbed.embedData) {
        return EmbedBuilder.from(customEmbed.embedData);
      }
    } catch (err) {
      logger.error(`Error fetching custom embed for RR: ${err.message}`);
    }
  }

  // Fallback to localized default
  const guildName = interaction.guild?.name || "Server";
  const guildIcon = interaction.guild?.iconURL({ dynamic: true }) || null;

  const embed = new EmbedBuilder()
    .setAuthor({
      name: lang.get(language, "RR_EMBED_AUTHOR", { guild: guildName }),
      iconURL: guildIcon,
    })
    .setTitle(lang.get(language, "RR_EMBED_TITLE"))
    .setDescription(lang.get(language, "RR_EMBED_DESC"))
    .setColor("#5865F2")
    .setFooter({
      text: lang.get(language, "RR_EMBED_FOOTER"),
      iconURL: interaction.client.user.displayAvatarURL(),
    })
    .setTimestamp();

  if (guildIcon) {
    embed.setThumbnail(guildIcon);
  }

  return embed;
}

module.exports = { createComponents, getDiscordEmbed };
