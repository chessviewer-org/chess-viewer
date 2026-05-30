CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ---------------------------------------------------------------------------
-- Shared trigger: stamp updated_at on every UPDATE.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    new.updated_at = NOW();
    RETURN new;
END;
$$ LANGUAGE plpgsql
   SECURITY DEFINER
   SET search_path = public, pg_temp;

-- ---------------------------------------------------------------------------
-- Constant-time string compare (used for defensive equality checks).
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.constant_time_eq(a TEXT, b TEXT)
RETURNS BOOLEAN AS $$
DECLARE
    result BOOLEAN := TRUE;
    i      INT;
    len_a  INT;
    len_b  INT;
BEGIN
    len_a := length(a);
    len_b := length(b);
    -- Always iterate max(len_a, len_b) to avoid early exit (timing side-channel).
    FOR i IN 1..GREATEST(len_a, len_b) LOOP
        IF i > len_a OR i > len_b OR substr(a, i, 1) != substr(b, i, 1) THEN
            result := FALSE;
            -- Do NOT exit early — always complete the loop.
        END IF;
    END LOOP;
    RETURN result AND (len_a = len_b);
END;
$$ LANGUAGE plpgsql
   IMMUTABLE
   SECURITY DEFINER
   SET search_path = public, pg_temp;

-- ---------------------------------------------------------------------------
-- ISSUE #1 — Array element-length validators.
-- CHECK constraints can only cap array LENGTH, not the size of each element.
-- These IMMUTABLE helpers cap both, blocking oversized-string payloads.
-- ---------------------------------------------------------------------------

-- fen_list: <=500 entries, each non-empty and <=100 chars (a standard FEN ~70).
CREATE OR REPLACE FUNCTION public.validate_fen_list(arr TEXT[])
RETURNS BOOLEAN AS $$
DECLARE
    el TEXT;
BEGIN
    IF arr IS NULL THEN
        RETURN TRUE;
    END IF;
    IF array_length(arr, 1) IS NOT NULL AND array_length(arr, 1) > 500 THEN
        RETURN FALSE;
    END IF;
    FOREACH el IN ARRAY arr LOOP
        -- NULL element or out-of-range length is rejected.
        IF el IS NULL OR char_length(el) = 0 OR char_length(el) > 100 THEN
            RETURN FALSE;
        END IF;
    END LOOP;
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql
   IMMUTABLE
   SET search_path = public, pg_temp;

-- backup_codes: <=10 entries, each a bcrypt hash (60 chars) — cap at 255 to be
-- safe while still blocking massive strings. Empty array is valid (none issued).
CREATE OR REPLACE FUNCTION public.validate_backup_codes(arr TEXT[])
RETURNS BOOLEAN AS $$
DECLARE
    el TEXT;
BEGIN
    IF arr IS NULL THEN
        RETURN TRUE;
    END IF;
    IF array_length(arr, 1) IS NOT NULL AND array_length(arr, 1) > 10 THEN
        RETURN FALSE;
    END IF;
    FOREACH el IN ARRAY arr LOOP
        IF el IS NULL OR char_length(el) = 0 OR char_length(el) > 255 THEN
            RETURN FALSE;
        END IF;
    END LOOP;
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql
   IMMUTABLE
   SET search_path = public, pg_temp;

-- ===========================================================================
-- TABLE: profiles
-- ===========================================================================
CREATE TABLE IF NOT EXISTS public.profiles (
    id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id      UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    email        TEXT        CHECK (email IS NULL OR char_length(email) <= 320),
    display_name TEXT        CHECK (display_name IS NULL OR char_length(display_name) <= 100),
    avatar_url   TEXT        CHECK (avatar_url IS NULL OR char_length(avatar_url) <= 2048),
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (user_id)
);

CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON public.profiles(user_id);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
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
-- Profiles are removed via CASCADE when the auth.users row is deleted.

