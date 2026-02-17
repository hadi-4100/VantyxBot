const {
  SlashCommandBuilder,
  PermissionFlagsBits,
  MessageFlags,
  EmbedBuilder,
} = require("discord.js");
const lang = require("../../utils/language");
const Warning = require("../../database/models/Warning");
const { checkPermissions, checkHierarchy } = require("../../utils/permissions");
const { sendTemporary } = require("../../utils/messages");
const logger = require("../../utils/logger");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("removewarn")
    .setDescription("Remove warnings from a member")
    .addUserOption((option) =>
      option
        .setName("user")
        .setDescription("The user to remove warnings from")
        .setRequired(true)
    )
    .addStringOption((option) =>
      option
        .setName("type")
        .setDescription("What to remove")
        .setRequired(false)
        .addChoices(
          { name: "Latest Warning", value: "latest" },
          { name: "All Warnings", value: "all" }
        )
    )
    .addStringOption((option) =>
      option
        .setName("id")
        .setDescription("Specific warning ID to remove (optional)")
        .setRequired(false)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

  async execute(interaction) {
    const isAllowed = await checkPermissions(interaction, {
      permissions: [
        PermissionFlagsBits.ModerateMembers,
        PermissionFlagsBits.ManageGuild,
      ],
    });
    if (!isAllowed) return;

    const language = await lang.getLanguage(interaction.guildId);
    const user = interaction.options.getUser("user");
    const member = await interaction.guild.members
      .fetch(user.id)
      .catch(() => null);

    // Hierarchy Check
    if (member && !checkHierarchy(interaction.member, member)) {
      return sendTemporary(interaction, {
        content: lang.get(language, "HIERARCHY_ERROR"),
        flags: MessageFlags.Ephemeral,
      });
    }

    const type = interaction.options.getString("type") || "latest";
    const warningId = interaction.options.getString("id");

    try {
      await interaction.deferReply();

      // If specific ID is provided, remove that warning
      if (warningId) {
        const warning = await Warning.findOneAndDelete({
          _id: warningId,
          guildId: interaction.guildId,
          userId: user.id,
        });

        if (!warning) {
          return interaction.editReply({
            content: lang.get(language, "REMOVEWARN_NOT_FOUND"),
            flags: MessageFlags.Ephemeral,
          });
        }

        const embed = new EmbedBuilder()
          .setColor("#00FF00")
          .setTitle(lang.get(language, "REMOVEWARN_TITLE"))
          .setDescription(
            lang.get(language, "REMOVEWARN_SUCCESS", {
              id: warningId,
              user: user.tag,
            })
          )
          .addFields(
            {
              name: lang.get(language, "REMOVEWARN_USER"),
              value: `${user.tag} (${user.id})`,
              inline: true,
            },
            {
              name: lang.get(language, "REMOVEWARN_ID"),
              value: warningId,
              inline: true,
            }
          )
          .setThumbnail(user.displayAvatarURL({ dynamic: true }))
          .setTimestamp()
          .setFooter({
            text: interaction.guild.name,
            iconURL: interaction.guild.iconURL({ dynamic: true }),
          });

        return interaction.editReply({ embeds: [embed] });
      }

      // Remove based on type
      if (type === "all") {
        const result = await Warning.deleteMany({
          guildId: interaction.guildId,
          userId: user.id,
        });

        if (result.deletedCount === 0) {
          return interaction.editReply({
            content: lang.get(language, "REMOVEWARN_NO_WARNINGS", {
              user: user.tag,
            }),
            flags: MessageFlags.Ephemeral,
          });
        }

        const embed = new EmbedBuilder()
          .setColor("#00FF00")
          .setTitle(lang.get(language, "REMOVEWARN_TITLE"))
          .setDescription(
            lang.get(language, "REMOVEWARN_ALL_SUCCESS", {
              count: result.deletedCount,
              user: user.tag,
            })
          )
          .setThumbnail(user.displayAvatarURL({ dynamic: true }))
          .setTimestamp()
          .setFooter({
            text: interaction.guild.name,
            iconURL: interaction.guild.iconURL({ dynamic: true }),
          });

        return interaction.editReply({ embeds: [embed] });
      }

      // Remove latest warning
      if (type === "latest") {
        const warning = await Warning.findOne({
          guildId: interaction.guildId,
          userId: user.id,
        }).sort({ timestamp: -1 });

        if (!warning) {
          return interaction.editReply({
            content: lang.get(language, "REMOVEWARN_NO_WARNINGS", {
              user: user.tag,
            }),
            flags: MessageFlags.Ephemeral,
          });
        }

        await Warning.findByIdAndDelete(warning._id);

        const embed = new EmbedBuilder()
          .setColor("#00FF00")
          .setTitle(lang.get(language, "REMOVEWARN_TITLE"))
          .setDescription(
            lang.get(language, "REMOVEWARN_LATEST_SUCCESS", { user: user.tag })
          )
          .addFields(
            {
              name: lang.get(language, "WARNS_REASON"),
              value: warning.reason || lang.get(language, "BAN_NO_REASON"),
              inline: false,
            },
            {
              name: lang.get(language, "REMOVEWARN_ID"),
              value: warning._id.toString(),
              inline: true,
            }
          )
          .setThumbnail(user.displayAvatarURL({ dynamic: true }))
          .setTimestamp()
          .setFooter({
            text: interaction.guild.name,
            iconURL: interaction.guild.iconURL({ dynamic: true }),
          });

        return interaction.editReply({ embeds: [embed] });
      }
    } catch (error) {
      logger.error(error);
      const errorContent = {
        content: lang.get(language, "ERROR"),
        flags: MessageFlags.Ephemeral,
      };

      if (interaction.deferred || interaction.replied) {
        await interaction.editReply(errorContent).catch(() => {});
      } else {
        await interaction.reply(errorContent).catch(() => {});
      }
    }
  },
};
