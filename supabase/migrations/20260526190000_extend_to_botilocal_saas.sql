-- =====================================================================
-- BotiLocal SaaS — розширення існуючої схеми
--
-- Цілі:
--   1. restaurants  → tenants            + бренд/підписка/мови/налаштування
--   2. products     → menu_items         + дієтичні позначки/алергени/калорії
--   3. restaurant_id → tenant_id         (категорії, страви, банери)
--   4. + category_translations           (i18n для назв категорій)
--   5. + menu_item_translations          (i18n для страв)
--   6. + users                           (owner/admin/waiter, FK на auth.users)
--   7. + daily_specials                  (блюда дня / акції / happy hour)
--   8. RLS: публічне читання активних тенантів + per-tenant write для команди
--   9. Видаляємо smoke_test (виконав свою роль)
-- =====================================================================

-- ---------------------------------------------------------------------
-- 0. Прибираємо smoke_test (CI ланцюжок підтверджений на попередньому PR)
-- ---------------------------------------------------------------------
drop table if exists public.smoke_test;

-- ---------------------------------------------------------------------
-- 0.5 Старі RLS-політики (з init-міграції) — дропаємо перед будь-якими
-- структурними змінами. Інакше "visible products are readable by anyone"
-- блокує DROP COLUMN is_hidden (postgres 2BP01 dependent_objects_still_exist).
--
-- Імена референсимо за СТАРИМИ назвами таблиць (renames ще не виконані).
-- ---------------------------------------------------------------------
drop policy if exists "restaurants are readable by anyone"      on public.restaurants;
drop policy if exists "categories are readable by anyone"       on public.categories;
drop policy if exists "visible products are readable by anyone" on public.products;
drop policy if exists "active banners are readable by anyone"   on public.banners;

-- ---------------------------------------------------------------------
-- 1. restaurants → tenants
-- ---------------------------------------------------------------------
alter table public.restaurants rename to tenants;
alter trigger restaurants_set_updated_at on public.tenants
  rename to tenants_set_updated_at;

alter table public.tenants
  add column if not exists logo_url               text,
  add column if not exists cover_image_url        text,
  add column if not exists description            text,
  add column if not exists primary_color          varchar(7)  default '#FF6B35',
  add column if not exists secondary_color        varchar(7)  default '#1A1A2E',
  add column if not exists currency               varchar(3)  default 'EUR',
  add column if not exists default_language       varchar(5)  default 'es',
  add column if not exists available_languages    jsonb       default '["es","en","uk","ru"]'::jsonb,
  add column if not exists opening_hours          jsonb,
  add column if not exists social_links           jsonb,
  add column if not exists is_active              boolean     default true,
  add column if not exists subscription_plan      varchar(50) default 'basic',
  add column if not exists subscription_expires_at timestamptz;

comment on table  public.tenants is
  'Tenant = ресторан/бар. Один Supabase-проект, багато тенантів, RLS по tenant_id.';
comment on column public.tenants.slug is
  'URL-сегмент тенанта, наприклад "paddys" для /menu/paddys';

-- ---------------------------------------------------------------------
-- 2. categories: restaurant_id → tenant_id, + видимість, + emoji
-- ---------------------------------------------------------------------
alter table public.categories rename column restaurant_id to tenant_id;
alter index  public.categories_restaurant_idx rename to categories_tenant_idx;

alter table public.categories
  add column if not exists is_visible boolean default true;

-- icon вже є; sort_order вже є.

-- ---------------------------------------------------------------------
-- 3. products → menu_items
-- ---------------------------------------------------------------------
alter table public.products rename to menu_items;
alter table public.menu_items rename column restaurant_id to tenant_id;

alter index public.products_restaurant_idx rename to menu_items_tenant_idx;
alter index public.products_category_idx   rename to menu_items_category_idx;
alter index public.products_visible_idx    rename to menu_items_visible_idx;
alter trigger products_set_updated_at on public.menu_items
  rename to menu_items_set_updated_at;

-- Перейменування is_hidden → is_available (інверсія смислу).
alter table public.menu_items add column if not exists is_available boolean default true;
update public.menu_items set is_available = not coalesce(is_hidden, false);
alter table public.menu_items drop column if exists is_hidden;

alter table public.menu_items
  add column if not exists is_new           boolean default false,
  add column if not exists is_featured      boolean default false,
  add column if not exists is_spicy         boolean default false,
  add column if not exists is_vegan         boolean default false,
  add column if not exists is_gluten_free   boolean default false,
  add column if not exists allergens        jsonb   default '[]'::jsonb,
  add column if not exists calories         integer,
  add column if not exists preparation_time integer,
  add column if not exists featured_until   timestamptz;

-- is_vegetarian, tags, is_popular, discount_percent, sort_order, image_url — вже є.

create index if not exists menu_items_available_idx
  on public.menu_items (tenant_id, is_available, sort_order);

-- ---------------------------------------------------------------------
-- 4. banners: restaurant_id → tenant_id (без змін полів)
-- ---------------------------------------------------------------------
alter table public.banners rename column restaurant_id to tenant_id;
alter index  public.banners_one_active_per_restaurant
  rename to banners_one_active_per_tenant;

-- ---------------------------------------------------------------------
-- 5. category_translations — мультимовність категорій
-- ---------------------------------------------------------------------
create table if not exists public.category_translations (
  id          uuid primary key default gen_random_uuid(),
  category_id uuid not null references public.categories (id) on delete cascade,
  language    varchar(5) not null,
  name        varchar(255) not null,
  description text,
  unique (category_id, language)
);

create index if not exists category_translations_category_idx
  on public.category_translations (category_id);

