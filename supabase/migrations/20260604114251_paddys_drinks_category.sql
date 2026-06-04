-- =====================================================================
-- Paddy's Point — нова категорія "Drinks" + soft drinks / beers / wines.
-- Юзер: "в меню нема напоїв коко-коли".
-- Категорія йде на sort_order=14 (після Sides).
-- =====================================================================

-- 1) Нова категорія
with t as (select id from public.tenants where slug = 'paddys')
insert into public.categories (tenant_id, slug, label, icon, sort_order, is_visible)
select t.id, 'drinks', 'Drinks', '🥤', 14, true from t
on conflict (tenant_id, slug) do nothing;

-- 2) Переклади категорії
with t as (select id from public.tenants where slug = 'paddys')
insert into public.category_translations (category_id, language, name)
select c.id, x.lang, x.name from public.categories c
join t on c.tenant_id = t.id
cross join (values
  ('drinks', 'es', 'Bebidas'),
  ('drinks', 'uk', 'Напої'),
  ('drinks', 'ru', 'Напитки')
) as x(slug, lang, name)
where c.slug = x.slug
on conflict (category_id, language) do update set name = excluded.name;

-- 3) Items (canonical EN name + description)
with t as (select id from public.tenants where slug = 'paddys'),
cat as (select id from public.categories where tenant_id = (select id from t) and slug = 'drinks')
insert into public.menu_items
  (tenant_id, category_id, name, description, price, is_vegetarian, tags, sort_order)
select
  t.id, cat.id, x.name, x.description, x.price, x.is_vegetarian, x.tags, x.sort_order
from t, cat
cross join (values
  ( 1, 'Coca-Cola',         '330ml can',                        2.50::numeric, true, array[]::text[]),
  ( 2, 'Coca-Cola Zero',    '330ml can',                        2.50,          true, array[]::text[]),
  ( 3, 'Sprite',            '330ml can',                        2.50,          true, array[]::text[]),
  ( 4, 'Fanta Orange',      '330ml can',                        2.50,          true, array[]::text[]),
  ( 5, 'Tonic Water',       'Fever-Tree tonic water',           2.50,          true, array[]::text[]),
  ( 6, 'Orange Juice',      'Fresh orange juice',               3.00,          true, array[]::text[]),
  ( 7, 'Sparkling Water',   '500ml bottle',                     2.00,          true, array[]::text[]),
  ( 8, 'Still Water',       '500ml bottle',                     2.00,          true, array[]::text[]),
  ( 9, 'Espresso',          'Single shot of espresso',          1.80,          true, array[]::text[]),
  (10, 'Cappuccino',        'Espresso with steamed milk foam',  2.50,          true, array['dairy']),
  (11, 'Tea',               'Pot of black tea',                 2.00,          true, array[]::text[]),
  (12, 'Guinness (Pint)',   'Irish dry stout, perfectly poured',5.50,          true, array[]::text[]),
  (13, 'Kilkenny (Pint)',   'Irish cream ale',                  5.50,          true, array[]::text[]),
  (14, 'Heineken',          '330ml bottle',                     4.50,          true, array[]::text[]),
  (15, 'Estrella Galicia',  '330ml bottle, Spanish lager',      3.50,          true, array[]::text[]),
  (16, 'House Red Wine',    '175ml glass',                      4.50,          true, array['alcohol']),
  (17, 'House White Wine',  '175ml glass',                      4.50,          true, array['alcohol']),
  (18, 'House Rosé Wine',   '175ml glass',                      4.50,          true, array['alcohol'])
) as x(sort_order, name, description, price, is_vegetarian, tags);

