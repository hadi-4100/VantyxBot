const {
  ChannelType,
  PermissionFlagsBits,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  AttachmentBuilder,
  MessageFlags,
} = require("discord.js");
const TicketSettings = require("../database/models/TicketSettings");
const Ticket = require("../database/models/Ticket");
const lang = require("./language");
const logger = require("./logger");

// Parse text placeholders
const parseText = (text, user, ticketCount) => {
  return text
    .replace(/{user}/g, user.toString())
    .replace(/{username}/g, user.username)
    .replace(/{id}/g, user.id)
    .replace(/{count}/g, ticketCount || "1");
};

async function handleTicketCreate(interaction, typeId) {
  const language = await lang.getLanguage(interaction.guildId);
  await interaction.deferReply({ flags: MessageFlags.Ephemeral });

  const settings = await TicketSettings.findOne({
    guildId: interaction.guildId,
  });
  if (!settings || !settings.enabled) {
    return interaction.editReply(lang.get(language, "TICKET_SYSTEM_DISABLED"));
  }

  const ticketType = settings.ticketTypes.find(
    (t) => t._id.toString() === typeId,
  );
  if (!ticketType || !ticketType.enabled) {
    return interaction.editReply(lang.get(language, "TICKET_TYPE_UNAVAILABLE"));
  }

  // Check Limits
  const openTickets = await Ticket.countDocuments({
    guildId: interaction.guildId,
    userId: interaction.user.id,
    status: "OPEN",
  });

  if (
    settings.limits.maxOpenTickets > 0 &&
    openTickets >= settings.limits.maxOpenTickets
  ) {
    return interaction.editReply(
      lang.get(language, "TICKET_LIMIT_REACHED", {
        max: settings.limits.maxOpenTickets,
      }),
    );
  }

  // Create Channel
  const guild = interaction.guild;
  const category = guild.channels.cache.get(settings.ticketsCategoryId);

  if (!category) {
    return interaction.editReply(lang.get(language, "TICKET_INVALID_CATEGORY"));
  }

  const totalTickets = await Ticket.countDocuments({ guildId: guild.id });
  const channelName = `ticket-${totalTickets + 1}`;
  const supportRoles = ticketType.supportRoleIds || [];

  const permissionOverwrites = [
    {
      id: guild.id,
      deny: [PermissionFlagsBits.ViewChannel],
    },
    {
      id: interaction.user.id,
      allow: [
        PermissionFlagsBits.ViewChannel,
        PermissionFlagsBits.SendMessages,
        PermissionFlagsBits.AttachFiles,
        PermissionFlagsBits.EmbedLinks,
      ],
    },
    {
      id: interaction.client.user.id,
      allow: [
        PermissionFlagsBits.ViewChannel,
        PermissionFlagsBits.ManageChannels,
        PermissionFlagsBits.SendMessages,
        PermissionFlagsBits.EmbedLinks,
      ],
    },
  ];

  for (const roleId of supportRoles) {
    permissionOverwrites.push({
      id: roleId,
      allow: [
        PermissionFlagsBits.ViewChannel,
        PermissionFlagsBits.SendMessages,
        PermissionFlagsBits.AttachFiles,
        PermissionFlagsBits.EmbedLinks,
      ],
    });
  }

  try {
    const ticketChannel = await guild.channels.create({
      name: channelName,
      type: ChannelType.GuildText,
      parent: category.id,
      permissionOverwrites,
    });

    const ticket = new Ticket({
      guildId: guild.id,
      channelId: ticketChannel.id,
      userId: interaction.user.id,
      typeId: typeId,
      status: "OPEN",
      createdAt: new Date(),
    });
    await ticket.save();

    const titlePrefix = ticketType.emoji
      ? ticketType.emoji.startsWith("<")
        ? ticketType.name
        : `${ticketType.emoji} ${ticketType.name}`
      : ticketType.name;

    const welcomeEmbed = new EmbedBuilder()
      .setTitle(
        lang.get(language, "TICKET_WELCOME_TITLE", { name: titlePrefix }),
      )
      .setDescription(
        parseText(
          ticketType.welcomeMessage ||
            lang.get(language, "TICKET_WELCOME_DEFAULT_MSG"),
          interaction.user,
          totalTickets + 1,
        ),
      )
      .setColor("#5865F2")
      .setTimestamp();

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("ticket:close_confirm")
        .setLabel(lang.get(language, "TICKET_CLOSE_BTN"))
        .setStyle(ButtonStyle.Danger)
        .setEmoji("🔒"),
      new ButtonBuilder()
        .setCustomId("ticket:claim")
        .setLabel(lang.get(language, "TICKET_CLAIM_BTN"))
        .setStyle(ButtonStyle.Success)
        .setEmoji("👋"),
    );

    await ticketChannel.send({
      content: `${interaction.user} ${
        supportRoles.length > 0
          ? supportRoles.map((r) => `<@&${r}>`).join(" ")
          : ""
      }`,
      embeds: [welcomeEmbed],
      components: [row],
    });

    await interaction.editReply(
      lang.get(language, "TICKET_CREATED_REPLY", {
        channel: ticketChannel.toString(),
      }),
    );
  } catch (error) {
    logger.error(`Ticket Creation Error: ${error.message}`);
    await interaction.editReply(lang.get(language, "TICKET_CREATE_FAIL"));
  }
}

