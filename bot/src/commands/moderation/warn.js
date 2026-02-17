const {
  SlashCommandBuilder,
  PermissionFlagsBits,
  MessageFlags,
  EmbedBuilder,
} = require("discord.js");
const lang = require("../../utils/language");
const Warning = require("../../database/models/Warning");
const Guild = require("../../database/models/Guild");
const ActiveMute = require("../../database/models/ActiveMute");
const { checkPermissions, checkHierarchy } = require("../../utils/permissions");
const { sendTemporary } = require("../../utils/messages");
const logger = require("../../utils/logger");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("warn")
    .setDescription("Warn a member")
    .addUserOption((option) =>
      option
        .setName("user")
        .setDescription("The user to warn")
        .setRequired(true)
    )
    .addStringOption((option) =>
      option
        .setName("reason")
        .setDescription("The reason for the warning")
        .setRequired(true)
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
    const reason = interaction.options.getString("reason");
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

    try {
      await interaction.deferReply();

      // Save warning
      const warning = new Warning({
        guildId: interaction.guildId,
        userId: user.id,
        moderatorId: interaction.user.id,
        reason: reason,
        timestamp: new Date(),
      });
      await warning.save();

      // Get total warnings
      const totalWarnings = await Warning.countDocuments({
        guildId: interaction.guildId,
        userId: user.id,
      });

      // Create response embed
      const embed = new EmbedBuilder()
        .setColor("#FFAA00")
        .setTitle(lang.get(language, "WARN_TITLE"))
        .setDescription(lang.get(language, "WARN_SUCCESS", { user: user.tag }))
        .addFields(
          {
            name: lang.get(language, "WARN_USER"),
            value: `${user.tag} (${user.id})`,
            inline: true,
          },
          {
            name: lang.get(language, "WARN_MODERATOR"),
            value: interaction.user.tag,
            inline: true,
          },
          {
            name: lang.get(language, "WARN_TOTAL"),
            value: lang.get(language, "WARN_COUNT", { count: totalWarnings }),
            inline: true,
          },
          {
            name: lang.get(language, "WARN_REASON"),
            value: reason,
            inline: false,
          }
        )
        .setThumbnail(user.displayAvatarURL({ dynamic: true }))
        .setTimestamp()
        .setFooter({
          text: interaction.guild.name,
          iconURL: interaction.guild.iconURL({ dynamic: true }),
        });

      // Check for auto-punishments
      const guildSettings = await Guild.findById(interaction.guildId);
      if (guildSettings?.warnings?.enabled && member) {
        const action = guildSettings.warnings.actions.find(
          (a) => a.threshold === totalWarnings
        );

        if (action && action.action !== "none") {
          let actionTaken = "";
          const autoReason = lang.get(language, "AUTOPUNISH_REASON", {
            count: totalWarnings,
          });

          try {
            switch (action.action) {
              case "kick":
                if (member.kickable) {
                  await member.kick(autoReason);
                  actionTaken = lang.get(language, "AUTOPUNISH_ACTION_KICKED");
                }
                break;
              case "ban":
                if (member.bannable) {
                  await member.ban({ reason: autoReason });
                  actionTaken = lang.get(language, "AUTOPUNISH_ACTION_BANNED");
                }
                break;
              case "timeout":
                if (member.moderatable) {
                  await member.timeout(action.duration, autoReason);
                  actionTaken = lang.get(
                    language,
                    "AUTOPUNISH_ACTION_TIMED_OUT",
                    {
                      duration: action.duration / 60000,
                    }
                  );
                }
                break;
              case "mute":
                // Role-based mute
                let muteRole = interaction.guild.roles.cache.find(
                  (r) => r.name.toLowerCase() === "muted"
                );

                if (!muteRole) {
                  try {
                    muteRole = await interaction.guild.roles.create({
                      name: "Muted",
                      color: "#818386",
                      permissions: [],
                      reason: lang.get(language, "AUTOPUNISH_MUTE_ROLE_REASON"),
                    });

                    // Apply overrides to all channels
                    interaction.guild.channels.cache.forEach(
                      async (channel) => {
                        if (channel.manageable) {
                          await channel.permissionOverwrites.create(muteRole, {
                            SendMessages: false,
                            AddReactions: false,
                            Speak: false,
                            Connect: false,
                          });
                        }
                      }
                    );
                  } catch (err) {
                    logger.error(`Failed to create Muted role: ${err.message}`);
                  }
                }

                if (muteRole && member.manageable) {
                  await member.roles.add(muteRole, autoReason);
                  actionTaken = lang.get(language, "AUTOPUNISH_ACTION_MUTED");

                  // Handle duration if specified
                  if (action.duration > 0) {
                    const expiresAt = new Date(Date.now() + action.duration);

                    // Save to database for persistence
                    await ActiveMute.create({
                      guildId: interaction.guildId,
                      userId: user.id,
                      roleId: muteRole.id,
                      expiresAt,
                    });

                    // Set timeout for current session
                    setTimeout(async () => {
                      try {
                        const currentMember = await interaction.guild.members
                          .fetch(member.id)
                          .catch(() => null);
                        if (currentMember) {
                          await currentMember.roles.remove(
                            muteRole,
                            "Auto-punishment: Mute duration expired"
                          );
                          await ActiveMute.deleteOne({
                            guildId: interaction.guildId,
                            userId: user.id,
                          });
                        }
                      } catch (e) {
                        logger.error(
                          `Failed to unmute user after duration: ${e.message}`
                        );
                      }
                    }, action.duration);
                    actionTaken += lang.get(
                      language,
                      "AUTOPUNISH_ACTION_MUTED_DURATION",
                      { duration: action.duration / 60000 }
                    );
                  }
                }
                break;
            }

            if (actionTaken) {
              embed.addFields({
                name: lang.get(language, "AUTOPUNISH_TITLE"),
                value: lang.get(language, "AUTOPUNISH_MSG", {
                  count: totalWarnings,
                  action: actionTaken,
                }),
                inline: false,
              });
            }
          } catch (err) {
            logger.error(`Failed to execute auto-punishment: ${err.message}`);
          }
        }
      }

      await interaction.editReply({ embeds: [embed] });
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
