# Discord Server Setup Guide for Acc Hub

## 🎯 Server Structure

### 📢 INFORMATION CATEGORY

**📌 rules**
- Type: Text Channel
- Description: Server rules and guidelines
- Permissions: Everyone can view, only admins can send

**📢 announcements**
- Type: Announcement Channel
- Description: Platform updates, new features, important news
- Permissions: Everyone can view, only admins can send

**📝 updates**
- Type: Text Channel
- Description: Changelog and version updates
- Permissions: Everyone can view, only admins can send

**📊 status**
- Type: Text Channel (Read-only for users)
- Description: Platform status, maintenance notices
- Permissions: Everyone can view, only bots/admins can send

### 💬 GENERAL CATEGORY

**💬 general**
- Type: Text Channel
- Description: General discussions about the platform
- Permissions: Everyone can chat

**🎮 account-generation**
- Type: Text Channel
- Description: Discussion about account generation, tips & tricks
- Permissions: Everyone can chat

**💡 suggestions**
- Type: Forum Channel
- Description: Users can suggest new features or improvements
- Permissions: Everyone can create posts

**❓ support**
- Type: Forum Channel
- Description: Get help with issues, ask questions
- Permissions: Everyone can create posts

**🐛 bug-reports**
- Type: Forum Channel
- Description: Report bugs and issues
- Permissions: Everyone can create posts

### 🎁 PROMO & CODES CATEGORY

**🎁 promo-codes**
- Type: Text Channel
- Description: Admin posts promo codes for VIP upgrades
- Permissions: Everyone can view, only admins can send
- Webhook: Auto-post promo codes from platform

**🎉 giveaways**
- Type: Text Channel
- Description: VIP account giveaways
- Permissions: Everyone can view, only admins can send

**🏆 winners**
- Type: Text Channel
- Description: Announce giveaway winners
- Permissions: Everyone can view, only admins can send

**💎 vip-accounts**
- Type: Text Channel
- Description: Exclusive VIP account announcements
- Permissions: VIP role can view

### 📈 STATISTICS CATEGORY

**📊 platform-stats**
- Type: Text Channel (Read-only)
- Description: Auto-updated platform statistics
- Permissions: Everyone can view, only bot can send
- Webhook: Auto-update from platform

**📈 account-stats**
- Type: Text Channel (Read-only)
- Description: Account generation statistics
- Permissions: Everyone can view, only bot can send

**🏅 leaderboard**
- Type: Text Channel (Read-only)
- Description: Top users leaderboard
- Permissions: Everyone can view, only bot can send

### 🔐 ADMIN CATEGORY

**🔐 admin-logs**
- Type: Text Channel
- Description: Admin activity logs
- Permissions: Admin role only

**🤖 bot-commands**
- Type: Text Channel
- Description: Bot command channel
- Permissions: Everyone can use commands

**📋 reports**
- Type: Text Channel
- Description: User reports (abuse, scams, etc.)
- Permissions: Everyone can send

### 🎤 VOICE CATEGORY (Optional)

**🎤 General Voice**
- Type: Voice Channel
- Description: General voice chat

**🎮 Gaming Voice**
- Type: Voice Channel
- Description: Gaming discussion voice chat

## 👥 ROLES

### Main Roles:
1. **@everyone** - Default role for all members
   - Can view most channels
   - Can chat in general channels

2. **🎁 FREE** - Free tier users
   - Access to free generator info
   - Basic support access

3. **👑 VIP** - VIP tier users (Premium)
   - Access to VIP channels
   - Early access to new accounts
   - Priority support
   - Special VIP badge

4. **🤖 Bot** - Platform bots
   - Auto-posts from platform
   - Statistics updates
   - Webhook notifications

5. **🔧 Staff** - Support staff
   - Can help users
   - Can moderate channels
   - Access to support channels

6. **👮 Moderator** - Community moderators
   - Can moderate all channels
   - Can mute/ban users
   - Access to reports

7. **⚡ Admin** - Server administrators
   - Full access to all channels
   - Can manage server settings
   - Can create promo codes

8. **👑 Owner** - Server owner
   - Ultimate permissions

### Special Roles:
- **🎉 Giveaway Winner** - Temporary role for winners
- **⭐ Early Supporter** - For early users
- **🐛 Beta Tester** - For beta testers

## 🤖 BOTS & AUTOMATION

### Recommended Bots:

1. **MEE6 or Dyno** - Moderation, auto-moderation, leveling
   - Auto-moderation (spam, links, etc.)
   - Auto-role assignment based on platform plan
   - Welcome messages

2. **Carl-bot** - Auto-moderation and custom commands
   - Reaction roles
   - Auto-roles
   - Custom commands

3. **Ticket Tool** - Support tickets
   - Create support tickets
   - Private support channels

4. **Custom Webhook Bot** - Platform integration
   - Auto-post account generation notifications
   - Auto-post promo codes
   - Auto-update statistics

## 🔗 WEBHOOK INTEGRATION

### Webhooks from Platform:

1. **Promo Code Webhook** (`#promo-codes`)
   - Auto-post new promo codes
   - Format: Embed with code, plan, expiration

