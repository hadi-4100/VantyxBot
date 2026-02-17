const {
  SlashCommandBuilder,
  PermissionFlagsBits,
  MessageFlags,
  EmbedBuilder,
} = require("discord.js");
const lang = require("../../utils/language");
const { checkPermissions } = require("../../utils/permissions");
const { sendTemporary } = require("../../utils/messages");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("unlock")
    .setDescription("Allows @everyone to send messages in specific channel")
    .addChannelOption((option) =>
      option
        .setName("channel")
        .setDescription("The channel to unlock (optional)")
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),
  async execute(interaction) {
    const isAllowed = await checkPermissions(interaction, {
      permissions: [
        PermissionFlagsBits.ManageChannels,
        PermissionFlagsBits.ManageGuild,
      ],
    });
    if (!isAllowed) return;

    const language = await lang.getLanguage(interaction.guildId);
    const channel =
      interaction.options.getChannel("channel") || interaction.channel;

    if (
      channel
        .permissionsFor(interaction.guild.id)
        .has(PermissionFlagsBits.SendMessages)
    ) {
      return sendTemporary(interaction, {
        content: lang.get(language, "UNLOCK_ALREADY"),
        flags: MessageFlags.Ephemeral,
      });
    }

    await channel.permissionOverwrites.edit(interaction.guild.id, {
      SendMessages: true,
    });

    const embed = new EmbedBuilder()
      .setColor("#00FF00")
      .setTitle(lang.get(language, "UNLOCK_TITLE"))
      .setDescription(lang.get(language, "UNLOCK_SUCCESS"));

    await interaction.reply({ embeds: [embed] });
  },
};
