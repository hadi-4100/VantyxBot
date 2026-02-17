/**
 * Leveling System Utilities
 * Provides logic for XP calculations, level progression, and anti-spam measures.
 */

// Configuration Constants
const XP_PER_MESSAGE_MIN = 15;
const XP_PER_MESSAGE_MAX = 25;
const XP_COOLDOWN = 60000; // 60 seconds between XP gains
const LEVEL_UP_COOLDOWN = 420000; // 7 minutes minimum between level ups

// Anti-Spam Constants
const MIN_MESSAGE_LENGTH = 5; // Minimum characters to earn XP
const MAX_SAME_MESSAGE_COUNT = 3; // Max times same message can earn XP within window
const SAME_MESSAGE_WINDOW = 300000; // 5 minute tracking window

// In-memory tracker for message history (userId -> Array<{content, timestamp}>)
const messageHistory = new Map();

/**
 * Calculates XP required for a specific level.
 * Formula: 5 * (level^2) + (50 * level) + 100
 */
function getXpForLevel(level) {
  return 5 * Math.pow(level, 2) + 50 * level + 100;
}

/**
 * Calculates total cumulative XP needed to reach a specific level.
 */
function getTotalXpForLevel(level) {
  let total = 0;
  for (let i = 0; i < level; i++) {
    total += getXpForLevel(i);
  }
  return total;
}

/**
 * Determines a user's level based on their total XP.
 */
function getLevelFromXp(xp) {
  let level = 0;
  let totalXp = 0;

  while (totalXp <= xp) {
    totalXp += getXpForLevel(level);
    if (totalXp <= xp) level++;
  }

  return level;
}

/**
 * Calculates progress towards the next level.
 */
function getXpProgress(xp, level) {
  const xpForCurrentLevel = getTotalXpForLevel(level);
  const xpForNextLevel = getTotalXpForLevel(level + 1);
  const currentLevelXp = xp - xpForCurrentLevel;
  const requiredXp = xpForNextLevel - xpForCurrentLevel;

  return {
    current: currentLevelXp,
    required: requiredXp,
    percentage: Math.max(
      0,
      Math.min(100, Math.floor((currentLevelXp / requiredXp) * 100)),
    ),
  };
}

/**
 * Generates a random XP amount for a message within the configured range.
 */
function getRandomXp() {
  return (
    Math.floor(Math.random() * (XP_PER_MESSAGE_MAX - XP_PER_MESSAGE_MIN + 1)) +
    XP_PER_MESSAGE_MIN
  );
}

/**
 * Detects if a message should be ignored for XP due to length or spamming.
 */
function isSpamMessage(userId, messageContent) {
  if (messageContent.length < MIN_MESSAGE_LENGTH) return true;

  if (!messageHistory.has(userId)) {
    messageHistory.set(userId, []);
  }

  const history = messageHistory.get(userId);
  const now = Date.now();

  // Purge expired history entries
  const recentHistory = history.filter(
    (msg) => now - msg.timestamp < SAME_MESSAGE_WINDOW,
  );

  // Check for duplicate messages
  const sameMessageCount = recentHistory.filter(
    (msg) => msg.content.toLowerCase() === messageContent.toLowerCase(),
  ).length;

  recentHistory.push({ content: messageContent, timestamp: now });
  messageHistory.set(userId, recentHistory);

  return sameMessageCount >= MAX_SAME_MESSAGE_COUNT;
}

/**
 * Checks if the user is outside the XP gain cooldown window.
 */
function canGainXp(lastXpGain) {
  if (!lastXpGain) return true;
  const timeSinceLastXp = Date.now() - new Date(lastXpGain).getTime();
  return timeSinceLastXp >= XP_COOLDOWN;
}

/**
 * Checks if the user is allowed to level up again (prevents rapid bursts).
 */
function canLevelUp(lastXpGain) {
  if (!lastXpGain) return true;
  const timeSinceLastXp = Date.now() - new Date(lastXpGain).getTime();
  return timeSinceLastXp >= LEVEL_UP_COOLDOWN;
}

/**
 * Tracks interaction time to ensure authentic engagement.
 */
function calculateInteractionTime(lastMessage) {
  if (!lastMessage) return 0;

  const timeSinceLastMessage = Date.now() - new Date(lastMessage).getTime();

  // Ignore interactions older than 5 minutes
  if (timeSinceLastMessage > 300000) return 0;

  // Capped at 60 seconds per message to normalize gain
  return Math.min(Math.floor(timeSinceLastMessage / 1000), 60);
}

/**
 * Formats XP numbers with local separators (e.g., 1,234).
 */
function formatXp(xp) {
  return xp.toLocaleString();
}

/**
 * Generates a text-based progress bar.
 */
function createProgressBar(percentage, length = 10) {
  const filled = Math.floor(
    (Math.max(0, Math.min(100, percentage)) / 100) * length,
  );
  const empty = length - filled;
  return "▰".repeat(filled) + "▱".repeat(empty);
}

/**
 * Converts a numerical rank into a string with a suffix (e.g., 1st, 2nd).
 */
function getRankSuffix(rank) {
  const j = rank % 10;
  const k = rank % 100;

  if (j === 1 && k !== 11) return rank + "st";
  if (j === 2 && k !== 12) return rank + "nd";
  if (j === 3 && k !== 13) return rank + "rd";
  return rank + "th";
}

module.exports = {
  XP_PER_MESSAGE_MIN,
  XP_PER_MESSAGE_MAX,
  XP_COOLDOWN,
  LEVEL_UP_COOLDOWN,
  getXpForLevel,
  getTotalXpForLevel,
  getLevelFromXp,
  getXpProgress,
  getRandomXp,
  isSpamMessage,
  canGainXp,
  canLevelUp,
  calculateInteractionTime,
  formatXp,
  createProgressBar,
  getRankSuffix,
};