async function handleTicketCloseConfirm(interaction) {
  const language = await lang.getLanguage(interaction.guildId);
  const ticket = await Ticket.findOne({ channelId: interaction.channelId });
  if (ticket && ticket.status === "CLOSED") {
    return interaction.reply({
      content: lang.get(language, "TICKET_ALREADY_CLOSED"),
      flags: MessageFlags.Ephemeral,
    });
  }

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId("ticket:close")
      .setLabel(lang.get(language, "TICKET_CLOSE_CONFIRM_TITLE"))
      .setStyle(ButtonStyle.Danger),
    new ButtonBuilder()
      .setCustomId("ticket:cancel_close")
      .setLabel(lang.get(language, "TICKET_CANCEL_BTN"))
      .setStyle(ButtonStyle.Secondary),
  );
  await interaction.reply({
    content: lang.get(language, "TICKET_CLOSE_CONFIRM_MSG"),
    components: [row],
    flags: MessageFlags.Ephemeral,
  });
}

async function handleTicketClose(interaction) {
  const language = await lang.getLanguage(interaction.guildId);
  await interaction.deferUpdate();

  try {
    if (interaction.message) {
      await interaction.message.delete().catch(() => {});
    }
  } catch (e) {}

  const ticket = await Ticket.findOne({ channelId: interaction.channelId });
  if (!ticket) return;

  if (ticket.status === "CLOSED") {
    return interaction.followUp({
      content: lang.get(language, "TICKET_ALREADY_CLOSED"),
      flags: MessageFlags.Ephemeral,
    });
  }

  ticket.status = "CLOSED";
  ticket.closedAt = new Date();
  await ticket.save();

  const channel = interaction.channel;
  await channel.permissionOverwrites
    .edit(ticket.userId, {
      ViewChannel: false,
    })
    .catch(() => {});

  const embed = new EmbedBuilder()
    .setTitle(lang.get(language, "TICKET_CLOSED_TITLE"))
    .setDescription(
      lang.get(language, "TICKET_CLOSED_DESC", {
        user: interaction.user.toString(),
      }),
    )
    .setColor("#FBBF24")
    .setTimestamp();

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId("ticket:transcript")
      .setLabel(lang.get(language, "TICKET_TRANSCRIPT_BTN"))
      .setStyle(ButtonStyle.Secondary)
      .setEmoji("📜"),
    new ButtonBuilder()
      .setCustomId("ticket:reopen")
      .setLabel(lang.get(language, "TICKET_REOPEN_BTN"))
      .setStyle(ButtonStyle.Success)
      .setEmoji("🔓"),
    new ButtonBuilder()
      .setCustomId("ticket:delete")
      .setLabel(lang.get(language, "TICKET_DELETE_BTN"))
      .setStyle(ButtonStyle.Danger)
      .setEmoji("🗑️"),
  );

  await channel.send({ embeds: [embed], components: [row] });
}

