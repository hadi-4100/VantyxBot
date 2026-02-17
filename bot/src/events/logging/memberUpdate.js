const { Events, EmbedBuilder } = require("discord.js");
const guildLogger = require("../../utils/guildLogger");
const lang = require("../../utils/language");

/**
 * Event: GuildMemberUpdate
 * Monitors changes to members, including role adjustments, nicknames,
 * and timeout (communciation disabled) status.
 */
module.exports = {
  name: Events.GuildMemberUpdate,
  async execute(oldMember, newMember) {
    const { guild, user } = newMember;
    if (!guild || !user || user.bot) return;

    const language = await lang.getLanguage(guild.id);
    const logEmbed = new EmbedBuilder()
      .setAuthor({
        name: user.tag,
        iconURL: user.displayAvatarURL({ dynamic: true }),
      })
      .setTimestamp()
      .setFooter({ text: `Member ID: ${user.id}` });

    // 1. Role Changes
    const addedRoles = newMember.roles.cache.filter(
      (r) => !oldMember.roles.cache.has(r.id),
    );
    const removedRoles = oldMember.roles.cache.filter(
      (r) => !newMember.roles.cache.has(r.id),
    );

    if (addedRoles.size > 0 || removedRoles.size > 0) {
      logEmbed
        .setTitle(lang.get(language, "LOG_MEMBER_ROLES_UPDATED"))
        .setDescription(
          `**${lang.get(language, "LOG_MEMBER_LABEL")}:** ${user.toString()}`,
        )
        .setColor("#3498DB");

      if (addedRoles.size > 0) {
        logEmbed.addFields({
          name: lang.get(language, "LOG_ADDED_ROLES_LABEL"),
          value: addedRoles.map((r) => r.toString()).join(", "),
        });
      }
      if (removedRoles.size > 0) {
        logEmbed.addFields({
          name: lang.get(language, "LOG_REMOVED_ROLES_LABEL"),
          value: removedRoles.map((r) => r.toString()).join(", "),
        });
      }
      await guildLogger.log(guild, "member", logEmbed);
    }

    // 2. Nickname Changes
    if (oldMember.nickname !== newMember.nickname) {
      const nickEmbed = EmbedBuilder.from(logEmbed)
        .setTitle(lang.get(language, "LOG_NICKNAME_CHANGED_TITLE"))
        .setDescription(
          lang.get(language, "LOG_NICKNAME_CHANGED_DESC", {
            user: user.toString(),
            tag: user.tag,
          }),
        )
        .addFields(
          {
            name: lang.get(language, "LOG_OLD_NICKNAME_LABEL"),
            value: oldMember.nickname || "*None*",
            inline: true,
          },
          {
            name: lang.get(language, "LOG_NEW_NICKNAME_LABEL"),
            value: newMember.nickname || "*None*",
            inline: true,
          },
        )
        .setColor("#F1C40F");
      await guildLogger.log(guild, "member", nickEmbed);
    }

    // 3. Timeout Status (Moderation)
    const wasTimedOut = oldMember.isCommunicationDisabled();
    const isTimedOut = newMember.isCommunicationDisabled();

    if (isTimedOut && !wasTimedOut) {
      // User was timed out
      const timeoutEmbed = EmbedBuilder.from(logEmbed)
        .setTitle(lang.get(language, "LOG_MEMBER_TIMED_OUT_TITLE"))
        .setDescription(
          lang.get(language, "LOG_MEMBER_TIMED_OUT_DESC", {
            user: user.toString(),
            tag: user.tag,
          }),
        )
        .addFields({
          name: lang.get(language, "LOG_EXPIRES_LABEL"),
          value: `<t:${Math.floor(
            newMember.communicationDisabledUntilTimestamp / 1000,
          )}:R>`,
          inline: true,
        })
        .setColor("#E67E22");
      await guildLogger.log(guild, "moderation", timeoutEmbed);
    } else if (!isTimedOut && wasTimedOut) {
      // Timeout removed/expired
      const timeoutRemovedEmbed = EmbedBuilder.from(logEmbed)
        .setTitle(lang.get(language, "LOG_TIMEOUT_REMOVED_TITLE"))
        .setDescription(
          lang.get(language, "LOG_TIMEOUT_REMOVED_DESC", {
            user: user.toString(),
            tag: user.tag,
          }),
        )
        .setColor("#2ECC71");
      await guildLogger.log(guild, "moderation", timeoutRemovedEmbed);
    }
  },
};
