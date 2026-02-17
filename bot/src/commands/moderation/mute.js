const {
  SlashCommandBuilder,
  PermissionFlagsBits,
  MessageFlags,
  EmbedBuilder,
} = require("discord.js");
const lang = require("../../utils/language");
const ActiveMute = require("../../database/models/ActiveMute");
const { checkPermissions, checkHierarchy } = require("../../utils/permissions");
const { sendTemporary } = require("../../utils/messages");
const logger = require("../../utils/logger");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("mute")
    .setDescription("Mute a member using the Muted role")
    .addUserOption((option) =>
      option
        .setName("user")
        .setDescription("The user to mute")
        .setRequired(true)
    )
    .addIntegerOption((option) =>
      option
        .setName("duration")
        .setDescription("Duration in minutes (optional)")
        .setRequired(false)
    )
    .addStringOption((option) =>
      option.setName("reason").setDescription("Reason for mute")
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
    const duration = interaction.options.getInteger("duration");
    const reason =
      interaction.options.getString("reason") ||
      lang.get(language, "TIMEOUT_NO_REASON");
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

    if (!member) {
      return sendTemporary(interaction, {
        content: lang.get(language, "ERROR"),
        flags: MessageFlags.Ephemeral,
      });
    }

    if (!member.manageable) {
      return sendTemporary(interaction, {
        content: lang.get(language, "TIMEOUT_CANNOT"),
        flags: MessageFlags.Ephemeral,
      });
    }

    await interaction.deferReply();

    try {
      // Find or create Muted role
      let muteRole = interaction.guild.roles.cache.find(
        (r) => r.name.toLowerCase() === "muted"
      );

      if (!muteRole) {
        muteRole = await interaction.guild.roles.create({
          name: "Muted",
          color: "#818386",
          permissions: [],
          reason: "Auto-created Muted role",
        });

        // Apply overrides to all channels
        interaction.guild.channels.cache.forEach(async (channel) => {
          if (channel.manageable) {
            await channel.permissionOverwrites.create(muteRole, {
              SendMessages: false,
              AddReactions: false,
              Speak: false,
              Connect: false,
            });
          }
        });
      }

      // Check if user already has the role
      if (member.roles.cache.has(muteRole.id)) {
        return sendTemporary(interaction, {
          content: lang.get(language, "MUTE_ALREADY"),
        });
      }

      await member.roles.add(muteRole, reason);

      let description = lang.get(language, "MUTE_SUCCESS_TEXT", {
        user: user.tag,
      });

      // Handle duration
      if (duration) {
        const expiresAt = new Date(Date.now() + duration * 60 * 1000);

        // Save to database
        await ActiveMute.create({
          guildId: interaction.guildId,
          userId: user.id,
          roleId: muteRole.id,
          expiresAt,
        });

        description += `\nDuration: ${duration} minutes`;
      }

      const embed = new EmbedBuilder()
        .setColor("#FFA500")
        .setTitle(lang.get(language, "MUTE_TITLE"))
        .setDescription(description)
        .addFields({
          name: lang.get(language, "TIMEOUT_REASON"),
          value: reason,
          inline: true,
        });

      await interaction.editReply({ embeds: [embed] });
    } catch (error) {
      logger.error(error);
      await sendTemporary(interaction, {
        content: lang.get(language, "ERROR"),
      });
    }
  },
};
