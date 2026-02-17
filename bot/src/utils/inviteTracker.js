const { Collection } = require("discord.js");
const User = require("../database/models/User");
const Guild = require("../database/models/Guild");
const InviteJoin = require("../database/models/InviteJoin");
const InviteCode = require("../database/models/InviteCode");
const lang = require("./language");

const invitesCache = new Collection(); // Map<GuildID, Collection<code, invite>>
const vanityCache = new Collection(); // Map<GuildID, { code: string, uses: number }>

/**
 * Sync all invites for a guild into cache
 */
async function fetchInvites(guild) {
  try {
    if (!guild.available) return new Collection();
    const me =
      guild.members.me || (await guild.members.fetchMe().catch(() => null));
    if (!me || !me.permissions || !me.permissions.has("ManageGuild"))
      return new Collection();

    // Retry logic for fetching invites (Discord API can be flaky)
    let invites;
    let retries = 3;
    while (retries > 0) {
      try {
        invites = await guild.invites.fetch({ cache: true });
        break;
      } catch (err) {
        retries--;
        if (retries === 0) throw err;
        await new Promise((res) => setTimeout(res, 2000)); // Wait 2s before retry
      }
    }

    invitesCache.set(guild.id, invites);

    if (guild.features.includes("VANITY_URL")) {
      try {
        const vanity = await guild.fetchVanityData().catch(() => null);
        if (vanity) {
          vanityCache.set(guild.id, { code: vanity.code, uses: vanity.uses });
        }
      } catch (err) {}
    }

    const updates = [];
    for (const [code, invite] of invites) {
      updates.push(
        InviteCode.findOneAndUpdate(
          { guildId: guild.id, code },
          {
            userId: invite.inviter?.id || "VANITY",
            uses: invite.uses,
            createdAt: invite.createdAt,
          },
          { upsert: true },
        ).catch(() => null),
      );
    }
    await Promise.all(updates);

    return invites;
  } catch (err) {
    console.error(`Error fetching invites for guild ${guild.id}:`, err);
    return new Collection();
  }
}

/**
 * Determine which invite was used by a member
 */
async function getInviter(member) {
  const guild = member.guild;

  // Always fetch new invites to avoid cache misses (with retries)
  let newInvites;
  let retries = 3;
  while (retries > 0) {
    try {
      newInvites = await guild.invites.fetch({ cache: true });
      break;
    } catch (err) {
      retries--;
      if (retries === 0) return null; // Graceful failure if Discord is down
      await new Promise((res) => setTimeout(res, 2000));
    }
  }

  let inviteUsed = null;

  const cachedInvites = invitesCache.get(guild.id) || new Collection();

  // 1. Check Regular invites (compare uses)
  for (const [code, invite] of newInvites) {
    const cached = cachedInvites.get(code);
    if (cached && invite.uses > cached.uses) {
      inviteUsed = invite;
      break;
    }
  }

  // 2. Check Deleted/Expired invites
  if (!inviteUsed) {
    for (const [code, cached] of cachedInvites) {
      if (!newInvites.has(code)) {
        if (cached.maxUses > 0 && cached.uses + 1 === cached.maxUses) {
          cached.uses++;
          inviteUsed = cached;
          break;
        }
      }
    }
  }

  // 3. Check Vanity URL
  if (!inviteUsed && guild.features.includes("VANITY_URL")) {
    try {
      const currentVanity = await guild.fetchVanityData();
      const cachedVanity = vanityCache.get(guild.id);

      if (!cachedVanity || currentVanity.uses > cachedVanity.uses) {
        inviteUsed = {
          code: currentVanity.code,
          inviter: null,
          uses: currentVanity.uses,
          isVanity: true,
        };
      }

      vanityCache.set(guild.id, {
        code: currentVanity.code,
        uses: currentVanity.uses,
      });
    } catch (err) {
      console.warn(`[InviteTracker] Vanity check failed: ${err.message}`);
    }
  }

  // 4. Fallback: If still null, try to guess by most used invite
  if (!inviteUsed) {
    let maxUses = -1;
    for (const [code, invite] of newInvites) {
      if (invite.uses > maxUses) {
        maxUses = invite.uses;
        inviteUsed = invite;
      }
    }
  }

  // Update cache
  invitesCache.set(guild.id, newInvites);

  return inviteUsed;
}

/**
 * Handle member joining
 */
