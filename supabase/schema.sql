-- Create user_security table with RLS
CREATE TABLE IF NOT EXISTS public.user_security (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    last_verified_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    -- We store hashed backup codes to prevent plain-text exposure in the DB
    backup_codes TEXT[] NOT NULL DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE public.user_security ENABLE ROW LEVEL SECURITY;

-- Create Policies
-- Users can read their own security settings
CREATE POLICY "Users can view own security data" 
    ON public.user_security 
    FOR SELECT 
    USING (auth.uid() = user_id);

-- Users can update their own security settings (e.g., updating last_verified_at or burning backup codes)
CREATE POLICY "Users can update own security data" 
    ON public.user_security 
    FOR UPDATE 
    USING (auth.uid() = user_id);

-- Function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user_security()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.user_security (user_id)
    VALUES (new.id);
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create user_security row on signup
CREATE OR REPLACE TRIGGER on_auth_user_created_security
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_security();
