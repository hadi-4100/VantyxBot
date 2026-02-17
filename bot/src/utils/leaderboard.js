const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ComponentType,
  MessageFlags,
} = require("discord.js");
const lang = require("./language");

async function renderLeaderboard(
  interaction,
  data,
  title,
  language,
  formatLine,
) {
  const USERS_PER_PAGE = 10;
  const totalPages = Math.ceil(data.length / USERS_PER_PAGE);
  let currentPage = 0;

  const createEmbed = async (page) => {
    const start = page * USERS_PER_PAGE;
    const end = start + USERS_PER_PAGE;
    const pageData = data.slice(start, end);

    const embed = new EmbedBuilder()
      .setColor("#4276f1")
      .setTitle(
        lang.get(language, "LB_TITLE", {
          guild: interaction.guild.name,
          title,
        }),
      )
      .setThumbnail(interaction.guild.iconURL({ dynamic: true }))
      .setFooter({
        text: lang.get(language, "LB_PAGE", {
          current: page + 1,
          total: totalPages,
        }),
      })
      .setTimestamp();

    const medals = ["🥇", "🥈", "🥉"];

    // Fetch all users for this page in parallel to avoid sequential delay
    const userPromises = pageData.map((entry) =>
      interaction.client.users.fetch(entry.userId).catch(() => null),
    );
    const resolvedUsers = await Promise.all(userPromises);

    const lines = [];
    for (let i = 0; i < pageData.length; i++) {
      const user = resolvedUsers[i];
      if (!user) continue;

      const entry = pageData[i];
      const position = start + i;
      const medal = position < 3 ? medals[position] : `**${position + 1}.**`;
      lines.push(`${medal} **${user.tag}**\n└ ${formatLine(entry, position)}`);
    }

    embed.setDescription(
      lines.join("\n\n") || lang.get(language, "LB_NO_DATA"),
    );
    return embed;
  };

  const createButtons = (page) => {
    return new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("prev")
        .setLabel("◀️")
        .setStyle(ButtonStyle.Primary)
        .setDisabled(page === 0),
      new ButtonBuilder()
        .setCustomId("page")
        .setLabel(`${page + 1} / ${totalPages}`)
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(true),
      new ButtonBuilder()
        .setCustomId("next")
        .setLabel("▶️")
        .setStyle(ButtonStyle.Primary)
        .setDisabled(page >= totalPages - 1),
    );
  };

  const message = await interaction.editReply({
    embeds: [await createEmbed(currentPage)],
    components: totalPages > 1 ? [createButtons(currentPage)] : [],
  });

  if (totalPages > 1) {
    const collector = message.createMessageComponentCollector({
      componentType: ComponentType.Button,
      time: 60000,
    });
    collector.on("collect", async (i) => {
      if (i.user.id !== interaction.user.id) {
        return i.reply({
          content: lang.get(language, "NOT_FOR_YOU"),
          flags: MessageFlags.Ephemeral,
        });
      }
      if (i.customId === "prev") currentPage--;
      if (i.customId === "next") currentPage++;
      await i.update({
        embeds: [await createEmbed(currentPage)],
        components: [createButtons(currentPage)],
      });
    });
  }
}

module.exports = { renderLeaderboard };
