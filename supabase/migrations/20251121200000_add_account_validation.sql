-- Add account validation fields to accounts table
DO $$
BEGIN
    -- Add is_validated column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'accounts' 
        AND column_name = 'is_validated'
    ) THEN
        ALTER TABLE public.accounts 
        ADD COLUMN is_validated boolean DEFAULT false;
    END IF;
    
    -- Add validation_status column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'accounts' 
        AND column_name = 'validation_status'
    ) THEN
        ALTER TABLE public.accounts 
        ADD COLUMN validation_status text DEFAULT 'unknown' 
        CHECK (validation_status IN ('unknown', 'valid', 'invalid', 'testing', 'expired'));
    END IF;
    
    -- Add last_validated_at column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'accounts' 
        AND column_name = 'last_validated_at'
    ) THEN
        ALTER TABLE public.accounts 
        ADD COLUMN last_validated_at timestamptz;
    END IF;
    
    -- Add validation_notes column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'accounts' 
        AND column_name = 'validation_notes'
    ) THEN
        ALTER TABLE public.accounts 
        ADD COLUMN validation_notes text;
    END IF;
END $$;

-- Create validation_history table to track validation attempts
CREATE TABLE IF NOT EXISTS public.validation_history (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id uuid REFERENCES public.accounts(id) ON DELETE CASCADE NOT NULL,
    validation_status text NOT NULL CHECK (validation_status IN ('valid', 'invalid', 'unknown', 'testing', 'expired')),
    validation_method text, -- 'email_format', 'login_test', 'manual', 'auto'
    validation_result text, -- JSON or text description
    validated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at timestamptz DEFAULT now()
);

-- Enable RLS on validation_history
ALTER TABLE public.validation_history ENABLE ROW LEVEL SECURITY;

-- Policy for validation_history
DROP POLICY IF EXISTS "Authenticated users can view validation history" ON public.validation_history;
CREATE POLICY "Authenticated users can view validation history" 
ON public.validation_history 
FOR SELECT 
USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Authenticated users can insert validation history" ON public.validation_history;
CREATE POLICY "Authenticated users can insert validation history" 
ON public.validation_history 
FOR INSERT 
WITH CHECK (auth.role() = 'authenticated');

-- Function to validate email format
CREATE OR REPLACE FUNCTION public.validate_email_format(p_email text)
RETURNS boolean
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
    -- Basic email format validation
    RETURN p_email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$';
END;
$$;

-- Function to check if account should be validated again
CREATE OR REPLACE FUNCTION public.should_validate_account(p_account_id uuid, p_validation_period_hours integer DEFAULT 24)
RETURNS boolean
LANGUAGE plpgsql
AS $$
DECLARE
    v_last_validated timestamptz;
BEGIN
    SELECT last_validated_at INTO v_last_validated
    FROM public.accounts
    WHERE id = p_account_id;
    
    -- If never validated, should validate
    IF v_last_validated IS NULL THEN
        RETURN true;
    END IF;
    
    -- If validated more than period hours ago, should validate again
    RETURN v_last_validated < (now() - (p_validation_period_hours || ' hours')::interval);
END;
$$;

-- Function to update account validation status
CREATE OR REPLACE FUNCTION public.update_account_validation(
    p_account_id uuid,
    p_status text,
    p_notes text DEFAULT NULL,
    p_validated_by uuid DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Update account validation
    UPDATE public.accounts
    SET 
        is_validated = CASE WHEN p_status = 'valid' THEN true ELSE false END,
        validation_status = p_status,
        last_validated_at = now(),
        validation_notes = COALESCE(p_notes, validation_notes)
    WHERE id = p_account_id;
    
    -- Log validation history
    INSERT INTO public.validation_history (
        account_id,
        validation_status,
        validation_method,
        validation_result,
        validated_by
    )
    VALUES (
        p_account_id,
        p_status,
        'manual',
        p_notes,
        COALESCE(p_validated_by, auth.uid())
    );
END;
$$;

