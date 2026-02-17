const { Events } = require("discord.js");
const { invitesCache } = require("../utils/inviteTracker");

/**
 * Event: InviteDelete
 * Triggered when an invite is deleted or expires. Ensures the internal cache
 * remains accurate by removing the stale reference.
 */
module.exports = {
  name: Events.InviteDelete,
  execute(invite) {
    const { guild, code } = invite;
    if (!guild) return;

    // 1. Remove the deleted code from the in-memory cache
    const guildInvites = invitesCache.get(guild.id);
    if (guildInvites) {
      guildInvites.delete(code);
    }
  },
};
