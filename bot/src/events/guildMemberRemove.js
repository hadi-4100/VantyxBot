const { EmbedBuilder, AuditLogEvent, Events } = require("discord.js");
const { log } = require("../utils/guildLogger");
const Guild = require("../database/models/Guild");
const inviteTracker = require("../utils/inviteTracker");
const lang = require("../utils/language");
const logger = require("../utils/logger");
const { recordGuildStat } = require("../utils/stats");

/**
 * Event: GuildMemberRemove
 * Handles members leaving the server: tracks statistics, logs leave/kick events,
 * and sends goodbye messages.
 */
module.exports = {
  name: Events.GuildMemberRemove,
  async execute(member) {
    const { guild, user } = member;
    const language = await lang.getLanguage(guild.id);

    try {
      // 1. Update Guild Statistics
      await recordGuildStat(guild, "leaves", guild.memberCount);

      // 2. Log Leave/Kick Event
      let isKick = false;
      let executor = null;
      let reason = null;

      try {
        const fetchedLogs = await guild.fetchAuditLogs({
          limit: 1,
          type: AuditLogEvent.MemberKick,
        });
        const kickLog = fetchedLogs.entries.first();
        if (
          kickLog &&
          kickLog.target.id === user.id &&
          kickLog.createdTimestamp > Date.now() - 5000
        ) {
          isKick = true;
          executor = kickLog.executor;
          reason = kickLog.reason;
        }
      } catch (e) {
        // Silently fail if audit logs cannot be fetched
      }

      const logEmbed = new EmbedBuilder().setTimestamp();

      if (isKick) {
        logEmbed
          .setTitle(lang.get(language, "MEMBER_KICKED_TITLE"))
          .setDescription(
            lang.get(language, "MEMBER_KICKED_DESC", {
              user: member.toString(),
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
          .setColor("#FFA500");

        await log(guild, "moderation", logEmbed);
      } else {
        logEmbed
          .setTitle(lang.get(language, "MEMBER_LEFT_TITLE"))
          .setDescription(
            lang.get(language, "MEMBER_LEFT_DESC", {
              user: member.toString(),
              tag: user.tag,
            }),
          )
          .setThumbnail(user.displayAvatarURL())
          .addFields(
            {
              name: lang.get(language, "JOINED_AT_LABEL"),
              value: member.joinedTimestamp
                ? `<t:${Math.floor(member.joinedTimestamp / 1000)}:R>`
                : lang.get(language, "UNKNOWN_TIME"),
              inline: true,
            },
            {
              name: lang.get(language, "MEMBER_COUNT_LABEL"),
              value: `${guild.memberCount}`,
              inline: true,
            },
          )
          .setColor("#FF0000");

        await log(guild, "member", logEmbed);
      }

      // 3. Process Goodbye System
      const guildSettings = await Guild.findById(guild.id).lean();
      if (guildSettings?.goodbye?.enabled) {
        const { goodbye: goodbyeSettings } = guildSettings;
        const rawMessage =
          goodbyeSettings.message ||
          lang.get(language, "GOODBYE_DEFAULT_MESSAGE");

        const formattedMessage = rawMessage
          .replace(/\[user\]/g, `<@${member.id}>`)
          .replace(/\[userName\]/g, user.username)
          .replace(/\[memberCount\]/g, guild.memberCount)
          .replace(/\[server\]/g, guild.name);

        let targetChannel = null;
        if (goodbyeSettings.channel) {
          targetChannel = guild.channels.cache.get(goodbyeSettings.channel);
        }
        if (!targetChannel) targetChannel = guild.systemChannel;

        // Fallback to first available text channel
        if (!targetChannel) {
          targetChannel = guild.channels.cache.find(
            (c) =>
              c.isTextBased() &&
              c.permissionsFor(guild.members.me).has("SendMessages"),
          );
        }

        if (targetChannel) {
          await targetChannel.send(formattedMessage).catch(() => {});
        }
      }

      // 4. Process Invite Tracking
      await inviteTracker.fetchInvites(guild);
      await inviteTracker.trackLeave(member);
    } catch (error) {
      logger.error(`Member Leave Handler Error: ${error.message}`);
    }
  },
};
