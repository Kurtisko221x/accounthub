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
      name: 'help',
      aliases: ['h', 'commands'],
      description: '📖 Show all available commands',
      async execute(message, args) {
        const prefix = process.env.DISCORD_PREFIX || '!';
        
        const embed = new EmbedBuilder()
          .setTitle('🤖 Acc Hub Bot Commands')
          .setDescription(`Prefix: **${prefix}**`)
          .addFields(
            {
              name: `${prefix}setup`,
              value: '🔧 Setup Acc Hub Discord server (Admin only)',
              inline: false,
            },
            {
              name: `${prefix}stats`,
              value: '📊 Show platform statistics',
              inline: false,
            },
            {
              name: `${prefix}promocode <vip|free>`,
              value: '🎁 Generate a promo code (Admin only)',
              inline: false,
            },
            {
              name: `${prefix}ping`,
              value: '🏓 Check bot latency',
              inline: false,
            },
            {
              name: `${prefix}help`,
              value: '📖 Show this help message',
              inline: false,
            },
          )
          .setColor(Colors.Blurple)
          .setFooter({ text: 'Acc Hub - Account Generator Platform' })
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

