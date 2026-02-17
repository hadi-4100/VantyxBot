const {
  SlashCommandBuilder,
  PermissionFlagsBits,
  EmbedBuilder,
} = require("discord.js");
const lang = require("../../utils/language");
const { checkPermissions } = require("../../utils/permissions");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("slowmode")
    .setDescription("Enable or disable slowmode on a channel")
    .addIntegerOption((option) =>
      option
        .setName("time")
        .setDescription("Time in seconds (0 to disable)")
        .setRequired(true)
    )
    .addChannelOption((option) =>
      option.setName("channel").setDescription("The channel (optional)")
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
    const time = interaction.options.getInteger("time");
    const channel =
      interaction.options.getChannel("channel") || interaction.channel;

    await channel.setRateLimitPerUser(time);

    const embed = new EmbedBuilder()
      .setColor("#0099ff")
      .setTitle(lang.get(language, "SLOWMODE_TITLE"))
      .setDescription(
        time === 0
          ? lang.get(language, "SLOWMODE_OFF")
          : lang.get(language, "SLOWMODE_SUCCESS", { time })
      );

    await interaction.reply({ embeds: [embed] });
  },
};
