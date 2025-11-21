-- Update get_category_stock_count to accept user_plan parameter
-- If user_plan is provided, count only accounts matching that quality level
-- If not provided, count all available accounts
CREATE OR REPLACE FUNCTION public.get_category_stock_count(
  p_category_id uuid,
  p_user_plan text DEFAULT NULL
)
RETURNS integer
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COUNT(*)::integer
  FROM accounts
  WHERE category_id = p_category_id 
    AND is_used = false
    AND (
      p_user_plan IS NULL 
      OR (p_user_plan = 'vip' AND COALESCE(quality_level, 'free') = 'vip')
      OR (p_user_plan = 'free' AND COALESCE(quality_level, 'free') = 'free')
    );
$$;