async function trackJoin(member, invite) {
  const guild = member.guild;
  let guildData = await Guild.findById(guild.id);
  if (!guildData) guildData = new Guild({ _id: guild.id });
  if (!guildData.invites) guildData.invites = { enabled: true };
  if (!guildData.invites.enabled) {
    guildData.invites.enabled = true;
    await guildData.save();
  }

  const inviter = invite?.inviter;
  const isVanity = invite?.isVanity || false;
  const code = invite?.code || "Unknown";

  if (inviter && guildData.invites.blacklist?.includes(inviter.id)) return;

  // --- Check if member joined before ---
  const previousJoin = await InviteJoin.findOne({
    guildId: guild.id,
    userId: member.id,
  });

  let isFake = false;
  if (guildData.invites.fakeThreshold?.enabled) {
    const daysOld =
      (Date.now() - member.user.createdTimestamp) / (1000 * 60 * 60 * 24);
    if (daysOld < guildData.invites.fakeThreshold.days) isFake = true;
  }

  // --- regular invite ---
  const alreadyCounted = previousJoin?.inviterId && !previousJoin.isFake;
  if (alreadyCounted) {
    isFake = true;
  }

  let inviterId = inviter ? inviter.id : isVanity ? "VANITY" : "Unknown";

  if (inviter) {
    let inviterData = await User.findOne({
      guildId: guild.id,
      userId: inviter.id,
    });
    if (!inviterData)
      inviterData = new User({ guildId: guild.id, userId: inviter.id });
    if (!inviterData.invites)
      inviterData.invites = { regular: 0, fake: 0, bonus: 0, leaves: 0 };

    if (isFake) inviterData.invites.fake++;
    else inviterData.invites.regular++;

    await inviterData.save();

    if (!isFake) {
      const total =
        (inviterData.invites.regular || 0) +
        (inviterData.invites.bonus || 0) -
        (inviterData.invites.leaves || 0);
      await checkRewards(member.guild, inviter.id, total);
    }
  }

  await InviteJoin.create({
    guildId: guild.id,
    inviterId,
    userId: member.id,
    code,
    isFake,
  });

  let memberData = await User.findOne({ guildId: guild.id, userId: member.id });
  if (!memberData)
    memberData = new User({ guildId: guild.id, userId: member.id });
  memberData.invitedBy = inviterId;
  memberData.inviteCode = code;
  await memberData.save();
}

/**
 * Handle member leaving
 */
async function trackLeave(member) {
  const guild = member.guild;
  const joinData = await InviteJoin.findOne({
    guildId: guild.id,
    userId: member.id,
    isLeave: false,
  }).sort({ joinedAt: -1 });

  if (!joinData) return;

  joinData.isLeave = true;
  joinData.leftAt = new Date();
  await joinData.save();

  if (
    joinData.inviterId &&
    joinData.inviterId !== "VANITY" &&
    joinData.inviterId !== "Unknown"
  ) {
    const inviterData = await User.findOne({
      guildId: guild.id,
      userId: joinData.inviterId,
    });
    if (inviterData && !joinData.isFake) {
      inviterData.invites.leaves++;
      await inviterData.save();
      await checkRewards(
        guild,
        joinData.inviterId,
        inviterData.invites.regular +
          inviterData.invites.bonus -
          inviterData.invites.leaves,
      );
    }
  }
}

/**
 * Check and assign/remove role rewards
 */
async function checkRewards(guild, userId, totalInvites) {
  const language = await lang.getLanguage(guild.id);
  const guildData = await Guild.findById(guild.id);
  if (
    !guildData ||
    !guildData.invites?.enabled ||
    !guildData.invites.rewards?.length
  )
    return;

  const member = await guild.members.fetch(userId).catch(() => null);
  if (!member) return;

  const rewards = guildData.invites.rewards.sort(
    (a, b) => b.inviteCount - a.inviteCount,
  );
  const applicableRewards = rewards.filter(
    (r) => totalInvites >= r.inviteCount,
  );

  const topReward = applicableRewards[0];

  for (const reward of rewards) {
    const hasRole = member.roles.cache.has(reward.role);
    const role = guild.roles.cache.get(reward.role);
    if (!role) continue;

    if (totalInvites >= reward.inviteCount) {
      if (
        reward.removeWithHigher &&
        topReward &&
        topReward.role !== reward.role
      ) {
        if (hasRole) await member.roles.remove(role).catch(() => null);
      } else {
        if (!hasRole) {
          await member.roles.add(role).catch(() => null);
          if (reward.dmMember) {
            member
              .send(
                lang.get(language, "INVITE_REWARD_DM", {
                  role: role.name,
                  guild: guild.name,
                  count: reward.inviteCount,
                }),
              )
              .catch(() => null);
          }
        }
      }
    } else {
      if (hasRole) {
        await member.roles.remove(role).catch(() => null);
      }
    }
  }
}

module.exports = {
  fetchInvites,
  getInviter,
  trackJoin,
  trackLeave,
  checkRewards,
  invitesCache,
};
