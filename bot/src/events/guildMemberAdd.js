const { EmbedBuilder, AttachmentBuilder, Events } = require("discord.js");
const { log } = require("../utils/guildLogger");
const Guild = require("../database/models/Guild");
const { generateWelcomeImage } = require("../utils/imageGenerator");
const inviteTracker = require("../utils/inviteTracker");
const lang = require("../utils/language");
const logger = require("../utils/logger");
const { recordGuildStat } = require("../utils/stats");

/**
 * Event: GuildMemberAdd
 * Handles new members joining: tracks statistics, logs join events,
 * assigns auto-roles, and sends welcome messages/images.
 */
module.exports = {
  name: Events.GuildMemberAdd,
  async execute(member) {
    const { guild, user } = member;
    const language = await lang.getLanguage(guild.id);

    try {
      // 1. Update Guild Statistics
      await recordGuildStat(guild, "joins", guild.memberCount);

      // 2. Log Join Event
      const logEmbed = new EmbedBuilder()
        .setTitle(lang.get(language, "MEMBER_JOINED_TITLE"))
        .setDescription(
          lang.get(language, "MEMBER_JOINED_DESC", {
            user: member.toString(),
            tag: user.tag,
          }),
        )
        .setThumbnail(user.displayAvatarURL())
        .addFields(
          {
            name: lang.get(language, "ACCOUNT_CREATED_LABEL"),
            value: `<t:${Math.floor(user.createdTimestamp / 1000)}:R>`,
            inline: true,
          },
          {
            name: lang.get(language, "MEMBER_COUNT_LABEL"),
            value: `${guild.memberCount}`,
            inline: true,
          },
        )
        .setColor("#00FF00")
        .setTimestamp();

      await log(guild, "member", logEmbed);

      // 3. Process Welcome System
      const guildSettings = await Guild.findById(guild.id).lean();
      if (guildSettings?.welcome) {
        const { welcome: welcomeSettings, welcomeImage: imageSettings } =
          guildSettings;

        // 3.1 Auto-Role Assignment
        if (
          welcomeSettings.autorole?.enabled &&
          welcomeSettings.autorole.roles?.length > 0
        ) {
          await member.roles
            .add(welcomeSettings.autorole.roles)
            .catch((err) => {
              logger.error(
                `Auto-Role Assignment Failed (${guild.id}): ${err.message}`,
              );
            });
        }

        // 3.2 Send Welcome Message/Image
        if (welcomeSettings.enabled) {
          const rawMessage =
            welcomeSettings.message ||
            lang.get(language, "WELCOME_DEFAULT_MESSAGE");
          const formattedMessage = rawMessage
            .replace(/\[user\]/g, `<@${member.id}>`)
            .replace(/\[userName\]/g, user.username)
            .replace(/\[memberCount\]/g, guild.memberCount)
            .replace(/\[server\]/g, guild.name);

          const deliveryMethod = welcomeSettings.delivery || "channel";
          let targetChannel = null;

          if (deliveryMethod === "channel") {
            const channelId = welcomeSettings.channel;
            targetChannel =
              (channelId && guild.channels.cache.get(channelId)) ||
              guild.systemChannel;

            // Fallback to first available text channel if system channel is unavailable
            if (!targetChannel) {
              targetChannel = guild.channels.cache.find(
                (c) =>
                  c.isTextBased() &&
                  c.permissionsFor(guild.members.me).has("SendMessages"),
              );
            }
          } else if (deliveryMethod === "dm") {
            targetChannel = member;
          }

          if (targetChannel) {
            const payload = { content: formattedMessage };

            if (imageSettings?.enabled) {
              const imageBuffer = await generateWelcomeImage(
                member,
                imageSettings,
              );
              if (imageBuffer) {
                const attachment = new AttachmentBuilder(imageBuffer, {
                  name: "welcome.png",
                });
                const imgDelivery = imageSettings.delivery || "with_text";

                if (imgDelivery === "with_text") {
                  payload.files = [attachment];
                  await targetChannel.send(payload).catch(() => {});
                } else if (imgDelivery === "before_text") {
                  await targetChannel
                    .send({ files: [attachment] })
                    .catch(() => {});
                  await targetChannel.send(payload).catch(() => {});
                } else if (imgDelivery === "channel" && imageSettings.channel) {
                  await targetChannel.send(payload).catch(() => {});
                  const imgChannel = guild.channels.cache.get(
                    imageSettings.channel,
                  );
                  if (imgChannel)
                    await imgChannel
                      .send({ files: [attachment] })
                      .catch(() => {});
                }
              } else {
                await targetChannel.send(payload).catch(() => {});
              }
            } else {
              await targetChannel.send(payload).catch(() => {});
            }
          }
        }
      }

      // 4. Process Invite Tracking
      await inviteTracker.fetchInvites(guild);
      const usedInvite = await inviteTracker.getInviter(member);
      await inviteTracker.trackJoin(member, usedInvite);
    } catch (error) {
      logger.error(`Member Join Handler Error: ${error.message}`);
    }
  },
};
