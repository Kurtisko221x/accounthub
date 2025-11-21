import { Client, GatewayIntentBits, Events, Collection } from 'discord.js';
import { config } from 'dotenv';
import { setupServer } from './setup.js';
import { handleCommands } from './commands.js';

config();

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
  
  // Auto-setup server if first time
  if (process.env.AUTO_SETUP === 'true') {
    console.log('🔧 Running auto-setup...');
    await setupServer(readyClient);
  }
  
  // Load commands
  await handleCommands(readyClient);
  
  console.log(`🤖 Bot is online and ready in ${readyClient.guilds.cache.size} server(s)`);
});

// Slash command handler
client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  const command = client.commands.get(interaction.commandName);
  if (!command) {
    console.error(`No command matching ${interaction.commandName} was found.`);
    return;
  }

  try {
    await command.execute(interaction);
  } catch (error) {
    console.error('Error executing command:', error);
    await interaction.reply({
      content: 'There was an error while executing this command!',
      ephemeral: true,
    });
  }
});

// Error handling
client.on(Events.Error, (error) => {
  console.error('Discord client error:', error);
});

// Login
client.login(process.env.DISCORD_BOT_TOKEN);

