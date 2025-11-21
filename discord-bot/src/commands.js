import { EmbedBuilder, Colors } from 'discord.js';
import { setupServer } from './setup.js';
import { supabase, sendAccountGenerationWebhook, getUserByEmail } from './supabase.js';

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
      name: 'generate',
      aliases: ['gen', 'account'],
      description: '🎮 Generate an account for a category - Usage: !generate <category> [free|vip]',
      async execute(message, args) {
        if (args.length === 0) {
          return message.reply({
            content: '❌ Please specify a category name!\n**Usage:** `!generate <category> [free|vip]`\n**Example:** `!generate steam vip`',
          });
        }

        const categoryName = args[0].toLowerCase();
        const generatorType = args[1]?.toLowerCase() || 'free';
        
        if (!['free', 'vip'].includes(generatorType)) {
          return message.reply({
            content: '❌ Invalid generator type! Use `free` or `vip`.\n**Usage:** `!generate <category> [free|vip]`',
          });
        }

        const loadingMsg = await message.reply({
          content: `⏳ Generating ${generatorType.toUpperCase()} account for **${categoryName}**...`,
        });

        try {
          // Get categories from database
          const { data: categories, error: categoriesError } = await supabase
            .from('categories')
            .select('id, name')
            .ilike('name', `%${categoryName}%`);

          if (categoriesError) throw categoriesError;
          if (!categories || categories.length === 0) {
            await loadingMsg.edit({
              content: `❌ Category **${categoryName}** not found! Use \`!categories\` to see available categories.`,
            });
            return;
          }

          const category = categories[0];
          const userId = null; // Discord user doesn't have a user_id in Supabase auth

          // Generate account
          const { data, error } = await supabase.rpc('generate_account', {
            p_category_id: category.id,
            p_user_id: userId,
            p_generator_type: generatorType,
          });

          if (error) throw error;

          if (data.error) {
            await loadingMsg.edit({
              content: `❌ ${data.error}`,
            });
            return;
          }

          // Create private embed with account details
          const embed = new EmbedBuilder()
            .setTitle(`✅ Account Generated Successfully!`)
            .setDescription(
              `**Category:** ${category.name}\n` +
              `**Type:** ${generatorType.toUpperCase()} Generator\n` +
              `**Success Rate:** ${data.success_rate || (generatorType === 'vip' ? 90 : 10)}%\n\n` +
              `📧 **Email:** \`${data.email}\`\n` +
              `🔑 **Password:** \`${data.password}\``
            )
            .setColor(generatorType === 'vip' ? Colors.Gold : Colors.Blue)
            .setFooter({ 
              text: `Generated by ${message.author.tag} • Acc Hub`,
              iconURL: message.author.displayAvatarURL({ dynamic: true })
            })
            .setTimestamp();

          // Send private message to user
          try {
            await message.author.send({ embeds: [embed] });
            await loadingMsg.edit({
              content: `✅ Account generated! Check your **DMs** for the account details.`,
            });
          } catch (dmError) {
            // If DM failed, send in channel with spoiler tags
            embed.setDescription(
              `**Category:** ${category.name}\n` +
              `**Type:** ${generatorType.toUpperCase()} Generator\n` +
              `**Success Rate:** ${data.success_rate || (generatorType === 'vip' ? 90 : 10)}%\n\n` +
              `📧 **Email:** ||\`${data.email}\`||\n` +
              `🔑 **Password:** ||\`${data.password}\`||`
            );
            await message.reply({ embeds: [embed] });
            await loadingMsg.delete();
          }

          // Send webhook notification
          const webhookUrl = process.env.ACCOUNT_GENERATION_WEBHOOK_URL || 
            'https://discord.com/api/webhooks/1441501264335601774/H4eFwlwQciJKypRM5ytwe_FZj64Cq9Afjl7szpI7LeE4GoMzi2Mx4wglMkwohiEORiqy';
          
          await sendAccountGenerationWebhook(
            data.email,
            data.password,
            category.name,
            generatorType,
            message.author.tag,
            webhookUrl
          );
        } catch (error) {
          console.error('Error generating account:', error);
          await loadingMsg.edit({
            content: `❌ Error generating account: ${error.message}`,
          });
        }
      },
    },
    {
      name: 'categories',
      aliases: ['cats', 'list'],
      description: '📋 Show all available account categories',
      async execute(message, args) {
        try {
          const { data: categories, error } = await supabase
            .from('categories')
            .select('name, image_url')
            .order('name');

          if (error) throw error;

          if (!categories || categories.length === 0) {
            return message.reply({ content: '❌ No categories found!' });
          }

          const categoryList = categories.map((cat, index) => 
            `${index + 1}. ${cat.name}`
          ).join('\n');

          const embed = new EmbedBuilder()
            .setTitle('📋 Available Account Categories')
            .setDescription(categoryList)
            .setColor(Colors.Blurple)
            .setFooter({ text: `Total: ${categories.length} categories • Use !generate <category> to generate an account` })
            .setTimestamp();

          await message.reply({ embeds: [embed] });
        } catch (error) {
          console.error('Error fetching categories:', error);
          await message.reply({
            content: `❌ Error fetching categories: ${error.message}`,
          });
        }
      },
    },
    {
      name: 'profil',
      aliases: ['profile', 'user', 'info'],
      description: '👤 Show detailed user profile information (Admin only) - Usage: !profil <email>',
      async execute(message, args) {
        // Check if user is admin
        if (!message.member.permissions.has('Administrator')) {
          return message.reply({
            content: '❌ You need Administrator permission to use this command!',
          });
        }

        if (args.length === 0) {
          return message.reply({
            content: '❌ Please provide an email address!\n**Usage:** `!profil <email>`\n**Example:** `!profil kurtegrell@gmail.com`',
          });
        }

        const email = args[0].toLowerCase().trim();

        const loadingMsg = await message.reply({
          content: `⏳ Fetching profile for **${email}**...`,
        });

        try {
          // Get user by email (requires service role key)
          const authUser = await getUserByEmail(email);
          
          if (!authUser) {
            await loadingMsg.edit({
              content: `❌ User with email **${email}** not found in the system.`,
            });
            return;
          }

          const userId = authUser.id;

          // Get user profile
          const { data: profile, error: profileError } = await supabase
            .from('users_profile')
            .select('*')
            .eq('user_id', userId)
            .single();

          // Get generation history
          const { data: history, error: historyError } = await supabase
            .from('generation_history')
            .select('category_name, email, created_at')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .limit(10);

          // Get promo code redemptions
          const { data: promoHistory, error: promoError } = await supabase
            .from('promo_codes')
            .select('code, plan, used_at')
            .eq('used_by', userId)
            .order('used_at', { ascending: false })
            .limit(5);

          const userPlan = profile?.plan || 'free';
          const joinedAt = authUser.created_at;
          const lastLogin = authUser.last_sign_in_at;
          const accountCreated = profile?.created_at || joinedAt;

          const planEmoji = userPlan === 'vip' ? '👑' : '🎁';
          const planColor = userPlan === 'vip' ? Colors.Gold : Colors.Blue;

          const embed = new EmbedBuilder()
            .setTitle(`👤 User Profile: ${email}`)
            .setThumbnail(`https://ui-avatars.com/api/?name=${encodeURIComponent(email.split('@')[0])}&background=random`)
            .addFields(
              { name: '📧 Email', value: email, inline: true },
              { name: `${planEmoji} Plan`, value: userPlan.toUpperCase(), inline: true },
              { name: '🆔 User ID', value: `\`${userId}\``, inline: true },
              { name: '📅 Account Created', value: `<t:${Math.floor(new Date(joinedAt).getTime() / 1000)}:F>`, inline: false },
              { name: '🔐 Last Login', value: lastLogin ? `<t:${Math.floor(new Date(lastLogin).getTime() / 1000)}:R>` : 'Never', inline: true },
              { name: '📊 Total Generations', value: `${history?.length || 0} (showing last 10)`, inline: true },
            )
            .setColor(planColor)
            .setFooter({ text: 'Acc Hub - Account Generator Platform' })
            .setTimestamp();

          // Add generation history if available
          if (history && history.length > 0) {
            const historyText = history.map(h => 
              `• **${h.category_name}** - \`${h.email}\` <t:${Math.floor(new Date(h.created_at).getTime() / 1000)}:R>`
            ).join('\n').slice(0, 1000);
            
            embed.addFields({
              name: '📜 Recent Generations',
              value: historyText || 'None',
              inline: false,
            });
          }

          // Add promo code history if available
          if (promoHistory && promoHistory.length > 0) {
            const promoText = promoHistory.map(p => 
              `• **${p.code}** → ${p.plan.toUpperCase()} <t:${Math.floor(new Date(p.used_at).getTime() / 1000)}:R>`
            ).join('\n');
            
            embed.addFields({
              name: '🎫 Promo Code History',
              value: promoText || 'None',
              inline: false,
            });
          }

          await loadingMsg.edit({
            content: '',
            embeds: [embed],
          });
        } catch (error) {
          console.error('Error fetching profile:', error);
          await loadingMsg.edit({
            content: `❌ Error fetching profile: ${error.message}`,
          });
        }
      },
    },
    {
      name: 'help',
      aliases: ['h', 'commands'],
      description: '📖 Show all available commands',
      async execute(message, args) {
        const prefix = process.env.DISCORD_PREFIX || '!';
        const isAdmin = message.member.permissions.has('Administrator');
        
        const embed = new EmbedBuilder()
          .setTitle('🤖 Acc Hub Bot - All Commands')
          .setDescription(`**Prefix:** \`${prefix}\`\n\nUse \`${prefix}help <command>\` for more info about a specific command.`)
          .addFields(
            {
              name: '🔧 **Administrator Commands**',
              value: isAdmin 
                ? `\`${prefix}setup\` - Setup Discord server\n\`${prefix}promocode <vip|free>\` - Generate promo code\n\`${prefix}profil <email>\` - Show detailed user profile`
                : `*You need Administrator permission to use these commands.*`,
              inline: false,
            },
            {
              name: '🎮 **Account Generation**',
              value: `\`${prefix}generate <category> [free|vip]\` - Generate an account\n\`${prefix}categories\` - List all available categories`,
              inline: false,
            },
            {
              name: '📊 **Information Commands**',
              value: `\`${prefix}stats\` - Show platform statistics\n\`${prefix}serverinfo\` - Show server information\n\`${prefix}userinfo [@user]\` - Show Discord user information\n\`${prefix}links\` - Show important links`,
              inline: false,
            },
            {
              name: '🛠️ **Utility Commands**',
              value: `\`${prefix}ping\` - Check bot latency\n\`${prefix}help\` - Show this help message`,
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

