import { Client, GatewayIntentBits, Events, Collection } from 'discord.js';
import { config } from 'dotenv';
import { setupServer } from './setup.js';
import { handleCommands } from './commands.js';

config();

const PREFIX = process.env.DISCORD_PREFIX || '!';

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
  ],
});

// Command collection
client.commands = new Collection();

// When bot is ready
client.once(Events.ClientReady, async (readyClient) => {
  console.log(`✅ Bot is ready! Logged in as ${readyClient.user.tag}`);
  console.log(`📝 Command prefix: ${PREFIX}`);
  
  // Auto-setup server if first time
  if (process.env.AUTO_SETUP === 'true') {
    console.log('🔧 Running auto-setup...');
    await setupServer(readyClient);
  }
  
  // Load commands
  await handleCommands(readyClient);
  
  console.log(`🤖 Bot is online and ready in ${readyClient.guilds.cache.size} server(s)`);
  console.log(`💡 Use ${PREFIX}help to see all available commands`);
});

// Prefix command handler
client.on(Events.MessageCreate, async (message) => {
  // Ignore bot messages and messages without prefix
  if (message.author.bot) return;
  if (!message.content.startsWith(PREFIX)) return;

  // Parse command and arguments
  const args = message.content.slice(PREFIX.length).trim().split(/ +/);
  const commandName = args.shift().toLowerCase();

  // Get command
  const command = client.commands.get(commandName);
  if (!command) return;

  try {
    await command.execute(message, args);
  } catch (error) {
    console.error('Error executing command:', error);
    await message.reply({
      content: '❌ There was an error while executing this command!',
    }).catch(() => {});
  }
});

// Error handling
client.on(Events.Error, (error) => {
  console.error('Discord client error:', error);
});

// Login
client.login(process.env.DISCORD_BOT_TOKEN);

