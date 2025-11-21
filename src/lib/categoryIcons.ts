// Category icon mapping - emoji icons as fallback for category images
export const getCategoryIcon = (categoryName: string): string => {
  const iconMap: Record<string, string> = {
    // Gaming Platforms
    'Steam': '🎮',
    'Epic Games': '🎯',
    'Minecraft': '⛏️',
    'Roblox': '🎮',
    'Origin': '🎮',
    'Battle.net': '⚔️',
    'PlayStation': '🎮',
    'PlayStation Network (PSN)': '🎮',
    'Xbox': '🎮',
    'Xbox Live': '🎮',
    'Nintendo': '🎮',
    'Ubisoft': '🎮',
    
    // Streaming Services
    'Netflix': '📺',
    'Spotify': '🎵',
    'Disney+': '🏰',
    'HBO Max': '📺',
    'HBO': '📺',
    'Disney Plus': '🏰',
    'Disney': '🏰',
    'YouTube Premium': '📺',
    'YouTube': '📺',
    'Twitch': '📺',
    'Crunchyroll': '📺',
    'Paramount+': '📺',
    'Paramount Plus': '📺',
    'Apple TV+': '📺',
    'Apple TV': '📺',
    'Hulu': '📺',
    'Prime Video': '📺',
    
    // Financial & Payment
    'PayPal': '💰',
    'Bankové účty': '🏦',
    'VISA Bankové účty': '🏦',
    'Bank': '🏦',
    'Kryptomenové burzy': '₿',
    'PlayStation Network (PSN)': '🎮',
    'PlayStation': '🎮',
    'Xbox Live': '🎮',
    'Xbox': '🎮',
    'Twitter (X)': '🐦',
    'Účty s uloženými kartami': '💳',
    'VPN služby': '🔒',
    'Crypto': '₿',
    'Bitcoin': '₿',
    
    // Email & Communication
    'Gmail': '📧',
    'Outlook': '📧',
    'Firemné e-maily': '📧',
    'Email': '📧',
    
    // Social Media
    'Facebook': '👤',
    'Instagram': '📸',
    'Twitter': '🐦',
    'Twitter (X)': '🐦',
    'TikTok': '🎵',
    'X': '🐦',
    'Discord': '💬',
    'Reddit': '👤',
    'LinkedIn': '💼',
    'Snapchat': '📸',
    'Pinterest': '📌',
    'Telegram': '✈️',
    
    // Software & Cloud
    'Adobe Creative Cloud': '🎨',
    'Adobe': '🎨',
    'Microsoft Office 365': '💼',
    'Office': '💼',
    'Office 365': '💼',
    'NordVPN': '🔒',
    'ExpressVPN': '🔒',
    'Surfshark': '🔒',
    'VPN': '🔒',
    'VPN služby': '🔒',
    'Google Workspace': '☁️',
    'Dropbox': '📦',
    'iCloud': '☁️',
    'OneDrive': '☁️',
    'Grammarly': '✍️',
    'Canva': '🎨',
    'Notion': '📝',
    
    // E-commerce
    'Amazon': '📦',
    'eBay': '🛒',
    
    // Default
    'default': '📦'
  };

  // Try to find exact match first
  if (iconMap[categoryName]) {
    return iconMap[categoryName];
  }

  // Try case-insensitive match
  const lowerName = categoryName.toLowerCase();
  for (const [key, icon] of Object.entries(iconMap)) {
    if (key.toLowerCase() === lowerName) {
      return icon;
    }
  }

  // Try partial match
  for (const [key, icon] of Object.entries(iconMap)) {
    if (lowerName.includes(key.toLowerCase()) || key.toLowerCase().includes(lowerName)) {
      return icon;
    }
  }

  // Return default if no match found
  return iconMap.default;
};
