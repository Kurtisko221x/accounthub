-- Create users_profile table to track registered users
CREATE TABLE IF NOT EXISTS public.users_profile (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  email text NOT NULL,
  username text,
  plan text DEFAULT 'free' CHECK (plan IN ('free', 'vip')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create promo_codes table
CREATE TABLE IF NOT EXISTS public.promo_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  plan text DEFAULT 'vip' CHECK (plan IN ('free', 'vip')),
  used_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  used_at timestamptz,
  expires_at timestamptz,
  max_uses integer DEFAULT 1,
  current_uses integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Add quality and generator_type to accounts table
DO $$
BEGIN
    -- Add quality_level column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'accounts' 
        AND column_name = 'quality_level'
    ) THEN
        ALTER TABLE public.accounts 
        ADD COLUMN quality_level text DEFAULT 'free';
        
        ALTER TABLE public.accounts 
        ADD CONSTRAINT accounts_quality_level_check 
        CHECK (quality_level IN ('free', 'vip'));
    END IF;
    
    -- Add success_rate column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'accounts' 
        AND column_name = 'success_rate'
    ) THEN
        ALTER TABLE public.accounts 
        ADD COLUMN success_rate integer DEFAULT 10;
        
        ALTER TABLE public.accounts 
        ADD CONSTRAINT accounts_success_rate_check 
        CHECK (success_rate >= 0 AND success_rate <= 100);
    END IF;
END $$;