2. **Account Generation Webhook** (`#general` or new channel)
   - Notify about new account generations
   - Show user info, category, plan

3. **Statistics Webhook** (`#platform-stats`)
   - Daily/weekly statistics updates
   - Total accounts generated
   - Active users count

4. **Announcement Webhook** (`#announcements`)
   - Platform updates
   - New features
   - Maintenance notices

## 📋 CHANNEL PERMISSIONS

### Default Permissions (@everyone):
- ✅ View Channels (except admin channels)
- ✅ Send Messages (in general channels)
- ✅ Read Message History
- ✅ Use Slash Commands
- ❌ Manage Messages
- ❌ Mention @everyone

### VIP Role Permissions:
- ✅ All default permissions
- ✅ View VIP channels
- ✅ Access VIP-only content
- ✅ Priority support access

### Admin Role Permissions:
- ✅ All permissions
- ✅ Manage Channels
- ✅ Manage Messages
- ✅ Mention @everyone
- ✅ Manage Webhooks

## 🎨 SERVER SETTINGS

### Server Name:
**Acc Hub - Account Generator Platform**

### Server Icon:
Use the Acc Hub logo (acchub.png)

### Server Banner:
Modern gaming-themed banner with Acc Hub branding

### Description:
"Official Acc Hub Discord Server - Account Generator Platform with FREE and VIP tiers. Join for support, updates, promo codes, and giveaways!"

### Verification Level:
Level 2 (Medium) - Users must have verified email

### Auto-Moderation:
- Enable auto-moderation for spam
- Filter common scams/phishing links
- Auto-warn for rule violations

## 📝 CHANNEL TOPICS/DESCRIPTIONS

### #general
"Chat about anything related to Acc Hub platform, account generation, or general discussion!"

### #account-generation
"Share tips, tricks, and experiences with account generation. Help others learn!"

### #support
"Need help? Create a post here and our staff will assist you!"

### #promo-codes
"Check here for promo codes to upgrade to VIP! New codes posted regularly."

### #giveaways
"VIP account giveaways! React to enter. Good luck!"

## 🎯 AUTO-ROLES

Set up auto-role assignment based on platform plan:

1. **Webhook from Platform** → Update Discord role
   - When user upgrades to VIP → Assign @VIP role
   - When user is FREE → Assign @FREE role

2. **Reaction Roles**:
   - Pin message in #roles channel
   - React to get notifications role
   - React to get updates role

## 📢 WELCOME SYSTEM

### Welcome Channel: `#welcome`

Welcome message:
```
🎉 Welcome to **Acc Hub** Discord Server!

📋 **Server Info:**
• Platform: https://your-platform-url.com
• FREE Generator: 10% Success Rate
• VIP Generator: 90% Success Rate - €5 Lifetime

📢 **Important Channels:**
• #announcements - Platform updates
• #promo-codes - VIP promo codes
• #support - Get help

🎁 **New to Acc Hub?**
1. Visit our platform and create an account
2. Check #promo-codes for free VIP codes
3. Join our giveaways in #giveaways

Need help? Check #support or create a ticket!
```

## 🔔 NOTIFICATION SETTINGS

### Server-wide:
- Default notification level: Mentions only
- Suppress @everyone: Enabled (except for admins)

### Channel-specific:
- #announcements: All messages
- #promo-codes: All messages
- #giveaways: All messages
- #support: Mentions only
- Others: Default

## 🎨 CUSTOMIZATION

### Server Emojis (Add):
- ✅ Success emoji
- ❌ Error emoji
- 🎁 Gift/Free emoji
- 👑 VIP/Crown emoji
- ⚡ Platform logo emoji
- 🎮 Category icons

### Server Stickers:
- Acc Hub branding stickers
- Success/Error stickers
- Category-related stickers

## 🔗 PLATFORM INTEGRATION

### Webhook URLs Setup:

1. **Create Webhooks in Discord:**
   - Go to Server Settings → Integrations → Webhooks
   - Create webhook for each channel
   - Copy webhook URL

2. **Add to Platform:**
   - Go to Admin Panel → Settings
   - Add Discord webhook URLs
   - Test webhooks

3. **Auto-posting:**
   - Promo codes auto-post when generated
   - Account generation notifications
   - Statistics updates (daily)

## 📊 STATISTICS CHANNEL FORMAT

Example message format for `#platform-stats`:
```
📊 **Acc Hub Platform Statistics**

👥 **Users:**
• Total: 1,234
• VIP: 567
• FREE: 667

🎮 **Accounts Generated:**
• Today: 45
• This Week: 312
• Total: 12,456

🏆 **Top Categories:**
1. Steam - 2,345
2. Netflix - 1,890
3. Spotify - 1,567

Last updated: <t:1234567890:R>
```

## 🎯 TIPS

1. **Keep it organized** - Use categories and clear channel names
2. **Moderation is key** - Set up auto-moderation for spam
3. **Regular updates** - Post in #announcements regularly
4. **Engage community** - Respond to suggestions and feedback
5. **Promo codes** - Post them regularly to keep engagement high
6. **Giveaways** - Regular giveaways increase activity

---

**Need help setting up?** Follow the step-by-step guide in your Discord server settings!

