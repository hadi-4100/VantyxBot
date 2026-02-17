const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  MessageFlags,
} = require("discord.js");
const Giveaway = require("../database/models/Giveaway");
const Guild = require("../database/models/Guild");
const User = require("../database/models/User");
const lang = require("./language");
const logger = require("./logger");

/**
 * Check if a user meets the giveaway requirements
 */
async function checkRequirements(member, requirements, language) {
  if (!requirements) return { allowed: true };

  // 1. Role Requirement
  if (requirements.role) {
    if (!member.roles.cache.has(requirements.role)) {
      const role = member.guild.roles.cache.get(requirements.role);
      return {
        allowed: false,
        reason: lang.get(language, "GIVEAWAY_REQ_ROLE", {
          role: role ? role.name : "Unknown Role",
        }),
      };
    }
  }

  // 2. Level Requirement
  if (requirements.level) {
    const userData = await User.findOne({
      guildId: member.guild.id,
      userId: member.id,
    });
    const userLevel = userData?.level || 0;
    if (userLevel < requirements.level) {
      return {
        allowed: false,
        reason: lang.get(language, "GIVEAWAY_REQ_LEVEL", {
          level: requirements.level,
          current: userLevel,
        }),
      };
    }
  }

  // 3. Invite Requirement
  if (requirements.invites) {
    const userData = await User.findOne({
      guildId: member.guild.id,
      userId: member.id,
    });
    const regular = userData?.invites?.regular || 0;
    const bonus = userData?.invites?.bonus || 0;
    const leaves = userData?.invites?.leaves || 0;
    const totalInvites = regular + bonus - leaves;

    if (totalInvites < requirements.invites) {
      return {
        allowed: false,
        reason: lang.get(language, "GIVEAWAY_REQ_INVITES", {
          count: requirements.invites,
          current: totalInvites,
        }),
      };
    }
  }

  return { allowed: true };
}

/**
 * Start a new Giveaway
 */
async function start(client, interaction, options) {
  const {
    duration,
    prize,
    winnerCount,
    channel,
    channelId,
    guildId,
    requirements,
    type,
    image,
    thumbnail,
    hostedBy,
  } = options;

  const targetGuildId = interaction ? interaction.guildId : guildId;
  const targetChannelId = interaction
    ? channel?.id || interaction.channelId
    : channelId;
  const hostId = interaction ? interaction.user.id : hostedBy;

  const language = await lang.getLanguage(targetGuildId);
  const guildData = await Guild.findById(targetGuildId);
  const embedColor = guildData?.giveaways?.embedColor || "#338ac4";
  const reactionEmoji = guildData?.giveaways?.reaction || "🎉";

  const endAt = Date.now() + duration;

  const bonusText =
    type === "drop"
      ? lang.get(language, "GIVEAWAY_DROP_BONUS")
      : lang.get(language, "GIVEAWAY_NORMAL_BONUS", {
          time: Math.floor(endAt / 1000),
        });

  const embed = new EmbedBuilder()
    .setTitle(
      type === "drop"
        ? lang.get(language, "GIVEAWAY_DROP_TITLE")
        : lang.get(language, "GIVEAWAY_NORMAL_TITLE")
    )
    .setDescription(
      lang.get(language, "GIVEAWAY_DESC", {
        prize,
        host: hostId,
        winners: winnerCount,
        bonus: bonusText,
      })
    )
    .setColor(embedColor)
    .setTimestamp(endAt)
    .setFooter({ text: lang.get(language, "GIVEAWAY_FOOTER_ENDS") });

  if (requirements) {
    let reqText = lang.get(language, "GIVEAWAY_REQ_TEXT");
    if (requirements.role)
      reqText += lang.get(language, "GIVEAWAY_REQ_ROLE_ROW", {
        role: requirements.role,
      });
    if (requirements.level)
      reqText += lang.get(language, "GIVEAWAY_REQ_LEVEL_ROW", {
        level: requirements.level,
      });
    if (requirements.invites)
      reqText += lang.get(language, "GIVEAWAY_REQ_INVITES_ROW", {
        invites: requirements.invites,
      });
    if (requirements.role || requirements.level || requirements.invites)
      embed.setDescription(embed.data.description + reqText);
  }

  if (image) embed.setImage(image);
  if (thumbnail) embed.setThumbnail(thumbnail);

  const joinButton = new ButtonBuilder()
    .setCustomId("giveaway_join")
    .setEmoji(reactionEmoji)
    .setLabel(
      type === "drop"
        ? lang.get(language, "GIVEAWAY_BTN_CLAIM")
        : guildData?.giveaways?.joinButtonText || "Join Giveaway"
    )
    .setStyle(ButtonStyle.Primary);

  const entriesCount = options?.entries?.length || 0;
  const participantsButton = new ButtonBuilder()
    .setCustomId("giveaway_participants")
    .setLabel(
      lang.get(language, "GIVEAWAY_BTN_PARTICIPANTS", { count: entriesCount })
    )
    .setStyle(ButtonStyle.Secondary);

  const row = new ActionRowBuilder().addComponents(
    joinButton,
    participantsButton
  );

  const targetChannel = await client.channels
    .fetch(targetChannelId)
    .catch(() => null);
  if (!targetChannel) {
    if (interaction) {
      interaction.editReply({ content: lang.get(language, "ERROR") });
    }
    return null;
  }

  const message = await targetChannel.send({
    embeds: [embed],
    components: [row],
  });

  if (options._id) {
    await Giveaway.findByIdAndUpdate(options._id, {
      messageId: message.id,
      startAt: Date.now(),
      endAt: endAt,
      action: null,
    });
  } else {
    const giveaway = new Giveaway({
      messageId: message.id,
      channelId: targetChannel.id,
      guildId: targetGuildId,
      startAt: Date.now(),
      endAt: endAt,
      winnerCount: winnerCount,
      prize: prize,
      hostedBy: hostId,
      type: type || "normal",
      requirements: requirements || {},
      entries: [],
    });
    await giveaway.save();
  }

  return message;
}

