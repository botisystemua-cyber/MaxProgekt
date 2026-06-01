-- =====================================================================
-- Fix two bugs discovered during create_team_member rollout:
--   1) New users created with NULL token columns → GoTrue throws
--      "Database error querying schema" on their login. Supabase
--      auth.users expects empty strings ('') for confirmation_token,
--      recovery_token, email_change_token_*, phone_change_token,
--      reauthentication_token. Our previous INSERT omitted them; for
--      columns without DEFAULT '' they end up NULL → broken auth.
--   2) list_team() filters through is_team_admin() which only allows
--      role IN ('owner', 'admin'). Superadmin was excluded → could
--      not see team list of own tenant.
-- =====================================================================

-- ---------- 1. Repair existing auth.users rows ----------
-- COALESCE keeps anything already non-NULL, only fills missing fields.
UPDATE auth.users SET
  confirmation_token         = COALESCE(confirmation_token, ''),
  recovery_token             = COALESCE(recovery_token, ''),
  email_change               = COALESCE(email_change, ''),
  email_change_token_current = COALESCE(email_change_token_current, ''),
  email_change_token_new     = COALESCE(email_change_token_new, ''),
  phone_change               = COALESCE(phone_change, ''),
  phone_change_token         = COALESCE(phone_change_token, ''),
  reauthentication_token     = COALESCE(reauthentication_token, '')
WHERE confirmation_token         IS NULL
   OR recovery_token             IS NULL
   OR email_change               IS NULL
   OR email_change_token_current IS NULL
   OR email_change_token_new     IS NULL
   OR phone_change               IS NULL
   OR phone_change_token         IS NULL
   OR reauthentication_token     IS NULL;

-- ---------- 2. is_team_admin: superadmin теж адмін команди ----------
CREATE OR REPLACE FUNCTION public.is_team_admin()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND role IN ('owner', 'admin', 'superadmin')
  );
$$;

-- ---------- 3. create_team_member: явні '' для token-колонок ----------
CREATE OR REPLACE FUNCTION public.create_team_member(
  p_email     text,
  p_password  text,
  p_role      text,
  p_full_name text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, extensions
AS $$
DECLARE
  v_user_id  uuid;
  v_tenant   uuid;
  v_existing uuid;
  v_was_new  boolean := false;
BEGIN
  IF NOT public.is_team_owner_or_super() THEN
    RAISE EXCEPTION 'forbidden: only owner or superadmin';
  END IF;

  IF p_email IS NULL OR p_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' THEN
    RAISE EXCEPTION 'invalid_email';
  END IF;
  IF p_role NOT IN ('owner','admin','waiter') THEN
    RAISE EXCEPTION 'role must be owner, admin or waiter';
  END IF;
  IF p_password IS NULL OR length(p_password) < 6 THEN
    RAISE EXCEPTION 'password_too_short';
  END IF;

  v_tenant := public.current_tenant_id();
  IF v_tenant IS NULL THEN
    RAISE EXCEPTION 'no_tenant: caller has no tenant_id';
  END IF;

  SELECT id INTO v_existing FROM auth.users WHERE email = p_email LIMIT 1;

  IF v_existing IS NOT NULL THEN
    v_user_id := v_existing;
  ELSE
    v_user_id := gen_random_uuid();
    v_was_new := true;

    INSERT INTO auth.users (
      id, instance_id, aud, role, email, encrypted_password,
      email_confirmed_at,
      confirmation_token, recovery_token, email_change,
      email_change_token_current, email_change_token_new,
      phone_change, phone_change_token, reauthentication_token,
      raw_app_meta_data, raw_user_meta_data,
      created_at, updated_at, is_anonymous, is_sso_user
    ) VALUES (
      v_user_id,
      '00000000-0000-0000-0000-000000000000',
      'authenticated',
      'authenticated',
      p_email,
      crypt(p_password, gen_salt('bf')),
      now(),
      '', '', '',           -- confirmation, recovery, email_change
      '', '',               -- email_change_token_current, _new
      '', '', '',           -- phone_change, phone_change_token, reauthentication_token
      jsonb_build_object('provider', 'email', 'providers', jsonb_build_array('email')),
      '{}'::jsonb,
      now(), now(), false, false
    );

    INSERT INTO auth.identities (
      id, user_id, identity_data, provider, provider_id,
      last_sign_in_at, created_at, updated_at
    ) VALUES (
      gen_random_uuid(),
      v_user_id,
      jsonb_build_object('sub', v_user_id::text, 'email', p_email),
      'email',
      v_user_id::text,
      now(), now(), now()
    );
  END IF;

  INSERT INTO public.users (id, tenant_id, role, full_name, is_active)
  VALUES (v_user_id, v_tenant, p_role, p_full_name, true)
  ON CONFLICT (id) DO UPDATE
    SET tenant_id = EXCLUDED.tenant_id,
        role      = EXCLUDED.role,
        full_name = COALESCE(EXCLUDED.full_name, public.users.full_name),
        is_active = true;

  RETURN jsonb_build_object('user_id', v_user_id, 'was_new', v_was_new);
END $$;

REVOKE EXECUTE ON FUNCTION public.create_team_member(text, text, text, text) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.create_team_member(text, text, text, text) TO authenticated;
