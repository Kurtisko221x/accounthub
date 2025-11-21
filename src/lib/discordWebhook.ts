// Discord webhook notification helper
export const sendDiscordWebhook = async (
  accountEmail: string,
  categoryName: string,
  userEmail: string | null,
  userName: string | null,
  userPlan: 'free' | 'vip',
  timestamp: string
) => {
  try {
    // Get Discord webhook URL from localStorage
    const settings = localStorage.getItem("platformSettings");
    if (!settings) return;

    const parsed = JSON.parse(settings);
    const discordWebhook = parsed.discordWebhook;

    if (!discordWebhook || !discordWebhook.trim()) {
      console.log("Discord webhook not configured");
      return;
    }

    const planEmoji = userPlan === 'vip' ? '👑' : '🎁';
    const planColor = userPlan === 'vip' ? 0xffd700 : 0x3498db; // Gold for VIP, Blue for FREE
    const successColor = 0x00ff00; // Green for success

    const date = new Date(timestamp);
    const timestampUnix = Math.floor(date.getTime() / 1000);
    
    // Acc Hub logo URL
    const accHubLogoUrl = "https://cdn.discordapp.com/attachments/1441466120631488754/1441474372614492232/acchub.png";
    
    const embed = {
      title: `✅ Account Generated Successfully!`,
      description: `**Category:** ${categoryName}\n**Account Email:** \`${accountEmail}\`\n\n${planEmoji} **${userPlan.toUpperCase()}** Generator - Successfully generated!`,
      color: successColor, // Green color for success
      thumbnail: {
        url: accHubLogoUrl,
      },
      fields: [
        {
          name: "👤 User",
          value: userEmail || userName || "Anonymous",
          inline: true,
        },
        {
          name: "📋 Plan",
          value: `${planEmoji} **${userPlan.toUpperCase()}**`,
          inline: true,
        },
        {
          name: "⏰ Generated At",
          value: `<t:${timestampUnix}:F>\n<t:${timestampUnix}:R>`,
          inline: false,
        },
      ],
      author: {
        name: "Acc Hub",
        icon_url: accHubLogoUrl,
        url: "https://your-platform-url.com", // Replace with your actual platform URL
      },
      footer: {
        text: "Acc Hub - Account Generator Platform",
        icon_url: accHubLogoUrl,
      },
      timestamp: timestamp,
    };

    const payload = {
      embeds: [embed],
    };

    const response = await fetch(discordWebhook, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      console.error("Discord webhook error:", response.status, response.statusText);
    }
  } catch (error) {
    console.error("Error sending Discord webhook:", error);
  }
};

