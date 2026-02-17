const {
  SlashCommandBuilder,
  AttachmentBuilder,
  EmbedBuilder,
} = require("discord.js");
const GuildStats = require("../../database/models/GuildStats");
const { createCanvas } = require("@napi-rs/canvas");
const lang = require("../../utils/language");
const logger = require("../../utils/logger");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("stats")
    .setDescription("Display server join statistics graphs")
    .addIntegerOption((option) =>
      option
        .setName("days")
        .setDescription("Number of days to display (default: 7)")
        .setMinValue(1)
        .setMaxValue(30)
    ),

  async execute(interaction) {
    const language = await lang.getLanguage(interaction.guildId);
    await interaction.deferReply();

    try {
      const days = interaction.options.getInteger("days") || 7;
      const guildId = interaction.guildId;

      const stats = await GuildStats.findOne({ guildId });
      if (!stats || !stats.dailyStats || stats.dailyStats.length === 0) {
        return interaction.editReply({
          content: lang.get(language, "STATS_NO_DATA"),
        });
      }

      // ===== Prepare Data =====
      const now = new Date();
      const labels = [];
      const dataPoints = [];
      let totalJoins = 0;

      for (let i = days - 1; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(d.getDate() - i);
        const dateString = d.toISOString().split("T")[0];
        const label = `${d.getDate()} ${d.toLocaleString("en", {
          month: "short",
        })}`;
        labels.push(label);

        const dayStat = stats.dailyStats.find((s) => s.date === dateString);
        const joins = dayStat ? dayStat.totalJoins : 0;
        dataPoints.push(joins);
        totalJoins += joins;
      }

      // ===== Canvas Setup =====
      const width = 800;
      const height = 400;
      const padding = 60;

      const canvas = createCanvas(width, height);
      const ctx = canvas.getContext("2d");

      const chartWidth = width - padding * 2;
      const chartHeight = height - padding * 2;
      const maxVal = Math.max(...dataPoints, 1);

      // Helper Functions
      const getX = (i) => padding + (i * chartWidth) / (dataPoints.length - 1);
      const getY = (v) => padding + chartHeight - (v / maxVal) * chartHeight;
      const safeText = (t, x, y) => {
        if (t != null && !Number.isNaN(x) && !Number.isNaN(y))
          ctx.fillText(String(t), x, y);
      };

      // ===== Grid & Axis =====
      ctx.strokeStyle = "rgba(13, 24, 29, 0.1)";
      ctx.lineWidth = 2;
      ctx.font = "bold 12px sans-serif";
      ctx.fillStyle = "#ffffff";

      const gridLines = 5;

      // Draw Horizontal Grid Lines & Y-Axis Labels
      ctx.textAlign = "right";
      for (let i = 0; i <= gridLines; i++) {
        const y = padding + (chartHeight * i) / gridLines;
        const value = Math.round(maxVal - (maxVal * i) / gridLines);

        ctx.beginPath();
        ctx.moveTo(padding, y);
        ctx.lineTo(width - padding, y);
        ctx.stroke();

        safeText(value, padding - 10, y + 4);
      }

      // Draw Vertical Grid Lines
      for (let i = 0; i < labels.length; i++) {
        const x = getX(i);
        ctx.beginPath();
        ctx.moveTo(x, padding);
        ctx.lineTo(x, height - padding);
        ctx.stroke();
      }

      // Draw X-Axis Labels (Date)
      ctx.textAlign = "center";
      const skipStep = Math.ceil(labels.length / 10); // Prevent overlap if many days
      for (let i = 0; i < labels.length; i++) {
        if (i % skipStep === 0) {
          safeText(labels[i], getX(i), height - padding + 22);
        }
      }

      const tension = 0.4; // Curvature factor

      // Fill
      ctx.beginPath();
      ctx.moveTo(getX(0), getY(dataPoints[0]));
      for (let i = 0; i < dataPoints.length - 1; i++) {
        const x0 = getX(i),
          y0 = getY(dataPoints[i]);
        const x1 = getX(i + 1),
          y1 = getY(dataPoints[i + 1]);
        ctx.bezierCurveTo(
          x0 + (x1 - x0) * tension,
          y0,
          x1 - (x1 - x0) * tension,
          y1,
          x1,
          y1
        );
      }
      ctx.lineTo(getX(dataPoints.length - 1), height - padding);
      ctx.lineTo(getX(0), height - padding);
      ctx.closePath();
      ctx.fillStyle = "rgba(61,148,192,0.1)";
      ctx.fill();

      // Stroke
      ctx.beginPath();
      ctx.moveTo(getX(0), getY(dataPoints[0]));
      for (let i = 0; i < dataPoints.length - 1; i++) {
        const x0 = getX(i),
          y0 = getY(dataPoints[i]);
        const x1 = getX(i + 1),
          y1 = getY(dataPoints[i + 1]);
        ctx.bezierCurveTo(
          x0 + (x1 - x0) * tension,
          y0,
          x1 - (x1 - x0) * tension,
          y1,
          x1,
          y1
        );
      }
      ctx.strokeStyle = "rgba(61,148,192,1)";
      ctx.lineWidth = 3;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.stroke();

      // Data Points
      for (let i = 0; i < dataPoints.length; i++) {
        ctx.beginPath();
        ctx.arc(getX(i), getY(dataPoints[i]), 4, 0, Math.PI * 2);
        ctx.fillStyle = "#50b4e6";
        ctx.fill();
      }

      const buffer = canvas.toBuffer("image/png");
      const attachment = new AttachmentBuilder(buffer, { name: "stats.png" });

      const growth = (
        (totalJoins / (interaction.guild.memberCount || 1)) *
        100
      ).toFixed(2);

      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(endDate.getDate() - (days - 1));
      const format = (d) => `${d.getDate()}/${d.getMonth() + 1}`;

      const embed = new EmbedBuilder()
        .setTitle(
          lang.get(language, "STATS_TITLE", {
            guild: interaction.guild.name,
            days,
          })
        )
        .setColor("#50b4e6")
        .addFields({
          name: lang.get(language, "STATS_GROWTH"),
          value: lang.get(language, "STATS_GROWTH_VALUE", {
            totalJoins,
            growth,
            start: format(startDate),
            end: format(endDate),
          }),
          inline: false,
        })
        .setImage("attachment://stats.png");

      await interaction.editReply({ embeds: [embed], files: [attachment] });
    } catch (err) {
      logger.error(err);
      await interaction.editReply({ content: lang.get(language, "ERROR") });
    }
  },
};