/**
 * End a Giveaway
 */
async function end(client, messageId, winnerOverride = null) {
  const giveaway = await Giveaway.findOne({ messageId, ended: false });
  if (!giveaway) return false;

  const language = await lang.getLanguage(giveaway.guildId);
  const guildData = await Guild.findById(giveaway.guildId);
  const endColor = guildData?.giveaways?.endEmbedColor || "#f04747";
  const winnerRole = guildData?.giveaways?.winnerRole;
  const dmWinnersArr = guildData?.giveaways?.dmWinners ?? true;
  const dmHost = guildData?.giveaways?.dmHost ?? false;

  const channel = await client.channels
    .fetch(giveaway.channelId)
    .catch(() => null);
  if (!channel) return false;

  const message = await channel.messages.fetch(messageId).catch(() => null);

  let winners = [];
  if (giveaway.entries.length > 0) {
    if (winnerOverride) {
      winners = winnerOverride;
    } else {
      const pool = [...giveaway.entries];
      const count = Math.min(giveaway.winnerCount, pool.length);
      for (let i = 0; i < count; i++) {
        const randomIndex = Math.floor(Math.random() * pool.length);
        winners.push(pool[randomIndex]);
        pool.splice(randomIndex, 1);
      }
    }
  }

  giveaway.ended = true;
  giveaway.winners = winners;
  await giveaway.save();

  const winnersString =
    winners.length > 0
      ? winners.map((id) => `<@${id}>`).join(", ")
      : lang.get(language, "GIVEAWAY_NO_PARTICIPANTS");

  const endEmbed = EmbedBuilder.from(
    message ? message.embeds[0] : new EmbedBuilder()
  )
    .setTitle(lang.get(language, "GIVEAWAY_ENDED_TITLE_UTIL"))
    .setColor(endColor)
    .setDescription(
      lang.get(language, "GIVEAWAY_ENDED_DESC_UTIL", {
        prize: giveaway.prize,
        winners: winnersString,
        host: giveaway.hostedBy,
      })
    )
    .setFooter({ text: lang.get(language, "GIVEAWAY_ENDED_FOOTER") })
    .setTimestamp(Date.now());

  if (message) {
    const disabledRow = new ActionRowBuilder();
    if (message.components.length > 0) {
      message.components[0].components.forEach((component) => {
        disabledRow.addComponents(
          ButtonBuilder.from(component).setDisabled(true)
        );
      });
      await message.edit({ embeds: [endEmbed], components: [disabledRow] });
    } else {
      await message.edit({ embeds: [endEmbed], components: [] });
    }

    if (winners.length > 0) {
      await message.reply({
        content: lang.get(language, "GIVEAWAY_CONGRATS", {
          winners: winnersString,
          prize: giveaway.prize,
        }),
      });
    } else {
      await message.reply({
        content: lang.get(language, "GIVEAWAY_NO_WINNER_MSG"),
      });
    }
  }

  const guild = client.guilds.cache.get(giveaway.guildId);
  if (guild) {
    for (const winnerId of winners) {
      const member = await guild.members.fetch(winnerId).catch(() => null);
      if (member) {
        if (winnerRole) await member.roles.add(winnerRole).catch(() => null);
        if (dmWinnersArr) {
          member
            .send(
              lang.get(language, "GIVEAWAY_DM_WINNER", {
                prize: giveaway.prize,
                guild: guild.name,
                url: message?.url || "",
              })
            )
            .catch(() => null);
        }
      }
    }

    if (dmHost) {
      const host = await guild.members
        .fetch(giveaway.hostedBy)
        .catch(() => null);
      if (host) {
        host
          .send(
            lang.get(language, "GIVEAWAY_DM_HOST", {
              prize: giveaway.prize,
              winners: winnersString,
            })
          )
          .catch(() => null);
      }
    }
  }

  return true;
}