async function handleTicketReopen(interaction) {
  const language = await lang.getLanguage(interaction.guildId);
  await interaction.deferUpdate();
  const ticket = await Ticket.findOne({ channelId: interaction.channelId });
  if (!ticket) return;

  ticket.status = "OPEN";
  await ticket.save();

  const channel = interaction.channel;
  await channel.permissionOverwrites
    .edit(ticket.userId, {
      ViewChannel: true,
      SendMessages: true,
    })
    .catch(() => {});

  const embed = new EmbedBuilder()
    .setDescription(
      lang.get(language, "TICKET_REOPENED_DESC", {
        user: interaction.user.toString(),
      }),
    )
    .setColor("#22C55E");

  await channel.send({ embeds: [embed] });

  try {
    if (interaction.message) {
      await interaction.message.delete().catch(() => {});
    }
  } catch (e) {}
}

async function handleTicketDelete(interaction) {
  const language = await lang.getLanguage(interaction.guildId);
  await interaction.reply(lang.get(language, "TICKET_DELETING_MSG"));
  await Ticket.deleteOne({ channelId: interaction.channelId });

  setTimeout(async () => {
    try {
      await interaction.channel.delete();
    } catch (e) {}
  }, 5000);
}

async function handleTicketClaim(interaction) {
  const language = await lang.getLanguage(interaction.guildId);
  await interaction.deferReply({ flags: MessageFlags.Ephemeral });

  const ticket = await Ticket.findOne({ channelId: interaction.channelId });
  if (!ticket)
    return interaction.editReply(lang.get(language, "TICKET_NOT_FOUND_DB"));

  if (ticket.claimedBy) {
    return interaction.editReply(
      lang.get(language, "TICKET_ALREADY_CLAIMED", { user: ticket.claimedBy }),
    );
  }

  ticket.claimedBy = interaction.user.id;
  await ticket.save();

  try {
    if (interaction.message) {
      const oldRow = interaction.message.components[0];
      const newRow = ActionRowBuilder.from(oldRow);
      const claimBtn = newRow.components.find(
        (c) => c.data.custom_id === "ticket:claim",
      );
      if (claimBtn) {
        claimBtn.setDisabled(true);
        claimBtn.setLabel(
          lang.get(language, "TICKET_CLAIMED_BY_LABEL", {
            user: interaction.user.username,
          }),
        );
      }
      await interaction.message.edit({ components: [newRow] });
    }
  } catch (err) {
    logger.error(`Failed to update claim button: ${err.message}`);
  }

  const embed = new EmbedBuilder()
    .setDescription(
      lang.get(language, "TICKET_CLAIMED_DESC", {
        user: interaction.user.toString(),
      }),
    )
    .setColor("#5865F2");

  await interaction.channel.send({ embeds: [embed] });
  await interaction.editReply(lang.get(language, "TICKET_CLAIM_SUCCESS"));
}

async function handleTicketTranscript(interaction) {
  const language = await lang.getLanguage(interaction.guildId);
  await interaction.deferReply({ flags: MessageFlags.Ephemeral });

  const ticket = await Ticket.findOne({ channelId: interaction.channelId });
  const messages = await interaction.channel.messages.fetch({ limit: 100 });
  const transcript = messages
    .reverse()
    .map(
      (m) =>
        `[${m.createdAt.toLocaleString()}] ${m.author.tag}: ${m.content} ${
          m.attachments.size > 0 ? "(Attachment)" : ""
        }`,
    )
    .join("\n");

  const buffer = Buffer.from(transcript, "utf-8");
  const attachment = new AttachmentBuilder(buffer, {
    name: `transcript-${ticket?.ticketId || "ticket"}.txt`,
  });

  await interaction.editReply({
    files: [attachment],
    content: lang.get(language, "TICKET_TRANSCRIPT_MSG"),
  });
}

module.exports = {
  handleTicketCreate,
  handleTicketCloseConfirm,
  handleTicketClose,
  handleTicketReopen,
  handleTicketDelete,
  handleTicketClaim,
  handleTicketTranscript,
};
