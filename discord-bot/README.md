# Acc Hub Discord Bot

Automated Discord bot that sets up your Acc Hub Discord server with all channels, roles, permissions, and webhooks.

## 🎯 Features

- ✅ **Auto-Setup Server**: Automatically creates all channels and roles
- ✅ **Role Management**: Creates FREE, VIP, Staff, Moderator, Admin roles
- ✅ **Channel Setup**: Creates all necessary channels with proper permissions
- ✅ **Webhook Integration**: Creates webhooks for platform integration
- ✅ **Prefix Commands**: Various commands for server management (uses `!` prefix)
- ✅ **Auto-Moderation**: Sets up auto-moderation rules

## 📋 Prerequisites

1. **Node.js 18+** installed
2. **Discord Bot Token** - Create a bot at https://discord.com/developers/applications
3. **Discord Server** - Your server where you want to set everything up

## 🚀 Setup

### Step 1: Create Discord Bot

1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Click "New Application"
3. Name it "Acc Hub Bot" (or whatever you want)
4. Go to "Bot" section
5. Click "Add Bot"
6. Under "Privileged Gateway Intents", enable:
   - ✅ Server Members Intent
   - ✅ Message Content Intent
7. Copy the bot token

### Step 2: Invite Bot to Server

1. Go to "OAuth2" → "URL Generator"
2. Select scopes:
   - ✅ `bot`
3. Select bot permissions:
   - ✅ Administrator (for full setup access)
   - Or select manually:
     - Manage Channels
     - Manage Roles
     - Manage Webhooks
     - Send Messages
     - Embed Links
     - Read Message History
4. Copy the generated URL and open it in browser
5. Select your server and authorize

### Step 3: Configure Bot

1. Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

2. Edit `.env` and add your values:
```env
DISCORD_BOT_TOKEN=your_bot_token_here
DISCORD_GUILD_ID=your_server_id_here
DISCORD_PREFIX=!
PLATFORM_URL=https://your-platform-url.com
ADMIN_USER_IDS=your_discord_user_id
AUTO_SETUP=false
```

3. Install dependencies:
```bash
npm install
```

### Step 4: Run Bot

**Development mode (with auto-restart):**
```bash
npm run dev
```

**Production mode:**
```bash
npm start
```

**Manual setup (run once):**
```bash
npm run setup
```

## 🤖 Commands

All commands use the `!` prefix (can be changed in `.env` with `DISCORD_PREFIX`).

### `!setup`
- **Permission**: Administrator only
- **Description**: Automatically sets up the entire Discord server
- **Usage**: `!setup`
- **What it does**:
  - Creates all roles (FREE, VIP, Staff, Moderator, Admin, etc.)
  - Creates all channels with proper categories
  - Sets up permissions for each channel
  - Creates webhooks for platform integration
  - Sends welcome message

### `!stats`
- **Description**: Show platform statistics
- **Usage**: `!stats`

### `!generate <category> [free|vip]`
- **Aliases**: `!gen`, `!account`
- **Description**: Generate an account for a category (FREE or VIP generator)
- **Usage**: `!generate steam vip` or `!generate netflix free`
- **Notes**: 
  - Account details are sent via DM (private message)
  - If DMs are disabled, details are sent in channel with spoiler tags
  - Automatically sends webhook notification to configured webhook

### `!categories`
- **Aliases**: `!cats`, `!list`
- **Description**: Show all available account categories
- **Usage**: `!categories`

### `!profil <email>`
- **Aliases**: `!profile`, `!user`, `!info`
- **Permission**: Administrator only
- **Description**: Show detailed user profile information from database
- **Usage**: `!profil kurtegrell@gmail.com`
- **Shows**: User plan, account creation date, last login, generation history, promo code history
- **Note**: Requires `SUPABASE_SERVICE_KEY` to be set in `.env`

### `!promocode <vip|free>`
- **Aliases**: `!promo`, `!code`
- **Permission**: Administrator only
- **Description**: Generate promo codes (requires platform API integration)
- **Usage**: `!promocode vip` or `!promocode free`

### `!ping`
- **Description**: Check bot latency
- **Usage**: `!ping`

