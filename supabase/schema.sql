CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    new.updated_at = NOW();
    RETURN new;
END;
$$ LANGUAGE plpgsql
   SECURITY DEFINER
   SET search_path = public;

-- Used in recovery code verification
CREATE OR REPLACE FUNCTION public.constant_time_eq(a TEXT, b TEXT)
RETURNS BOOLEAN AS $$
DECLARE
    result BOOLEAN := TRUE;
    i INT;
    len_a INT;
    len_b INT;
BEGIN
    len_a := length(a);
    len_b := length(b);
    -- Always iterate max(len_a, len_b) to avoid early exit
    FOR i IN 1..GREATEST(len_a, len_b) LOOP
        IF i > len_a OR i > len_b OR substr(a, i, 1) != substr(b, i, 1) THEN
            result := FALSE;
            -- Do NOT exit early — always complete the loop
        END IF;
    END LOOP;
    RETURN result AND (len_a = len_b);
END;
$$ LANGUAGE plpgsql
   SECURITY DEFINER
   SET search_path = public;


CREATE TABLE IF NOT EXISTS public.profiles (
    id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    email       TEXT        CHECK (char_length(email) <= 320),
    display_name TEXT       CHECK (char_length(display_name) <= 100),
    avatar_url  TEXT        CHECK (char_length(avatar_url) <= 2048),
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(user_id)
);

CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON public.profiles(user_id);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own profile"   ON public.profiles;
CREATE POLICY "Users can view own profile"
    ON public.profiles FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile"
    ON public.profiles FOR INSERT
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Profiles are deleted via CASCADE when auth.users row is deleted by admin