-- Create accounts_quality table to track account success rate (optional detailed tracking)
CREATE TABLE IF NOT EXISTS public.accounts_quality (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id uuid REFERENCES public.accounts(id) ON DELETE CASCADE UNIQUE,
  success_rate integer DEFAULT 50 CHECK (success_rate >= 0 AND success_rate <= 100),
  quality_level text DEFAULT 'standard' CHECK (quality_level IN ('low', 'standard', 'high', 'premium')),
  notes text,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.users_profile ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.promo_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.accounts_quality ENABLE ROW LEVEL SECURITY;

-- Policies for users_profile (drop if exists first)
DO $$
BEGIN
    -- Drop existing policies if they exist
    DROP POLICY IF EXISTS "Users can view their own profile" ON public.users_profile;
    DROP POLICY IF EXISTS "Users can update their own profile" ON public.users_profile;
    DROP POLICY IF EXISTS "Authenticated users can insert their profile" ON public.users_profile;
    DROP POLICY IF EXISTS "Authenticated admins can view all profiles" ON public.users_profile;
END $$;

CREATE POLICY "Users can view their own profile" 
ON public.users_profile 
FOR SELECT 
USING (auth.uid() = user_id OR auth.role() = 'authenticated');

CREATE POLICY "Users can update their own profile" 
ON public.users_profile 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Authenticated users can insert their profile" 
ON public.users_profile 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Authenticated admins can view all profiles" 
ON public.users_profile 
FOR SELECT 
USING (auth.role() = 'authenticated');

-- Policies for promo_codes (drop if exists first)
DO $$
BEGIN
    DROP POLICY IF EXISTS "Anyone can view active promo codes" ON public.promo_codes;
    DROP POLICY IF EXISTS "Authenticated users can redeem promo codes" ON public.promo_codes;
    DROP POLICY IF EXISTS "Authenticated admins can manage promo codes" ON public.promo_codes;
END $$;

CREATE POLICY "Anyone can view active promo codes" 
ON public.promo_codes 
FOR SELECT 
USING (used_at IS NULL AND (expires_at IS NULL OR expires_at > now()) AND current_uses < max_uses);

CREATE POLICY "Authenticated users can redeem promo codes" 
ON public.promo_codes 
FOR UPDATE 
USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated admins can manage promo codes" 
ON public.promo_codes 
FOR ALL 
USING (auth.role() = 'authenticated');

-- Policies for accounts_quality (drop if exists first)
DO $$
BEGIN
    DROP POLICY IF EXISTS "Authenticated users can view account quality" ON public.accounts_quality;
    DROP POLICY IF EXISTS "Authenticated admins can manage account quality" ON public.accounts_quality;
END $$;

CREATE POLICY "Authenticated users can view account quality" 
ON public.accounts_quality 
FOR SELECT 
USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated admins can manage account quality" 
ON public.accounts_quality 
FOR ALL 
USING (auth.role() = 'authenticated');

-- Function to get user plan
CREATE OR REPLACE FUNCTION public.get_user_plan(p_user_id uuid)
RETURNS text
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE((SELECT plan FROM users_profile WHERE user_id = p_user_id), 'free');
$$;

-- Function to redeem promo code
CREATE OR REPLACE FUNCTION public.redeem_promo_code(p_code text, p_user_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_code_record record;
  v_plan text;
BEGIN
  -- Get promo code
  SELECT * INTO v_code_record
  FROM promo_codes
  WHERE code = p_code
    AND (expires_at IS NULL OR expires_at > now())
    AND current_uses < max_uses
    AND used_at IS NULL;
  
  IF v_code_record IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Invalid or expired promo code');
  END IF;
  
  -- Check if already used by this user
  IF v_code_record.used_by = p_user_id THEN
    RETURN json_build_object('success', false, 'error', 'You have already used this code');
  END IF;
  
  -- Update promo code
  UPDATE promo_codes
  SET used_by = p_user_id,
      used_at = now(),
      current_uses = current_uses + 1
  WHERE id = v_code_record.id;
  
  -- Update or create user profile
  INSERT INTO users_profile (user_id, email, plan)
  VALUES (p_user_id, (SELECT email FROM auth.users WHERE id = p_user_id), v_code_record.plan)
  ON CONFLICT (user_id) 
  DO UPDATE SET plan = v_code_record.plan, updated_at = now();
  
  RETURN json_build_object('success', true, 'plan', v_code_record.plan);
END;
$$;

-- Update generate_account function to consider user plan and account quality
-- FREE generator: only accounts with quality_level = 'free' (10% success rate)
-- VIP generator: only accounts with quality_level = 'vip' (90% success rate)
CREATE OR REPLACE FUNCTION public.generate_account(p_category_id uuid, p_user_id uuid DEFAULT NULL)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_account record;
  v_category_name text;
  v_user_plan text;
  v_account_quality text;
BEGIN
  -- Get category name
  SELECT name INTO v_category_name FROM categories WHERE id = p_category_id;
  
  -- Get user plan (default to free if not provided)
  IF p_user_id IS NOT NULL THEN
    v_user_plan := get_user_plan(p_user_id);
  ELSE
    v_user_plan := 'free';
  END IF;
  
  -- Select account based on user plan - FREE users only get FREE accounts, VIP users only get VIP accounts
  IF v_user_plan = 'vip' THEN
    -- VIP users get only VIP quality accounts
    SELECT a.id, a.email, a.password, 
           COALESCE(a.success_rate, 90) as success_rate,
           COALESCE(a.quality_level, 'vip') as quality_level
    INTO v_account
    FROM accounts a
    WHERE a.category_id = p_category_id 
      AND a.is_used = false
      AND COALESCE(a.quality_level, 'free') = 'vip'
    ORDER BY random()
    LIMIT 1;
  ELSE
    -- FREE users get only FREE quality accounts
    SELECT a.id, a.email, a.password,
           COALESCE(a.success_rate, 10) as success_rate,
           COALESCE(a.quality_level, 'free') as quality_level
    INTO v_account
    FROM accounts a
    WHERE a.category_id = p_category_id 
      AND a.is_used = false
      AND COALESCE(a.quality_level, 'free') = 'free'
    ORDER BY random()
    LIMIT 1;
  END IF;
  
  IF v_account IS NULL THEN
    RETURN json_build_object(
      'error', 
      CASE 
        WHEN v_user_plan = 'vip' THEN 'No VIP accounts available for this service. Upgrade your plan or try another category.'
        ELSE 'No free accounts available for this service. Try again later or upgrade to VIP for better accounts.'
      END
    );
  END IF;
  
  -- Mark as used
  UPDATE accounts
  SET is_used = true, used_at = now()
  WHERE id = v_account.id;
  
  -- Log generation history
  INSERT INTO generation_history (category_id, category_name, email)
  VALUES (p_category_id, v_category_name, v_account.email);
  
  -- Return the account credentials with success rate info
  RETURN json_build_object(
    'email', v_account.email,
    'password', v_account.password,
    'success', true,
    'success_rate', v_account.success_rate,
    'plan', v_user_plan,
    'quality', v_account.quality_level
  );
END;
$$;

