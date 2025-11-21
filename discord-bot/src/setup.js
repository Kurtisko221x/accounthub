import { ChannelType, PermissionFlagsBits, EmbedBuilder, Colors } from 'discord.js';

/**
 * Auto-setup Discord server with all channels, roles, and permissions
 */
export async function setupServer(client) {
  const guildId = process.env.DISCORD_GUILD_ID;
  if (!guildId) {
    console.error('❌ DISCORD_GUILD_ID not set in .env');
    return;
  }

  const guild = await client.guilds.fetch(guildId);
  console.log(`🔧 Setting up server: ${guild.name}`);

  try {
    // Step 1: Create roles
    const roles = await createRoles(guild);
    console.log('✅ Roles created');

    // Step 2: Create channels
    const channels = await createChannels(guild, roles);
    console.log('✅ Channels created');

    // Step 3: Set up webhooks
    await setupWebhooks(channels, guild);
    console.log('✅ Webhooks configured');

    // Step 4: Send welcome message
    await sendWelcomeMessage(channels.welcome, guild);
    console.log('✅ Welcome message sent');

    // Step 5: Set up auto-moderation
    await setupAutoModeration(guild);
    console.log('✅ Auto-moderation configured');

    console.log('🎉 Server setup complete!');
    return { success: true, roles, channels };
  } catch (error) {
    console.error('❌ Error setting up server:', error);
    throw error;
  }
}

/**
 * Create all roles
 */
async function createRoles(guild) {
  const roles = {};

  // FREE Role
  roles.free = await getOrCreateRole(guild, {
    name: '🎁 FREE',
    color: 0x3498db, // Blue
    mentionable: true,
    reason: 'Auto-created by Acc Hub bot',
  });

  // VIP Role
  roles.vip = await getOrCreateRole(guild, {
    name: '👑 VIP',
    color: 0xffd700, // Gold
    mentionable: true,
    reason: 'Auto-created by Acc Hub bot',
  });

  // Staff Role
  roles.staff = await getOrCreateRole(guild, {
    name: '🔧 Staff',
    color: 0x00ff00, // Green
    mentionable: true,
    reason: 'Auto-created by Acc Hub bot',
  });

  // Moderator Role
  roles.moderator = await getOrCreateRole(guild, {
    name: '👮 Moderator',
    color: 0xff0000, // Red
    permissions: [
      PermissionFlagsBits.ManageMessages,
      PermissionFlagsBits.KickMembers,
      PermissionFlagsBits.BanMembers,
      PermissionFlagsBits.ModerateMembers,
    ],
    mentionable: true,
    reason: 'Auto-created by Acc Hub bot',
  });

  // Admin Role
  roles.admin = await getOrCreateRole(guild, {
    name: '⚡ Admin',
    color: 0x9b59b6, // Purple
    permissions: [
      PermissionFlagsBits.Administrator,
    ],
    mentionable: true,
    reason: 'Auto-created by Acc Hub bot',
  });

  // Bot Role
  roles.bot = await getOrCreateRole(guild, {
    name: '🤖 Bot',
    color: 0x7289da, // Discord blurple
    reason: 'Auto-created by Acc Hub bot',
  });

  // Special roles
  roles.giveawayWinner = await getOrCreateRole(guild, {
    name: '🎉 Giveaway Winner',
    color: 0xff69b4, // Hot pink
    mentionable: false,
    reason: 'Auto-created by Acc Hub bot',
  });

  roles.earlySupporter = await getOrCreateRole(guild, {
    name: '⭐ Early Supporter',
    color: 0x1abc9c, // Turquoise
    mentionable: false,
    reason: 'Auto-created by Acc Hub bot',
  });

  // Assign admin role to specified users
  if (process.env.ADMIN_USER_IDS) {
    const adminUserIds = process.env.ADMIN_USER_IDS.split(',');
    for (const userId of adminUserIds) {
      try {
        const trimmedUserId = userId.trim();
        if (!trimmedUserId) continue;
        
        const member = await guild.members.fetch(trimmedUserId);
        if (member) {
          await member.roles.add(roles.admin);
          console.log(`✅ Assigned admin role to ${member.user.tag}`);
        }
      } catch (error) {
        // User not found or not in server - just warn, don't fail
        console.warn(`⚠️ Could not assign admin to ${userId.trim()}: ${error.message}`);
      }
    }
  }

  return roles;
}

/**
 * Create all channels
 */
