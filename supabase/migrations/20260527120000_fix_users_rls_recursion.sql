-- =====================================================================
-- BotiLocal: fix RLS infinite recursion on public.users
--
-- Дві політики ("users read team for owners and admins" і "users write
-- by owners") мали EXISTS-subquery на самій public.users — це викликало
-- "42P17: infinite recursion detected in policy for relation users" і
-- блокувало навіть базовий SELECT (рекурсія підривала всю SELECT-оцінку).
--
-- Виправлення: дві SECURITY DEFINER функції bypass-ять RLS:
--   - is_team_admin() — true якщо поточний юзер owner/admin
--   - is_team_owner() — true якщо власне owner
-- Політики тепер їх викликають замість прямого SELECT з public.users.
-- =====================================================================

CREATE OR REPLACE FUNCTION public.is_team_admin()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND role IN ('owner', 'admin')
  );
$$;

CREATE OR REPLACE FUNCTION public.is_team_owner()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND role = 'owner'
  );
$$;

DROP POLICY IF EXISTS "users read team for owners and admins" ON public.users;
CREATE POLICY "users read team for owners and admins"
  ON public.users FOR SELECT
  USING (
    tenant_id = public.current_tenant_id()
    AND public.is_team_admin()
  );

DROP POLICY IF EXISTS "users write by owners" ON public.users;
CREATE POLICY "users write by owners"
  ON public.users FOR ALL
  USING (tenant_id = public.current_tenant_id() AND public.is_team_owner())
  WITH CHECK (tenant_id = public.current_tenant_id() AND public.is_team_owner());
