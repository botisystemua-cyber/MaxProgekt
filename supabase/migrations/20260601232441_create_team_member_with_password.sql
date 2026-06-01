-- =====================================================================
-- create_team_member: створює auth.users рядок з паролем напряму
-- (email одразу confirmed) + лінкує до тенанта з обраною роллю.
--
-- Контекст: magic-link flow зламаний бо Supabase Site URL стоїть
-- localhost:3000. Юзер просить: "знімай магік, давай логін+пароль
-- я придумую сам". Owner/superadmin задає пароль → передає його
-- працівнику будь-яким способом → той заходить на /admin/login.
-- =====================================================================

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
  -- 1. AuthZ — owner або superadmin лише.
  IF NOT public.is_team_owner_or_super() THEN
    RAISE EXCEPTION 'forbidden: only owner or superadmin';
  END IF;

  -- 2. Валідація.
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

  -- 3. Якщо auth.users юзер уже існує — не чіпаємо пароль, просто лінкуємо.
  SELECT id INTO v_existing FROM auth.users WHERE email = p_email LIMIT 1;

  IF v_existing IS NOT NULL THEN
    v_user_id := v_existing;
  ELSE
    -- 4. Створюємо auth.users + auth.identities рядки напряму.
    -- Це санкціонований Supabase patern для прог-створення юзера через
    -- SECURITY DEFINER функцію (альтернатива — Edge Function зі
    -- service_role ключем, що вимагає окремого деплою).
    v_user_id := gen_random_uuid();
    v_was_new := true;

    INSERT INTO auth.users (
      id, instance_id, aud, role, email, encrypted_password,
      email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
      created_at, updated_at, is_anonymous, is_sso_user
    ) VALUES (
      v_user_id,
      '00000000-0000-0000-0000-000000000000',
      'authenticated',
      'authenticated',
      p_email,
      crypt(p_password, gen_salt('bf')),
      now(),
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

  -- 5. Лінкуємо/оновлюємо public.users → tenant + role.
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