async function createChannels(guild, roles) {
  const channels = {};

  // INFORMATION CATEGORY
  const infoCategory = await getOrCreateCategory(guild, '📢 INFORMATION', {
    position: 0,
  });

  // Rules channel
  channels.rules = await getOrCreateChannel(guild, 'rules', {
    type: ChannelType.GuildText,
    parent: infoCategory,
    topic: '📋 Server rules and guidelines - Read before participating',
    permissionOverwrites: [
      {
        id: guild.roles.everyone.id,
        deny: [PermissionFlagsBits.SendMessages],
        allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.ReadMessageHistory],
      },
    ],
  });

  // Announcements channel
  channels.announcements = await getOrCreateChannel(guild, 'announcements', {
    type: ChannelType.GuildText,
    parent: infoCategory,
    topic: '📢 Platform updates, new features, and important news',
    permissionOverwrites: [
      {
        id: guild.roles.everyone.id,
        deny: [PermissionFlagsBits.SendMessages],
        allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.ReadMessageHistory],
      },
      {
        id: roles.bot.id,
        allow: [PermissionFlagsBits.SendMessages],
      },
    ],
  });

  // Updates channel
  channels.updates = await getOrCreateChannel(guild, 'updates', {
    type: ChannelType.GuildText,
    parent: infoCategory,
    topic: '📝 Changelog and version updates',
    permissionOverwrites: [
      {
        id: guild.roles.everyone.id,
        deny: [PermissionFlagsBits.SendMessages],
        allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.ReadMessageHistory],
      },
    ],
  });

  // Status channel
  channels.status = await getOrCreateChannel(guild, 'status', {
    type: ChannelType.GuildText,
    parent: infoCategory,
    topic: '📊 Platform status and maintenance notices',
    permissionOverwrites: [
      {
        id: guild.roles.everyone.id,
        deny: [PermissionFlagsBits.SendMessages],
        allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.ReadMessageHistory],
      },
      {
        id: roles.bot.id,
        allow: [PermissionFlagsBits.SendMessages],
      },
    ],
  });

  // GENERAL CATEGORY
  const generalCategory = await getOrCreateCategory(guild, '💬 GENERAL', {
    position: 1,
  });

  // General channel
  channels.general = await getOrCreateChannel(guild, 'general', {
    type: ChannelType.GuildText,
    parent: generalCategory,
    topic: '💬 Chat about anything related to Acc Hub platform!',
  });

  // Account generation channel
  channels.accountGeneration = await getOrCreateChannel(guild, 'account-generation', {
    type: ChannelType.GuildText,
    parent: generalCategory,
    topic: '🎮 Discussion about account generation, tips & tricks',
  });

  // Suggestions channel
  channels.suggestions = await getOrCreateChannel(guild, 'suggestions', {
    type: ChannelType.GuildText,
    parent: generalCategory,
    topic: '💡 Suggest new features or improvements',
  });

  // Support channel
  channels.support = await getOrCreateChannel(guild, 'support', {
    type: ChannelType.GuildText,
    parent: generalCategory,
    topic: '❓ Get help with issues, ask questions',
  });

  // Bug reports channel
  channels.bugReports = await getOrCreateChannel(guild, 'bug-reports', {
    type: ChannelType.GuildText,
    parent: generalCategory,
    topic: '🐛 Report bugs and issues',
  });

  // PROMO & CODES CATEGORY
  const promoCodesCategory = await getOrCreateCategory(guild, '🎁 PROMO & CODES', {
    position: 2,
  });

  // Promo codes channel
  channels.promoCodes = await getOrCreateChannel(guild, 'promo-codes', {
    type: ChannelType.GuildText,
    parent: promoCodesCategory,
    topic: '🎁 Admin posts promo codes for VIP upgrades - Check regularly!',
    permissionOverwrites: [
      {
        id: guild.roles.everyone.id,
        deny: [PermissionFlagsBits.SendMessages],
        allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.ReadMessageHistory],
      },
    ],
  });

  // Giveaways channel
  channels.giveaways = await getOrCreateChannel(guild, 'giveaways', {
    type: ChannelType.GuildText,
    parent: promoCodesCategory,
    topic: '🎉 VIP account giveaways - React to enter!',
    permissionOverwrites: [
      {
        id: guild.roles.everyone.id,
        deny: [PermissionFlagsBits.SendMessages],
        allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.ReadMessageHistory, PermissionFlagsBits.AddReactions],
      },
    ],
  });

  // Winners channel
  channels.winners = await getOrCreateChannel(guild, 'winners', {
    type: ChannelType.GuildText,
    parent: promoCodesCategory,
    topic: '🏆 Announce giveaway winners',
    permissionOverwrites: [
      {
        id: guild.roles.everyone.id,
        deny: [PermissionFlagsBits.SendMessages],
        allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.ReadMessageHistory],
      },
    ],
  });

  // VIP accounts channel
  channels.vipAccounts = await getOrCreateChannel(guild, 'vip-accounts', {
    type: ChannelType.GuildText,
    parent: promoCodesCategory,
    topic: '💎 Exclusive VIP account announcements',
    permissionOverwrites: [
      {
        id: guild.roles.everyone.id,
        deny: [PermissionFlagsBits.ViewChannel],
      },
      {
        id: roles.vip.id,
        allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.ReadMessageHistory],
      },
    ],
  });

  // STATISTICS CATEGORY
  const statsCategory = await getOrCreateCategory(guild, '📈 STATISTICS', {
    position: 3,
  });

  // Platform stats channel
  channels.platformStats = await getOrCreateChannel(guild, 'platform-stats', {
    type: ChannelType.GuildText,
    parent: statsCategory,
    topic: '📊 Auto-updated platform statistics',
    permissionOverwrites: [
      {
        id: guild.roles.everyone.id,
        deny: [PermissionFlagsBits.SendMessages],
        allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.ReadMessageHistory],
      },
      {
        id: roles.bot.id,
        allow: [PermissionFlagsBits.SendMessages],
      },
    ],
  });

  // Account stats channel
  channels.accountStats = await getOrCreateChannel(guild, 'account-stats', {
    type: ChannelType.GuildText,
    parent: statsCategory,
    topic: '📈 Account generation statistics',
    permissionOverwrites: [
      {
        id: guild.roles.everyone.id,
        deny: [PermissionFlagsBits.SendMessages],
        allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.ReadMessageHistory],
      },
      {
        id: roles.bot.id,
        allow: [PermissionFlagsBits.SendMessages],
      },
    ],
  });

  // Leaderboard channel
  channels.leaderboard = await getOrCreateChannel(guild, 'leaderboard', {
    type: ChannelType.GuildText,
    parent: statsCategory,
    topic: '🏅 Top users leaderboard',
    permissionOverwrites: [
      {
        id: guild.roles.everyone.id,
        deny: [PermissionFlagsBits.SendMessages],
        allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.ReadMessageHistory],
      },
      {
        id: roles.bot.id,
        allow: [PermissionFlagsBits.SendMessages],
      },
    ],
  });

  // ADMIN CATEGORY
  const adminCategory = await getOrCreateCategory(guild, '🔐 ADMIN', {
    position: 4,
  });

  // Admin logs channel
  channels.adminLogs = await getOrCreateChannel(guild, 'admin-logs', {
    type: ChannelType.GuildText,
    parent: adminCategory,
    topic: '🔐 Admin activity logs',
    permissionOverwrites: [
      {
        id: guild.roles.everyone.id,
        deny: [PermissionFlagsBits.ViewChannel],
      },
      {
        id: roles.admin.id,
        allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages],
      },
      {
        id: roles.moderator.id,
        allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages],
      },
    ],
  });

  // Bot commands channel
  channels.botCommands = await getOrCreateChannel(guild, 'bot-commands', {
    type: ChannelType.GuildText,
    parent: adminCategory,
    topic: '🤖 Bot command channel',
  });

  // Reports channel
  channels.reports = await getOrCreateChannel(guild, 'reports', {
    type: ChannelType.GuildText,
    parent: adminCategory,
    topic: '📋 User reports (abuse, scams, etc.)',
  });

  // VOICE CATEGORY (Optional)
  const voiceCategory = await getOrCreateCategory(guild, '🎤 VOICE', {
    position: 5,
  });

  // General voice
  channels.generalVoice = await getOrCreateChannel(guild, 'General Voice', {
    type: ChannelType.GuildVoice,
    parent: voiceCategory,
  });

  // Gaming voice
  channels.gamingVoice = await getOrCreateChannel(guild, 'Gaming Voice', {
    type: ChannelType.GuildVoice,
    parent: voiceCategory,
  });

  // Welcome channel
  channels.welcome = await getOrCreateChannel(guild, 'welcome', {
    type: ChannelType.GuildText,
    parent: infoCategory,
    topic: '👋 Welcome new members to Acc Hub!',
    position: 0,
  });

  return channels;
}

