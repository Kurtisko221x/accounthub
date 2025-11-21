-- Insert predefined categories for account types
-- This migration adds all common account categories

-- First, add unique constraint on name if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'categories_name_unique'
    ) THEN
        ALTER TABLE public.categories ADD CONSTRAINT categories_name_unique UNIQUE (name);
    END IF;
END $$;

-- Insert categories (only if they don't exist)
INSERT INTO public.categories (name, image_url)
SELECT * FROM (VALUES
-- Herné platformy
('Steam', 'https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/steam.svg'),
('Epic Games', 'https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/epicgames.svg'),
('Minecraft', 'https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/minecraft.svg'),
('Roblox', 'https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/roblox.svg'),
('Origin', 'https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/origin.svg'),
('Battle.net', 'https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/battledotnet.svg'),
('PlayStation Network (PSN)', 'https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/playstation.svg'),
('Xbox Live', 'https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/xbox.svg'),
('Nintendo', 'https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/nintendo.svg'),
('Ubisoft', 'https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/ubisoft.svg'),

-- Streamovacie služby
('Netflix', 'https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/netflix.svg'),
('Spotify', 'https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/spotify.svg'),
('Disney+', 'https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/disneyplus.svg'),
('HBO Max', 'https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/hbomax.svg'),
('YouTube Premium', 'https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/youtube.svg'),
('Twitch', 'https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/twitch.svg'),
('Crunchyroll', 'https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/crunchyroll.svg'),
('Paramount+', 'https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/paramountplus.svg'),
('Apple TV+', 'https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/appletv.svg'),
('Hulu', 'https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/hulu.svg'),
('Prime Video', 'https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/amazonprime.svg'),

-- Finančné a platobné
('PayPal', 'https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/paypal.svg'),
('Bankové účty', 'https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/visa.svg'),
('Kryptomenové burzy', 'https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/bitcoin.svg'),

-- E-mailové a komunikačné
('Gmail', 'https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/gmail.svg'),
('Outlook', 'https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/microsoftoutlook.svg'),
('Firemné e-maily', 'https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/microsoft.svg'),

-- Sociálne siete
('Facebook', 'https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/facebook.svg'),
('Instagram', 'https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/instagram.svg'),
('Twitter (X)', 'https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/x.svg'),
('TikTok', 'https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/tiktok.svg'),
('Discord', 'https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/discord.svg'),
('Reddit', 'https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/reddit.svg'),
('LinkedIn', 'https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/linkedin.svg'),
('Snapchat', 'https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/snapchat.svg'),
('Pinterest', 'https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/pinterest.svg'),
('Telegram', 'https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/telegram.svg'),

-- Softvérové a cloudové
('Adobe Creative Cloud', 'https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/adobe.svg'),
('Microsoft Office 365', 'https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/microsoftoffice.svg'),
('NordVPN', 'https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/nordvpn.svg'),
('ExpressVPN', 'https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/expressvpn.svg'),
('Surfshark', 'https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/surfshark.svg'),
('VPN služby', 'https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/vpn.svg'),
('Google Workspace', 'https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/google.svg'),
('Dropbox', 'https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/dropbox.svg'),
('iCloud', 'https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/icloud.svg'),
('OneDrive', 'https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/onedrive.svg'),
('Grammarly', 'https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/grammarly.svg'),
('Canva', 'https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/canva.svg'),
('Notion', 'https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/notion.svg'),

-- E-commerce a vernostné
('Amazon', 'https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/amazon.svg'),
('eBay', 'https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/ebay.svg'),
('Účty s uloženými kartami', 'https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/creditcard.svg')
) AS v(name, image_url)
WHERE NOT EXISTS (
    SELECT 1 FROM public.categories WHERE categories.name = v.name
);
