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
    // Step 0: Clean up old channels and roles
    await cleanupOldChannelsAndRoles(guild);
    console.log('✅ Old channels and roles cleaned up');

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

    // Step 5: Send rules message
    await sendRulesMessage(channels.rules, guild, client);
    console.log('✅ Rules message sent');

    // Step 6: Set up auto-moderation
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

  // Welcome channel
  channels.welcome = await getOrCreateChannel(guild, '👋-welcome', {
    type: ChannelType.GuildText,
    parent: infoCategory,
    topic: '👋 Welcome to Acc Hub! Read the rules and introduce yourself',
    permissionOverwrites: [
      {
        id: guild.roles.everyone.id,
        allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.ReadMessageHistory, PermissionFlagsBits.SendMessages],
      },
    ],
  });

  // Rules channel
  channels.rules = await getOrCreateChannel(guild, '📜-rules', {
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
  channels.announcements = await getOrCreateChannel(guild, '📢-announcements', {
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
  channels.updates = await getOrCreateChannel(guild, '📝-updates', {
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
  channels.status = await getOrCreateChannel(guild, '📊-status', {
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

  // Account generation channel (at top of general)
  channels.accountGeneration = await getOrCreateChannel(guild, '🎮-account-generation', {
    type: ChannelType.GuildText,
    parent: generalCategory,
    topic: '🎮 Discussion about account generation, tips & tricks',
    position: 0,
  });

  // General channel
  channels.general = await getOrCreateChannel(guild, '💬-general', {
    type: ChannelType.GuildText,
    parent: generalCategory,
    topic: '💬 Chat about anything related to Acc Hub platform!',
    position: 1,
  });

  // Questions channel
  channels.questions = await getOrCreateChannel(guild, '❓-questions', {
    type: ChannelType.GuildText,
    parent: generalCategory,
    topic: '❓ Get help with issues, ask questions',
    position: 2,
  });

  // Suggestions channel
  channels.suggestions = await getOrCreateChannel(guild, '💡-suggestions', {
    type: ChannelType.GuildText,
    parent: generalCategory,
    topic: '💡 Suggest new features or improvements',
    position: 3,
  });

  // Support channel
  channels.support = await getOrCreateChannel(guild, '🆘-support', {
    type: ChannelType.GuildText,
    parent: generalCategory,
    topic: '🆘 Need help? Create a support ticket or ask here',
    position: 4,
  });

  // Bug reports channel
  channels.bugReports = await getOrCreateChannel(guild, '🐛-bug-reports', {
    type: ChannelType.GuildText,
    parent: generalCategory,
    topic: '🐛 Report bugs and issues you found',
    position: 5,
  });

  // PROMO & CODES CATEGORY
  const promoCodesCategory = await getOrCreateCategory(guild, '🎁 PROMO & CODES', {
    position: 2,
  });

  // Promo codes channel
  channels.promoCodes = await getOrCreateChannel(guild, '🎫-promo-codes', {
    type: ChannelType.GuildText,
    parent: promoCodesCategory,
    topic: '🎁 Admin posts promo codes for VIP upgrades - Check regularly!',
    position: 0,
    permissionOverwrites: [
      {
        id: guild.roles.everyone.id,
        deny: [PermissionFlagsBits.SendMessages],
        allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.ReadMessageHistory],
      },
    ],
  });

  // Giveaways channel
  channels.giveaways = await getOrCreateChannel(guild, '🎉-giveaways', {
    type: ChannelType.GuildText,
    parent: promoCodesCategory,
    topic: '🎉 VIP account giveaways - React to enter!',
    position: 1,
    permissionOverwrites: [
      {
        id: guild.roles.everyone.id,
        deny: [PermissionFlagsBits.SendMessages],
        allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.ReadMessageHistory, PermissionFlagsBits.AddReactions],
      },
    ],
  });

  // Winners channel
  channels.winners = await getOrCreateChannel(guild, '🏆-winners', {
    type: ChannelType.GuildText,
    parent: promoCodesCategory,
    topic: '🏆 Announce giveaway winners',
    position: 2,
    permissionOverwrites: [
      {
        id: guild.roles.everyone.id,
        deny: [PermissionFlagsBits.SendMessages],
        allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.ReadMessageHistory],
      },
    ],
  });

  // VIP accounts channel
  channels.vipAccounts = await getOrCreateChannel(guild, '💎-vip-accounts', {
    type: ChannelType.GuildText,
    parent: promoCodesCategory,
    topic: '💎 Exclusive VIP account announcements',
    position: 3,
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
  channels.platformStats = await getOrCreateChannel(guild, '📊-platform-stats', {
    type: ChannelType.GuildText,
    parent: statsCategory,
    topic: '📊 Auto-updated platform statistics',
    position: 0,
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
  channels.accountStats = await getOrCreateChannel(guild, '📈-account-stats', {
    type: ChannelType.GuildText,
    parent: statsCategory,
    topic: '📈 Account generation statistics',
    position: 1,
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
  channels.leaderboard = await getOrCreateChannel(guild, '🏅-leaderboard', {
    type: ChannelType.GuildText,
    parent: statsCategory,
    topic: '🏅 Top users leaderboard',
    position: 2,
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

  // Logs channel
  channels.logs = await getOrCreateChannel(guild, '📋-logs', {
    type: ChannelType.GuildText,
    parent: adminCategory,
    topic: '📋 Server logs and moderation actions',
    position: 0,
    permissionOverwrites: [
      {
        id: guild.roles.everyone.id,
        deny: [PermissionFlagsBits.ViewChannel],
      },
      {
        id: roles.admin.id,
        allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory],
      },
      {
        id: roles.moderator.id,
        allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.ReadMessageHistory],
      },
      {
        id: roles.bot.id,
        allow: [PermissionFlagsBits.SendMessages, PermissionFlagsBits.ViewChannel],
      },
    ],
  });

  // Admin logs channel
  channels.adminLogs = await getOrCreateChannel(guild, '🔐-admin-logs', {
    type: ChannelType.GuildText,
    parent: adminCategory,
    topic: '🔐 Admin activity logs',
    position: 1,
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
        allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.ReadMessageHistory],
      },
    ],
  });

  // Bot commands channel
  channels.botCommands = await getOrCreateChannel(guild, '🤖-bot-commands', {
    type: ChannelType.GuildText,
    parent: adminCategory,
    topic: '🤖 Bot command channel - Use !help to see commands',
    position: 2,
  });

  // Reports channel
  channels.reports = await getOrCreateChannel(guild, '📨-reports', {
    type: ChannelType.GuildText,
    parent: adminCategory,
    topic: '📋 User reports (abuse, scams, etc.)',
    position: 3,
  });

  // VOICE CATEGORY (Optional)
  const voiceCategory = await getOrCreateCategory(guild, '🎤 VOICE', {
    position: 5,
  });

  // General voice
  channels.generalVoice = await getOrCreateChannel(guild, '🔊 General Voice', {
    type: ChannelType.GuildVoice,
    parent: voiceCategory,
    position: 0,
  });

  // Gaming voice
  channels.gamingVoice = await getOrCreateChannel(guild, '🎮 Gaming Voice', {
    type: ChannelType.GuildVoice,
    parent: voiceCategory,
    position: 1,
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

    // Account generation webhook (use the provided webhook URL)
    const accountGenerationWebhookUrl = process.env.ACCOUNT_GENERATION_WEBHOOK_URL || 
      'https://discord.com/api/webhooks/1441501264335601774/H4eFwlwQciJKypRM5ytwe_FZj64Cq9Afjl7szpI7LeE4GoMzi2Mx4wglMkwohiEORiqy';
    
    console.log('✅ Account Generation Webhook URL:', accountGenerationWebhookUrl);
    
    // Store webhook URL for use in commands
    webhooks.accountGeneration = { url: accountGenerationWebhookUrl };

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
 * Send rules message to rules channel
 */
async function sendRulesMessage(channel, guild, client) {
  if (!channel) return;

  const embed = new EmbedBuilder()
    .setTitle('📜 Acc Hub Server Rules')
    .setDescription('Please read and follow these rules to maintain a friendly and safe community!')
    .addFields(
      {
        name: '1️⃣ **Be Respectful**',
        value: 'Treat all members with respect. No harassment, bullying, or hate speech.',
        inline: false,
      },
      {
        name: '2️⃣ **No Spam**',
        value: 'Do not spam messages, emojis, or links. Keep conversations on-topic.',
        inline: false,
      },
      {
        name: '3️⃣ **No Advertising**',
        value: 'Self-promotion and advertising of other services is not allowed without admin permission.',
        inline: false,
      },
      {
        name: '4️⃣ **Appropriate Content**',
        value: 'Keep all content appropriate. No NSFW content, illegal activities, or dangerous links.',
        inline: false,
      },
      {
        name: '5️⃣ **Follow Discord ToS**',
        value: 'All Discord Terms of Service and Community Guidelines apply here.',
        inline: false,
      },
      {
        name: '6️⃣ **Account Generation Guidelines**',
        value: 'Generated accounts are for personal use only. Do not resell or redistribute accounts.',
        inline: false,
      },
      {
        name: '7️⃣ **No Scamming**',
        value: 'Any form of scamming, fraud, or deception will result in an immediate ban.',
        inline: false,
      },
      {
        name: '8️⃣ **Listen to Staff**',
        value: 'Follow instructions from moderators and administrators. Their decisions are final.',
        inline: false,
      },
    )
    .setColor(Colors.Red)
    .setFooter({
      text: 'Acc Hub - Account Generator Platform',
      iconURL: 'https://cdn.discordapp.com/attachments/1441466120631488754/1441474372614492232/acchub.png',
    })
    .setTimestamp();

  try {
    // Check if rules message already exists
    const messages = await channel.messages.fetch({ limit: 10 });
    const existingRules = messages.find(m => 
      m.author.id === client.user?.id && 
      m.embeds.length > 0 && 
      m.embeds[0].title === '📜 Acc Hub Server Rules'
    );

    if (!existingRules) {
      await channel.send({ embeds: [embed] });
    } else {
      console.log('  ℹ️ Rules message already exists, skipping...');
    }
  } catch (error) {
    console.error('❌ Error sending rules message:', error);
  }
}

/**
 * Clean up old channels and roles that are not in the new structure
 */
async function cleanupOldChannelsAndRoles(guild) {
  // Define which channels and roles should exist
  const expectedChannelNames = [
    '👋-welcome',
    '📜-rules',
    '📢-announcements',
    '📝-updates',
    '📊-status',
    '🎮-account-generation',
    '💬-general',
    '❓-questions',
    '💡-suggestions',
    '🆘-support',
    '🐛-bug-reports',
    '🎫-promo-codes',
    '🎉-giveaways',
    '🏆-winners',
    '💎-vip-accounts',
    '📊-platform-stats',
    '📈-account-stats',
    '🏅-leaderboard',
    '📋-logs',
    '🔐-admin-logs',
    '🤖-bot-commands',
    '📨-reports',
    '🔊 General Voice',
    '🎮 Gaming Voice',
  ];

  const expectedRoleNames = [
    '🎁 FREE',
    '👑 VIP',
    '🔧 Staff',
    '👮 Moderator',
    '⚡ Admin',
    '🤖 Bot',
    '🎉 Giveaway Winner',
    '⭐ Early Supporter',
  ];

  const expectedCategoryNames = [
    '📢 INFORMATION',
    '💬 GENERAL',
    '🎁 PROMO & CODES',
    '📈 STATISTICS',
    '🔐 ADMIN',
    '🎤 VOICE',
  ];

  try {
    // Delete channels that don't match expected names
    let deletedChannels = 0;
    const channelsToDelete = [];
    
    // First pass: collect channels to delete
    for (const channel of guild.channels.cache.values()) {
      // Skip categories for now
      if (channel.type === ChannelType.GuildCategory) continue;
      
      // Don't delete system channels
      if (channel.id === guild.rulesChannelId || channel.id === guild.systemChannelId) {
        continue;
      }
      
      // Check if channel name matches expected names exactly
      const matchesExpected = expectedChannelNames.includes(channel.name);
      
      // If channel doesn't match expected names, mark for deletion
      if (!matchesExpected) {
        channelsToDelete.push(channel);
      }
    }
    
    // Second pass: delete collected channels
    for (const channel of channelsToDelete) {
      try {
        await channel.delete('Cleaning up old channels during setup');
        deletedChannels++;
        console.log(`  🗑️ Deleted old channel: ${channel.name}`);
      } catch (error) {
        console.warn(`  ⚠️ Could not delete channel ${channel.name}: ${error.message}`);
      }
    }

    // Delete categories that don't match expected names
    let deletedCategories = 0;
    for (const category of guild.channels.cache.values()) {
      if (category.type !== ChannelType.GuildCategory) continue;
      
      const matchesExpected = expectedCategoryNames.includes(category.name);
      
      if (!matchesExpected && category.name !== 'Text Channels' && category.name !== 'Voice Channels') {
        try {
          // Delete all channels in category first
          for (const childChannel of category.children.cache.values()) {
            try {
              await childChannel.delete('Cleaning up old channels during setup');
            } catch (error) {
              console.warn(`  ⚠️ Could not delete channel ${childChannel.name}: ${error.message}`);
            }
          }
          await category.delete('Cleaning up old categories during setup');
          deletedCategories++;
          console.log(`  🗑️ Deleted old category: ${category.name}`);
        } catch (error) {
          console.warn(`  ⚠️ Could not delete category ${category.name}: ${error.message}`);
        }
      }
    }

    // Delete roles that don't match expected names (except @everyone)
    let deletedRoles = 0;
    for (const role of guild.roles.cache.values()) {
      // Never delete @everyone role
      if (role.id === guild.id) continue;
      
      // Don't delete managed roles (bot roles)
      if (role.managed) continue;
      
      const matchesExpected = expectedRoleNames.includes(role.name);
      
      if (!matchesExpected) {
        try {
          await role.delete('Cleaning up old roles during setup');
          deletedRoles++;
          console.log(`  🗑️ Deleted old role: ${role.name}`);
        } catch (error) {
          console.warn(`  ⚠️ Could not delete role ${role.name}: ${error.message}`);
        }
      }
    }

    if (deletedChannels > 0 || deletedCategories > 0 || deletedRoles > 0) {
      console.log(`  ✅ Cleanup complete: ${deletedChannels} channels, ${deletedCategories} categories, ${deletedRoles} roles deleted`);
    } else {
      console.log('  ℹ️ No old channels, categories, or roles to delete');
    }
  } catch (error) {
    console.error('❌ Error during cleanup:', error);
    // Don't throw, just log - we can continue with setup
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
      // If webhook is an object with URL, return it directly
      if (options.url) {
        console.log(`✅ Using provided webhook URL: ${options.name}`);
        return options;
      }

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

