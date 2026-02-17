const { EmbedBuilder, AuditLogEvent, Events } = require("discord.js");
const { log } = require("../utils/guildLogger");
const lang = require("../utils/language");
const logger = require("../utils/logger");

/**
 * Event: GuildBanAdd
 * Triggered when a user is banned from a guild. Logs the event with executor and reason.
 */
module.exports = {
  name: Events.GuildBanAdd,
  async execute(ban) {
    const { guild, user, reason: rawReason } = ban;
    if (!guild) return;

    const language = await lang.getLanguage(guild.id);
    let executor = null;
    let reason = rawReason;

    try {
      // 1. Fetch Audit Logs for attribution
      const fetchedLogs = await guild.fetchAuditLogs({
        limit: 1,
        type: AuditLogEvent.MemberBanAdd,
      });
      const banLog = fetchedLogs.entries.first();

      // Check if the log entry matches the current ban event
      if (banLog && banLog.target.id === user.id) {
        executor = banLog.executor;
        if (!reason) reason = banLog.reason;
      }
    } catch (err) {
      logger.warn(
        `Could not fetch audit logs for ban in guild ${guild.id}: ${err.message}`,
      );
    }

    // 2. Build Logging Embed
    const embed = new EmbedBuilder()
      .setTitle(lang.get(language, "MEMBER_BANNED_TITLE"))
      .setDescription(
        lang.get(language, "MEMBER_BANNED_DESC", {
          user: user.toString(),
          tag: user.tag,
        }),
      )
      .addFields(
        {
          name: lang.get(language, "EXECUTOR_LABEL"),
          value: executor
            ? executor.toString()
            : lang.get(language, "UNKNOWN_USER"),
          inline: true,
        },
        {
          name: lang.get(language, "REASON_LABEL"),
          value: reason || lang.get(language, "NO_REASON_PROVIDED"),
          inline: true,
        },
      )
      .setColor("#8B0000")
      .setTimestamp();

    // 3. Dispatch to Guild's dedicated moderation logs
    await log(guild, "moderation", embed);
  },
};
