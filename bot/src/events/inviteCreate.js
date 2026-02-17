const { Events } = require("discord.js");
const { invitesCache } = require("../utils/inviteTracker");

/**
 * Event: InviteCreate
 * Triggered when a new invite is created in a guild. Updates the internal cache
 * to ensure accurate join tracking.
 */
module.exports = {
  name: Events.InviteCreate,
  async execute(invite) {
    const { guild } = invite;
    if (!guild) return;

    // 1. Update the in-memory invite cache for this guild
    const guildInvites = invitesCache.get(guild.id);
    if (guildInvites) {
      guildInvites.set(invite.code, invite);
    }
  },
};