/**
 * Reroll a Giveaway
 */
async function reroll(client, messageId) {
  const giveaway = await Giveaway.findOne({ messageId, ended: true });
  if (!giveaway) {
    const language = "en"; // Fallback or fetch from message if possible. Usually reroll is called from guild.
    // Try to get guildId from message search? Or just end and re-pick.
    // Actually, giveaway doc HAS guildId.
    return { success: false, error: "Giveaway not found or not ended." };
  }
  const language = await lang.getLanguage(giveaway.guildId);

  if (!giveaway.entries || giveaway.entries.length === 0) {
    return {
      success: false,
      error: lang.get(language, "GIVEAWAY_ERR_NO_PARTICIPANTS"),
    };
  }

  const pool = [...giveaway.entries];
  const randomIndex = Math.floor(Math.random() * pool.length);
  const newWinnerId = pool[randomIndex];

  const channel = await client.channels
    .fetch(giveaway.channelId)
    .catch(() => null);
  if (channel) {
    channel.send(
      lang.get(language, "GIVEAWAY_NEW_WINNER_MSG", { newWinnerId })
    );
    return { success: true };
  }
  return { success: false, error: "Channel not found." };
}

/**
 * Handle Join Interaction
 */
async function handleJoin(interaction) {
  const language = await lang.getLanguage(interaction.guildId);
  const messageId = interaction.message.id;
  const giveaway = await Giveaway.findOne({ messageId, ended: false });

  if (!giveaway) {
    return interaction.reply({
      content: lang.get(language, "GIVEAWAY_ERR_ENDED"),
      flags: MessageFlags.Ephemeral,
    });
  }

  if (interaction.customId === "giveaway_participants") {
    if (giveaway.entries.length === 0) {
      return interaction.reply({
        content: lang.get(language, "GIVEAWAY_ERR_NO_PARTICIPANTS"),
        flags: MessageFlags.Ephemeral,
      });
    }

    const participants = giveaway.entries.map((id) => `<@${id}>`).join(", ");
    return interaction.reply({
      content: lang.get(language, "GIVEAWAY_PARTICIPANTS_LIST", {
        count: giveaway.entries.length,
        participants,
      }),
      flags: MessageFlags.Ephemeral,
    });
  }

  if (giveaway.entries.includes(interaction.user.id)) {
    const index = giveaway.entries.indexOf(interaction.user.id);
    giveaway.entries.splice(index, 1);
    await giveaway.save();
    await updateGiveawayMessage(interaction);
    return interaction.reply({
      content: lang.get(language, "GIVEAWAY_LEFT"),
      flags: MessageFlags.Ephemeral,
    });
  }

  const guildData = await Guild.findById(interaction.guildId);
  const check = await checkRequirements(
    interaction.member,
    giveaway.requirements,
    language
  );
  if (!check.allowed) {
    return interaction.reply({
      content: lang.get(language, "GIVEAWAY_ROLE_REQ_NOT_MET", {
        reason: check.reason,
      }),
      flags: MessageFlags.Ephemeral,
    });
  }

  giveaway.entries.push(interaction.user.id);
  await giveaway.save();

  if (giveaway.type === "drop") {
    await end(interaction.client, messageId, [interaction.user.id]);
    return interaction.reply({
      content: lang.get(language, "GIVEAWAY_CLAIMED"),
      flags: MessageFlags.Ephemeral,
    });
  }

  await updateGiveawayMessage(interaction);
  return interaction.reply({
    content: lang.get(language, "GIVEAWAY_ENTERED"),
    flags: MessageFlags.Ephemeral,
  });
}

/**
 * Update the giveaway message
 */