-- ---------------------------------------------------------------------
-- 6. menu_item_translations — мультимовність страв
-- ---------------------------------------------------------------------
create table if not exists public.menu_item_translations (
  id           uuid primary key default gen_random_uuid(),
  menu_item_id uuid not null references public.menu_items (id) on delete cascade,
  language     varchar(5) not null,
  name         varchar(255) not null,
  description  text,
  unique (menu_item_id, language)
);

create index if not exists menu_item_translations_item_idx
  on public.menu_item_translations (menu_item_id);

-- ---------------------------------------------------------------------
-- 7. users — команда тенанта (owner / admin / waiter)
-- ---------------------------------------------------------------------
create table if not exists public.users (
  id         uuid primary key references auth.users (id) on delete cascade,
  tenant_id  uuid not null references public.tenants (id) on delete cascade,
  role       varchar(20) not null default 'waiter'
              check (role in ('owner', 'admin', 'waiter')),
  full_name  varchar(255),
  avatar_url text,
  is_active  boolean default true,
  created_at timestamptz default now()
);

create index if not exists users_tenant_idx on public.users (tenant_id);

-- ---------------------------------------------------------------------
-- 8. daily_specials — блюда дня / акції / happy hour
-- ---------------------------------------------------------------------
create table if not exists public.daily_specials (
  id            uuid primary key default gen_random_uuid(),
  tenant_id     uuid not null references public.tenants (id)    on delete cascade,
  menu_item_id  uuid not null references public.menu_items (id) on delete cascade,
  special_type  varchar(20) default 'daily'
                  check (special_type in ('daily', 'promo', 'happy_hour')),
  special_price numeric(10, 2),
  starts_at     timestamptz default now(),
  ends_at       timestamptz,
  is_active     boolean default true,
  created_at    timestamptz default now()
);

create index if not exists daily_specials_tenant_active_idx
  on public.daily_specials (tenant_id, is_active, ends_at);

-- ---------------------------------------------------------------------
-- 9. RLS — нові політики (старі дропнуті у блоці 0.5 на самому початку,
-- щоб не блокувати DROP COLUMN is_hidden у блоці 3).
-- ---------------------------------------------------------------------
alter table public.tenants                enable row level security;
alter table public.categories             enable row level security;
alter table public.menu_items             enable row level security;
alter table public.menu_item_translations enable row level security;
alter table public.category_translations  enable row level security;
alter table public.banners                enable row level security;
alter table public.daily_specials         enable row level security;
alter table public.users                  enable row level security;

-- Helper-функція: tenant_id поточного юзера (для admin/waiter read+write).
create or replace function public.current_tenant_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select tenant_id from public.users where id = auth.uid();
$$;

-- ---- Public read (без логіну, через slug) ---------------------------
create policy "tenants public read active"
  on public.tenants for select
  using (is_active = true);

create policy "categories public read visible tenants"
  on public.categories for select
  using (
    is_visible = true
    and tenant_id in (select id from public.tenants where is_active = true)
  );

create policy "menu_items public read available"
  on public.menu_items for select
  using (
    is_available = true
    and tenant_id in (select id from public.tenants where is_active = true)
  );

create policy "category_translations public read"
  on public.category_translations for select using (true);

create policy "menu_item_translations public read"
  on public.menu_item_translations for select using (true);

create policy "banners public read active"
  on public.banners for select
  using (
    is_active = true
    and tenant_id in (select id from public.tenants where is_active = true)
  );

create policy "daily_specials public read active"
  on public.daily_specials for select
  using (
    is_active = true
    and (ends_at is null or ends_at > now())
    and tenant_id in (select id from public.tenants where is_active = true)
  );

-- ---- Tenant team write (owner/admin/waiter) -------------------------
create policy "tenants write own"
  on public.tenants for update
  using (id = public.current_tenant_id());

create policy "categories write own tenant"
  on public.categories for all
  using (tenant_id = public.current_tenant_id())
  with check (tenant_id = public.current_tenant_id());

create policy "menu_items write own tenant"
  on public.menu_items for all
  using (tenant_id = public.current_tenant_id())
  with check (tenant_id = public.current_tenant_id());

create policy "category_translations write own tenant"
  on public.category_translations for all
  using (category_id in (select id from public.categories where tenant_id = public.current_tenant_id()))
  with check (category_id in (select id from public.categories where tenant_id = public.current_tenant_id()));

create policy "menu_item_translations write own tenant"
  on public.menu_item_translations for all
  using (menu_item_id in (select id from public.menu_items where tenant_id = public.current_tenant_id()))
  with check (menu_item_id in (select id from public.menu_items where tenant_id = public.current_tenant_id()));

create policy "banners write own tenant"
  on public.banners for all
  using (tenant_id = public.current_tenant_id())
  with check (tenant_id = public.current_tenant_id());

create policy "daily_specials write own tenant"
  on public.daily_specials for all
  using (tenant_id = public.current_tenant_id())
  with check (tenant_id = public.current_tenant_id());

-- users: кожен бачить себе; owner/admin бачать всю команду свого тенанта.
create policy "users read self"
  on public.users for select
  using (id = auth.uid());

create policy "users read team for owners and admins"
  on public.users for select
  using (
    tenant_id = public.current_tenant_id()
    and exists (
      select 1 from public.users me
      where me.id = auth.uid()
        and me.role in ('owner', 'admin')
    )
  );

create policy "users write by owners"
  on public.users for all
  using (
    tenant_id = public.current_tenant_id()
    and exists (
      select 1 from public.users me
      where me.id = auth.uid() and me.role = 'owner'
    )
  )
  with check (
    tenant_id = public.current_tenant_id()
    and exists (
      select 1 from public.users me
      where me.id = auth.uid() and me.role = 'owner'
    )
  );
