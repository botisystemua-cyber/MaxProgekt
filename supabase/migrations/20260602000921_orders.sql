-- =====================================================================
-- Orders MVP: гість з QR-меню робить замовлення → з'являється на
-- адмін-сторінці /admin/orders у режимі kanban статусів.
--
-- Дві таблиці: orders + order_items.
-- Публічна політика: anon може INSERT (через RPC create_order)
-- й SELECT власного замовлення (для confirmation-екрану).
-- Tenant-team: SELECT/UPDATE усіх замовлень свого закладу.
-- =====================================================================

CREATE TYPE public.order_status AS ENUM (
  'new',       -- щойно надіслане, треба прийняти
  'cooking',   -- готується
  'ready',     -- готове, видати
  'served',    -- віддане гостю
  'cancelled'  -- скасоване
);

CREATE TABLE public.orders (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id     uuid NOT NULL REFERENCES public.tenants (id) ON DELETE CASCADE,
  status        public.order_status NOT NULL DEFAULT 'new',
  table_label   text,                                -- "Стіл 5", "Бар-2" — опційно
  customer_note text,                                -- побажання гостя
  currency      varchar(3) NOT NULL DEFAULT 'EUR',
  total         numeric(10, 2) NOT NULL CHECK (total >= 0),
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX orders_tenant_status_idx
  ON public.orders (tenant_id, status, created_at DESC);

CREATE TABLE public.order_items (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id     uuid NOT NULL REFERENCES public.orders (id) ON DELETE CASCADE,
  menu_item_id uuid REFERENCES public.menu_items (id) ON DELETE SET NULL,
  name         text NOT NULL,                         -- snapshot на момент замовлення
  price        numeric(10, 2) NOT NULL CHECK (price >= 0),
  qty          integer NOT NULL CHECK (qty > 0),
  created_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX order_items_order_idx ON public.order_items (order_id);

-- updated_at тригер для orders.
CREATE TRIGGER orders_set_updated_at
  BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ---------- RLS ----------
ALTER TABLE public.orders      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- Тенант (owner/admin/waiter) бачить і керує усіма замовленнями свого закладу.
CREATE POLICY "orders tenant read"
  ON public.orders FOR SELECT
  USING (tenant_id = public.current_tenant_id());

CREATE POLICY "orders tenant update"
  ON public.orders FOR UPDATE
  USING (tenant_id = public.current_tenant_id())
  WITH CHECK (tenant_id = public.current_tenant_id());

CREATE POLICY "order_items tenant read"
  ON public.order_items FOR SELECT
  USING (order_id IN (SELECT id FROM public.orders WHERE tenant_id = public.current_tenant_id()));

-- Реалтайм: підписуємось на нові замовлення / зміни статусу.
ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;

-- ---------- RPC: створення замовлення з кошика (anon-friendly) ----------
-- Гість не залогінений → робимо через SECURITY DEFINER RPC щоб обійти
-- INSERT-RLS (не хочемо дозволяти прямий INSERT з anon-ключа).
CREATE OR REPLACE FUNCTION public.create_order(
  p_tenant_slug text,
  p_items       jsonb,   -- [{ "menu_item_id":"...", "qty": 2 }]
  p_table_label text DEFAULT NULL,
  p_customer_note text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_tenant   public.tenants%ROWTYPE;
  v_order_id uuid;
  v_total    numeric(10, 2) := 0;
  v_line     jsonb;
  v_item     public.menu_items%ROWTYPE;
  v_qty      integer;
  v_count    integer;
BEGIN
  -- 1. Валідація tenant.
  SELECT * INTO v_tenant FROM public.tenants WHERE slug = p_tenant_slug AND is_active = true LIMIT 1;
  IF v_tenant.id IS NULL THEN
    RAISE EXCEPTION 'tenant_not_found';
  END IF;

  -- 2. Валідація — мінімум 1 позиція, максимум 50 (анти-спам).
  IF p_items IS NULL OR jsonb_typeof(p_items) <> 'array' THEN
    RAISE EXCEPTION 'invalid_items';
  END IF;
  v_count := jsonb_array_length(p_items);
  IF v_count = 0 OR v_count > 50 THEN
    RAISE EXCEPTION 'items_count_out_of_range';
  END IF;

  -- 3. Створюємо order placeholder з 0 total — обновимо після.
  v_order_id := gen_random_uuid();
  INSERT INTO public.orders (id, tenant_id, table_label, customer_note, currency, total)
  VALUES (v_order_id, v_tenant.id, p_table_label, p_customer_note, v_tenant.currency, 0);

  -- 4. Проходимось по позиціях, беремо ЦІНУ з БД (anti-tamper), вставляємо items.
  FOR v_line IN SELECT * FROM jsonb_array_elements(p_items) LOOP
    v_qty := (v_line->>'qty')::int;
    IF v_qty IS NULL OR v_qty <= 0 OR v_qty > 99 THEN
      RAISE EXCEPTION 'invalid_qty';
    END IF;

    SELECT * INTO v_item FROM public.menu_items
    WHERE id = (v_line->>'menu_item_id')::uuid
      AND tenant_id = v_tenant.id
      AND is_available = true
    LIMIT 1;
    IF v_item.id IS NULL THEN
      RAISE EXCEPTION 'menu_item_not_found_or_unavailable';
    END IF;

    INSERT INTO public.order_items (order_id, menu_item_id, name, price, qty)
    VALUES (v_order_id, v_item.id, v_item.name, v_item.price, v_qty);

    v_total := v_total + v_item.price * v_qty;
  END LOOP;

  -- 5. Записуємо реальний total.
  UPDATE public.orders SET total = v_total WHERE id = v_order_id;

  RETURN jsonb_build_object('order_id', v_order_id, 'total', v_total);
END $$;

REVOKE EXECUTE ON FUNCTION public.create_order(text, jsonb, text, text) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.create_order(text, jsonb, text, text) TO anon, authenticated;
