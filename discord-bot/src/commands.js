import { SlashCommandBuilder, EmbedBuilder, Colors } from 'discord.js';
import { setupServer } from './setup.js';

/**
 * Load and register slash commands
 */
export async function handleCommands(client) {
  const commands = [
    {
      data: new SlashCommandBuilder()
        .setName('setup')
        .setDescription('🔧 Setup Acc Hub Discord server (Admin only)')
        .setDefaultMemberPermissions(0x8), // Administrator permission
      async execute(interaction) {
        if (!interaction.member.permissions.has('Administrator')) {
          return interaction.reply({
            content: '❌ You need Administrator permission to run this command!',
            ephemeral: true,
          });
        }

        await interaction.reply({
          content: '🔧 Starting server setup... This may take a minute.',
          ephemeral: true,
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

            await interaction.editReply({
              content: '',
              embeds: [embed],
            });
          }
        } catch (error) {
          await interaction.editReply({
            content: `❌ Error setting up server: ${error.message}`,
          });
        }
      },
    },
    {
      data: new SlashCommandBuilder()
        .setName('stats')
        .setDescription('📊 Show platform statistics'),
      async execute(interaction) {
        // This would fetch stats from your platform API
        const embed = new EmbedBuilder()
          .setTitle('📊 Acc Hub Platform Statistics')
          .setDescription('Statistics are updated automatically. Check <#platform-stats> for live updates!')
          .setColor(Colors.Blurple)
          .setTimestamp();

        await interaction.reply({ embeds: [embed], ephemeral: true });
      },
    },
    {
      data: new SlashCommandBuilder()
        .setName('promocode')
        .setDescription('🎁 Generate a promo code (Admin only)')
        .addStringOption(option =>
          option
            .setName('plan')
            .setDescription('Plan type')
            .setRequired(true)
            .addChoices(
              { name: 'VIP', value: 'vip' },
              { name: 'FREE', value: 'free' }
            )
        )
        .setDefaultMemberPermissions(0x8),
      async execute(interaction) {
        if (!interaction.member.permissions.has('Administrator')) {
          return interaction.reply({
            content: '❌ You need Administrator permission!',
            ephemeral: true,
          });
        }

        const plan = interaction.options.getString('plan');
        // This would integrate with your platform API to generate codes
        await interaction.reply({
          content: `🎁 Generating ${plan.toUpperCase()} promo code... (This would integrate with your platform API)`,
          ephemeral: true,
        });
      },
    },
    {
      data: new SlashCommandBuilder()
        .setName('ping')
        .setDescription('🏓 Check bot latency'),
      async execute(interaction) {
        const sent = await interaction.reply({
          content: '🏓 Pinging...',
          fetchReply: true,
          ephemeral: true,
        });

        const latency = sent.createdTimestamp - interaction.createdTimestamp;
        const apiLatency = Math.round(interaction.client.ws.ping);

        const embed = new EmbedBuilder()
          .setTitle('🏓 Pong!')
          .addFields(
            { name: 'Bot Latency', value: `${latency}ms`, inline: true },
            { name: 'API Latency', value: `${apiLatency}ms`, inline: true }
          )
          .setColor(Colors.Green)
          .setTimestamp();

        await interaction.editReply({
          content: '',
          embeds: [embed],
        });
      },
    },
  ];

  // Register commands
  for (const command of commands) {
    client.commands.set(command.data.name, command);
  }

  // Deploy commands to Discord
  try {
    const commandsData = commands.map(cmd => cmd.data.toJSON());
    
    if (process.env.DISCORD_GUILD_ID) {
      // Guild commands (instant update)
      const guild = await client.guilds.fetch(process.env.DISCORD_GUILD_ID);
      await guild.commands.set(commandsData);
      console.log(`✅ Registered ${commands.length} slash commands for guild: ${guild.name}`);
    } else {
      // Global commands (takes up to 1 hour)
      await client.application.commands.set(commandsData);
      console.log(`✅ Registered ${commands.length} global slash commands`);
    }
  } catch (error) {
    console.error('❌ Error registering commands:', error);
  }
}