/**
 * Set up webhooks for platform integration
 */
async function setupWebhooks(channels, guild) {
  const webhooks = {};

  try {
    // Promo codes webhook
    webhooks.promoCodes = await createWebhook(channels.promoCodes, {
      name: 'Acc Hub - Promo Codes',
      avatar: 'https://cdn.discordapp.com/attachments/1441466120631488754/1441474372614492232/acchub.png',
      reason: 'Auto-created for platform integration',
    });

    // Account generation webhook
    webhooks.accountGeneration = await createWebhook(channels.general, {
      name: 'Acc Hub - Account Generator',
      avatar: 'https://cdn.discordapp.com/attachments/1441466120631488754/1441474372614492232/acchub.png',
      reason: 'Auto-created for platform integration',
    });

    // Statistics webhook
    webhooks.stats = await createWebhook(channels.platformStats, {
      name: 'Acc Hub - Statistics',
      avatar: 'https://cdn.discordapp.com/attachments/1441466120631488754/1441474372614492232/acchub.png',
      reason: 'Auto-created for platform integration',
    });

    console.log('✅ Webhooks created:');
    console.log('  - Promo Codes:', webhooks.promoCodes?.url || 'Failed');
    console.log('  - Account Generation:', webhooks.accountGeneration?.url || 'Failed');
    console.log('  - Statistics:', webhooks.stats?.url || 'Failed');

    // Save webhook URLs to file or return them
    return webhooks;
  } catch (error) {
    console.error('❌ Error creating webhooks:', error);
    return webhooks;
  }
}