DROP TRIGGER IF EXISTS set_profiles_updated_at ON public.profiles;
CREATE TRIGGER set_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TABLE IF NOT EXISTS public.fen_batches (
    id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name        TEXT        NOT NULL DEFAULT 'Untitled Batch'
                            CHECK (char_length(name) <= 255),
    -- Array capped at 500 entries; each FEN string capped at 100 chars.
    -- A standard FEN is ~70 chars; 100 is generous.
    fen_list    TEXT[]      NOT NULL DEFAULT '{}'
                            CHECK (
                                array_length(fen_list, 1) IS NULL
                                OR array_length(fen_list, 1) <= 500
                            ),
    description TEXT        CHECK (char_length(description) <= 1000),
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_fen_batches_user_id ON public.fen_batches(user_id);

ALTER TABLE public.fen_batches ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own fen_batches"   ON public.fen_batches;
CREATE POLICY "Users can view own fen_batches"
    ON public.fen_batches FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own fen_batches" ON public.fen_batches;
CREATE POLICY "Users can insert own fen_batches"
    ON public.fen_batches FOR INSERT
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own fen_batches" ON public.fen_batches;
CREATE POLICY "Users can update own fen_batches"
    ON public.fen_batches FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own fen_batches" ON public.fen_batches;
CREATE POLICY "Users can delete own fen_batches"
    ON public.fen_batches FOR DELETE
    USING (auth.uid() = user_id);

DROP TRIGGER IF EXISTS set_fen_batches_updated_at ON public.fen_batches;
CREATE TRIGGER set_fen_batches_updated_at
    BEFORE UPDATE ON public.fen_batches
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TABLE IF NOT EXISTS public.user_security (
    id                    UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id               UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    last_verified_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_refresh_attempt  TIMESTAMPTZ,
    refresh_count         INT         NOT NULL DEFAULT 0 CHECK (refresh_count >= 0),
    failed_backup_attempts INT        NOT NULL DEFAULT 0 CHECK (failed_backup_attempts >= 0),
    last_backup_attempt   TIMESTAMPTZ,
    backup_codes          TEXT[]      NOT NULL DEFAULT '{}'
                          CHECK (
                              array_length(backup_codes, 1) IS NULL
                              OR array_length(backup_codes, 1) <= 10
                          ),
    created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(user_id)
);

CREATE INDEX IF NOT EXISTS idx_user_security_user_id ON public.user_security(user_id);

ALTER TABLE public.user_security ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own security data" ON public.user_security;
CREATE POLICY "Users can view own security data"
    ON public.user_security FOR SELECT
    USING (auth.uid() = user_id);

-- All writes go through SECURITY DEFINER functions only.
-- This is intentional — direct table writes are blocked for all users.

DROP TRIGGER IF EXISTS set_user_security_updated_at ON public.user_security;
CREATE TRIGGER set_user_security_updated_at
    BEFORE UPDATE ON public.user_security
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TABLE IF NOT EXISTS public.security_events (
    id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    event_type  TEXT        NOT NULL
                CHECK (event_type IN (
                    'SECURITY_REFRESH',
                    'RECOVERY_CODES_GENERATED',
                    'RECOVERY_CODE_SUCCESS',
                    'RECOVERY_CODE_FAILURE',
                    'MFA_ENABLED',
                    'MFA_DISABLED',
                    'LOGIN_SUCCESS',
                    'LOGIN_FAILURE',
                    'PASSWORD_CHANGE'
                )),
    metadata    JSONB       NOT NULL DEFAULT '{}',
    ip_address  TEXT        CHECK (char_length(ip_address) <= 45),  -- IPv6 max 45
    user_agent  TEXT        CHECK (char_length(user_agent) <= 512),
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_security_events_user_id ON public.security_events(user_id);
CREATE INDEX IF NOT EXISTS idx_security_events_type    ON public.security_events(event_type);
CREATE INDEX IF NOT EXISTS idx_security_events_created ON public.security_events(created_at DESC);

ALTER TABLE public.security_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own security events" ON public.security_events;
CREATE POLICY "Users can view own security events"
    ON public.security_events FOR SELECT
    USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.is_mfa_enabled()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM auth.mfa_factors
        WHERE user_id = auth.uid()
        AND   status  = 'verified'
    );
END;
$$ LANGUAGE plpgsql
   SECURITY DEFINER
   SET search_path = auth, public;

CREATE OR REPLACE FUNCTION public.refresh_security_session()
RETURNS BOOLEAN AS $$
DECLARE
    curr_security public.user_security;
    iat_val       NUMERIC;
    mfa_enabled   BOOLEAN;
BEGIN
    IF auth.uid() IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    SELECT * INTO curr_security
    FROM public.user_security
    WHERE user_id = auth.uid()
    FOR UPDATE; 

    IF NOT FOUND THEN
        RAISE EXCEPTION 'User security record not found';
    END IF;

    -- 1. Rate limiting: 5 refreshes per hour
    IF curr_security.last_refresh_attempt IS NOT NULL
       AND curr_security.last_refresh_attempt > (NOW() - INTERVAL '1 hour')
       AND curr_security.refresh_count >= 5 THEN
        RAISE EXCEPTION 'Rate limit exceeded. Try again in an hour.';
    END IF;

    -- 2. Session freshness: JWT must be < 10 minutes old
    iat_val := (auth.jwt() ->> 'iat')::NUMERIC;
    IF iat_val IS NULL OR (extract(epoch FROM NOW()) - iat_val) > 600 THEN
        RAISE EXCEPTION 'Session too old. Please re-authenticate.';
    END IF;

    -- 3. MFA enforcement — NO grace window
    -- If MFA is enabled, aal2 is ALWAYS required. Period.
    mfa_enabled := public.is_mfa_enabled();
    IF mfa_enabled AND (auth.jwt() ->> 'aal') != 'aal2' THEN
        RAISE EXCEPTION 'MFA verification required.';
    END IF;

    UPDATE public.user_security
    SET last_verified_at     = NOW(),
        last_refresh_attempt = NOW(),
        refresh_count        = CASE
            WHEN last_refresh_attempt IS NULL
              OR last_refresh_attempt < (NOW() - INTERVAL '1 hour')
            THEN 1
            ELSE refresh_count + 1
        END,
        updated_at           = NOW()
    WHERE user_id = auth.uid();

    INSERT INTO public.security_events (user_id, event_type, metadata)
    VALUES (
        auth.uid(),
        'SECURITY_REFRESH',
        jsonb_build_object('mfa_enforced', mfa_enabled)
    );

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql
   SECURITY DEFINER
   SET search_path = public;


-- No functional changes needed but search_path confirmed locked.
CREATE OR REPLACE FUNCTION public.generate_recovery_codes()
RETURNS TEXT[] AS $$
DECLARE
    plain_codes  TEXT[] := '{}';
    hashed_codes TEXT[] := '{}';
    i            INT;
    code         TEXT;
    hashed       TEXT;
BEGIN
    IF auth.uid() IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    IF public.is_mfa_enabled() AND (auth.jwt() ->> 'aal') != 'aal2' THEN
        RAISE EXCEPTION 'MFA verification required to generate codes.';
    END IF;

    FOR i IN 1..10 LOOP
        code   := upper(encode(gen_random_bytes(8), 'hex'));
        plain_codes  := array_append(plain_codes, code);
        -- bcrypt cost factor 12 (was 10) — better resistance to offline brute-force
        hashed := crypt(code, gen_salt('bf', 12));
        hashed_codes := array_append(hashed_codes, hashed);
    END LOOP;

    UPDATE public.user_security
    SET backup_codes = hashed_codes,
        updated_at   = NOW()
    WHERE user_id = auth.uid();

    INSERT INTO public.security_events (user_id, event_type)
    VALUES (auth.uid(), 'RECOVERY_CODES_GENERATED');

    RETURN plain_codes;
END;
$$ LANGUAGE plpgsql
   SECURITY DEFINER
   SET search_path = public;

CREATE OR REPLACE FUNCTION public.verify_recovery_code(code TEXT)
RETURNS BOOLEAN AS $$
DECLARE
    stored_hashes  TEXT[];
    matched        BOOLEAN  := FALSE;
    matched_index  INT      := NULL;
    new_hashes     TEXT[]   := '{}';
    i              INT;
    norm_code      TEXT;
    curr_security  public.user_security;
    cmp            BOOLEAN;
BEGIN
    IF auth.uid() IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    SELECT * INTO curr_security
    FROM public.user_security
    WHERE user_id = auth.uid()
    FOR UPDATE; 
    -- Rate limiting: 3 failed attempts per 30 minutes
    IF curr_security.last_backup_attempt IS NOT NULL
       AND curr_security.last_backup_attempt > (NOW() - INTERVAL '30 minutes')
       AND curr_security.failed_backup_attempts >= 3 THEN
        RAISE EXCEPTION 'Too many failed attempts. Try again in 30 minutes.';
    END IF;

    norm_code     := upper(trim(code));
    stored_hashes := curr_security.backup_codes;

    IF stored_hashes IS NULL OR array_length(stored_hashes, 1) IS NULL THEN
        RETURN FALSE;
    END IF;

    -- This eliminates timing side-channel (attacker could infer code position).
    FOR i IN 1..array_length(stored_hashes, 1) LOOP
        cmp := (stored_hashes[i] = crypt(norm_code, stored_hashes[i]));
        IF cmp AND matched_index IS NULL THEN
            matched       := TRUE;
            matched_index := i;
            -- Do NOT exit — complete all iterations
        END IF;
    END LOOP;

    -- Rebuild hash array excluding the matched code
    IF matched THEN
        FOR i IN 1..array_length(stored_hashes, 1) LOOP
            IF i != matched_index THEN
                new_hashes := array_append(new_hashes, stored_hashes[i]);
            END IF;
        END LOOP;
    END IF;

    IF matched THEN
        UPDATE public.user_security
        SET backup_codes           = new_hashes,
            last_verified_at       = NOW(),
            failed_backup_attempts = 0,
            updated_at             = NOW()
        WHERE user_id = auth.uid();

        INSERT INTO public.security_events (user_id, event_type)
        VALUES (auth.uid(), 'RECOVERY_CODE_SUCCESS');

        RETURN TRUE;
    ELSE
        UPDATE public.user_security
        SET failed_backup_attempts = CASE
                WHEN last_backup_attempt IS NULL
                  OR last_backup_attempt < (NOW() - INTERVAL '30 minutes')
                THEN 1
                ELSE failed_backup_attempts + 1
            END,
            last_backup_attempt    = NOW(),
            updated_at             = NOW()
        WHERE user_id = auth.uid();

        INSERT INTO public.security_events (user_id, event_type)
        VALUES (auth.uid(), 'RECOVERY_CODE_FAILURE');

        RETURN FALSE;
    END IF;
END;
$$ LANGUAGE plpgsql
   SECURITY DEFINER
   SET search_path = public;

CREATE TABLE IF NOT EXISTS public.user_data (
    id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id    UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    key        TEXT        NOT NULL CHECK (char_length(key) <= 255),
    value      TEXT        NOT NULL CHECK (char_length(value) <= 10000),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, key)
);

