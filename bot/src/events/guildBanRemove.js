const { EmbedBuilder, AuditLogEvent, Events } = require("discord.js");
const { log } = require("../utils/guildLogger");
const lang = require("../utils/language");
const logger = require("../utils/logger");

/**
 * Event: GuildBanRemove
 * Triggered when a user balance is revoked (unbanned). Logs the action and executor.
 */
module.exports = {
  name: Events.GuildBanRemove,
  async execute(ban) {
    const { guild, user } = ban;
    if (!guild) return;

    const language = await lang.getLanguage(guild.id);
    let executor = null;

    try {
      // 1. Fetch Audit Logs for attribution
      const fetchedLogs = await guild.fetchAuditLogs({
        limit: 1,
        type: AuditLogEvent.MemberBanRemove,
      });
      const unbanLog = fetchedLogs.entries.first();

      if (unbanLog && unbanLog.target.id === user.id) {
        executor = unbanLog.executor;
      }
    } catch (err) {
      logger.warn(
        `Could not fetch audit logs for unban in guild ${guild.id}: ${err.message}`,
      );
    }

    // 2. Build Logging Embed
    const embed = new EmbedBuilder()
      .setTitle(lang.get(language, "MEMBER_UNBANNED_TITLE"))
      .setDescription(
        lang.get(language, "MEMBER_UNBANNED_DESC", {
          user: user.toString(),
          tag: user.tag,
        }),
      )
      .addFields({
        name: lang.get(language, "EXECUTOR_LABEL"),
        value: executor
          ? executor.toString()
          : lang.get(language, "UNKNOWN_USER"),
        inline: true,
      })
      .setColor("#00EE00")
      .setTimestamp();

    // 3. Dispatch to Guild's dedicated moderation logs
    await log(guild, "moderation", embed);
  },
};
