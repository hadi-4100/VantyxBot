const { MessageFlags, PermissionFlagsBits } = require("discord.js");
const Guild = require("../database/models/Guild");
const logger = require("./logger");
const lang = require("./language");

async function handleReactionRole(interaction) {
  const language = await lang.getLanguage(interaction.guildId);
  const customId = interaction.customId;
  const parts = customId.split(":"); // [rr, messageRefId, roleId/select]
  const messageRefId = parts[1];
  const action = parts[2];

  const guildId = interaction.guildId;
  const guildSettings = await Guild.findById(guildId).lean();

  if (!guildSettings?.reactionRoles?.enabled) {
    return interaction.reply({
      content: lang.get(language, "RR_DISABLED"),
      flags: MessageFlags.Ephemeral,
    });
  }

  const messageConfig = guildSettings.reactionRoles.messages.find(
    (m) => String(m._id) === messageRefId
  );

  if (!messageConfig) {
    return interaction.reply({
      content: lang.get(language, "RR_NOT_REGISTERED"),
      flags: MessageFlags.Ephemeral,
    });
  }

  // Defer AFTER basic checks to avoid unnecessary deferral
  if (!interaction.deferred && !interaction.replied) {
    try {
      await interaction.deferReply({ flags: MessageFlags.Ephemeral });
    } catch (err) {
      return;
    }
  }

  const member = interaction.member;
  const botMember = interaction.guild.members.me;

  // Check Bot Permissions
  if (!botMember.permissions.has(PermissionFlagsBits.ManageRoles)) {
    return interaction.reply({
      content: lang.get(language, "BOT_PERMISSION_MANAGE_ROLES"),
      flags: MessageFlags.Ephemeral,
    });
  }

  let selectedRoleIds = [];
  if (interaction.isStringSelectMenu()) {
    selectedRoleIds = interaction.values;
  } else {
    selectedRoleIds = [action];
  }

  const isButton = interaction.isButton();
  const allMessageRoleIds = messageConfig.roles.map((r) => r.roleId);
  const currentRoles = member.roles.cache.filter((r) =>
    allMessageRoleIds.includes(r.id)
  );

  try {
    if (isButton) {
      const roleId = action;
      let role = interaction.guild.roles.cache.get(roleId);

      if (!role) {
        try {
          role = await interaction.guild.roles.fetch(roleId);
        } catch (err) {}
      }

      if (!role) {
        return interaction.reply({
          content: lang.get(language, "ROLE_NOT_FOUND_ID", { id: roleId }),
          flags: MessageFlags.Ephemeral,
        });
      }

      if (role.position >= botMember.roles.highest.position) {
        return interaction.reply({
          content: lang.get(language, "ROLE_HIERARCHY_RR", { role: role.name }),
          flags: MessageFlags.Ephemeral,
        });
      }

      if (member.roles.cache.has(roleId)) {
        await member.roles.remove(roleId);
        return interaction.reply({
          content: lang.get(language, "RR_ROLE_REMOVED", { role: role.name }),
          flags: MessageFlags.Ephemeral,
        });
      } else {
        let responseContent = lang.get(language, "RR_ROLE_ADDED", {
          role: role.name,
        });

        // Check limits
        if (!messageConfig.allowMultiple && currentRoles.size > 0) {
          // Single role mode: remove others
          const oldRoleNames = currentRoles
            .map((r) => `**${r.name}**`)
            .join(", ");
          const toRemove = currentRoles.map((r) => r.id);
          await member.roles.remove(toRemove).catch(() => {});

          responseContent = lang.get(language, "RR_ROLE_SYNC_SUCCESS", {
            role: role.name,
            oldRoles: oldRoleNames,
          });
        } else if (
          messageConfig.allowMultiple &&
          currentRoles.size >= messageConfig.maxRoles
        ) {
          return interaction.reply({
            content: lang.get(language, "RR_MAX_ROLES_ERROR", {
              max: messageConfig.maxRoles,
            }),
            flags: MessageFlags.Ephemeral,
          });
        }

        await member.roles.add(roleId);
        return interaction.reply({
          content: responseContent,
          flags: MessageFlags.Ephemeral,
        });
      }
    } else if (interaction.isStringSelectMenu()) {
      // Select Menu logic: Sync mode
      const rolesToSet = selectedRoleIds;
      const rolesToRemove = allMessageRoleIds.filter(
        (id) => !rolesToSet.includes(id) && member.roles.cache.has(id)
      );
      const rolesToAdd = rolesToSet.filter((id) => !member.roles.cache.has(id));

      if (
        rolesToSet.length > messageConfig.maxRoles &&
        messageConfig.allowMultiple
      ) {
        return interaction.reply({
          content: lang.get(language, "RR_MAX_SELECT_ERROR", {
            max: messageConfig.maxRoles,
          }),
          flags: MessageFlags.Ephemeral,
        });
      }

      const invalidRoles = [];
      const finalRolesToRemove = [];
      const finalRolesToAdd = [];

      for (const rId of [...rolesToRemove, ...rolesToAdd]) {
        let role = interaction.guild.roles.cache.get(rId);
        if (!role) {
          try {
            role = await interaction.guild.roles.fetch(rId);
          } catch (e) {}
        }

        if (!role || role.position >= botMember.roles.highest.position) {
          invalidRoles.push(rId);
          continue;
        }

        if (rolesToRemove.includes(rId)) finalRolesToRemove.push(rId);
        else finalRolesToAdd.push(rId);
      }

      if (finalRolesToRemove.length > 0) {
        await member.roles
          .remove(finalRolesToRemove)
          .catch((e) => logger.error(`RR Remove Error: ${e.message}`));
      }
      if (finalRolesToAdd.length > 0) {
        await member.roles
          .add(finalRolesToAdd)
          .catch((e) => logger.error(`RR Add Error: ${e.message}`));
      }

      let response = lang.get(language, "RR_UPDATED_SUCCESS");
      if (invalidRoles.length > 0) {
        response += lang.get(language, "RR_SOME_FAILED");
      }

      return interaction.reply({
        content: response,
        flags: MessageFlags.Ephemeral,
      });
    }
  } catch (err) {
    logger.error(`Error updating reaction roles: ${err.message}`);
    return interaction
      .reply({
        content: lang.get(language, "RR_ERROR"),
        flags: MessageFlags.Ephemeral,
      })
      .catch(() => {});
  }
}

module.exports = { handleReactionRole };