### `!help`
- **Aliases**: `!h`, `!commands`
- **Description**: Show all available commands
- **Usage**: `!help`

## 📁 Server Structure Created

The bot automatically creates:

### 📢 INFORMATION
- `#welcome` - Welcome channel
- `#rules` - Server rules
- `#announcements` - Platform announcements
- `#updates` - Changelog and updates
- `#status` - Platform status

### 💬 GENERAL
- `#general` - General chat
- `#account-generation` - Account generation discussion
- `#suggestions` - Feature suggestions (Forum)
- `#support` - Support requests (Forum)
- `#bug-reports` - Bug reports (Forum)

### 🎁 PROMO & CODES
- `#promo-codes` - VIP promo codes
- `#giveaways` - Giveaways
- `#winners` - Giveaway winners
- `#vip-accounts` - VIP-only announcements

### 📈 STATISTICS
- `#platform-stats` - Platform statistics
- `#account-stats` - Account generation stats
- `#leaderboard` - Top users leaderboard

### 🔐 ADMIN
- `#admin-logs` - Admin activity logs
- `#bot-commands` - Bot commands
- `#reports` - User reports

### 🎤 VOICE
- `General Voice` - General voice chat
- `Gaming Voice` - Gaming voice chat

## 👥 Roles Created

1. **🎁 FREE** - Free tier users
2. **👑 VIP** - VIP tier users
3. **🔧 Staff** - Support staff
4. **👮 Moderator** - Community moderators
5. **⚡ Admin** - Server administrators
6. **🤖 Bot** - Bot role
7. **🎉 Giveaway Winner** - Temporary winner role
8. **⭐ Early Supporter** - Early users

## 🔗 Webhook Integration

After running setup, the bot will create webhooks and output their URLs. Add these to your platform:

1. **Promo Codes Webhook** → Add to platform settings
2. **Account Generation Webhook** → Add to platform settings
3. **Statistics Webhook** → Add to platform settings

The webhook URLs will be printed in the console when you run the bot.

## 🔧 Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `DISCORD_BOT_TOKEN` | Your Discord bot token | ✅ Yes |
| `DISCORD_GUILD_ID` | Your Discord server ID | ✅ Yes |
| `DISCORD_PREFIX` | Command prefix (default: `!`) | ❌ No |
| `SUPABASE_URL` | Your Supabase project URL | ✅ Yes |
| `SUPABASE_ANON_KEY` | Your Supabase anonymous key | ✅ Yes |
| `SUPABASE_SERVICE_KEY` | Your Supabase service role key (for !profil command) | ❌ No |
| `ACCOUNT_GENERATION_WEBHOOK_URL` | Discord webhook URL for account generation notifications | ❌ No |
| `PLATFORM_URL` | Your platform URL | ❌ No |
| `AUTO_SETUP` | Run setup on bot start (true/false) | ❌ No |

## 📝 Getting Discord Server ID

1. Enable Developer Mode in Discord (User Settings → Advanced → Developer Mode)
2. Right-click on your server
3. Click "Copy Server ID"

## 🛠️ Customization

### Edit Channel Structure

Edit `src/setup.js` to customize:
- Channel names
- Channel topics
- Permissions
- Categories

### Add Custom Commands

Add new commands in `src/commands.js`:
```javascript
{
  name: 'mycommand',
  aliases: ['mycmd', 'cmd'], // Optional aliases
  description: 'My command description',
  async execute(message, args) {
    // Your command logic
    // message - the Discord message object
    // args - array of command arguments
    await message.reply('Command executed!');
  },
}
```

## 🐛 Troubleshooting

### Bot doesn't respond
- Check if bot token is correct
- Make sure bot has necessary permissions
- Check if bot is online (green status)

### Setup fails
- Make sure bot has Administrator permission
- Check console for error messages
- Verify server ID is correct

### Commands not working
- Check if command prefix is correct (default: `!`)
- Make sure bot has "Message Content Intent" enabled
- Check if bot can read messages in the channel

## 📚 Documentation

- [Discord.js Guide](https://discordjs.guide/)
- [Discord Developer Portal](https://discord.com/developers/docs)
- [Discord API Documentation](https://discord.com/developers/docs/intro)

## 📄 License

MIT

