-- =====================================================================
-- Hide superadmin rows from tenant team views.
--
-- Bug: власник ресторану (b1@gmail.com OWNER) бачив у списку Команди
-- 'botisystemua@gmail.com SUPERADMIN' — наш платформний акаунт. Це
-- порушення приватності: тенант не має знати про існування platform-
-- админів, які мають технічний tenant_id для роботи з UI як від імені
-- тенанта.
--
-- Фікс на 2 рівнях, щоб superadmin не "просочувався":
--   1) RLS-політика "users read team for owners and admins" виключає
--      superadmin рядки → прямий SELECT із PostgREST їх не побачить.
--   2) list_team() RPC (SECURITY DEFINER, обходить RLS) явно фільтрує
--      superadmin.
--
-- Superadmin усе одно бачить себе через "users read self" і керує
-- тенантами через /admin/platform.
-- =====================================================================

-- ---------- 1. RLS: приховати superadmin для owner/admin ----------
DROP POLICY IF EXISTS "users read team for owners and admins" ON public.users;
CREATE POLICY "users read team for owners and admins"
  ON public.users FOR SELECT
  USING (
    tenant_id = public.current_tenant_id()
    AND role <> 'superadmin'
    AND public.is_team_admin()
  );

-- ---------- 2. list_team(): явний фільтр на SQL рівні ----------
CREATE OR REPLACE FUNCTION public.list_team()
RETURNS TABLE (id uuid, email text, role text, full_name text, is_active boolean, created_at timestamptz)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT u.id, au.email::text, u.role::text, u.full_name, u.is_active, u.created_at
  FROM public.users u
  JOIN auth.users au ON au.id = u.id
  WHERE u.tenant_id = public.current_tenant_id()
    AND u.role <> 'superadmin'
    AND public.is_team_admin()
  ORDER BY u.created_at;
$$;

-- ---------- 3. Захист superadmin від модифікації не-superadmin'ом ----------
-- Owner у власному тенанті ділив tenant_id з superadmin → міг би
-- викликати change_team_role / remove_team_member з його user_id і
-- зламати йому акаунт. Додаємо явну перевірку: superadmin-рядки
-- може чіпати лише сам superadmin.

CREATE OR REPLACE FUNCTION public.remove_team_member(p_user_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_target_role text;
  v_caller_role text;
BEGIN
  IF NOT public.is_team_owner_or_super() THEN
    RAISE EXCEPTION 'forbidden: only owner or superadmin';
  END IF;
  IF p_user_id = auth.uid() THEN
    RAISE EXCEPTION 'cannot remove yourself';
  END IF;

  SELECT role INTO v_target_role FROM public.users WHERE id = p_user_id;
  SELECT role INTO v_caller_role FROM public.users WHERE id = auth.uid();
  IF v_target_role = 'superadmin' AND v_caller_role <> 'superadmin' THEN
    RAISE EXCEPTION 'forbidden: cannot modify superadmin';
  END IF;

  DELETE FROM public.users
  WHERE id = p_user_id AND tenant_id = public.current_tenant_id();
END $$;

CREATE OR REPLACE FUNCTION public.change_team_role(p_user_id uuid, p_role text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_target_role text;
  v_caller_role text;
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

  SELECT role INTO v_target_role FROM public.users WHERE id = p_user_id;
  SELECT role INTO v_caller_role FROM public.users WHERE id = auth.uid();
  IF v_target_role = 'superadmin' AND v_caller_role <> 'superadmin' THEN
    RAISE EXCEPTION 'forbidden: cannot modify superadmin';
  END IF;

  UPDATE public.users SET role = p_role
  WHERE id = p_user_id AND tenant_id = public.current_tenant_id();
END $$;
