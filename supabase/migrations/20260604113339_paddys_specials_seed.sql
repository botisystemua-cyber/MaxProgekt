-- =====================================================================
-- Paddy's Point — seed свіжих daily_specials для бігучої стрічки.
--
-- Контекст: бігуча стрічка на /menu/paddys пропала бо таблиця
-- daily_specials порожня з часу пересіву меню (cascade видалив).
-- Створюємо 5 активних специалів які SpecialsTicker покаже:
--   2 daily — блюда дня
--   2 promo — акції зі знижкою
--   1 happy_hour — для коктейлю
-- =====================================================================

with t as (select id from public.tenants where slug = 'paddys'),
items as (
  select mi.id, mi.name, mi.price
  from public.menu_items mi
  join t on mi.tenant_id = t.id
  where mi.name in (
    'Full Irish',
    'Paddy''s Point Burger',
    'Mojito',
    'Pulled Pork Wrap',
    'Famous Paddy''s Point Fish Goujons'
  )
)
insert into public.daily_specials (tenant_id, menu_item_id, special_type, special_price, is_active, starts_at, ends_at)
select
  t.id,
  i.id,
  x.special_type,
  x.special_price,
  true,
  now(),
  case when x.duration_hours > 0 then now() + (x.duration_hours || ' hours')::interval else null end
from t
cross join (values
  ('Full Irish',                          'daily'::varchar,      6.95::numeric, 0),
  ('Paddy''s Point Burger',               'promo'::varchar,     14.95::numeric, 24),
  ('Mojito',                              'happy_hour'::varchar, 5.00::numeric, 4),
  ('Pulled Pork Wrap',                    'daily'::varchar,      9.95::numeric, 0),
  ('Famous Paddy''s Point Fish Goujons',  'promo'::varchar,     10.95::numeric, 24)
) as x(item_name, special_type, special_price, duration_hours)
join items i on i.name = x.item_name;
