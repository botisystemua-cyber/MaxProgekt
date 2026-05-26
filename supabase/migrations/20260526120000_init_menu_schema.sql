-- =====================================================================
-- MaxProgekt / MaxDigital.es — QR-меню (initial schema)
-- Multi-tenant: один Supabase-проект обслуговує багато ресторанів,
-- кожен має власний slug (наприклад /menu/paddys).
-- =====================================================================

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------
-- restaurants — заклад (tenant)
-- ---------------------------------------------------------------------
create table public.restaurants (
  id          uuid primary key default gen_random_uuid(),
  slug        text not null unique,
  name        text not null,
  tagline     text,
  address     text,
  phone       text,
  hours       text,
  wifi        text,
  rating      numeric(2, 1),
  reviews     integer not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

comment on column public.restaurants.slug
  is 'URL-сегмент закладу, наприклад "paddys" для /menu/paddys';

-- ---------------------------------------------------------------------
-- categories — розділи меню (стартери, головне, десерти, напої…)
-- ---------------------------------------------------------------------
create table public.categories (
  id             uuid primary key default gen_random_uuid(),
  restaurant_id  uuid not null references public.restaurants (id) on delete cascade,
  slug           text not null,
  label          text not null,
  icon           text,
  sort_order     integer not null default 0,
  created_at     timestamptz not null default now(),
  unique (restaurant_id, slug)
);

create index categories_restaurant_idx
  on public.categories (restaurant_id, sort_order);

-- ---------------------------------------------------------------------
-- products — позиції меню
-- ---------------------------------------------------------------------
create table public.products (
  id                uuid primary key default gen_random_uuid(),
  restaurant_id     uuid not null references public.restaurants (id) on delete cascade,
  category_id       uuid not null references public.categories  (id) on delete restrict,
  name              text not null,
  description       text,
  price             numeric(10, 2) not null check (price >= 0),
  is_vegetarian     boolean not null default false,
  tags              text[] not null default '{}',
  is_popular        boolean not null default false,
  is_hidden         boolean not null default false,
  discount_percent  integer not null default 0
                      check (discount_percent between 0 and 100),
  sort_order        integer not null default 0,
  image_url         text,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create index products_restaurant_idx
  on public.products (restaurant_id);

create index products_category_idx
  on public.products (category_id);

create index products_visible_idx
  on public.products (restaurant_id, is_hidden, sort_order);

-- ---------------------------------------------------------------------
-- banners — промо-банери (тільки один активний на ресторан)
-- ---------------------------------------------------------------------
create table public.banners (
  id             uuid primary key default gen_random_uuid(),
  restaurant_id  uuid not null references public.restaurants (id) on delete cascade,
  text           text not null,
  subtext        text,
  emoji          text not null default '🎉',
  color          text,
  is_active      boolean not null default false,
  created_at     timestamptz not null default now()
);

create unique index banners_one_active_per_restaurant
  on public.banners (restaurant_id)
  where is_active = true;

-- ---------------------------------------------------------------------
-- updated_at triggers
-- ---------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger restaurants_set_updated_at
  before update on public.restaurants
  for each row execute function public.set_updated_at();

create trigger products_set_updated_at
  before update on public.products
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------
-- Row Level Security
-- Публічне читання видимого меню; запис — лише через service_role
-- (PIN-адмінка ходить через серверну функцію або захищений edge endpoint).
-- ---------------------------------------------------------------------
alter table public.restaurants enable row level security;
alter table public.categories  enable row level security;
alter table public.products    enable row level security;
alter table public.banners     enable row level security;

create policy "restaurants are readable by anyone"
  on public.restaurants
  for select
  using (true);

create policy "categories are readable by anyone"
  on public.categories
  for select
  using (true);

create policy "visible products are readable by anyone"
  on public.products
  for select
  using (is_hidden = false);

create policy "active banners are readable by anyone"
  on public.banners
  for select
  using (is_active = true);
