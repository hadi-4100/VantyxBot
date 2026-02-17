const {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  StringSelectMenuBuilder,
} = require("discord.js");
const fs = require("fs");
const path = require("path");
const lang = require("../../utils/language");
const config = require("../../../../config.js");
const logger = require("../../utils/logger");

// Optimized caching system
let helpDataCache = null;

module.exports = {
  data: new SlashCommandBuilder()
    .setName("help")
    .setDescription("The ultimate interactive Help Center"),
  async execute(interaction) {

    const language = await lang.getLanguage(interaction.guildId);

    // 1. Precise Data Loading
    if (!helpDataCache) {
      try {
        const categories = {};
        const commandsPath = path.join(__dirname, "../../commands");
        const subDirs = fs
          .readdirSync(commandsPath)
          .filter((f) =>
            fs.lstatSync(path.join(commandsPath, f)).isDirectory(),
          );

        for (const folder of subDirs) {
          const files = fs
            .readdirSync(path.join(commandsPath, folder))
            .filter((f) => f.endsWith(".js"));
          const cmds = files
            .map((file) => {
              const cmd = require(path.join(commandsPath, folder, file));
              if (!cmd.data) return null;

              // Extract subcommands
              let subcommands = [];
              if (cmd.data.options && Array.isArray(cmd.data.options)) {
                subcommands = cmd.data.options
                  .filter((opt) => {
                    // Check if option is a subcommand (Type 1)
                    // Handle both Builder objects and raw JSON if ever used
                    const type =
                      opt.type || (opt.toJSON ? opt.toJSON().type : undefined);
                    return type === 1;
                  })
                  .map((sub) => ({
                    name: sub.name,
                    description: sub.description,
                  }));
              }

              return {
                name: cmd.data.name,
                description: cmd.data.description,
                usage: cmd.usage || `/${cmd.data.name}`,
                subcommands,
              };
            })
            .filter((c) => c !== null);

          if (cmds.length > 0) categories[folder] = cmds;
        }
        helpDataCache = categories;
      } catch (error) {
        logger.error(`Error loading help data: ${error.message}`);
        helpDataCache = {};
      }
    }

    const categories = helpDataCache;
    const catEmojis = {
      moderation: "🛡️",
      giveaway: "🎉",
      leveling: "📊",
      general: "🏠",
      info: "ℹ️",
      invites: "📨",
      tickets: "🎫",
      reaction_role: "➕",
    };

    // Sort categories
    const sortedCategories = Object.keys(categories).sort((a, b) => {
      const priority = Object.keys(catEmojis);
      const indexA = priority.indexOf(a);
      const indexB = priority.indexOf(b);

      // If a category isn't in our priority list, put it at the end
      if (indexA === -1 && indexB === -1) return a.localeCompare(b);
      if (indexA === -1) return 1;
      if (indexB === -1) return -1;

      return indexA - indexB;
    });

    const getTotalCommandsCount = () => {
      let commands = 0;
      let subcommands = 0;

      for (const cat of Object.values(categories)) {
        for (const cmd of cat) {
          commands += 1;
          subcommands += cmd.subcommands?.length || 0;
        }
      }

      return {
        commands,
        subcommands,
        total: commands + subcommands,
      };
    };

    const counts = getTotalCommandsCount();

    // 2. Powerful Hybrid UI Logic
    const getHomeEmbed = () =>
      new EmbedBuilder()
        .setColor("#5865F2")
        .setAuthor({
          name: `${interaction.client.user.username} Advanced Assistant`,
          iconURL: interaction.client.user.displayAvatarURL(),
        })
        .setTitle(lang.get(language, "HELP_HOME_TITLE"))
        .setDescription(
          lang.get(language, "HELP_HOME_DESC", {
            modules: sortedCategories.length,
            commands: counts.commands,
            subcommands: counts.subcommands,
            latency: interaction.client.ws.ping,
          }),
        )
        .setThumbnail(interaction.client.user.displayAvatarURL({ size: 512 }))
        .addFields(
          {
            name: lang.get(language, "HELP_USAGE_TITLE"),
            value: lang.get(language, "HELP_USAGE_VALUE"),
          },
          {
            name: lang.get(language, "HELP_LINKS_TITLE"),
            value: lang.get(language, "HELP_LINKS_VALUE", {
              support: config.LINKS.SUPPORT,
              dashboard: config.DASHBOARD_URL,
              invite: `https://discord.com/api/oauth2/authorize?client_id=${interaction.client.user.id}&permissions=8&scope=bot%20applications.commands`,
            }),
          },
        )
        .setFooter({
          text: lang.get(language, "HELP_FOOTER"),
          iconURL: interaction.guild.iconURL(),
        })
        .setTimestamp();

    const getNavRow = (active = "home") =>
      new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId("help_go_home")
          .setLabel(lang.get(language, "HELP_BTN_HOME"))
          .setEmoji("🏠")
          .setStyle(
            active === "home" ? ButtonStyle.Primary : ButtonStyle.Secondary,
          ),
        new ButtonBuilder()
          .setCustomId("help_go_modules")
          .setLabel(lang.get(language, "HELP_BTN_MODULES"))
          .setEmoji("📂")
          .setStyle(
            active === "modules" ? ButtonStyle.Primary : ButtonStyle.Secondary,
          ),
      );

    const getCategoryMenu = (selected = null) =>
      new ActionRowBuilder().addComponents(
        new StringSelectMenuBuilder()
          .setCustomId("help_cat_picker")
          .setPlaceholder(lang.get(language, "HELP_MENU_PLACEHOLDER"))
          .addOptions(
            sortedCategories.map((cat) => ({
              label: cat.charAt(0).toUpperCase() + cat.slice(1),
              value: cat,
              emoji: catEmojis[cat] || "📁",
              description: `View ${categories[cat].length} unique commands`,
              default: cat === selected,
            })),
          ),
      );

    // 3. High-performance Interaction Handling
    await interaction.editReply({
      embeds: [getHomeEmbed()],
      components: [getNavRow("home")],
    });

    const initialMsg = await interaction.fetchReply();

    const collector = initialMsg.createMessageComponentCollector({
      filter: (i) => i.user.id === interaction.user.id,
      time: 600000, // 10 Minutes
    });

    collector.on("collect", async (i) => {
      const iLang = await lang.getLanguage(i.guildId);

      // HANDLE SELECT MENU
      if (i.isStringSelectMenu() && i.customId === "help_cat_picker") {
        const cat = i.values[0];
        const cmds = categories[cat];

        const catEmbed = new EmbedBuilder()
          .setColor("#5865F2")
          .setAuthor({
            name: `${cat.toUpperCase()} Module Commands`,
            iconURL: interaction.client.user.displayAvatarURL(),
          })
          .setTitle(
            lang.get(iLang, "HELP_MODULE_TITLE", {
              emoji: catEmojis[cat] || "�",
              category: cat.charAt(0).toUpperCase() + cat.slice(1),
            }),
          )
          .setDescription(
            lang.get(iLang, "HELP_MODULE_DESC", {
              category: cat,
              commands: cmds
                .map((c) => {
                  let text = `**\`/${c.name}\`**\n┕ ${c.description}`;
                  if (c.subcommands && c.subcommands.length > 0) {
                    text +=
                      `\n` +
                      c.subcommands
                        .map(
                          (sub) =>
                            `   > \`/${c.name} ${sub.name}\`: ${sub.description}`,
                        )
                        .join("\n");
                  }
                  return text;
                })
                .join("\n\n"),
            }),
          )
          .setThumbnail(
            interaction.guild.iconURL({ dynamic: true }) ||
              interaction.client.user.displayAvatarURL(),
          )
          .setFooter({
            text: lang.get(iLang, "HELP_MODULE_FOOTER", {
              count: cmds.length,
            }),
          })
          .setTimestamp();

        return await i.update({
          embeds: [catEmbed],
          components: [getNavRow("modules"), getCategoryMenu(cat)],
        });
      }

      // HANDLE BUTTONS
      if (i.isButton()) {
        if (i.customId === "help_go_home") {
          return await i.update({
            embeds: [getHomeEmbed()],
            components: [getNavRow("home")],
          });
        }

        if (i.customId === "help_go_modules") {
          const overview = sortedCategories
            .map((cat) => {
              const cmdCount = categories[cat].length;
              const subCount = categories[cat].reduce(
                (acc, cmd) => acc + (cmd.subcommands?.length || 0),
                0,
              );
              return `${catEmojis[cat] || "📁"} **${
                cat.charAt(0).toUpperCase() + cat.slice(1)
              }** (${cmdCount} commands${
                subCount > 0 ? `, ${subCount} subcommands` : ""
              })`;
            })
            .join("\n");

          const browseEmbed = new EmbedBuilder()
            .setColor("#2B2D31")
            .setAuthor({
              name: "Module Directory",
              iconURL: interaction.client.user.displayAvatarURL(),
            })
            .setTitle(lang.get(iLang, "HELP_BROWSE_TITLE"))
            .setDescription(lang.get(iLang, "HELP_BROWSE_DESC", { overview }))
            .setThumbnail(interaction.client.user.displayAvatarURL())
            .setFooter({ text: "Use the menu below to navigate" });

          return await i.update({
            embeds: [browseEmbed],
            components: [getNavRow("modules"), getCategoryMenu()],
          });
        }
      }
    });

    collector.on("end", () => {
      interaction.editReply({ components: [] }).catch(() => {});
    });
  },
};
