-- Update generate_account function to accept generator_type parameter
-- This allows explicitly selecting FREE or VIP accounts regardless of user plan
CREATE OR REPLACE FUNCTION public.generate_account(
  p_category_id uuid, 
  p_user_id uuid DEFAULT NULL,
  p_generator_type text DEFAULT NULL
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_account record;
  v_category_name text;
  v_user_plan text;
  v_generator_type text;
  v_account_quality text;
BEGIN
  -- Get category name
  SELECT name INTO v_category_name FROM categories WHERE id = p_category_id;
  
  -- Determine generator type
  -- Priority: 1. p_generator_type parameter, 2. user plan from DB, 3. default to 'free'
  IF p_generator_type IS NOT NULL AND p_generator_type IN ('free', 'vip') THEN
    v_generator_type := p_generator_type;
  ELSIF p_user_id IS NOT NULL THEN
    v_user_plan := get_user_plan(p_user_id);
    v_generator_type := v_user_plan;
  ELSE
    v_generator_type := 'free';
  END IF;
  
  -- Select account based on generator type
  IF v_generator_type = 'vip' THEN
    -- VIP generator: only VIP quality accounts
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
    -- FREE generator: only FREE quality accounts
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
        WHEN v_generator_type = 'vip' THEN 'No VIP accounts available for this service. Upgrade your plan or try another category.'
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
    'plan', v_generator_type,
    'quality', v_account.quality_level
  );
END;
$$;