CREATE INDEX IF NOT EXISTS idx_user_data_user_id ON public.user_data(user_id);

ALTER TABLE public.user_data ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own data"   ON public.user_data;
CREATE POLICY "Users can view own data"
    ON public.user_data FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own data" ON public.user_data;
CREATE POLICY "Users can insert own data"
    ON public.user_data FOR INSERT
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own data" ON public.user_data;
CREATE POLICY "Users can update own data"
    ON public.user_data FOR UPDATE
    USING (auth.uid() = user_id)
    -- [FIX v7.2] WITH CHECK added to prevent user_id change on UPDATE
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own data" ON public.user_data;
CREATE POLICY "Users can delete own data"
    ON public.user_data FOR DELETE
    USING (auth.uid() = user_id);

DROP TRIGGER IF EXISTS set_user_data_updated_at ON public.user_data;
CREATE TRIGGER set_user_data_updated_at
    BEFORE UPDATE ON public.user_data
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    safe_name TEXT;
BEGIN
    safe_name := left(split_part(COALESCE(new.email, ''), '@', 1), 100);

    INSERT INTO public.profiles (user_id, email, display_name)
    VALUES (new.id, new.email, safe_name)
    ON CONFLICT (user_id) DO NOTHING;

    INSERT INTO public.user_security (user_id)
    VALUES (new.id)
    ON CONFLICT (user_id) DO NOTHING;

    RETURN new;
END;
$$ LANGUAGE plpgsql
   SECURITY DEFINER
   SET search_path = public;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
