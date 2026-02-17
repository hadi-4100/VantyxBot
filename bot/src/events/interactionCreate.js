const { Events, MessageFlags } = require("discord.js");
const logger = require("../utils/logger");
const Guild = require("../database/models/Guild");
const Stats = require("../database/models/Stats");
const lang = require("../utils/language");
const config = require("../../../config");
const { handleJoin } = require("../utils/giveaway");

/**
 * Event: InteractionCreate
 * Entry point for all slash commands, buttons, and select menus.
 */
module.exports = {
  name: Events.InteractionCreate,
  async execute(interaction, client) {
    // 1. Handle Autocomplete Suggestions
    if (interaction.isAutocomplete()) {
      const command = client.commands.get(interaction.commandName);
      if (command?.autocomplete) {
        await command
          .autocomplete(interaction)
          .catch((err) => logger.error(`Autocomplete Error: ${err.message}`));
      }
      return;
    }

    // 2. Handle Slash Commands
    if (interaction.isChatInputCommand()) {
      /**
       * Unified response handler via monkey-patching.
       * Ensures consistent behavior between initial replies and secondary edits,
       * while silently handling common Discord interaction timeout errors.
       */
      const originalReply = interaction.reply.bind(interaction);
      const originalEditReply = interaction.editReply.bind(interaction);
      const originalDeferReply = interaction.deferReply.bind(interaction);

      interaction.deferReply = async (options) => {
        if (interaction.deferred || interaction.replied) return;
        try {
          return await originalDeferReply(options);
        } catch (err) {
          if (err.code === 10062) return; // Unknown Interaction
          throw err;
        }
      };

      interaction.reply = async (options) => {
        try {
          if (interaction.deferred || interaction.replied) {
            if (typeof options === "object") delete options.flags;
            return await originalEditReply(options);
          }
          return await originalReply(options);
        } catch (err) {
          // Silently recover if the interaction token expired but we can still edit
          if (err.code === 40060 || err.code === 10062) {
            if (typeof options === "object") delete options.flags;
            return await originalEditReply(options).catch(() => {});
          }
          throw err;
        }
      };

      const command = client.commands.get(interaction.commandName);
      if (!command) return;

      // Defer reply immediately for all standard commands to prevent 3s timeout
      await interaction
        .deferReply({
          flags: command.ephemeral ? MessageFlags.Ephemeral : undefined,
        })
        .catch(() => {});

      try {
        const guildId = interaction.guild?.id;

        // Fetch minimal guild status for authorization check
        const guildStatus = await Guild.findById(guildId)
          .select("commands language")
          .lean();

        const disabledCategories =
          guildStatus?.commands?.disabledCategories || [];
        const disabledCommands = guildStatus?.commands?.disabledCommands || [];
        const language = guildStatus?.language || config.DEFAULT_LANG;

        // Categorization normalization
        const normalizedCategory =
          command.category.charAt(0).toUpperCase() +
          command.category.slice(1).toLowerCase();

        // Subcommand identification for granular disabling
        let subcommandName = null;
        try {
          subcommandName = interaction.options.getSubcommand(false);
        } catch {
          /* ignored */
        }

        const fullCommandName = subcommandName
          ? `${interaction.commandName} ${subcommandName}`
          : interaction.commandName;

        // Check if command or its category is disabled for this guild
        if (
          disabledCategories.includes(normalizedCategory) ||
          disabledCommands.includes(fullCommandName) ||
          disabledCommands.includes(interaction.commandName)
        ) {
          return await interaction.reply({
            content: lang.get(language, "COMMAND_DISABLED"),
            flags: MessageFlags.Ephemeral,
          });
        }

        // Execute the command logic
        await command.execute(interaction, client);

        // Record execution statistics (Asynchronous)
        updateGlobalStats(interaction.commandName);
      } catch (error) {
        logger.error(
          `Command Execution Error (${interaction.commandName}): ${error.message}`,
        );
        const language = await lang.getLanguage(interaction.guildId);
        await interaction
          .reply({
            content: lang.get(language, "COMMAND_ERROR"),
            flags: MessageFlags.Ephemeral,
          })
          .catch(() => {});
      }
      return;
    }

    // 3. Handle Component Interactions (Buttons, Select Menus)
    if (interaction.isButton() || interaction.isStringSelectMenu()) {
      const customId = interaction.customId;

      // Giveaway interactions
      if (
        customId === "giveaway_join" ||
        customId === "giveaway_participants"
      ) {
        return handleJoin(interaction);
      }

      // Ticket system interactions
      if (customId.startsWith("ticket:")) {
        const {
          handleTicketCreate,
          handleTicketCloseConfirm,
          handleTicketClose,
          handleTicketReopen,
          handleTicketDelete,
          handleTicketClaim,
          handleTicketTranscript,
        } = require("../utils/ticketHandler");

        const [, action, id] = customId.split(":");
        switch (action) {
          case "create":
            return handleTicketCreate(interaction, id);
          case "close_confirm":
            return handleTicketCloseConfirm(interaction);
          case "close":
            return handleTicketClose(interaction);
          case "cancel_close":
            return interaction.message.delete().catch(() => {});
          case "reopen":
            return handleTicketReopen(interaction);
          case "delete":
            return handleTicketDelete(interaction);
          case "claim":
            return handleTicketClaim(interaction);
          case "transcript":
            return handleTicketTranscript(interaction);
        }
      }

      // Reaction role interactions
      if (customId.startsWith("rr:")) {
        const { handleReactionRole } = require("../utils/reactionRoleHandler");
        return handleReactionRole(interaction);
      }
    }
  },
};

/**
 * Updates global and daily command usage statistics.
 * @param {string} commandName
 */
async function updateGlobalStats(commandName) {
  try {
    const today = new Date().toISOString().split("T")[0];
    const stats = await Stats.findOneAndUpdate(
      { _id: "global" },
      { $inc: { totalCommands: 1 } },
      { upsert: true, new: true },
    );

    if (!stats) return;

    // Update specific command usage counter
    const cmdIndex = stats.commandUsage.findIndex(
      (c) => c.command === commandName,
    );
    if (cmdIndex >= 0) {
      stats.commandUsage[cmdIndex].count++;
    } else {
      stats.commandUsage.push({ command: commandName, count: 1 });
    }

    // Update daily command activity
    const dailyIndex = stats.dailyCommands.findIndex((d) => d.date === today);
    if (dailyIndex >= 0) {
      stats.dailyCommands[dailyIndex].count++;
    } else {
      stats.dailyCommands.push({ date: today, count: 1 });
    }

    // Maintain a rolling window of 7 days
    if (stats.dailyCommands.length > 7) {
      stats.dailyCommands = stats.dailyCommands.slice(-7);
    }

    await stats.save();
  } catch (err) {
    // Fail silently on stats recording to avoid affecting user experience
  }
}
