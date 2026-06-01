-- =====================================================================
-- Розширення team-RPC: superadmin може робити все що owner;
-- add_team_member тепер приймає роль 'owner' (раніше тільки admin/waiter).
--
-- Контекст: юзер-superadmin не міг додати працівника бо
-- is_team_owner() перевіряє лише role='owner'. Superadmin — це
-- "над-власник" платформи, має право на повний контроль team.
-- =====================================================================

-- Helper: owner АБО superadmin поточного тенанта.
CREATE OR REPLACE FUNCTION public.is_team_owner_or_super()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND role IN ('owner', 'superadmin')
  );
$$;

GRANT EXECUTE ON FUNCTION public.is_team_owner_or_super() TO authenticated;

-- ---------- add_team_member: + superadmin + роль 'owner' ----------
CREATE OR REPLACE FUNCTION public.add_team_member(p_email text, p_role text, p_full_name text DEFAULT NULL)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_auth_id uuid;
  v_tenant uuid;
BEGIN
  IF NOT public.is_team_owner_or_super() THEN
    RAISE EXCEPTION 'forbidden: only owner or superadmin';
  END IF;
  IF p_role NOT IN ('owner','admin','waiter') THEN
    RAISE EXCEPTION 'role must be owner, admin or waiter';
  END IF;

  SELECT id INTO v_auth_id FROM auth.users WHERE email = p_email LIMIT 1;
  IF v_auth_id IS NULL THEN
    RAISE EXCEPTION 'not_registered: % must sign up at /admin/login first', p_email
      USING ERRCODE = 'P0001';
  END IF;

  v_tenant := public.current_tenant_id();

  INSERT INTO public.users (id, tenant_id, role, full_name, is_active)
  VALUES (v_auth_id, v_tenant, p_role, p_full_name, true)
  ON CONFLICT (id) DO UPDATE
    SET tenant_id = EXCLUDED.tenant_id,
        role      = EXCLUDED.role,
        full_name = COALESCE(EXCLUDED.full_name, public.users.full_name),
        is_active = true;

  RETURN v_auth_id;
END $$;

-- ---------- remove_team_member: + superadmin ----------
CREATE OR REPLACE FUNCTION public.remove_team_member(p_user_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.is_team_owner_or_super() THEN
    RAISE EXCEPTION 'forbidden: only owner or superadmin';
  END IF;
  IF p_user_id = auth.uid() THEN
    RAISE EXCEPTION 'cannot remove yourself';
  END IF;

  DELETE FROM public.users
  WHERE id = p_user_id AND tenant_id = public.current_tenant_id();
END $$;

-- ---------- change_team_role: + superadmin ----------
CREATE OR REPLACE FUNCTION public.change_team_role(p_user_id uuid, p_role text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.is_team_owner_or_super() THEN
    RAISE EXCEPTION 'forbidden: only owner or superadmin';
  END IF;
  IF p_role NOT IN ('owner','admin','waiter') THEN
    RAISE EXCEPTION 'invalid role';
  END IF;
  IF p_user_id = auth.uid() AND p_role <> 'owner' AND p_role <> 'superadmin' THEN
    RAISE EXCEPTION 'cannot demote yourself';
  END IF;

  UPDATE public.users SET role = p_role
  WHERE id = p_user_id AND tenant_id = public.current_tenant_id();
END $$;