DROP TRIGGER IF EXISTS set_profiles_updated_at ON public.profiles;
CREATE TRIGGER set_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ===========================================================================
-- TABLE: fen_batches
-- ===========================================================================
CREATE TABLE IF NOT EXISTS public.fen_batches (
    id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name        TEXT        NOT NULL DEFAULT 'Untitled Batch'
                            CHECK (char_length(name) <= 255),
    -- ISSUE #1: validate both array length AND each element's length.
    fen_list    TEXT[]      NOT NULL DEFAULT '{}'
                            CHECK (public.validate_fen_list(fen_list)),
    description TEXT        CHECK (description IS NULL OR char_length(description) <= 1000),
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_fen_batches_user_id ON public.fen_batches(user_id);

ALTER TABLE public.fen_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fen_batches FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own fen_batches" ON public.fen_batches;
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

-- ===========================================================================
-- TABLE: user_security  (SELECT-only for users; writes via functions only)
-- ===========================================================================
-- Rate-limit counters (refresh_count, failed_backup_attempts, …) have moved to
-- the generic rate_limit_ledger. This table now holds only durable security
-- state: the 90-day verification timestamp and the backup-code hashes.
CREATE TABLE IF NOT EXISTS public.user_security (
    id                     UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id                UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    last_verified_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    -- ISSUE #1: validate both array length AND each element's length.
    backup_codes           TEXT[]      NOT NULL DEFAULT '{}'
                           CHECK (public.validate_backup_codes(backup_codes)),
    created_at             TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at             TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (user_id)
);

-- Migration: shed the legacy counter columns from already-provisioned tables
-- (CREATE TABLE IF NOT EXISTS is a no-op when the table already exists).
ALTER TABLE public.user_security DROP COLUMN IF EXISTS last_refresh_attempt;
ALTER TABLE public.user_security DROP COLUMN IF EXISTS refresh_count;
ALTER TABLE public.user_security DROP COLUMN IF EXISTS failed_backup_attempts;
ALTER TABLE public.user_security DROP COLUMN IF EXISTS last_backup_attempt;

CREATE INDEX IF NOT EXISTS idx_user_security_user_id ON public.user_security(user_id);

-- NOTE: ENABLE (not FORCE) — the SECURITY DEFINER functions run as the table
-- owner and MUST be able to write this table. FORCE would apply RLS to the
-- owner too and, with no write policy present, block those functions entirely.
-- Client write access is instead blocked by the REVOKE below + absent policies.
ALTER TABLE public.user_security ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own security data" ON public.user_security;
CREATE POLICY "Users can view own security data"
    ON public.user_security FOR SELECT
    USING (auth.uid() = user_id);

-- ISSUE #2: NO INSERT/UPDATE/DELETE policies — intentional default-deny.
-- All mutations occur inside the SECURITY DEFINER functions below, which run
-- with FORCE RLS bypassed by virtue of being the table owner's definer context.
-- Revoke direct DML grants from client roles as belt-and-suspenders.
REVOKE INSERT, UPDATE, DELETE ON public.user_security FROM anon, authenticated;

DROP TRIGGER IF EXISTS set_user_security_updated_at ON public.user_security;
CREATE TRIGGER set_user_security_updated_at
    BEFORE UPDATE ON public.user_security
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ===========================================================================
-- TABLE: security_events  (SELECT-only for users; appended by functions only)
-- ===========================================================================
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
    ip_address  TEXT        CHECK (ip_address IS NULL OR char_length(ip_address) <= 45),  -- IPv6 max 45
    user_agent  TEXT        CHECK (user_agent IS NULL OR char_length(user_agent) <= 512),
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_security_events_user_id ON public.security_events(user_id);
CREATE INDEX IF NOT EXISTS idx_security_events_type    ON public.security_events(event_type);
CREATE INDEX IF NOT EXISTS idx_security_events_created ON public.security_events(created_at DESC);

-- NOTE: ENABLE (not FORCE) — same rationale as user_security: the audit-log
-- INSERTs happen inside SECURITY DEFINER functions running as the owner.
ALTER TABLE public.security_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own security events" ON public.security_events;
CREATE POLICY "Users can view own security events"
    ON public.security_events FOR SELECT
    USING (auth.uid() = user_id);

-- ISSUE #2: NO write policies — events are an append-only audit log written
-- only by the SECURITY DEFINER functions. Block direct client DML.
REVOKE INSERT, UPDATE, DELETE ON public.security_events FROM anon, authenticated;

-- ===========================================================================
-- TABLE: user_data  (E2EE KV store; full user-scoped CRUD)
-- ===========================================================================
CREATE TABLE IF NOT EXISTS public.user_data (
    id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id    UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    key        TEXT        NOT NULL CHECK (char_length(key) <= 255),
    value      TEXT        NOT NULL CHECK (char_length(value) <= 10000),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (user_id, key)
);

CREATE INDEX IF NOT EXISTS idx_user_data_user_id ON public.user_data(user_id);

ALTER TABLE public.user_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_data FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own data" ON public.user_data;
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
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own data" ON public.user_data;
CREATE POLICY "Users can delete own data"
    ON public.user_data FOR DELETE
    USING (auth.uid() = user_id);

DROP TRIGGER IF EXISTS set_user_data_updated_at ON public.user_data;
CREATE TRIGGER set_user_data_updated_at
    BEFORE UPDATE ON public.user_data
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ===========================================================================
-- TABLE: rate_limit_ledger  (generic, action-agnostic rate limiting)
--
-- Eliminates: rate limits previously lived as columns ON user_security, so they
-- could only cover refresh + backup-code and were entangled with security state.
-- This ledger rate-limits ANY action by (user_id, action) with a rolling window,
-- requires no schema change to add a new limited action, and is written only by
-- the SECURITY DEFINER check_rate_limit() function (closed-door, like the other
-- security tables). Users may SELECT their own rows for transparency.
-- ===========================================================================
CREATE TABLE IF NOT EXISTS public.rate_limit_ledger (
    id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id      UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    action       TEXT        NOT NULL CHECK (char_length(action) <= 64),
    window_start TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    attempt_count INT        NOT NULL DEFAULT 0 CHECK (attempt_count >= 0),
    updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (user_id, action)
);

CREATE INDEX IF NOT EXISTS idx_rate_limit_user_action
    ON public.rate_limit_ledger(user_id, action);

ALTER TABLE public.rate_limit_ledger ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own rate limits" ON public.rate_limit_ledger;
CREATE POLICY "Users can view own rate limits"
    ON public.rate_limit_ledger FOR SELECT
    USING (auth.uid() = user_id);

-- Closed-door: no write policies. Only check_rate_limit() (definer) writes.
REVOKE INSERT, UPDATE, DELETE ON public.rate_limit_ledger FROM anon, authenticated;

DROP TRIGGER IF EXISTS set_rate_limit_updated_at ON public.rate_limit_ledger;
CREATE TRIGGER set_rate_limit_updated_at
    BEFORE UPDATE ON public.rate_limit_ledger
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ---------------------------------------------------------------------------
-- check_rate_limit(action, max_attempts, window) -> BOOLEAN
--
-- Atomically records one attempt of `action` for the current user and returns
-- TRUE if still within budget, FALSE if the limit is exceeded. Uses an UPSERT
-- with a row lock so concurrent calls cannot race past the cap. The window is
-- rolling: once it elapses, the counter resets to 1 on the next attempt.
-- Returns FALSE (caller decides whether to RAISE) rather than throwing, so it
-- composes with different error messages per call site.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.check_rate_limit(
    p_action       TEXT,
    p_max_attempts INT,
    p_window       INTERVAL
)
RETURNS BOOLEAN AS $$
DECLARE
    ledger         public.rate_limit_ledger;
    window_expired BOOLEAN;
    new_count      INT;
BEGIN
    IF auth.uid() IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    -- Lock (or create) the user's ledger row for this action.
    INSERT INTO public.rate_limit_ledger (user_id, action, window_start, attempt_count)
    VALUES (auth.uid(), p_action, NOW(), 0)
    ON CONFLICT (user_id, action) DO NOTHING;

    SELECT * INTO ledger
    FROM public.rate_limit_ledger
    WHERE user_id = auth.uid() AND action = p_action
    FOR UPDATE;

    window_expired := (ledger.window_start < (NOW() - p_window));

    -- Reset the window or increment within it — single source of truth.
    IF window_expired THEN
        new_count := 1;
        UPDATE public.rate_limit_ledger
        SET window_start  = NOW(),
            attempt_count = 1,
            updated_at    = NOW()
        WHERE user_id = auth.uid() AND action = p_action;
    ELSE
        new_count := ledger.attempt_count + 1;
        UPDATE public.rate_limit_ledger
        SET attempt_count = new_count,
            updated_at    = NOW()
        WHERE user_id = auth.uid() AND action = p_action;
    END IF;

    RETURN new_count <= p_max_attempts;
END;
$$ LANGUAGE plpgsql
   SECURITY DEFINER
   SET search_path = public, pg_temp;

-- ---------------------------------------------------------------------------
-- is_rate_limited(action, max_attempts, window) -> BOOLEAN  (read-only peek)
--
-- Returns TRUE if the current user is ALREADY over budget for `action` within
-- the window, WITHOUT recording an attempt. Use this to gate at the top of a
-- handler when you only want to COUNT certain outcomes (e.g. failures) via a
-- separate check_rate_limit() call. Does not lock or mutate.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.is_rate_limited(
    p_action       TEXT,
    p_max_attempts INT,
    p_window       INTERVAL
)
RETURNS BOOLEAN AS $$
DECLARE
    ledger public.rate_limit_ledger;
BEGIN
    IF auth.uid() IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    SELECT * INTO ledger
    FROM public.rate_limit_ledger
    WHERE user_id = auth.uid() AND action = p_action;

    IF NOT FOUND THEN
        RETURN FALSE;
    END IF;

    -- Outside the window → not limited (counter is stale and will reset).
    IF ledger.window_start < (NOW() - p_window) THEN
        RETURN FALSE;
    END IF;

    RETURN ledger.attempt_count >= p_max_attempts;
END;
$$ LANGUAGE plpgsql
   SECURITY DEFINER
   SET search_path = public, pg_temp;

-- ===========================================================================
-- TABLE: auth_audit_log  (append-only, retained security audit trail)
--
-- Eliminates: security_events grows unbounded (cost/DoS) and is co-mingled with
-- app-level events. auth_audit_log is a hardened, prune-able audit stream for
-- authentication-critical actions, written only by definer functions and
-- pruned by prune_auth_audit_log() (schedule via pg_cron — see manual actions).
-- Closed-door: SELECT-own only; no client writes; no client deletes (so users
-- cannot erase their own trail).
-- ===========================================================================
CREATE TABLE IF NOT EXISTS public.auth_audit_log (
    id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID        REFERENCES auth.users(id) ON DELETE SET NULL,
    action      TEXT        NOT NULL CHECK (char_length(action) <= 64),
    succeeded   BOOLEAN     NOT NULL,
    metadata    JSONB       NOT NULL DEFAULT '{}',
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_auth_audit_user    ON public.auth_audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_auth_audit_created ON public.auth_audit_log(created_at DESC);

ALTER TABLE public.auth_audit_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own audit log" ON public.auth_audit_log;
CREATE POLICY "Users can view own audit log"
    ON public.auth_audit_log FOR SELECT
    USING (auth.uid() = user_id);

-- Closed-door append-only: no INSERT/UPDATE/DELETE for clients.
REVOKE INSERT, UPDATE, DELETE ON public.auth_audit_log FROM anon, authenticated;

-- ---------------------------------------------------------------------------
-- record_audit(action, succeeded, metadata) — definer-only audit append.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.record_audit(
    p_action    TEXT,
    p_succeeded BOOLEAN,
    p_metadata  JSONB DEFAULT '{}'
)
RETURNS VOID AS $$
BEGIN
    INSERT INTO public.auth_audit_log (user_id, action, succeeded, metadata)
    VALUES (auth.uid(), p_action, p_succeeded, COALESCE(p_metadata, '{}'::jsonb));
END;
$$ LANGUAGE plpgsql
   SECURITY DEFINER
   SET search_path = public, pg_temp;

-- ---------------------------------------------------------------------------
-- prune_auth_audit_log(retain) — delete audit rows older than `retain`.
-- Schedule via pg_cron (manual action). Default retention: 180 days.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.prune_auth_audit_log(retain INTERVAL DEFAULT INTERVAL '180 days')
RETURNS INT AS $$
DECLARE
    deleted INT;
BEGIN
    DELETE FROM public.auth_audit_log
    WHERE created_at < (NOW() - retain);
    GET DIAGNOSTICS deleted = ROW_COUNT;
    RETURN deleted;
END;
$$ LANGUAGE plpgsql
   SECURITY DEFINER
   SET search_path = public, pg_temp;

-- ===========================================================================
-- TABLE: trusted_devices  (known-device tracking for the 90-day gate)
--
-- Eliminates: every session re-runs the full security gate regardless of device
-- familiarity, and unknown-device access is invisible. A device is identified
-- by an opaque token the FRONTEND generates and stores (see manual actions);
-- only its bcrypt hash is persisted here. Closed-door writes via definer funcs.
-- ===========================================================================
CREATE TABLE IF NOT EXISTS public.trusted_devices (
    id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id       UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    device_hash   TEXT        NOT NULL CHECK (char_length(device_hash) <= 255),
    label         TEXT        CHECK (label IS NULL OR char_length(label) <= 100),
    last_seen_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (user_id, device_hash)
);

CREATE INDEX IF NOT EXISTS idx_trusted_devices_user ON public.trusted_devices(user_id);

ALTER TABLE public.trusted_devices ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own devices" ON public.trusted_devices;
CREATE POLICY "Users can view own devices"
    ON public.trusted_devices FOR SELECT
    USING (auth.uid() = user_id);

-- Users MAY revoke (delete) their own devices; all other writes go via functions.
DROP POLICY IF EXISTS "Users can revoke own devices" ON public.trusted_devices;
CREATE POLICY "Users can revoke own devices"
    ON public.trusted_devices FOR DELETE
    USING (auth.uid() = user_id);

REVOKE INSERT, UPDATE ON public.trusted_devices FROM anon, authenticated;

-- ---------------------------------------------------------------------------
-- register_trusted_device(token, label) — record/refresh a device (definer).
-- Stores only bcrypt(token); requires aal2 when MFA is enabled.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.register_trusted_device(p_token TEXT, p_label TEXT DEFAULT NULL)
RETURNS VOID AS $$
DECLARE
    hashed TEXT;
BEGIN
    IF auth.uid() IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;
    IF p_token IS NULL OR char_length(p_token) < 16 OR char_length(p_token) > 256 THEN
        RAISE EXCEPTION 'Invalid device token.';
    END IF;
    IF public.is_mfa_enabled() AND (auth.jwt() ->> 'aal') != 'aal2' THEN
        RAISE EXCEPTION 'MFA verification required to trust a device.';
    END IF;

    hashed := crypt(p_token, gen_salt('bf', 12));

    INSERT INTO public.trusted_devices (user_id, device_hash, label, last_seen_at)
    VALUES (auth.uid(), hashed, left(p_label, 100), NOW())
    ON CONFLICT (user_id, device_hash) DO UPDATE
        SET last_seen_at = NOW();
END;
$$ LANGUAGE plpgsql
   SECURITY DEFINER
   SET search_path = public, pg_temp;

-- ---------------------------------------------------------------------------
-- is_device_trusted(token) -> BOOLEAN — does this token match a known device?
-- Scans the user's devices with bcrypt compare; refreshes last_seen on a hit.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.is_device_trusted(p_token TEXT)
RETURNS BOOLEAN AS $$
DECLARE
    rec     public.trusted_devices;
    matched BOOLEAN := FALSE;
BEGIN
    IF auth.uid() IS NULL OR p_token IS NULL OR char_length(p_token) > 256 THEN
        RETURN FALSE;
    END IF;

    FOR rec IN
        SELECT * FROM public.trusted_devices WHERE user_id = auth.uid()
    LOOP
        IF rec.device_hash = crypt(p_token, rec.device_hash) THEN
            matched := TRUE;
            UPDATE public.trusted_devices
            SET last_seen_at = NOW()
            WHERE id = rec.id;
            -- Keep scanning is unnecessary here (no secret position to hide:
            -- the token is the caller's own), so exit on first match.
            EXIT;
        END IF;
    END LOOP;

    RETURN matched;
END;
$$ LANGUAGE plpgsql
   SECURITY DEFINER
   SET search_path = public, pg_temp;

-- ===========================================================================
-- FUNCTION: is_mfa_enabled — does the caller have a verified TOTP factor?
-- ===========================================================================
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
   SET search_path = auth, public, pg_temp;

-- ===========================================================================
-- FUNCTION: refresh_security_session — re-verify the 90-day security gate.
--
-- Rate limiting now delegates to the generic rate_limit_ledger via
-- check_rate_limit() (5 refreshes per rolling hour), so the counter logic lives
-- in one audited place. Writes a SECURITY_REFRESH event AND an auth_audit_log
-- entry for the retained trail.
-- ===========================================================================
CREATE OR REPLACE FUNCTION public.refresh_security_session()
RETURNS BOOLEAN AS $$
DECLARE
    iat_val     NUMERIC;
    mfa_enabled BOOLEAN;
BEGIN
    IF auth.uid() IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    -- Ensure a security row exists (used as the durable verification record).
    IF NOT EXISTS (SELECT 1 FROM public.user_security WHERE user_id = auth.uid()) THEN
        RAISE EXCEPTION 'User security record not found';
    END IF;

    -- 1. Rate limiting: max 5 refreshes per rolling hour (ledger-backed).
    IF NOT public.check_rate_limit('security_refresh', 5, INTERVAL '1 hour') THEN
        PERFORM public.record_audit('security_refresh', FALSE,
                                    jsonb_build_object('reason', 'rate_limited'));
        RAISE EXCEPTION 'Rate limit exceeded. Try again in an hour.';
    END IF;

    -- 2. Session freshness: the JWT must be < 10 minutes old.
    iat_val := (auth.jwt() ->> 'iat')::NUMERIC;
    IF iat_val IS NULL OR (extract(epoch FROM NOW()) - iat_val) > 600 THEN
        RAISE EXCEPTION 'Session too old. Please re-authenticate.';
    END IF;

    -- 3. MFA enforcement — if MFA is enabled, aal2 is ALWAYS required.
    mfa_enabled := public.is_mfa_enabled();
    IF mfa_enabled AND (auth.jwt() ->> 'aal') != 'aal2' THEN
        RAISE EXCEPTION 'MFA verification required.';
    END IF;

    UPDATE public.user_security
    SET last_verified_at = NOW(),
        updated_at       = NOW()
    WHERE user_id = auth.uid();

    INSERT INTO public.security_events (user_id, event_type, metadata)
    VALUES (
        auth.uid(),
        'SECURITY_REFRESH',
        jsonb_build_object('mfa_enforced', mfa_enabled)
    );
    PERFORM public.record_audit('security_refresh', TRUE,
                                jsonb_build_object('mfa_enforced', mfa_enabled));

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql
   SECURITY DEFINER
   SET search_path = public, pg_temp;

-- ===========================================================================
-- FUNCTION: generate_recovery_codes — issue 10 single-use backup codes.
-- Returns the PLAINTEXT codes to the caller once; only bcrypt hashes persist.
-- ===========================================================================
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

    -- Ensure the row exists (defensive: handle_new_user normally creates it).
    INSERT INTO public.user_security (user_id)
    VALUES (auth.uid())
    ON CONFLICT (user_id) DO NOTHING;

    FOR i IN 1..10 LOOP
        code         := upper(encode(gen_random_bytes(8), 'hex'));
        plain_codes  := array_append(plain_codes, code);
        -- bcrypt cost factor 12 — resists offline brute-force.
        hashed       := crypt(code, gen_salt('bf', 12));
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
   SET search_path = public, pg_temp;

-- ===========================================================================
-- FUNCTION: verify_recovery_code — consume one backup code (single-use).
--
-- Rate limiting (max 3 FAILED attempts per rolling 30 min) is ledger-backed:
-- is_rate_limited() gates at the top WITHOUT counting, and only genuine misses
-- are recorded via check_rate_limit('backup_code_fail', …). A success resets the
-- failure counter by deleting the ledger row. Iterates ALL stored hashes
-- (constant work) so the matched code's position can't leak via timing.
-- ===========================================================================
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

    -- Reject oversized input early (defence in depth; codes are 16 hex chars).
    IF code IS NULL OR char_length(code) > 64 THEN
        RAISE EXCEPTION 'Invalid recovery code.';
    END IF;

    -- Gate on prior failures WITHOUT counting this attempt yet.
    IF public.is_rate_limited('backup_code_fail', 3, INTERVAL '30 minutes') THEN
        RAISE EXCEPTION 'Too many failed attempts. Try again in 30 minutes.';
    END IF;

    SELECT * INTO curr_security
    FROM public.user_security
    WHERE user_id = auth.uid()
    FOR UPDATE;

    IF NOT FOUND THEN
        RETURN FALSE;
    END IF;

    norm_code     := upper(trim(code));
    stored_hashes := curr_security.backup_codes;

    IF stored_hashes IS NULL OR array_length(stored_hashes, 1) IS NULL THEN
        -- No codes issued — record a failed attempt to rate-limit probing.
        PERFORM public.check_rate_limit('backup_code_fail', 3, INTERVAL '30 minutes');
        INSERT INTO public.security_events (user_id, event_type)
        VALUES (auth.uid(), 'RECOVERY_CODE_FAILURE');
        PERFORM public.record_audit('recovery_code', FALSE,
                                    jsonb_build_object('reason', 'no_codes'));
        RETURN FALSE;
    END IF;

    -- Constant-time-ish scan: check every hash, never exit early.
    FOR i IN 1..array_length(stored_hashes, 1) LOOP
        cmp := (stored_hashes[i] = crypt(norm_code, stored_hashes[i]));
        IF cmp AND matched_index IS NULL THEN
            matched       := TRUE;
            matched_index := i;
        END IF;
    END LOOP;

    IF matched THEN
        -- Rebuild the hash array excluding the consumed code.
        FOR i IN 1..array_length(stored_hashes, 1) LOOP
            IF i != matched_index THEN
                new_hashes := array_append(new_hashes, stored_hashes[i]);
            END IF;
        END LOOP;

        UPDATE public.user_security
        SET backup_codes     = new_hashes,
            last_verified_at = NOW(),
            updated_at       = NOW()
        WHERE user_id = auth.uid();

        -- Success clears the failure counter for this action.
        DELETE FROM public.rate_limit_ledger
        WHERE user_id = auth.uid() AND action = 'backup_code_fail';

        INSERT INTO public.security_events (user_id, event_type)
        VALUES (auth.uid(), 'RECOVERY_CODE_SUCCESS');
        PERFORM public.record_audit('recovery_code', TRUE);

        RETURN TRUE;
    ELSE
        -- Record this failure against the rolling window.
        PERFORM public.check_rate_limit('backup_code_fail', 3, INTERVAL '30 minutes');
        INSERT INTO public.security_events (user_id, event_type)
        VALUES (auth.uid(), 'RECOVERY_CODE_FAILURE');
        PERFORM public.record_audit('recovery_code', FALSE,
                                    jsonb_build_object('reason', 'mismatch'));
        RETURN FALSE;
    END IF;
END;
$$ LANGUAGE plpgsql
   SECURITY DEFINER
   SET search_path = public, pg_temp;

-- ===========================================================================
-- FUNCTION + TRIGGER: handle_new_user — provision profile + security row.
--
-- ISSUE #3 — email can be NULL (e.g. phone/OAuth signups). The profiles.email
-- CHECK now permits NULL, and we insert NULL (not '') so we never write an
-- empty-string email that downstream "email present" checks would misread.
-- display_name falls back to a generated handle when no email local-part exists.
-- ===========================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    local_part TEXT;
    safe_name  TEXT;
BEGIN
    -- Derive the email local-part only when an email actually exists.
    local_part := NULLIF(split_part(COALESCE(new.email, ''), '@', 1), '');
    safe_name  := left(COALESCE(local_part, 'player_' || left(new.id::text, 8)), 100);

    INSERT INTO public.profiles (user_id, email, display_name)
    VALUES (new.id, new.email, safe_name)  -- new.email may be NULL — allowed.
    ON CONFLICT (user_id) DO NOTHING;

    INSERT INTO public.user_security (user_id)
    VALUES (new.id)
    ON CONFLICT (user_id) DO NOTHING;

    RETURN new;
END;
$$ LANGUAGE plpgsql
   SECURITY DEFINER
   SET search_path = public, pg_temp;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ===========================================================================
-- TABLE: db_search_cache  (PDB/YACPDB lookup cache for the edge proxy)
--
-- The `chess-database-search` Edge Function checks this table before calling
-- the external problem databases, so identical positions are not re-fetched and
-- PDB/YACPDB server limits are respected. Keyed by the board-placement field of
-- the FEN so castling/clock differences collapse to one entry. `checked_at`
-- drives TTL eviction (see prune_db_search_cache).
--
-- ACCESS MODEL (public read, server-only write):
--   * SELECT — open to everyone. The table holds only public chess-position
--     metadata (no user/sensitive data), so public read powers the client
--     status bar with zero privacy exposure.
--   * INSERT/UPDATE/DELETE — denied to anon/authenticated (no write policy =
--     default-deny under RLS). Writes happen only via the Edge Function's
--     service-role key, which bypasses RLS by design.
--   * The service_role INSERT policy below is belt-and-suspenders only:
--     service_role already bypasses RLS, so the policy documents intent but is
--     not the actual enforcer. The real write barrier is the ABSENCE of any
--     anon/authenticated write policy + table GRANTs limited to SELECT.
-- ===========================================================================
CREATE TABLE IF NOT EXISTS public.db_search_cache (
    fen_board   TEXT        PRIMARY KEY CHECK (char_length(fen_board) <= 100),
    found       BOOLEAN     NOT NULL DEFAULT FALSE,
    database    TEXT        CHECK (database IS NULL OR char_length(database) <= 32),
    url         TEXT        CHECK (url IS NULL OR char_length(url) <= 2048),
    checked_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_db_search_cache_checked
    ON public.db_search_cache(checked_at);

ALTER TABLE public.db_search_cache ENABLE ROW LEVEL SECURITY;

-- Table-level grants must permit what the RLS policies allow: SELECT only for
-- clients (no INSERT/UPDATE/DELETE grant), so the public-read policy can take
-- effect while writes stay impossible for non-service roles.
REVOKE ALL ON public.db_search_cache FROM anon, authenticated;
GRANT SELECT ON public.db_search_cache TO anon, authenticated;

-- Public read: anyone may view cached results (public chess data only).
DROP POLICY IF EXISTS "Allow public read access" ON public.db_search_cache;
CREATE POLICY "Allow public read access"
    ON public.db_search_cache
    FOR SELECT
    TO public
    USING (true);

-- Server-only write (belt-and-suspenders; service_role already bypasses RLS).
DROP POLICY IF EXISTS "Allow service_role to insert cache" ON public.db_search_cache;
CREATE POLICY "Allow service_role to insert cache"
    ON public.db_search_cache
    FOR INSERT
    TO service_role
    WITH CHECK (true);

-- Evict cache rows older than `retain` (default 7 days). Schedule via pg_cron.
CREATE OR REPLACE FUNCTION public.prune_db_search_cache(retain INTERVAL DEFAULT INTERVAL '7 days')
RETURNS INT AS $$
DECLARE
    deleted INT;
BEGIN
    DELETE FROM public.db_search_cache
    WHERE checked_at < (NOW() - retain);
    GET DIAGNOSTICS deleted = ROW_COUNT;
    RETURN deleted;
END;
$$ LANGUAGE plpgsql
   SECURITY DEFINER
   SET search_path = public, pg_temp;

REVOKE EXECUTE ON FUNCTION public.prune_db_search_cache(INTERVAL)
    FROM PUBLIC, anon, authenticated;

-- ===========================================================================
-- Execution grants.
--
-- Client-callable RPCs: callable by `authenticated` only (anon revoked; each
-- function re-checks auth.uid() internally).
-- Internal helpers (check_rate_limit, is_rate_limited, record_audit,
-- prune_auth_audit_log): NOT client-callable — they are invoked only from
-- inside other SECURITY DEFINER functions, so EXECUTE is revoked from clients.
-- ===========================================================================
REVOKE EXECUTE ON FUNCTION public.refresh_security_session()                       FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.generate_recovery_codes()                        FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.verify_recovery_code(TEXT)                       FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.register_trusted_device(TEXT, TEXT)              FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.is_device_trusted(TEXT)                          FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.refresh_security_session()                       TO authenticated;
GRANT  EXECUTE ON FUNCTION public.generate_recovery_codes()                        TO authenticated;
GRANT  EXECUTE ON FUNCTION public.verify_recovery_code(TEXT)                       TO authenticated;
GRANT  EXECUTE ON FUNCTION public.register_trusted_device(TEXT, TEXT)              TO authenticated;
GRANT  EXECUTE ON FUNCTION public.is_device_trusted(TEXT)                          TO authenticated;

-- Internal-only helpers: deny direct client EXECUTE.
REVOKE EXECUTE ON FUNCTION public.check_rate_limit(TEXT, INT, INTERVAL)            FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.is_rate_limited(TEXT, INT, INTERVAL)             FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.record_audit(TEXT, BOOLEAN, JSONB)              FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.prune_auth_audit_log(INTERVAL)                  FROM PUBLIC, anon, authenticated;