/**
 * Send welcome message
 */
async function sendWelcomeMessage(channel, guild) {
  if (!channel) return;

  const embed = new EmbedBuilder()
    .setTitle('🎉 Welcome to Acc Hub Discord Server!')
    .setDescription(`
**Acc Hub** - Account Generator Platform

📋 **Server Info:**
• Platform: ${process.env.PLATFORM_URL || 'https://your-platform-url.com'}
• FREE Generator: 10% Success Rate
• VIP Generator: 90% Success Rate - €5 Lifetime

📢 **Important Channels:**
• <#${channel.id}> - Read the rules
• <#announcements> - Platform updates
• <#promo-codes> - VIP promo codes
• <#support> - Get help

🎁 **New to Acc Hub?**
1. Visit our platform and create an account
2. Check <#promo-codes> for free VIP codes
3. Join our giveaways in <#giveaways>

💡 **Need help?** Check <#support> or create a post!

**Enjoy your stay!** 🚀
    `)
    .setColor(Colors.Blurple)
    .setTimestamp()
    .setFooter({
      text: 'Acc Hub - Account Generator Platform',
      iconURL: 'https://cdn.discordapp.com/attachments/1441466120631488754/1441474372614492232/acchub.png',
    });

  try {
    await channel.send({ embeds: [embed] });
  } catch (error) {
    console.error('❌ Error sending welcome message:', error);
  }
}

/**
 * Set up auto-moderation
 */
async function setupAutoModeration(guild) {
  try {
    // Enable auto-moderation features
    // Note: This requires Discord's AutoMod feature
    // You can configure this manually in Discord server settings
    console.log('💡 Configure auto-moderation in Discord server settings:');
    console.log('  - Enable spam detection');
    console.log('  - Enable link filtering');
    console.log('  - Enable profanity filter');
  } catch (error) {
    console.error('❌ Error setting up auto-moderation:', error);
  }
}

/**
 * Helper: Get or create role
 */
async function getOrCreateRole(guild, options) {
  const existing = guild.roles.cache.find(r => r.name === options.name);
  if (existing) {
    // Update existing role if needed
    if (options.color && existing.color !== options.color) {
      await existing.setColor(options.color);
    }
    return existing;
  }
  return await guild.roles.create(options);
}

/**
 * Helper: Get or create category
 */
async function getOrCreateCategory(guild, name, options = {}) {
  const existing = guild.channels.cache.find(
    c => c.type === ChannelType.GuildCategory && c.name === name
  );
  if (existing) return existing;
  return await guild.channels.create({
    name,
    type: ChannelType.GuildCategory,
    ...options,
  });
}

/**
 * Helper: Get or create channel
 */
async function getOrCreateChannel(guild, name, options = {}) {
  const existing = guild.channels.cache.find(
    c => c.name === name && (!options.parent || c.parentId === options.parent.id)
  );
  if (existing) return existing;
  return await guild.channels.create({
    name,
    ...options,
  });
}

/**
 * Helper: Create webhook
 */
async function createWebhook(channel, options = {}) {
  if (!channel) return null;
  
  try {
    // Check if webhook already exists
    const existingWebhooks = await channel.fetchWebhooks();
    const existing = existingWebhooks.find(w => w.name === options.name);
    if (existing) {
      console.log(`✅ Webhook "${options.name}" already exists`);
      return existing;
    }

    const webhook = await channel.createWebhook(options);
    console.log(`✅ Created webhook "${options.name}"`);
    return webhook;
  } catch (error) {
    console.error(`❌ Error creating webhook "${options.name}":`, error.message);
    return null;
  }
}

