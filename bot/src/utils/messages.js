/**
 * Sends a temporary message that auto-deletes after a delay.
 * @param {import("discord.js").Interaction|import("discord.js").TextChannel} target - The interaction or channel to send to.
 * @param {string|import("discord.js").MessagePayload|import("discord.js").InteractionReplyOptions} content - The message content.
 * @param {number} [duration=10000] - Duration in milliseconds (default: 10 seconds).
 */
async function sendTemporary(target, content, duration = 10000) {
  let message;

  // Normalize content to ensure it's an object if passed as string
  const payload = typeof content === "string" ? { content } : content;

  try {
    if (target.isRepliable && target.isRepliable()) {
      // It's an interaction
      if (target.replied || target.deferred) {
        message = await target.editReply(payload);
      } else {
        message = await target.reply({ ...payload, fetchReply: true });
      }
    } else {
      // It's a channel
      message = await target.send(payload);
    }

    if (message) {
      setTimeout(async () => {
        try {
          // Check if message is deletable
          await message.delete().catch(() => {});
        } catch (err) {
          // Ignore delete errors (e.g. message already deleted)
        }
      }, duration);
    }
  } catch (error) {
    console.error("Failed to send temporary message:", error);
  }
}

module.exports = { sendTemporary };
