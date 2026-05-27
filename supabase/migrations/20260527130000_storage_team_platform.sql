-- =====================================================================
-- BotiLocal: storage bucket + team RPCs + superadmin role + platform RPCs
-- =====================================================================

-- ---------- 1. ROLE: superadmin ----------
-- Дозволяємо tenant_id NULL для платформного користувача (наш staff).
ALTER TABLE public.users ALTER COLUMN tenant_id DROP NOT NULL;
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE public.users
  ADD CONSTRAINT users_role_check
  CHECK (role IN ('owner', 'admin', 'waiter', 'superadmin'));

CREATE OR REPLACE FUNCTION public.is_superadmin()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'superadmin');
$$;

-- Superadmin може все на всіх tenants + читати всю команду
DROP POLICY IF EXISTS "superadmin all tenants" ON public.tenants;
CREATE POLICY "superadmin all tenants" ON public.tenants FOR ALL
  USING (public.is_superadmin()) WITH CHECK (public.is_superadmin());

DROP POLICY IF EXISTS "superadmin all users" ON public.users;
CREATE POLICY "superadmin all users" ON public.users FOR ALL
  USING (public.is_superadmin()) WITH CHECK (public.is_superadmin());

-- ---------- 2. STORAGE: menu-images bucket ----------
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('menu-images', 'menu-images', true, 2097152,
        ARRAY['image/webp','image/jpeg','image/png']::text[])
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 2097152,
  allowed_mime_types = ARRAY['image/webp','image/jpeg','image/png']::text[];

-- Скидаємо старі policies (idempotent)
DROP POLICY IF EXISTS "menu_images public read"        ON storage.objects;
DROP POLICY IF EXISTS "menu_images tenant team write"  ON storage.objects;
DROP POLICY IF EXISTS "menu_images tenant team update" ON storage.objects;
DROP POLICY IF EXISTS "menu_images tenant team delete" ON storage.objects;

CREATE POLICY "menu_images public read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'menu-images');

-- Тенант пише ТІЛЬКИ у власну папку (slug як перший рівень).
CREATE POLICY "menu_images tenant team write"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'menu-images'
    AND (storage.foldername(name))[1] = (
      SELECT slug FROM public.tenants WHERE id = public.current_tenant_id()
    )
  );

CREATE POLICY "menu_images tenant team update"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'menu-images'
    AND (storage.foldername(name))[1] = (
      SELECT slug FROM public.tenants WHERE id = public.current_tenant_id()
    )
  );

CREATE POLICY "menu_images tenant team delete"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'menu-images'
    AND (storage.foldername(name))[1] = (
      SELECT slug FROM public.tenants WHERE id = public.current_tenant_id()
    )
  );

-- ---------- 3. TEAM RPCs ----------
CREATE OR REPLACE FUNCTION public.list_team()
RETURNS TABLE (id uuid, email text, role text, full_name text, is_active boolean, created_at timestamptz)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT u.id, au.email::text, u.role::text, u.full_name, u.is_active, u.created_at
  FROM public.users u
  JOIN auth.users au ON au.id = u.id
  WHERE u.tenant_id = public.current_tenant_id()
    AND public.is_team_admin()
  ORDER BY u.created_at;
$$;

CREATE OR REPLACE FUNCTION public.add_team_member(p_email text, p_role text, p_full_name text DEFAULT NULL)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_auth_id uuid;
  v_tenant uuid;
BEGIN
  IF NOT public.is_team_owner() THEN RAISE EXCEPTION 'forbidden: only owner'; END IF;
  IF p_role NOT IN ('admin','waiter') THEN RAISE EXCEPTION 'role must be admin or waiter'; END IF;

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