-- 4) Переклади страв (es/uk/ru)
with t as (select id from public.tenants where slug = 'paddys')
insert into public.menu_item_translations (menu_item_id, language, name, description)
select mi.id, x.lang, x.tr_name, x.tr_desc from public.menu_items mi
join t on mi.tenant_id = t.id
cross join (values
  -- ES
  ('Coca-Cola',         'es', 'Coca-Cola',                'Lata de 330ml'),
  ('Coca-Cola Zero',    'es', 'Coca-Cola Zero',           'Lata de 330ml'),
  ('Sprite',            'es', 'Sprite',                   'Lata de 330ml'),
  ('Fanta Orange',      'es', 'Fanta Naranja',            'Lata de 330ml'),
  ('Tonic Water',       'es', 'Tónica Fever-Tree',        'Tónica Fever-Tree'),
  ('Orange Juice',      'es', 'Zumo de Naranja',          'Zumo de naranja natural'),
  ('Sparkling Water',   'es', 'Agua con Gas',             'Botella de 500ml'),
  ('Still Water',       'es', 'Agua sin Gas',             'Botella de 500ml'),
  ('Espresso',          'es', 'Espresso',                 'Café espresso solo'),
  ('Cappuccino',        'es', 'Capuchino',                'Espresso con leche vaporizada'),
  ('Tea',               'es', 'Té',                       'Tetera de té negro'),
  ('Guinness (Pint)',   'es', 'Guinness (Pinta)',         'Stout irlandés tirada a la perfección'),
  ('Kilkenny (Pint)',   'es', 'Kilkenny (Pinta)',         'Cream ale irlandesa'),
  ('Heineken',          'es', 'Heineken',                 'Botella de 330ml'),
  ('Estrella Galicia',  'es', 'Estrella Galicia',         'Botella de 330ml, lager española'),
  ('House Red Wine',    'es', 'Vino Tinto de la Casa',    'Copa de 175ml'),
  ('House White Wine',  'es', 'Vino Blanco de la Casa',   'Copa de 175ml'),
  ('House Rosé Wine',   'es', 'Vino Rosado de la Casa',   'Copa de 175ml'),
  -- UK
  ('Coca-Cola',         'uk', 'Кока-Кола',                'Банка 330мл'),
  ('Coca-Cola Zero',    'uk', 'Кока-Кола Зеро',           'Банка 330мл'),
  ('Sprite',            'uk', 'Спрайт',                   'Банка 330мл'),
  ('Fanta Orange',      'uk', 'Фанта апельсин',           'Банка 330мл'),
  ('Tonic Water',       'uk', 'Тонік',                    'Тонік Fever-Tree'),
  ('Orange Juice',      'uk', 'Апельсиновий сік',         'Свіжовичавлений апельсиновий сік'),
  ('Sparkling Water',   'uk', 'Газована вода',            'Пляшка 500мл'),
  ('Still Water',       'uk', 'Негазована вода',          'Пляшка 500мл'),
  ('Espresso',          'uk', 'Еспресо',                  'Одинарне еспресо'),
  ('Cappuccino',        'uk', 'Капучино',                 'Еспресо зі збитим молоком'),
  ('Tea',               'uk', 'Чай',                      'Чайник чорного чаю'),
  ('Guinness (Pint)',   'uk', 'Guinness (пінта)',         'Ірландський сухий стаут, ідеально налитий'),
  ('Kilkenny (Pint)',   'uk', 'Kilkenny (пінта)',         'Ірландський cream ale'),
  ('Heineken',          'uk', 'Heineken',                 'Пляшка 330мл'),
  ('Estrella Galicia',  'uk', 'Estrella Galicia',         'Пляшка 330мл, іспанський лагер'),
  ('House Red Wine',    'uk', 'Червоне вино',             'Келих 175мл'),
  ('House White Wine',  'uk', 'Біле вино',                'Келих 175мл'),
  ('House Rosé Wine',   'uk', 'Рожеве вино',              'Келих 175мл'),
  -- RU
  ('Coca-Cola',         'ru', 'Кока-Кола',                'Банка 330мл'),
  ('Coca-Cola Zero',    'ru', 'Кока-Кола Зеро',           'Банка 330мл'),
  ('Sprite',            'ru', 'Спрайт',                   'Банка 330мл'),
  ('Fanta Orange',      'ru', 'Фанта апельсин',           'Банка 330мл'),
  ('Tonic Water',       'ru', 'Тоник',                    'Тоник Fever-Tree'),
  ('Orange Juice',      'ru', 'Апельсиновый сок',         'Свежевыжатый апельсиновый сок'),
  ('Sparkling Water',   'ru', 'Газированная вода',        'Бутылка 500мл'),
  ('Still Water',       'ru', 'Негазированная вода',      'Бутылка 500мл'),
  ('Espresso',          'ru', 'Эспрессо',                 'Одинарный эспрессо'),
  ('Cappuccino',        'ru', 'Капучино',                 'Эспрессо со взбитым молоком'),
  ('Tea',               'ru', 'Чай',                      'Чайник чёрного чая'),
  ('Guinness (Pint)',   'ru', 'Guinness (пинта)',         'Ирландский сухой стаут, идеально налитый'),
  ('Kilkenny (Pint)',   'ru', 'Kilkenny (пинта)',         'Ирландский cream ale'),
  ('Heineken',          'ru', 'Heineken',                 'Бутылка 330мл'),
  ('Estrella Galicia',  'ru', 'Estrella Galicia',         'Бутылка 330мл, испанский лагер'),
  ('House Red Wine',    'ru', 'Красное вино',             'Бокал 175мл'),
  ('House White Wine',  'ru', 'Белое вино',               'Бокал 175мл'),
  ('House Rosé Wine',   'ru', 'Розовое вино',             'Бокал 175мл')
) as x(orig_name, lang, tr_name, tr_desc)
where mi.name = x.orig_name
on conflict (menu_item_id, language) do update set name = excluded.name, description = excluded.description;
