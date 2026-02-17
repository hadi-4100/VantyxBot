const { PermissionFlagsBits, MessageFlags } = require("discord.js");
const lang = require("./language");
const { sendTemporary } = require("./messages");

/**
 * Checks if a member has permission to run a sensitive command.
 * @param {import("discord.js").Interaction} interaction
 * @param {Object} options
 * @param {bigint[]} options.permissions Required Discord permissions (e.g. [PermissionFlagsBits.ManageGuild])
 * @param {string[]} options.roles Custom allowed roles from the database (e.g. guildSettings.giveaways.managerRoles)
 * @returns {Promise<boolean>} True if allowed, false otherwise (replies to interaction if false)
 */
async function checkPermissions(interaction, options = {}) {
  const { permissions = [PermissionFlagsBits.ManageGuild], roles = [] } =
    options;

  // 1. Check if user has Manage Server (ManageGuild) or specified permissions
  const hasPermission = permissions.some((perm) =>
    interaction.member.permissions.has(perm)
  );
  if (hasPermission) return true;

  // 2. Check if user has any of the specific allowed roles
  if (roles && roles.length > 0) {
    const hasRole = interaction.member.roles.cache.some((role) =>
      roles.includes(role.id)
    );
    if (hasRole) return true;
  }

  // 3. Deny access
  const language = await lang.getLanguage(interaction.guildId);
  const content = lang.get(language, "NO_PERMISSION");

  await sendTemporary(interaction, { content, flags: MessageFlags.Ephemeral });
  return false;
}

/**
 * Checks if a member can target another member based on role hierarchy.
 * @param {import("discord.js").GuildMember} actor
 * @param {import("discord.js").GuildMember} target
 * @returns {boolean} True if actor is higher than target
 */
function checkHierarchy(actor, target) {
  if (!target) return true;
  return actor.roles.highest.position > target.roles.highest.position;
}

module.exports = { checkPermissions, checkHierarchy };
