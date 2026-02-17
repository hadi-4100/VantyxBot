const {
  SlashCommandBuilder,
  EmbedBuilder,
  PermissionFlagsBits,
  ButtonBuilder,
  ButtonStyle,
  ActionRowBuilder,
} = require("discord.js");
const User = require("../../database/models/User");
const { fetchInvites } = require("../../utils/inviteTracker");
const { checkPermissions } = require("../../utils/permissions");
const lang = require("../../utils/language");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("sync-invites")
    .setDescription(
      "Load invites stored in server settings into the bot database."
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),
  async execute(interaction) {
    const isAllowed = await checkPermissions(interaction, {
      permissions: [PermissionFlagsBits.ManageGuild],
    });
    if (!isAllowed) return;

    const language = await lang.getLanguage(interaction.guildId);

    const embed = new EmbedBuilder()
      .setTitle(lang.get(language, "SYNC_TITLE"))
      .setDescription(lang.get(language, "SYNC_DESC"))
      .setColor("#FFA500");

    const confirm = new ButtonBuilder()
      .setCustomId("sync_confirm")
      .setLabel(lang.get(language, "SYNC_BTN_CONFIRM"))
      .setStyle(ButtonStyle.Danger);

    const cancel = new ButtonBuilder()
      .setCustomId("sync_cancel")
      .setLabel(lang.get(language, "SYNC_BTN_CANCEL"))
      .setStyle(ButtonStyle.Secondary);

    const row = new ActionRowBuilder().addComponents(confirm, cancel);

    const response = await interaction.reply({
      embeds: [embed],
      components: [row],
      ephemeral: true,
    });

    const collectorFilter = (i) => i.user.id === interaction.user.id;

    try {
      const confirmation = await response.awaitMessageComponent({
        filter: collectorFilter,
        time: 60000,
      });

      if (confirmation.customId === "sync_confirm") {
        await confirmation.update({
          content: lang.get(language, "SYNC_PROGRESS"),
          embeds: [],
          components: [],
        });

        const invites = await fetchInvites(interaction.guild);

        for (const invite of invites.values()) {
          if (invite.inviter) {
            await User.findOneAndUpdate(
              { guildId: interaction.guild.id, userId: invite.inviter.id },
              { "invites.regular": invite.uses },
              { upsert: true }
            );
          }
        }

        await confirmation.editReply({
          content: lang.get(language, "SYNC_SUCCESS", { count: invites.size }),
          embeds: [],
          components: [],
        });
      } else {
        await confirmation.update({
          content: lang.get(language, "SYNC_CANCELLED"),
          embeds: [],
          components: [],
        });
      }
    } catch (e) {
      await interaction.editReply({
        content: lang.get(language, "SYNC_TIMEOUT"),
        embeds: [],
        components: [],
      });
    }
  },
};
