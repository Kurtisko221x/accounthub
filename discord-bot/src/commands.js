import { EmbedBuilder, Colors } from 'discord.js';
import { setupServer } from './setup.js';

/**
 * Load and register prefix commands
 */
export async function handleCommands(client) {
  const commands = [
    {
      name: 'setup',
      description: '🔧 Setup Acc Hub Discord server (Admin only)',
      async execute(message, args) {
        if (!message.member.permissions.has('Administrator')) {
          return message.reply({
            content: '❌ You need Administrator permission to run this command!',
          });
        }

        const loadingMsg = await message.reply({
          content: '🔧 Starting server setup... This may take a minute.',
        });

        try {
          const result = await setupServer(client);
          
          if (result.success) {
            const embed = new EmbedBuilder()
              .setTitle('✅ Server Setup Complete!')
              .setDescription(`
**Successfully configured Acc Hub Discord server!**

✅ **Roles Created:**
• 🎁 FREE
• 👑 VIP
• 🔧 Staff
• 👮 Moderator
• ⚡ Admin
• 🤖 Bot
• 🎉 Giveaway Winner
• ⭐ Early Supporter

✅ **Channels Created:**
• Information category
• General category
• Promo & Codes category
• Statistics category
• Admin category
• Voice category

✅ **Webhooks Configured:**
• Promo Codes webhook
• Account Generation webhook
• Statistics webhook

📋 **Next Steps:**
1. Add webhook URLs to your platform settings
2. Configure auto-moderation in server settings
3. Set up reaction roles (optional)
4. Customize welcome message

**Webhook URLs:**
Check the console/logs for webhook URLs to add to your platform.
              `)
              .setColor(Colors.Green)
              .setTimestamp();

            await loadingMsg.edit({
              content: '',
              embeds: [embed],
            });
          }
        } catch (error) {
          await loadingMsg.edit({
            content: `❌ Error setting up server: ${error.message}`,
          });
        }
      },
    },
    {
      name: 'stats',
      description: '📊 Show platform statistics',
      async execute(message, args) {
        // This would fetch stats from your platform API
        const embed = new EmbedBuilder()
          .setTitle('📊 Acc Hub Platform Statistics')
          .setDescription('Statistics are updated automatically. Check <#platform-stats> for live updates!')
          .setColor(Colors.Blurple)
          .setTimestamp();

        await message.reply({ embeds: [embed] });
      },
    },
    {
      name: 'promocode',
      aliases: ['promo', 'code'],
      description: '🎁 Generate a promo code (Admin only) - Usage: !promocode <vip|free>',
      async execute(message, args) {
        if (!message.member.permissions.has('Administrator')) {
          return message.reply({
            content: '❌ You need Administrator permission!',
          });
        }

        const plan = args[0]?.toLowerCase();
        if (!plan || !['vip', 'free'].includes(plan)) {
          return message.reply({
            content: '❌ Please specify a plan type: `!promocode vip` or `!promocode free`',
          });
        }

        // This would integrate with your platform API to generate codes
        await message.reply({
          content: `🎁 Generating ${plan.toUpperCase()} promo code... (This would integrate with your platform API)`,
        });
      },
    },
    {
      name: 'ping',
      description: '🏓 Check bot latency',
      async execute(message, args) {
        const sent = await message.reply({
          content: '🏓 Pinging...',
        });

        const latency = sent.createdTimestamp - message.createdTimestamp;
        const apiLatency = Math.round(message.client.ws.ping);

        const embed = new EmbedBuilder()
          .setTitle('🏓 Pong!')
          .addFields(
            { name: 'Bot Latency', value: `${latency}ms`, inline: true },
            { name: 'API Latency', value: `${apiLatency}ms`, inline: true }
          )
          .setColor(Colors.Green)
          .setTimestamp();

        await sent.edit({
          content: '',
          embeds: [embed],
        });
      },
    },
    {
      name: 'serverinfo',
      aliases: ['server', 'info'],
      description: 'ℹ️ Show server information',
      async execute(message, args) {
        const guild = message.guild;
        const embed = new EmbedBuilder()
          .setTitle(`📊 ${guild.name} - Server Info`)
          .setThumbnail(guild.iconURL({ dynamic: true }))
          .addFields(
            { name: '👥 Members', value: `${guild.memberCount}`, inline: true },
            { name: '📝 Channels', value: `${guild.channels.cache.size}`, inline: true },
            { name: '🎭 Roles', value: `${guild.roles.cache.size}`, inline: true },
            { name: '👑 Owner', value: `<@${guild.ownerId}>`, inline: true },
            { name: '📅 Created', value: `<t:${Math.floor(guild.createdTimestamp / 1000)}:R>`, inline: true },
            { name: '🤖 Bot', value: `<@${message.client.user.id}>`, inline: true },
          )
          .setColor(Colors.Blurple)
          .setFooter({ text: 'Acc Hub - Account Generator Platform' })
          .setTimestamp();

        await message.reply({ embeds: [embed] });
      },
    },
    {
      name: 'userinfo',
      aliases: ['user', 'whois'],
      description: '👤 Show user information',
      async execute(message, args) {
        const target = message.mentions.users.first() || message.author;
        const member = message.guild.members.cache.get(target.id);
        
        if (!member) {
          return message.reply({ content: '❌ User not found in this server!' });
        }

        const embed = new EmbedBuilder()
          .setTitle(`👤 ${target.tag}`)
          .setThumbnail(target.displayAvatarURL({ dynamic: true }))
          .addFields(
            { name: '🆔 User ID', value: target.id, inline: true },
            { name: '📅 Account Created', value: `<t:${Math.floor(target.createdTimestamp / 1000)}:R>`, inline: true },
            { name: '📥 Joined Server', value: `<t:${Math.floor(member.joinedTimestamp / 1000)}:R>`, inline: true },
            { name: '🎭 Roles', value: member.roles.cache.map(r => r.toString()).slice(0, 10).join(' ') || 'None', inline: false },
          )
          .setColor(member.displayColor || Colors.Blurple)
          .setFooter({ text: 'Acc Hub - Account Generator Platform' })
          .setTimestamp();

        await message.reply({ embeds: [embed] });
      },
    },
    {
      name: 'links',
      aliases: ['invite', 'website'],
      description: '🔗 Show important links',
      async execute(message, args) {
        const platformUrl = process.env.PLATFORM_URL || 'https://your-platform-url.com';
        const embed = new EmbedBuilder()
          .setTitle('🔗 Acc Hub Links')
          .setDescription('Important links for Acc Hub platform')
          .addFields(
            { name: '🌐 Website', value: `[Visit Platform](${platformUrl})`, inline: true },
            { name: '💬 Discord', value: `[Join Server](${message.guild.vanityURLCode ? `https://discord.gg/${message.guild.vanityURLCode}` : 'No invite link'})`, inline: true },
          )
          .setColor(Colors.Blurple)
          .setFooter({ text: 'Acc Hub - Account Generator Platform' })
          .setTimestamp();

        await message.reply({ embeds: [embed] });
      },
    },
    {
      name: 'help',
      aliases: ['h', 'commands'],
      description: '📖 Show all available commands',
      async execute(message, args) {
        const prefix = process.env.DISCORD_PREFIX || '!';
        
        const embed = new EmbedBuilder()
          .setTitle('🤖 Acc Hub Bot - All Commands')
          .setDescription(`**Prefix:** \`${prefix}\`\n\nUse \`${prefix}help <command>\` for more info about a specific command.`)
          .addFields(
            {
              name: '🔧 **Administrator Commands**',
              value: `\`${prefix}setup\` - Setup Discord server (Admin only)\n\`${prefix}promocode <vip|free>\` - Generate promo code (Admin only)`,
              inline: false,
            },
            {
              name: '📊 **Information Commands**',
              value: `\`${prefix}stats\` - Show platform statistics\n\`${prefix}serverinfo\` - Show server information\n\`${prefix}userinfo [@user]\` - Show user information\n\`${prefix}links\` - Show important links`,
              inline: false,
            },
            {
              name: '🛠️ **Utility Commands**',
              value: `\`${prefix}ping\` - Check bot latency\n\`${prefix}help [command]\` - Show this help message`,
              inline: false,
            },
          )
          .setColor(Colors.Blurple)
          .setFooter({ text: 'Acc Hub - Account Generator Platform • Use !help <command> for more details' })
          .setTimestamp();

        await message.reply({ embeds: [embed] });
      },
    },
  ];

  // Register commands
  for (const command of commands) {
    client.commands.set(command.name, command);
    
    // Register aliases
    if (command.aliases) {
      for (const alias of command.aliases) {
        client.commands.set(alias, command);
      }
    }
  }

  console.log(`✅ Loaded ${commands.length} prefix commands`);
}

