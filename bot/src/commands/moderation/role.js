const {
  SlashCommandBuilder,
  PermissionFlagsBits,
  MessageFlags,
  EmbedBuilder,
} = require("discord.js");
const lang = require("../../utils/language");
const { checkPermissions, checkHierarchy } = require("../../utils/permissions");
const { sendTemporary } = require("../../utils/messages");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("role")
    .setDescription("Manage user roles")
    .addSubcommand((subcommand) =>
      subcommand
        .setName("add")
        .setDescription("Add a role to a user")
        .addUserOption((option) =>
          option.setName("user").setDescription("The user").setRequired(true)
        )
        .addRoleOption((option) =>
          option.setName("role").setDescription("The role").setRequired(true)
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("remove")
        .setDescription("Remove a role from a user")
        .addUserOption((option) =>
          option.setName("user").setDescription("The user").setRequired(true)
        )
        .addRoleOption((option) =>
          option.setName("role").setDescription("The role").setRequired(true)
        )
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles),
  async execute(interaction) {
    const isAllowed = await checkPermissions(interaction, {
      permissions: [
        PermissionFlagsBits.ManageRoles,
        PermissionFlagsBits.ManageGuild,
      ],
    });
    if (!isAllowed) return;

    const language = await lang.getLanguage(interaction.guildId);
    const subcommand = interaction.options.getSubcommand();
    const user = interaction.options.getUser("user");
    const role = interaction.options.getRole("role");
    const member = await interaction.guild.members
      .fetch(user.id)
      .catch(() => null);

    // Hierarchy Check for Target Member
    if (member && !checkHierarchy(interaction.member, member)) {
      return sendTemporary(interaction, {
        content: lang.get(language, "HIERARCHY_ERROR"),
        flags: MessageFlags.Ephemeral,
      });
    }

    // Hierarchy Check for target Role
    if (
      role.position >= interaction.member.roles.highest.position &&
      interaction.user.id !== interaction.guild.ownerId
    ) {
      return sendTemporary(interaction, {
        content: lang.get(language, "ROLE_HIERARCHY_ERROR"),
        flags: MessageFlags.Ephemeral,
      });
    }

    if (!member) {
      return sendTemporary(interaction, {
        content: lang.get(language, "ERROR"),
        flags: MessageFlags.Ephemeral,
      });
    }

    if (role.position >= interaction.guild.members.me.roles.highest.position) {
      return sendTemporary(interaction, {
        content: lang.get(language, "ROLE_HIGHER"),
        flags: MessageFlags.Ephemeral,
      });
    }

    if (subcommand === "add") {
      if (member.roles.cache.has(role.id)) {
        return sendTemporary(interaction, {
          content: lang.get(language, "ROLE_ALREADY_HAS"),
          flags: MessageFlags.Ephemeral,
        });
      }
      await member.roles.add(role);

      const embed = new EmbedBuilder()
        .setColor("#00FF00")
        .setTitle(lang.get(language, "ROLE_TITLE_ADD"))
        .setDescription(
          lang.get(language, "ROLE_SUCCESS_ADD", {
            role: role.name,
            user: user.tag,
          })
        );

      await interaction.reply({ embeds: [embed] });
    } else if (subcommand === "remove") {
      if (!member.roles.cache.has(role.id)) {
        return sendTemporary(interaction, {
          content: lang.get(language, "ROLE_DOES_NOT_HAVE"),
          flags: MessageFlags.Ephemeral,
        });
      }
      await member.roles.remove(role);

      const embed = new EmbedBuilder()
        .setColor("#FF0000")
        .setTitle(lang.get(language, "ROLE_TITLE_REMOVE"))
        .setDescription(
          lang.get(language, "ROLE_SUCCESS_REMOVE", {
            role: role.name,
            user: user.tag,
          })
        );

      await interaction.reply({ embeds: [embed] });
    }
  },
};
