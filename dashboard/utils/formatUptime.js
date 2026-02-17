/**
 * Format uptime in milliseconds to a human-readable string
 * Automatically switches between seconds, minutes, hours, and days
 * @param {number} ms - Uptime in milliseconds
 * @returns {string} Formatted uptime string
 */
export function formatUptime(ms) {
  if (!ms || ms < 0) return "Offline";

  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  // Less than 1 minute - show seconds
  if (seconds < 60) {
    return `${seconds}s`;
  }

  // Less than 1 hour - show minutes and seconds
  if (minutes < 60) {
    const secs = seconds % 60;
    return secs > 0 ? `${minutes}m ${secs}s` : `${minutes}m`;
  }

  // Less than 1 day - show hours and minutes
  if (hours < 24) {
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  }

  // 1 day or more - show days and hours
  const hrs = hours % 24;
  return hrs > 0 ? `${days}d ${hrs}h` : `${days}d`;
}

/**
 * Format uptime with full labels (e.g., "2 days, 3 hours")
 * @param {number} ms - Uptime in milliseconds
 * @returns {string} Formatted uptime string with labels
 */
export function formatUptimeLong(ms) {
  if (!ms || ms < 0) return "0 seconds";

  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  const parts = [];

  if (days > 0) {
    parts.push(`${days} ${days === 1 ? "day" : "days"}`);
  }

  const remainingHours = hours % 24;
  if (remainingHours > 0) {
    parts.push(`${remainingHours} ${remainingHours === 1 ? "hour" : "hours"}`);
  }

  const remainingMinutes = minutes % 60;
  if (remainingMinutes > 0 && days === 0) {
    parts.push(
      `${remainingMinutes} ${remainingMinutes === 1 ? "minute" : "minutes"}`
    );
  }

  const remainingSeconds = seconds % 60;
  if (remainingSeconds > 0 && hours === 0) {
    parts.push(
      `${remainingSeconds} ${remainingSeconds === 1 ? "second" : "seconds"}`
    );
  }

  return parts.length > 0 ? parts.join(", ") : "0 seconds";
}
