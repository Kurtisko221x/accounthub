-- Add generation_history table
CREATE TABLE IF NOT EXISTS public.generation_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id uuid REFERENCES public.categories(id) ON DELETE SET NULL,
  category_name text,
  email text,
  generated_at timestamptz DEFAULT now(),
  ip_address text,
  user_agent text
);

-- Add activity_log table
CREATE TABLE IF NOT EXISTS public.activity_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  action text NOT NULL,
  entity_type text,
  entity_id uuid,
  details jsonb,
  created_at timestamptz DEFAULT now()
);

-- Add settings table for platform configuration
CREATE TABLE IF NOT EXISTS public.settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text UNIQUE NOT NULL,
  value jsonb NOT NULL,
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.generation_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

-- Policies for generation_history (authenticated users can view)
CREATE POLICY "Authenticated users can view generation history" 
ON public.generation_history 
FOR SELECT 
USING (auth.role() = 'authenticated');

CREATE POLICY "Anyone can insert generation history" 
ON public.generation_history 
FOR INSERT 
WITH CHECK (true);

-- Policies for activity_log (authenticated users can view and insert)
CREATE POLICY "Authenticated users can view activity log" 
ON public.activity_log 
FOR SELECT 
USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert activity log" 
ON public.activity_log 
FOR INSERT 
WITH CHECK (auth.role() = 'authenticated');

-- Policies for settings (authenticated users can manage)
CREATE POLICY "Authenticated users can view settings" 
ON public.settings 
FOR SELECT 
USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can manage settings" 
ON public.settings 
FOR ALL 
USING (auth.role() = 'authenticated');

-- Function to log activity
CREATE OR REPLACE FUNCTION public.log_activity(
  p_action text,
  p_entity_type text DEFAULT NULL,
  p_entity_id uuid DEFAULT NULL,
  p_details jsonb DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO activity_log (user_id, action, entity_type, entity_id, details)
  VALUES (auth.uid(), p_action, p_entity_type, p_entity_id, p_details);
END;
$$;

-- Update generate_account function to log history
CREATE OR REPLACE FUNCTION public.generate_account(p_category_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_account record;
  v_category_name text;
BEGIN
  -- Get category name
  SELECT name INTO v_category_name FROM categories WHERE id = p_category_id;
  
  -- Get a random available account
  SELECT id, email, password INTO v_account
  FROM accounts
  WHERE category_id = p_category_id AND is_used = false
  ORDER BY random()
  LIMIT 1;
  
  IF v_account IS NULL THEN
    RETURN json_build_object('error', 'No accounts available for this service');
  END IF;
  
  -- Mark as used
  UPDATE accounts
  SET is_used = true, used_at = now()
  WHERE id = v_account.id;
  
  -- Log generation history
  INSERT INTO generation_history (category_id, category_name, email)
  VALUES (p_category_id, v_category_name, v_account.email);
  
  -- Return the account credentials
  RETURN json_build_object(
    'email', v_account.email,
    'password', v_account.password,
    'success', true
  );
END;
$$;

