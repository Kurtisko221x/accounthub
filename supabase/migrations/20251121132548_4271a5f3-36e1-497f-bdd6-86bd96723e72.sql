-- Create categories table
CREATE TABLE IF NOT EXISTS public.categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  image_url text,
  created_at timestamptz DEFAULT now()
);

-- Create accounts table
CREATE TABLE IF NOT EXISTS public.accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id uuid REFERENCES public.categories(id) ON DELETE CASCADE NOT NULL,
  email text NOT NULL,
  password text NOT NULL,
  is_used boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  used_at timestamptz
);

-- Enable RLS
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;

-- Public policies for categories (anyone can view)
CREATE POLICY "Anyone can view categories" 
ON public.categories 
FOR SELECT 
USING (true);

-- Admin policies for categories (authenticated users can manage)
CREATE POLICY "Authenticated users can insert categories" 
ON public.categories 
FOR INSERT 
WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update categories" 
ON public.categories 
FOR UPDATE 
USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete categories" 
ON public.categories 
FOR DELETE 
USING (auth.role() = 'authenticated');

-- Admin policies for accounts (authenticated users can manage)
CREATE POLICY "Authenticated users can view all accounts" 
ON public.accounts 
FOR SELECT 
USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert accounts" 
ON public.accounts 
FOR INSERT 
WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update accounts" 
ON public.accounts 
FOR UPDATE 
USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete accounts" 
ON public.accounts 
FOR DELETE 
USING (auth.role() = 'authenticated');

-- Function to get stock count for a category
CREATE OR REPLACE FUNCTION public.get_category_stock_count(p_category_id uuid)
RETURNS integer
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COUNT(*)::integer
  FROM accounts
  WHERE category_id = p_category_id AND is_used = false;
$$;

-- Function to generate a random available account (public access)
CREATE OR REPLACE FUNCTION public.generate_account(p_category_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_account record;
BEGIN
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
  
  -- Return the account credentials
  RETURN json_build_object(
    'email', v_account.email,
    'password', v_account.password,
    'success', true
  );
END;
$$;