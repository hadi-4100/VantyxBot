const Warn = require("../database/models/Warn");
const Guild = require("../database/models/Guild");
const lang = require("./language");
const logger = require("./logger");

async function addWarn(guildId, userId, moderatorId, reason) {
  const warn = new Warn({ guildId, userId, moderatorId, reason });
  await warn.save();

  const count = await Warn.countDocuments({ guildId, userId });
  return { warn, count };
}

async function checkAutoPunish(guild, member, count) {
  const guildData = await Guild.findById(guild.id);
  if (!guildData || !guildData.warnings || !guildData.warnings.actions)
    return null;

  const action = guildData.warnings.actions.find((a) => a.threshold === count);
  if (!action) return null;

  const language = await lang.getLanguage(guild.id);
  const reason = lang.get(language, "AUTOPUNISH_REASON", { count });

  try {
    if (action.action === "kick") {
      await member.kick(reason);
      return "kicked";
    } else if (action.action === "ban") {
      await member.ban({ reason });
      return "banned";
    } else if (action.action === "timeout") {
      await member.timeout(action.duration * 60 * 1000, reason);
      return "muted";
    }
  } catch (err) {
    logger.error(`Failed to auto-punish ${member.user.tag}: ${err.message}`);
    return "failed";
  }
}

module.exports = { addWarn, checkAutoPunish };