async function updateGiveawayMessage(interaction) {
  const language = await lang.getLanguage(interaction.guildId);
  const messageId = interaction.message.id;
  const giveaway = await Giveaway.findOne({ messageId, ended: false });
  if (!giveaway) return;

  const guildData = await Guild.findById(interaction.guildId);
  const reactionEmoji = guildData?.giveaways?.reaction || "🎉";

  const joinButton = new ButtonBuilder()
    .setCustomId("giveaway_join")
    .setEmoji(reactionEmoji)
    .setLabel(
      giveaway.type === "drop"
        ? lang.get(language, "GIVEAWAY_BTN_CLAIM")
        : guildData?.giveaways?.joinButtonText || "Join Giveaway"
    )
    .setStyle(ButtonStyle.Primary);

  const participantsButton = new ButtonBuilder()
    .setCustomId("giveaway_participants")
    .setLabel(
      lang.get(language, "GIVEAWAY_BTN_PARTICIPANTS", {
        count: giveaway.entries.length,
      })
    )
    .setStyle(ButtonStyle.Secondary);

  const row = new ActionRowBuilder().addComponents(
    joinButton,
    participantsButton
  );
  await interaction.message.edit({ components: [row] }).catch(() => null);
}

async function processPendingActions(client) {
  const pending = await Giveaway.find({ action: { $ne: null } });
  for (const g of pending) {
    try {
      const language = await lang.getLanguage(g.guildId);
      if (g.action === "start") {
        const duration = g.endAt - g.startAt;
        await start(client, null, {
          _id: g._id,
          duration: duration > 0 ? duration : 3600000,
          prize: g.prize,
          winnerCount: g.winnerCount,
          channelId: g.channelId,
          guildId: g.guildId,
          hostedBy: g.hostedBy,
          type: g.type,
          requirements: g.requirements,
        });
      } else if (g.action === "end") {
        await end(client, g.messageId);
        g.action = null;
        await g.save();
      } else if (g.action === "reroll") {
        await reroll(client, g.messageId);
        g.action = null;
        await g.save();
      } else if (g.action === "delete") {
        const channel = await client.channels
          .fetch(g.channelId)
          .catch(() => null);
        if (channel) {
          const msg = await channel.messages
            .fetch(g.messageId)
            .catch(() => null);
          if (msg) await msg.delete().catch(() => {});
        }
        await Giveaway.findByIdAndDelete(g._id);
      } else if (g.action === "edit") {
        const channel = await client.channels
          .fetch(g.channelId)
          .catch(() => null);
        if (channel) {
          const msg = await channel.messages
            .fetch(g.messageId)
            .catch(() => null);
          if (msg) {
            const embed = msg.embeds[0];
            const newEmbed = {
              ...embed.data,
              description: lang.get(language, "GIVEAWAY_DESC", {
                prize: g.prize,
                host: g.hostedBy,
                winners: g.winnerCount,
                bonus: lang.get(language, "GIVEAWAY_NORMAL_BONUS", {
                  time: Math.floor(g.endAt / 1000),
                }),
              }),
            };
            const guildData = await Guild.findById(g.guildId);
            const reactionEmoji = guildData?.giveaways?.reaction || "🎉";
            const joinButtonText =
              g.type === "drop"
                ? lang.get(language, "GIVEAWAY_BTN_CLAIM")
                : guildData?.giveaways?.joinButtonText || "Join Giveaway";

            const joinButton = new ButtonBuilder()
              .setCustomId("giveaway_join")
              .setEmoji(reactionEmoji)
              .setLabel(joinButtonText)
              .setStyle(ButtonStyle.Primary);
            const participantsButton = new ButtonBuilder()
              .setCustomId("giveaway_participants")
              .setLabel(
                lang.get(language, "GIVEAWAY_BTN_PARTICIPANTS", {
                  count: g.entries.length,
                })
              )
              .setStyle(ButtonStyle.Secondary);
            const newRow = new ActionRowBuilder().addComponents(
              joinButton,
              participantsButton
            );
            await msg.edit({ embeds: [newEmbed], components: [newRow] });
          }
        }
        g.action = null;
        await g.save();
      }
    } catch (e) {
      logger.error(
        `Failed to process action ${g.action} for giveaway ${g._id}: ${e.message}`
      );
      g.action = null;
      await g.save();
    }
  }
}

async function checkGiveaways(client) {
  const giveaways = await Giveaway.find({
    ended: false,
    endAt: { $lte: Date.now() },
    type: { $ne: "drop" },
    messageId: { $ne: null },
  });
  for (const giveaway of giveaways) await end(client, giveaway.messageId);
  await processPendingActions(client);
}

module.exports = {
  start,
  end,
  reroll,
  handleJoin,
  checkGiveaways,
  processPendingActions,
};
