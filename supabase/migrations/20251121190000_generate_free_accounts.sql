-- Generate varied FREE accounts for each category
-- OPTIMIZED: Simple approach with smaller batches to avoid timeout
-- Run this script multiple times if needed - it will skip categories that already have enough accounts

DO $$
DECLARE
    category_record RECORD;
    existing_count INTEGER;
    target_count INTEGER;
    needed_count INTEGER;
    batch_size INTEGER := 200; -- Smaller batches to avoid timeout
    i INTEGER;
    random_email TEXT;
    random_password TEXT;
    email_domains TEXT[] := ARRAY['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'icloud.com', 'mail.com', 'protonmail.com'];
    random_words TEXT[] := ARRAY['user', 'account', 'test', 'demo', 'temp', 'free', 'new', 'old', 'alpha', 'beta', 'gamma', 'delta'];
BEGIN
    -- Process only first few categories at a time to avoid timeout
    FOR category_record IN 
        SELECT id, name FROM public.categories 
        ORDER BY name
        LIMIT 5 -- Process 5 categories at a time
    LOOP
        -- Determine target count (reduced numbers to avoid timeout)
        IF category_record.name IN ('Steam', 'Netflix', 'Spotify', 'Gmail', 'Facebook') THEN
            target_count := 5000; -- Reduced from 20,000
        ELSIF category_record.name IN ('Epic Games', 'Minecraft', 'Roblox', 'PayPal', 'Amazon') THEN
            target_count := 3000; -- Reduced from 15,000
        ELSIF category_record.name IN ('Disney+', 'HBO Max', 'Apple TV+', 'NordVPN', 'ExpressVPN') THEN
            target_count := 2000; -- Reduced from 10,000
        ELSIF category_record.name IN ('Crunchyroll', 'Paramount+', 'Hulu', 'Snapchat', 'Reddit') THEN
            target_count := 1000; -- Reduced from 5,000
        ELSIF category_record.name IN ('Surfshark', 'Dropbox', 'iCloud', 'Outlook', 'Telegram') THEN
            target_count := 500; -- Reduced from 2,000
        ELSIF category_record.name IN ('Origin', 'Battle.net', 'Nintendo', 'Ubisoft') THEN
            target_count := 300; -- Reduced from 500
        ELSE
            target_count := 120; -- Default
        END IF;
        
        -- Check existing count
        SELECT COUNT(*) INTO existing_count
        FROM public.accounts
        WHERE category_id = category_record.id
          AND quality_level = 'free'
          AND is_used = false;
        
        needed_count := target_count - existing_count;
        
        IF needed_count > 0 THEN
            RAISE NOTICE 'Category: % | Existing: % | Target: % | Need: %', 
                category_record.name, existing_count, target_count, needed_count;
            
            -- Generate in small batches
            FOR i IN 1..needed_count LOOP
                -- Simple random email
                random_email := (
                    random_words[1 + floor(random() * array_length(random_words, 1))::int] ||
                    floor(random() * 99999)::text ||
                    random_words[1 + floor(random() * array_length(random_words, 1))::int] ||
                    floor(random() * 999999)::text ||
                    '@' ||
                    email_domains[1 + floor(random() * array_length(email_domains, 1))::int]
                );
                
                -- Simple random password
                random_password := (
                    chr(65 + floor(random() * 26)::int) ||
                    chr(97 + floor(random() * 26)::int) ||
                    floor(random() * 100000)::text ||
                    chr(65 + floor(random() * 26)::int) ||
                    chr(97 + floor(random() * 26)::int)
                );
                
                -- Insert (skip on duplicate)
                BEGIN
                    INSERT INTO public.accounts (category_id, email, password, quality_level, success_rate, is_used)
                    VALUES (category_record.id, random_email, random_password, 'free', 10, false);
                EXCEPTION WHEN OTHERS THEN
                    -- Skip duplicate or other errors
                    NULL;
                END;
                
                -- Progress update every batch
                IF i % batch_size = 0 THEN
                    RAISE NOTICE 'Generated % accounts for %', i, category_record.name;
                    COMMIT; -- Explicit commit every batch
                END IF;
            END LOOP;
            
            RAISE NOTICE 'Completed: %', category_record.name;
        ELSE
            RAISE NOTICE 'Skipping: % (already has % accounts)', category_record.name, existing_count;
        END IF;
    END LOOP;
    
    RAISE NOTICE 'Batch processing complete. Run again to process more categories.';
END $$;