CREATE OR REPLACE FUNCTION public.remove_team_member(p_user_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.is_team_owner() THEN RAISE EXCEPTION 'forbidden: only owner'; END IF;
  IF p_user_id = auth.uid() THEN RAISE EXCEPTION 'cannot remove yourself'; END IF;

  DELETE FROM public.users
  WHERE id = p_user_id AND tenant_id = public.current_tenant_id();
END $$;

CREATE OR REPLACE FUNCTION public.change_team_role(p_user_id uuid, p_role text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.is_team_owner() THEN RAISE EXCEPTION 'forbidden: only owner'; END IF;
  IF p_role NOT IN ('owner','admin','waiter') THEN RAISE EXCEPTION 'invalid role'; END IF;
  IF p_user_id = auth.uid() AND p_role <> 'owner' THEN
    RAISE EXCEPTION 'cannot demote yourself';
  END IF;

  UPDATE public.users SET role = p_role
  WHERE id = p_user_id AND tenant_id = public.current_tenant_id();
END $$;

-- ---------- 4. PLATFORM RPCs (superadmin only) ----------
CREATE OR REPLACE FUNCTION public.list_tenants_admin()
RETURNS TABLE (id uuid, slug text, name text, is_active boolean, owner_email text, items_count bigint, created_at timestamptz)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT
    t.id, t.slug, t.name, t.is_active,
    (SELECT au.email::text FROM public.users u JOIN auth.users au ON au.id = u.id
       WHERE u.tenant_id = t.id AND u.role = 'owner' ORDER BY u.created_at LIMIT 1) AS owner_email,
    (SELECT count(*) FROM public.menu_items WHERE tenant_id = t.id) AS items_count,
    t.created_at
  FROM public.tenants t
  WHERE public.is_superadmin()
  ORDER BY t.created_at DESC;
$$;

CREATE OR REPLACE FUNCTION public.create_tenant_admin(
  p_slug text, p_name text,
  p_default_language text DEFAULT 'es',
  p_currency text DEFAULT 'EUR',
  p_primary_color text DEFAULT '#FF6B35',
  p_secondary_color text DEFAULT '#1A1A2E'
)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_id uuid;
BEGIN
  IF NOT public.is_superadmin() THEN RAISE EXCEPTION 'forbidden: superadmin only'; END IF;

  INSERT INTO public.tenants
    (slug, name, default_language, currency, primary_color, secondary_color, is_active,
     available_languages)
  VALUES
    (lower(trim(p_slug)), p_name, p_default_language, p_currency, p_primary_color,
     p_secondary_color, true, '["es","en","uk","ru","pl","ga","de"]'::jsonb)
  RETURNING id INTO v_id;

  -- Seed 4 базові категорії щоб новий ресторан не був пустим
  INSERT INTO public.categories (tenant_id, slug, label, icon, sort_order, is_visible) VALUES
    (v_id, 'starters', 'Starters', '🥗', 1, true),
    (v_id, 'mains',    'Mains',    '🍖', 2, true),
    (v_id, 'desserts', 'Desserts', '🍮', 3, true),
    (v_id, 'drinks',   'Drinks',   '🍺', 4, true);

  RETURN v_id;
END $$;

CREATE OR REPLACE FUNCTION public.delete_tenant_admin(p_tenant_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.is_superadmin() THEN RAISE EXCEPTION 'forbidden: superadmin only'; END IF;
  DELETE FROM public.tenants WHERE id = p_tenant_id;  -- cascade видалить всі дочірні
END $$;

CREATE OR REPLACE FUNCTION public.provision_tenant_owner_admin(p_tenant_id uuid, p_email text)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_auth_id uuid;
BEGIN
  IF NOT public.is_superadmin() THEN RAISE EXCEPTION 'forbidden: superadmin only'; END IF;

  SELECT id INTO v_auth_id FROM auth.users WHERE email = p_email LIMIT 1;
  IF v_auth_id IS NULL THEN
    RAISE EXCEPTION 'not_registered: % must sign up at /admin/login first', p_email
      USING ERRCODE = 'P0001';
  END IF;

  INSERT INTO public.users (id, tenant_id, role, is_active)
  VALUES (v_auth_id, p_tenant_id, 'owner', true)
  ON CONFLICT (id) DO UPDATE
    SET tenant_id = EXCLUDED.tenant_id,
        role = 'owner',
        is_active = true;

  RETURN v_auth_id;
END $$;

-- ---------- 5. Зробити мене superadmin ----------
UPDATE public.users
SET role = 'superadmin'
WHERE id = (SELECT id FROM auth.users WHERE email = 'botisystemua@gmail.com' LIMIT 1);

-- ---------- 6. Permissions ----------
REVOKE EXECUTE ON FUNCTION public.list_team                         FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.add_team_member                   FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.remove_team_member                FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.change_team_role                  FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.list_tenants_admin                FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.create_tenant_admin               FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.delete_tenant_admin               FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.provision_tenant_owner_admin      FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.list_team                         TO authenticated;
GRANT  EXECUTE ON FUNCTION public.add_team_member                   TO authenticated;
GRANT  EXECUTE ON FUNCTION public.remove_team_member                TO authenticated;
GRANT  EXECUTE ON FUNCTION public.change_team_role                  TO authenticated;
GRANT  EXECUTE ON FUNCTION public.list_tenants_admin                TO authenticated;
GRANT  EXECUTE ON FUNCTION public.create_tenant_admin               TO authenticated;
GRANT  EXECUTE ON FUNCTION public.delete_tenant_admin               TO authenticated;
GRANT  EXECUTE ON FUNCTION public.provision_tenant_owner_admin      TO authenticated;
