-- BotiRestaurant — Supabase schema init
-- Run ONCE in Dashboard → SQL Editor on a fresh project.
--
-- Створює 3 таблиці (settings/items/banner), додає їх у Realtime
-- publication, відкриває RLS "public read + anon write" (MVP-режим)
-- і сидить 17 позицій з QRMenu.html для прикладу.

-- ────────────────────────────────────────────────────────────────────────
-- Tables
-- ────────────────────────────────────────────────────────────────────────

create table if not exists public.restaurant_settings (
  id text primary key default 'default',
  name text not null default 'Paddy''s Point Irish Bar',
  tagline text default 'Irish Pub & Kitchen · La Zenia',
  address text default 'Av. de las Naciones, La Zenia, Orihuela Costa',
  phone text default '+34 966 73 05 27',
  hours text default '11:00 – 01:00',
  wifi text default 'PaddysPoint2024',
  rating numeric default 4.6,
  reviews int default 3787,
  menu_url text default 'botisystem.com/BotiRestaurant-v1.0/menu-client/',
  updated_at timestamptz not null default now()
);

create table if not exists public.restaurant_items (
  id bigserial primary key,
  category text not null,
  name text not null,
  description text,
  price numeric not null,
  veg boolean not null default false,
  tags text[] not null default array[]::text[],
  popular boolean not null default false,
  discount int not null default 0,
  hidden boolean not null default false,
  sort_order int not null default 0,
  updated_at timestamptz not null default now(),
  constraint restaurant_items_cat_name_uq unique (category, name)
);

create table if not exists public.restaurant_banner (
  id text primary key default 'default',
  active boolean not null default false,
  text text,
  subtext text,
  emoji text default '🎉',
  color text default 'linear-gradient(135deg, #f59e0b, #ef4444)',
  updated_at timestamptz not null default now()
);

-- ────────────────────────────────────────────────────────────────────────
-- Realtime publication
-- ────────────────────────────────────────────────────────────────────────
-- Виконуй у блоці DO — якщо таблиця вже у публікації, ALTER кине помилку
-- 42710 (object already in publication), і весь скрипт обірветься.

do $$
begin
  begin alter publication supabase_realtime add table public.restaurant_settings; exception when duplicate_object then null; end;
  begin alter publication supabase_realtime add table public.restaurant_items;    exception when duplicate_object then null; end;
  begin alter publication supabase_realtime add table public.restaurant_banner;   exception when duplicate_object then null; end;
end
$$;

-- ────────────────────────────────────────────────────────────────────────
-- RLS — MVP mode: public read, anon write (admin gated client-side).
-- ────────────────────────────────────────────────────────────────────────

alter table public.restaurant_settings enable row level security;
alter table public.restaurant_items    enable row level security;
alter table public.restaurant_banner   enable row level security;

drop policy if exists "public read settings" on public.restaurant_settings;
drop policy if exists "anon write settings"  on public.restaurant_settings;
drop policy if exists "public read items"    on public.restaurant_items;
drop policy if exists "anon write items"     on public.restaurant_items;
drop policy if exists "public read banner"   on public.restaurant_banner;
drop policy if exists "anon write banner"    on public.restaurant_banner;

create policy "public read settings" on public.restaurant_settings for select using (true);
create policy "anon write settings"  on public.restaurant_settings for all    using (true) with check (true);

create policy "public read items" on public.restaurant_items for select using (true);
create policy "anon write items"  on public.restaurant_items for all    using (true) with check (true);

create policy "public read banner" on public.restaurant_banner for select using (true);
create policy "anon write banner"  on public.restaurant_banner for all    using (true) with check (true);

-- ────────────────────────────────────────────────────────────────────────
-- Seed (idempotent через UNIQUE + ON CONFLICT)
-- ────────────────────────────────────────────────────────────────────────

insert into public.restaurant_settings (id) values ('default')
  on conflict (id) do nothing;

insert into public.restaurant_banner (id, active) values ('default', false)
  on conflict (id) do nothing;

insert into public.restaurant_items (category, name, description, price, veg, tags, sort_order) values
  ('starters', 'Nachos & Cheese Dip', 'Tortilla chips, jalapeños, sour cream, guacamole', 8.5, false, array['gluten'], 1),
  ('starters', 'Irish Beef Stew Soup', 'Rich broth, root vegetables, crusty bread', 7.5, false, array['gluten'], 2),
  ('starters', 'Garlic Mushrooms', 'Pan-fried butter, garlic & parsley, sourdough', 7.0, true, array['gluten','dairy'], 3),
  ('starters', 'Chicken Wings x8', 'Buffalo or BBQ sauce, blue cheese dip', 9.5, false, array[]::text[], 4),
  ('mains',    'Fish & Chips', 'Beer-battered cod, chunky chips, mushy peas, tartar sauce', 14.5, false, array['gluten','fish'], 5),
  ('mains',    'Irish Beef Burger', '200g beef patty, cheddar, bacon, lettuce, fries', 13.5, false, array['gluten','dairy'], 6),
  ('mains',    'Shepherd''s Pie', 'Slow-cooked minced lamb, seasonal veg, creamy mash', 13.0, false, array['dairy'], 7),
  ('mains',    'Veggie Burger', 'Grilled halloumi, avocado, tomato, brioche bun, fries', 12.0, true, array['gluten','dairy'], 8),
  ('mains',    'Steak & Ale Pie', 'Slow braised beef, dark ale gravy, shortcrust pastry, mash', 15.0, false, array['gluten','dairy'], 9),
  ('desserts', 'Sticky Toffee Pudding', 'Warm sponge, toffee sauce, vanilla ice cream', 6.5, true, array['gluten','dairy'], 10),
  ('desserts', 'Chocolate Brownie', 'Warm brownie, whipped cream, chocolate drizzle', 6.0, true, array['gluten','dairy'], 11),
  ('desserts', 'Cheesecake of the Day', 'Ask your server for today''s flavour', 6.5, true, array['gluten','dairy'], 12),
  ('drinks',   'Guinness', 'Pint · Irish dry stout, perfectly poured', 5.5, true, array[]::text[], 13),
  ('drinks',   'Kilkenny', 'Pint · Irish cream ale', 5.5, true, array[]::text[], 14),
  ('drinks',   'House Wine', 'Glass 175ml · Red / White / Rosé', 4.5, true, array[]::text[], 15),
  ('drinks',   'Soft Drinks', 'Coca-Cola, Sprite, Fanta, Tonic, OJ', 2.5, true, array[]::text[], 16),
  ('drinks',   'Irish Coffee', 'Jameson whiskey, hot coffee, brown sugar, cream', 6.0, true, array['dairy'], 17)
on conflict (category, name) do nothing;
