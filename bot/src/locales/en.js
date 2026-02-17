module.exports = {
  // General
  ERROR: "❌ An error occurred while executing this command.",
  NO_PERMISSION: "🚫 You do not have permission to use this command.",
  SUCCESS: "✅ Operation completed successfully!",

  // Commands
  PING_DESCRIPTION: "Check the bot's latency",
  PING_RESPONSE:
    "🏓 Pong! Latency is **{latency}ms**\n⏱️ API Latency: **{api}ms**",

  HELP_DESCRIPTION: "Shows a list of available commands",
  HELP_TITLE: "📚 Vantyx Commands",
  HELP_DESCRIPTION_TEXT: "Here are all available commands",
  HELP_CATEGORY_MODERATION: "🛡️ Moderation",
  HELP_CATEGORY_LEVELING: "📊 Leveling",
  HELP_CATEGORY_GIVEAWAY: "🎉 Giveaways",
  HELP_CATEGORY_UTILITY: "🔧 Utility",

  LANGUAGE_DESCRIPTION: "Change the bot's language",
  LANGUAGE_CHANGED: "🌐 Language has been changed to **English**!",
  LANGUAGE_SELECT: "🌍 Please select a language:",

  BOTINFO_DESCRIPTION: "Display bot information and statistics",
  BOTINFO_TITLE: "🤖 Bot Information",
  BOTINFO_NAME: "Bot Name",
  BOTINFO_ID: "Bot ID",
  BOTINFO_CREATED: "Created",
  BOTINFO_UPTIME: "Uptime",
  BOTINFO_SERVERS: "Servers",
  BOTINFO_USERS: "Users",
  BOTINFO_MEMORY: "Memory Usage",
  BOTINFO_NODE: "Node.js Version",
  BOTINFO_DISCORDJS: "Discord.js Version",
  BOTINFO_PING: "Ping",

  // Moderation Commands
  BAN_DESCRIPTION: "Ban a member from the server",
  BAN_TITLE: "🔨 Member Banned",
  BAN_SUCCESS: "**{user}** has been banned from the server",
  BAN_USER: "👤 **User**",
  BAN_REASON: "📝 **Reason**",
  BAN_MODERATOR: "👮 **Moderator**",
  BAN_NO_REASON: "No reason provided",
  BAN_CANNOT:
    "❌ I cannot ban this user. They may have higher permissions than me.",
  BAN_SELF: "❌ You cannot ban yourself!",
  BAN_BOT: "❌ I cannot ban myself!",

  KICK_DESCRIPTION: "Kick a member from the server",
  KICK_TITLE: "👢 Member Kicked",
  KICK_SUCCESS: "**{user}** has been kicked from the server",
  KICK_USER: "👤 **User**",
  KICK_REASON: "📝 **Reason**",
  KICK_MODERATOR: "👮 **Moderator**",
  KICK_NO_REASON: "No reason provided",
  KICK_CANNOT:
    "❌ I cannot kick this user. They may have higher permissions than me.",
  KICK_SELF: "❌ You cannot kick yourself!",
  KICK_BOT: "❌ I cannot kick myself!",

  TIMEOUT_DESCRIPTION: "Timeout a member temporarily",
  TIMEOUT_TITLE: "⏱️ Member Timed Out",
  TIMEOUT_SUCCESS: "**{user}** has been timed out",
  TIMEOUT_USER: "👤 **User**",
  TIMEOUT_DURATION: "⏰ **Duration**",
  TIMEOUT_REASON: "📝 **Reason**",
  TIMEOUT_MODERATOR: "👮 **Moderator**",
  TIMEOUT_NO_REASON: "No reason provided",
  TIMEOUT_CANNOT:
    "❌ I cannot timeout this user. They may have higher permissions than me.",
  TIMEOUT_SELF: "❌ You cannot timeout yourself!",
  TIMEOUT_BOT: "❌ I cannot timeout myself!",

  WARN_DESCRIPTION: "Warn a member",
  WARN_TITLE: "⚠️ Warning Issued",
  WARN_SUCCESS: "**{user}** has been warned",
  WARN_USER: "👤 **User**",
  WARN_REASON: "📝 **Reason**",
  WARN_MODERATOR: "👮 **Moderator**",
  WARN_TOTAL: "📊 **Total Warnings**",
  WARN_COUNT: "{count} warning(s)",

  WARNS_DESCRIPTION: "View a member's warnings",
  WARNS_TITLE: "📋 Warnings for {user}",
  WARNS_NONE: "✅ This user has no warnings.",
  WARNS_LIST: "**Warning #{number}**",
  WARNS_BY: "👮 By",
  WARNS_REASON: "📝 Reason",
  WARNS_DATE: "📅 Date",

  REMOVEWARN_DESCRIPTION: "Remove a warning from a member",
  REMOVEWARN_TITLE: "✅ Warning Removed",
  REMOVEWARN_SUCCESS: "Warning **#{id}** has been removed from **{user}**",
  REMOVEWARN_USER: "👤 **User**",
  REMOVEWARN_ID: "🔢 **Warning ID**",
  REMOVEWARN_NOT_FOUND: "❌ Warning not found.",

  CLEAR_DESCRIPTION: "Delete multiple messages",
  CLEAR_TITLE: "🧹 Messages Cleared",
  CLEAR_SUCCESS: "Successfully deleted **{amount}** message(s)",
  CLEAR_AMOUNT: "📊 **Amount**",
  CLEAR_MESSAGES: "{count} messages",

  // Leveling Commands
  RANK_DESCRIPTION: "View your or another member's rank",
  RANK_TITLE: "📊 Rank Card",
  RANK_LEVEL: "🎯 **Level**",
  RANK_XP: "⭐ **XP**",
  RANK_RANK: "🏆 **Rank**",
  RANK_NEXT_LEVEL: "📈 **Next Level**",
  RANK_PROGRESS: "Progress",
  RANK_NO_DATA: "❌ No ranking data available for this user.",

  LEADERBOARD_DESCRIPTION: "View the server leaderboard",
  LEADERBOARD_TITLE: "🏆 Server Leaderboard",
  LEADERBOARD_TOP: "Top 10 Members",
  LEADERBOARD_LEVEL: "Level",
  LEADERBOARD_XP: "XP",
  LEADERBOARD_NO_DATA: "❌ No leaderboard data available.",
  LEADERBOARD_POSITION: "#{position}",

  LEVEL_UP:
    "🎉 Congratulations **{user}**! You have reached **Level {level}**! 🎊",

  // Giveaway Commands
  GIVEAWAY_START_DESCRIPTION: "Start a giveaway",
  GIVEAWAY_START_TITLE: "🎉 Giveaway Started!",
  GIVEAWAY_START_SUCCESS: "Giveaway has been created successfully!",
  GIVEAWAY_PRIZE: "🎁 **Prize**",
  GIVEAWAY_DURATION: "⏰ **Duration**",
  GIVEAWAY_WINNERS: "👥 **Winners**",
  GIVEAWAY_HOSTED_BY: "👤 **Hosted by**",
  GIVEAWAY_REACT: "React with 🎉 to enter!",
  GIVEAWAY_ENDS_AT: "⏰ Ends",
  GIVEAWAY_ENDED: "🎊 **ENDED**",

  GIVEAWAY_END_DESCRIPTION: "End a giveaway early",
  GIVEAWAY_END_TITLE: "🎊 Giveaway Ended!",
  GIVEAWAY_END_SUCCESS: "Giveaway has been ended",
  GIVEAWAY_WINNERS_TITLE: "🏆 **Winners**",
  GIVEAWAY_NO_WINNERS: "No valid participants",

  GIVEAWAY_REROLL_DESCRIPTION: "Reroll a giveaway winner",
  GIVEAWAY_REROLL_TITLE: "🔄 Giveaway Rerolled!",
  GIVEAWAY_NEW_WINNER: "🎉 **New Winner**",

  // Utility
  USERINFO_DESCRIPTION: "Get information about a user",
  USERINFO_TITLE: "👤 User Information",
  USERINFO_MEMBER: "Member Information",
  USERINFO_USER: "User Information",
  USERINFO_USERNAME: "Username",
  USERINFO_ID: "ID",
  USERINFO_CREATED: "Account Created",
  USERINFO_JOINED: "Joined Server",
  USERINFO_ROLES: "Roles",
  USERINFO_BOT: "Bot",
  USERINFO_YES: "Yes",
  USERINFO_NO: "No",

  AVATAR_DESCRIPTION: "Get a user's avatar",
  AVATAR_TITLE: "🖼️ Avatar for {user}",
  AVATAR_LINK: "Link",

  SERVERINFO_DESCRIPTION: "Get information about the server",
  SERVERINFO_TITLE: "🏰 Server Information",
  SERVERINFO_OWNER: "👑 Owner",
  SERVERINFO_CREATED: "📅 Created On",
  SERVERINFO_MEMBERS: "👥 Members",
  SERVERINFO_CHANNELS: "💬 Channels",
  SERVERINFO_ROLES: "🎭 Roles",
  SERVERINFO_BOOSTS: "🚀 Boosts",
  SERVERINFO_ID: "🆔 ID",

  ROLES_DESCRIPTION: "Get a list of server roles",
  ROLES_TITLE: "🎭 Server Roles",
  ROLES_COUNT: "Total Roles: {count}",
  ROLES_LIST: "Roles List",

  // Moderation - Mute/Unmute/Untimeout
  MUTE_DESCRIPTION: "Mute a member",
  MUTE_TEXT_DESCRIPTION: "Mute a member in text channels (Timeout)",
  MUTE_VOICE_DESCRIPTION: "Mute a member in voice channels",
  MUTE_TITLE: "🔇 Member Muted",
  MUTE_SUCCESS_TEXT: "**{user}** has been muted in text channels",
  MUTE_SUCCESS_VOICE: "**{user}** has been muted in voice channels",
  MUTE_ALREADY_VOICE: "❌ This user is already muted in voice channels.",
  MUTE_NOT_IN_VOICE: "❌ This user is not in a voice channel.",
  MUTE_ALREADY: "❌ User is already muted!",
  UNMUTE_NOT_MUTED: "❌ User is not muted (does not have the Muted role)!",

  UNMUTE_DESCRIPTION: "Unmute a member",
  UNMUTE_TEXT_DESCRIPTION: "Unmute a member in text channels",
  UNMUTE_VOICE_DESCRIPTION: "Unmute a member in voice channels",
  UNMUTE_TITLE: "🔊 Member Unmuted",
  UNMUTE_SUCCESS_TEXT: "**{user}** has been unmuted in text channels",
  UNMUTE_SUCCESS_VOICE: "**{user}** has been unmuted in voice channels",
  UNMUTE_NOT_VOICE: "❌ This user is not muted in voice channels.",

  UNTIMEOUT_DESCRIPTION: "Remove timeout from a member",
  UNTIMEOUT_TITLE: "🔊 Timeout Removed",
  UNTIMEOUT_SUCCESS: "Timeout has been removed from **{user}**",
  UNTIMEOUT_NOT_TIMED_OUT: "❌ This user is not timed out.",
  UNMUTE_REASON_DEFAULT: "Manual unmute",

  // Moderation - Role
  ROLE_DESCRIPTION: "Manage user roles",
  ROLE_ADD_DESCRIPTION: "Add a role to a user",
  ROLE_REMOVE_DESCRIPTION: "Remove a role from a user",
  ROLE_TITLE_ADD: "✅ Role Added",
  ROLE_TITLE_REMOVE: "🗑️ Role Removed",
  ROLE_SUCCESS_ADD: "Added **{role}** to **{user}**",
  ROLE_SUCCESS_REMOVE: "Removed **{role}** from **{user}**",
  ROLE_ALREADY_HAS: "❌ User already has this role.",
  ROLE_DOES_NOT_HAVE: "❌ User does not have this role.",
  ROLE_HIGHER: "❌ I cannot manage this role as it is higher than mine.",

  // Moderation - Lock/Unlock
  LOCK_DESCRIPTION: "Lock a channel",
  LOCK_TITLE: "🔒 Channel Locked",
  LOCK_SUCCESS: "Channel has been locked for @everyone",
  LOCK_ALREADY: "❌ This channel is already locked.",

  UNLOCK_DESCRIPTION: "Unlock a channel",
  UNLOCK_TITLE: "🔓 Channel Unlocked",
  UNLOCK_SUCCESS: "Channel has been unlocked for @everyone",
  UNLOCK_ALREADY: "❌ This channel is already unlocked.",

  // Moderation - Slowmode
  SLOWMODE_DESCRIPTION: "Set channel slowmode",
  SLOWMODE_TITLE: "🐢 Slowmode Updated",
  SLOWMODE_SUCCESS: "Slowmode set to **{time}** seconds",
  // Reaction Roles
  RR_DISABLED:
    "❌ The Reaction Roles system is currently disabled in the dashboard.",
  RR_NO_CONFIG: "❌ No reaction role messages configured in the dashboard.",
  RR_CONFIG_INCOMPLETE: "Message {i}: ❌ Configuration incomplete.",
  RR_CHANNEL_ERROR: "Message {i}: ❌ Target channel not found or inaccessible.",
  RR_ALREADY_EXISTS:
    "Message {i}: ⏭️ Already deployed to {channel}. (Use `/reaction-role refresh` to update)",
  RR_DEPLOY_SUCCESS: "Message {i}: ✅ Successfully deployed to {channel}.",
  RR_DEPLOY_ERROR: "Message {i}: ❌ Failed to deploy (Permissions?).",
  RR_RESULTS_TITLE: "### 🚀 Deployment Results\n{results}",
  RR_NOT_DEPLOYED:
    "Message {i}: ⏭️ Not deployed yet. Use `/reaction-role deploy`.",
  RR_REFRESH_SUCCESS: "Message {i}: ✅ Refreshed in {channel}.",
  RR_REFRESH_ERROR:
    "Message {i}: ❌ Failed to refresh (Message deleted or Permissions missing).",
  RR_REFRESH_RESULTS: "### 🔄 Refresh Results\n{results}",
  RR_RESET_CONFIRM:
    "⚠️ **Are you sure?** This will delete all active reaction role messages from your server. Dashboard settings will remain untouched.",
  RR_RESET_CANCEL: "✅ Reset cancelled.",
  RR_RESET_COMPLETE:
    "### 🗑️ Reset Complete\n{results}\n\n*Server messages were removed.*",
  RR_RESET_TIMEOUT: "⏰ Reset timed out.",
  RR_DELETED: "✅ Deleted message in {channel}.",
  RR_DELETE_ERROR: "❌ Could not find/delete message in {channel}.",
  RR_NO_ACTIVE: "No active messages were found to delete.",

  SLOWMODE_OFF: "Slowmode has been disabled",

  // Hierarchy
  HIERARCHY_ERROR:
    "❌ You cannot manage this user because they have a higher or equal role than you.",

  // Tickets
  TICKET_RESET_CONFIRM:
    "⚠️ **Are you sure?**\nThis will delete the ticket panel, all ticket channels, and database records.\nThis action cannot be undone.",
  TICKET_RESET_CANCEL: "Action cancelled.",
  TICKET_RESETTING: "♻️ Resetting system...",
  TICKET_NO_SETTINGS: "No settings found.",
  TICKET_RESET_COMPLETE:
    "✅ **System Reset Complete.**\nYou can now run `/setup` again.",
  TICKET_NOT_YOURS: "❌ Not your command.",
  TICKET_ERROR: "❌ An error occurred.",

  // Errors
  ERROR_GENERIC: "❌ An error occurred.",
  // General - Help
  HELP_HOME_TITLE: "🛡️ Bot Control & Help Center",
  HELP_HOME_DESC:
    "Welcome to the **Interactive Dashboard**. This menu allows you to explore all functions with real-time feedback.\n\n**📊 Real-time Stats**\n┕ 📂 Available Modules: `{modules}`\n┕ ⌨️ Loaded Commands: `{commands}` ({subcommands} subcommands)\n┕ 🛰️ API Latency: `{latency}ms`",
  HELP_USAGE_TITLE: "💡 How to use?",
  HELP_USAGE_VALUE:
    "1. Click **Browse Modules** to see categories.\n2. Use the **Select Menu** to view specific commands.\n3. Click **Home** anytime to return here.",
  HELP_LINKS_TITLE: "🔗 Useful Links",
  HELP_LINKS_VALUE:
    "[Support Server]({support}) • [Dashboard]({dashboard}) • [Invite Bot]({invite})",
  HELP_FOOTER: "Empowering your server with advanced automation",
  HELP_BTN_HOME: "Home Dashboard",
  HELP_BTN_MODULES: "Browse Modules",
  HELP_MENU_PLACEHOLDER: "📂 Select a module to see commands",
  HELP_BROWSE_TITLE: "📁 System Modules Overview",
  HELP_BROWSE_DESC:
    "Browse through the available modules below. Each module contains specialized commands for your server.\n\n**Available Modules:**\n{overview}\n\n💡 *Select a module from the dropdown below to view its specific commands.*",
  HELP_MODULE_TITLE: "{emoji} {category} Protocols",
  HELP_MODULE_DESC:
    "Here are all the specialized commands available in the **{category}** suite.\n\n{commands}",
  HELP_MODULE_FOOTER: "Total: {count} Commands | Use / to run any command",

  // General - SendEmbed
  EMBED_NOT_FOUND:
    "❌ I couldn't find an embed with that code. Please check your dashboard.",
  EMBED_NO_PERM: "❌ I don't have permission to send messages in {channel}.",
  EMBED_SENT: "✅ Successfully sent embed `{code}` to {channel}!",
  EMBED_ERROR:
    "❌ An error occurred while trying to send the embed. Make sure all URLs are valid.",

  // Moderation - Additional
  ROLE_HIERARCHY_ERROR:
    "❌ You cannot manage this role because it is higher or equal to your highest role.",
  REMOVEWARN_ALL_SUCCESS:
    "Successfully removed **{count}** warning(s) from {user}",
  REMOVEWARN_LATEST_SUCCESS:
    "Successfully removed the latest warning from {user}",
  REMOVEWARN_NO_WARNINGS: "❌ {user} has no warnings to remove.",
  AUTOPUNISH_MSG: "User reached {count} warnings and was **{action}**.",
  AUTOPUNISH_TITLE: "Auto-Punishment Triggered",
  AUTOPUNISH_REASON: "Auto-punishment: Reached {count} warnings",
  AUTOPUNISH_MUTE_ROLE_REASON: "Auto-created Muted role for warning system",
  AUTOPUNISH_ACTION_KICKED: "Kicked",
  AUTOPUNISH_ACTION_BANNED: "Banned",
  AUTOPUNISH_ACTION_TIMED_OUT: "Timed out for {duration}m",
  AUTOPUNISH_ACTION_MUTED: "Muted (Role)",
  AUTOPUNISH_ACTION_MUTED_DURATION: " for {duration}m",

  // Invites
  INVITE_TITLE: "{user}'s Invites",
  INVITE_TOTAL: "✨ Total",
  INVITE_REGULAR: "✅ Regular",
  INVITE_FAKE: "❌ Fake",
  INVITE_LEAVES: "📤 Leaves",
  INVITE_BONUS: "🎁 Bonus",
  STATS_TITLE: "📊 Join Stats for {guild} ({days} days)",
  STATS_GROWTH: "📈 Server Growth",
  STATS_GROWTH_VALUE:
    "👥 **{totalJoins}** members joined\n🌱 That's **{growth}%** of the server\n📅 From **{start}** to **{end}**",
  STATS_NO_DATA: "❌ No statistics available for this server yet.",
  BONUS_ADDED_TITLE: "Bonus Added",
  BONUS_ADDED_DESC:
    "Added **{amount}** bonus invites to {user}. New bonus: **{total}**",
  USER_NO_DATA: "❌ User has no data.",
  BONUS_REMOVED_TITLE: "Bonus Removed",
  BONUS_REMOVED_DESC:
    "Removed **{amount}** bonus invites from {user}. New bonus: **{total}**",
  INVITES_REMOVED_TITLE: "Invites Removed",
  INVITES_REMOVED_DESC:
    "Successfully removed and archived all invites for {user}. You can restore them using `/restoreinvites`.",
  RESTORE_NO_DATA: "User has no removed invites to restore.",
  RESTORE_TITLE: "Invites Restored",
  RESTORE_DESC: "Successfully restored archived invites for {user}.",
  SYNC_TITLE: "Sync Invites Confirmation",
  SYNC_DESC:
    "This will replace all existing invite data (Regular, Fake) with current server invite counts. Leaves data will be preserved.\n\n**Are you sure you want to proceed?**",
  SYNC_BTN_CONFIRM: "Confirm Sync",
  SYNC_BTN_CANCEL: "Cancel",
  SYNC_PROGRESS: "Syncing invites... Please wait.",
  SYNC_SUCCESS: "Successfully synced **{count}** invite codes.",
  SYNC_CANCELLED: "Sync cancelled.",
  SYNC_TIMEOUT: "Confirmation timed out.",
  SYNC_TIMEOUT: "Confirmation timed out.",

  // Giveaways
  GIVEAWAY_INVALID_DURATION: "❌ Invalid duration format. Use 1m, 1h, 1d.",
  GIVEAWAY_CREATED: "✅ **{type}** created in {channel}!",
  GIVEAWAY_ENDED_SUCCESS: "✅ Giveaway ended.",
  GIVEAWAY_ENDED_FAIL:
    "❌ Failed to end giveaway. Check ID or if it's already ended.",
  GIVEAWAY_REROLL_SUCCESS_CMD: "✅ Giveaway rerolled.",
  GIVEAWAY_REROLL_FAIL: "❌ Failed: {error}",
  GIVEAWAY_DELETED_SUCCESS:
    "✅ Giveaway deleted from database and message removed.",
  GIVEAWAY_NOT_FOUND: "❌ Giveaway not found in database.",
  GIVEAWAY_ACTIVE_NOT_FOUND: "❌ Active giveaway not found.",
  GIVEAWAY_UPDATED: "✅ Giveaway updated!\n{updates}",
  GIVEAWAY_UPDATE_PRIZE: "Prize updated to **{prize}**",
  GIVEAWAY_UPDATE_WINNERS: "Winners updated to **{winners}**",
  GIVEAWAY_UPDATE_TIME: "New end time set to **{time}** from now",
  GIVEAWAY_REQ_ROLE: "You need the **{role}** to join!",
  GIVEAWAY_REQ_LEVEL:
    "You need to be **Level {level}** to join! Your level: {current}",
  GIVEAWAY_REQ_INVITES:
    "You need **{count}** invites to join! You have: {current}",
  GIVEAWAY_DROP_TITLE: "🚨 DROP GIVEAWAY 🚨",
  GIVEAWAY_NORMAL_TITLE: "🎉 GIVEAWAY 🎉",
  GIVEAWAY_DESC:
    "Prize: **{prize}**\nHosted by: <@{host}>\nWinners: **{winners}**\n{bonus}",
  GIVEAWAY_DROP_BONUS: "**First to click wins!**",
  GIVEAWAY_NORMAL_BONUS: "Ends: <t:{time}:R> (<t:{time}:f>)",
  GIVEAWAY_FOOTER_ENDS: "Ends at",
  GIVEAWAY_REQ_TEXT: "\n**Requirements:**\n",
  GIVEAWAY_REQ_ROLE_ROW: "• Role: <@&{role}>\n",
  GIVEAWAY_REQ_LEVEL_ROW: "• Level: {level}\n",
  GIVEAWAY_REQ_INVITES_ROW: "• Invites: {invites}\n",
  GIVEAWAY_BTN_CLAIM: "Claim Prize!",
  GIVEAWAY_BTN_PARTICIPANTS: "Participantes ({count})",
  GIVEAWAY_ENDED_TITLE_UTIL: "🎉 GIVEAWAY ENDED 🎉",
  GIVEAWAY_ENDED_DESC_UTIL:
    "Prize: **{prize}**\nWinners: {winners}\nHosted by: <@{host}>",
  GIVEAWAY_ENDED_FOOTER: "Ended at",
  GIVEAWAY_NO_PARTICIPANTS: "No one joined :(",
  GIVEAWAY_CONGRATS: "Congratulations {winners}! You won **{prize}**!",
  GIVEAWAY_NO_WINNER_MSG: "Giveaway ended, but no one joined.",
  GIVEAWAY_DM_WINNER:
    "🎉 Congratulations! You won **{prize}** in **{guild}**! Check {url}",
  GIVEAWAY_DM_HOST:
    "Your giveaway for **{prize}** has ended. Winners: {winners}",
  GIVEAWAY_NEW_WINNER_MSG:
    "🎉 New winner is <@${newWinnerId}>! Congratulations!",
  GIVEAWAY_ERR_ENDED: "This giveaway has ended or does not exist.",
  GIVEAWAY_ERR_NO_PARTICIPANTS: "No users have joined this giveaway yet.",
  GIVEAWAY_PARTICIPANTS_LIST: "**Participants ({count}):**\n{participants}",
  GIVEAWAY_LEFT: "💔 You have left the giveaway.",
  GIVEAWAY_CLAIMED: "🎉 You claimed the drop!",
  GIVEAWAY_ENTERED: "✅ You entered the giveaway!",
  GIVEAWAY_ROLE_REQ_NOT_MET: "⛔ {reason}",

  // Leveling
  LEVELING_DISABLED: "❌ The leveling system is disabled in this server.",
  XP_NONE_SELF:
    "❌ You haven't earned any XP yet! Start chatting to gain levels.",
  XP_NONE_OTHER: "❌ **{user}** hasn't earned any XP yet.",
  RANK_TITLE: "{user}'s Rank",
  RANK_LABEL: "📊 Rank",
  LEVEL_LABEL: "⭐ Level",
  TOTAL_XP_LABEL: "💎 Total XP",
  PROGRESS_LABEL: "📈 Progress to Next Level",
  RANK_FOOTER: "{guild} • Keep chatting to level up!",
  LB_XP_DISABLED: "❌ The leveling system is disabled.",
  LB_XP_NONE: "❌ No one has earned XP yet!",
  LB_INVITE_NONE: "❌ No invite data found for this period.",
  LB_TITLE: "📊 {guild} - {title}",
  LB_PAGE: "Page {current} of {total}",
  LB_NO_DATA: "No data",
  LB_XP_LINE: "Level: `{level}` | XP: `{xp}`",
  LB_INVITE_LINE_ALL:
    "Invites: `{score}` ({regular} ref, {bonus} bonus, {leaves} leaves)",
  LB_INVITE_LINE_PERIOD: "Joins: `{score}`",
  XP_LB_NAME: "XP Leaderboard",
  INVITE_LB_NAME: "Invite Leaderboard",
  NOT_FOR_YOU: "Not for you",

  // Tickets
  TICKET_DISABLED: "❌ **Ticket System is disabled or not set up.**",
  TICKET_NO_CHANNEL: "❌ **No Panel Channel configured in Dashboard.**",
  TICKET_INVALID_CHANNEL:
    "❌ **Configured Panel Channel not found or invalid.**",
  TICKET_NO_TYPES:
    "❌ **No enabled ticket types found.** Please enable at least one in the dashboard.",
  TICKET_PANEL_UPDATED:
    "✅ **Panel Updated!**\nThe ticket panel in {channel} has been refreshed.",
  TICKET_PANEL_RECREATED:
    "✅ **Panel Recreated!**\nThe original message was missing, so a new panel was created in {channel}.",
  TICKET_SETUP_INCOMPLETE:
    "❌ **Setup Incomplete**\nMissing configuration:\n{missing}\n\nConfigure these in the dashboard before running /setup.",
  TICKET_ALREADY_INSTALLED:
    "❌ **System already installed.**\n use `/ticket-refresh` to update the panel, or `/ticket-reset` to reinstall.",
  TICKET_INVALID_CATEGORY:
    "❌ **Invalid Ticket Category.**\nThe configured category does not exist.",
  TICKET_SETUP_COMPLETE:
    "✅ **Setup Complete!**\nTicket panel sent to {channel}.",
  TICKET_DEFAULT_TITLE: "Support Tickets",
  TICKET_DEFAULT_DESC: "Click a button below to open a ticket.",
  TICKET_FOOTER_PL: "Powered by VantyxBot",

  // System & Automod
  COMMAND_DISABLED:
    "❌ This command is currently disabled by the server administrators.",
  COMMAND_ERROR: "❌ There was an error while executing this command!",
  AUTOMOD_SPAM: "Auto-Mod: Spam detected",
  AUTOMOD_BADWORD: "Auto-Mod: Bad word detected",
  AUTOMOD_INVITE: "Auto-Mod: Discord invite detected",
  AUTOMOD_LINK: "Auto-Mod: External link detected",
  INVITE_REWARD_DM:
    "Congratulations! You've received the **{role}** role in **{guild}** for reaching {count} invites!",

  // XP & Leveling Events
  LEVEL_UP_DEFAULT_MESSAGE:
    "🥳 **Congratulations**, [user]!\nYou climbed from level **[oldLevel]** to **[level]**. Keep it up!",
  LEVEL_UP_DM_TITLE: "🎉 **Congratulations, {user}!**",
  LEVEL_UP_DM_BODY:
    "You just leveled up in **{guild}**!\n\n**⬆️ Level Up**\nPrevious Level: **{oldLevel}**\nNew Level: **{newLevel}**\n\n**🏅 Rewards Earned**\nRole Granted: **{role}**\n\nKeep engaging and climb even higher! 🚀",

  // Guard & Logging Events
  MEMBER_JOINED_TITLE: "Member Joined",
  MEMBER_JOINED_DESC: "{user} ({tag}) has joined the server.",
  ACCOUNT_CREATED_LABEL: "Account Created",
  MEMBER_COUNT_LABEL: "Member Count",
  WELCOME_DEFAULT_MESSAGE: "Welcome [user] to [server]!",
  MEMBER_KICKED_TITLE: "Member Kicked",
  MEMBER_KICKED_DESC: "{user} ({tag}) was kicked.",
  MEMBER_LEFT_TITLE: "Member Left",
  MEMBER_LEFT_DESC: "{user} ({tag}) has left the server.",
  EXECUTOR_LABEL: "Executor",
  REASON_LABEL: "Reason",
  NO_REASON_PROVIDED: "No reason provided",
  JOINED_AT_LABEL: "Joined At",
  GOODBYE_DEFAULT_MESSAGE: "Goodbye [user]!",
  MEMBER_BANNED_TITLE: "Member Banned",
  MEMBER_BANNED_DESC: "{user} ({tag}) was banned.",
  MEMBER_UNBANNED_TITLE: "Member Unbanned",
  MEMBER_UNBANNED_DESC: "{user} ({tag}) was unbanned.",
  UNKNOWN_USER: "Unknown",

  // Ticket Handler
  TICKET_SYSTEM_DISABLED: "❌ Ticket system is currently disabled.",
  TICKET_TYPE_UNAVAILABLE: "❌ This ticket type is no longer available.",
  TICKET_LIMIT_REACHED:
    "❌ You have reached the maximum number of open tickets ({max}).",
  TICKET_INVALID_CATEGORY:
    "❌ Ticket category configuration is invalid. Please contact an admin.",
  TICKET_WELCOME_TITLE: "{name} Ticket",
  TICKET_WELCOME_DEFAULT_MSG:
    "Welcome {user}!\nA staff member will be with you shortly.",
  TICKET_CLOSE_BTN: "Close Ticket",
  TICKET_CLAIM_BTN: "Claim Ticket",
  TICKET_CREATED_REPLY: "✅ Ticket created: {channel}",
  TICKET_CREATE_FAIL: "❌ Failed to create ticket channel.",
  TICKET_ALREADY_CLOSED: "❌ This ticket is already closed!",
  TICKET_CLOSE_CONFIRM_TITLE: "Confirm Close",
  TICKET_CANCEL_BTN: "Cancel",
  TICKET_CLOSE_CONFIRM_MSG: "Are you sure you want to close this ticket?",
  TICKET_CLOSED_TITLE: "Ticket Closed",
  TICKET_CLOSED_DESC: "Ticket closed by {user}",
  TICKET_TRANSCRIPT_BTN: "Transcript",
  TICKET_REOPEN_BTN: "Reopen",
  TICKET_DELETE_BTN: "Delete",
  TICKET_REOPENED_DESC: "Ticket reopened by {user}",
  TICKET_DELETING_MSG: "🗑️ Deleting ticket in 5 seconds...",
  TICKET_NOT_FOUND_DB: "Ticket not found in DB.",
  TICKET_ALREADY_CLAIMED: "Ticket already claimed by {user}",
  TICKET_CLAIMED_BY_LABEL: "Claimed by {user}",
  TICKET_CLAIMED_DESC: "👋 Ticket claimed by {user}",
  TICKET_CLAIM_SUCCESS: "You claimed this ticket.",
  TICKET_TRANSCRIPT_MSG: "Here is the transcript:",

  // Reaction Role Handler
  RR_DISABLED: "❌ The Reaction Roles system is currently disabled.",
  RR_NOT_REGISTERED: "❌ This reaction role message is no longer registered.",
  BOT_PERMISSION_MANAGE_ROLES:
    "❌ I don't have the **Manage Roles** permission to assign roles.",
  ROLE_NOT_FOUND_ID:
    "❌ Role not found (ID: {id}). Please make sure the role exists.",
  ROLE_HIERARCHY_RR:
    "❌ I cannot manage the role **{role}** because it is higher than mine in the hierarchy.",
  RR_ROLE_REMOVED: "✅ Removed the role **{role}**.",
  RR_ROLE_ADDED: "✅ Added the role **{role}**.",
  RR_ROLE_SYNC_SUCCESS:
    "✅ You have been given the **{role}** role, but {oldRoles} has been removed from you.",
  RR_MAX_ROLES_ERROR:
    "❌ You can only have up to {max} roles from this message.",
  RR_MAX_SELECT_ERROR: "❌ You can only select up to {max} roles.",
  RR_UPDATED_SUCCESS: "✅ Your roles have been updated.",
  RR_SOME_FAILED:
    "\n⚠️ Some roles could not be managed due to permissions/hierarchy.",
  RR_ERROR: "❌ An error occurred while updating your roles.",

  // Logging Events
  LOG_MEMBER_ROLES_UPDATED: "Member Roles Updated",
  LOG_MEMBER_LABEL: "Member",
  LOG_ADDED_ROLES_LABEL: "Added Roles",
  LOG_REMOVED_ROLES_LABEL: "Removed Roles",
  LOG_NICKNAME_CHANGED_TITLE: "Nickname Changed",
  LOG_NICKNAME_CHANGED_DESC: "{user} ({tag}) changed their nickname.",
  LOG_OLD_NICKNAME_LABEL: "Old Nickname",
  LOG_NEW_NICKNAME_LABEL: "New Nickname",
  LOG_MEMBER_TIMED_OUT_TITLE: "Member Timed Out",
  LOG_MEMBER_TIMED_OUT_DESC: "{user} ({tag}) was timed out.",
  LOG_EXPIRES_LABEL: "Expires",
  LOG_TIMEOUT_REMOVED_TITLE: "Timeout Removed",
  LOG_TIMEOUT_REMOVED_DESC: "Timeout was removed for {user} ({tag}).",
  LOG_VOICE_JOINED: "joined voice channel",
  LOG_VOICE_LEFT: "left voice channel",
  LOG_VOICE_SWITCHED: "switched voice channel",
  LOG_VOICE_JOINED_DESC: "**{user}** joined **{channel}**",
  LOG_VOICE_LEFT_DESC: "**{user}** left **{channel}**",
  LOG_VOICE_SWITCHED_DESC:
    "**{user}** moved from **{oldChannel}** to **{newChannel}**",
  LOG_VOICE_UPDATE_TITLE: "Voice Update: {action}",
  LOG_MESSAGE_EDITED_TITLE: "Message Edited",
  LOG_MESSAGE_EDITED_DESC:
    "**Author:** {tag}\n**Channel:** {channel}\n**Before:** {oldContent}\n**After:** {newContent}",
  LOG_MESSAGE_DELETED_TITLE: "Message Deleted",
  LOG_MESSAGE_DELETED_DESC:
    "**Author:** {tag}\n**Channel:** {channel}\n**Content:** {content}",
  LOG_NO_CONTENT: "No content",
  LOG_NONE_PL: "None",
  LOG_CHANNEL_CREATED_TITLE: "Channel Created",
  LOG_CHANNEL_CREATED_DESC: "Channel {channel} (`{name}`) was created.",
  LOG_TYPE_LABEL: "Type",
  LOG_ID_LABEL: "ID",
  LOG_CHANNEL_DELETED_TITLE: "Channel Deleted",
  LOG_CHANNEL_DELETED_DESC: "Channel `{name}` ({id}) was deleted.",
  LOG_EMOJI_CREATED_TITLE: "Emoji Created",
  LOG_EMOJI_CREATED_DESC: "Emoji {emoji} (`{name}`) was created.",
  LOG_EMOJI_DELETED_TITLE: "Emoji Deleted",
  LOG_EMOJI_DELETED_DESC: "Emoji `{name}` ({id}) was deleted.",
  LOG_ROLE_CREATED_TITLE: "Role Created",
  LOG_ROLE_CREATED_DESC: "Role {role} (`{name}`) was created.",
  LOG_ROLE_DELETED_TITLE: "Role Deleted",
  LOG_ROLE_DELETED_DESC: "Role `{name}` ({id}) was deleted.",

  // Reaction Roles Components
  RR_SELECT_PLACEHOLDER: "Select a role...",
  RR_EMBED_AUTHOR: "{guild} • Reaction Roles",
  RR_EMBED_TITLE: "✨ Self-Assignable Roles",
  RR_EMBED_DESC:
    "Choose the roles you would like to have by clicking the buttons or selecting from the menu below.\n\nYou can add or remove roles at any time by interacting with the components.",
  RR_EMBED_FOOTER: "Managed by VantyxBot • Select your interests!",
};
