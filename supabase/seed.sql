-- =====================================================================
-- Seed: Paddy's Point Irish Bar (відповідає DEFAULT_ITEMS у QRMenu.html)
-- =====================================================================

with new_restaurant as (
  insert into public.restaurants
    (slug, name, tagline, address, phone, hours, wifi, rating, reviews)
  values
    ('paddys',
     'Paddy''s Point Irish Bar',
     'Irish Pub & Kitchen · La Zenia',
     'Av. de las Naciones, La Zenia, Orihuela Costa',
     '+34 966 73 05 27',
     '11:00 – 01:00',
     'PaddysPoint2024',
     4.6,
     3787)
  returning id
),
new_categories as (
  insert into public.categories (restaurant_id, slug, label, icon, sort_order)
  select r.id, c.slug, c.label, c.icon, c.sort_order
  from new_restaurant r
  cross join (values
    ('starters', 'Стартери', '🥗', 1),
    ('mains',    'Головне',  '🍖', 2),
    ('desserts', 'Десерти',  '🍮', 3),
    ('drinks',   'Напої',    '🍺', 4)
  ) as c (slug, label, icon, sort_order)
  returning id, slug
),
items (sort_order, cat_slug, name, description, price, is_vegetarian, tags) as (
  values
    ( 1, 'starters', 'Nachos & Cheese Dip',     'Tortilla chips, jalapeños, sour cream, guacamole',           8.5::numeric, false, array['gluten']),
    ( 2, 'starters', 'Irish Beef Stew Soup',    'Rich broth, root vegetables, crusty bread',                  7.5,          false, array['gluten']),
    ( 3, 'starters', 'Garlic Mushrooms',        'Pan-fried butter, garlic & parsley, sourdough',              7.0,          true,  array['gluten','dairy']),
    ( 4, 'starters', 'Chicken Wings x8',        'Buffalo or BBQ sauce, blue cheese dip',                      9.5,          false, array[]::text[]),
    ( 5, 'mains',    'Fish & Chips',            'Beer-battered cod, chunky chips, mushy peas, tartar sauce', 14.5,          false, array['gluten','fish']),
    ( 6, 'mains',    'Irish Beef Burger',       '200g beef patty, cheddar, bacon, lettuce, fries',           13.5,          false, array['gluten','dairy']),
    ( 7, 'mains',    'Shepherd''s Pie',         'Slow-cooked minced lamb, seasonal veg, creamy mash',        13.0,          false, array['dairy']),
    ( 8, 'mains',    'Veggie Burger',           'Grilled halloumi, avocado, tomato, brioche bun, fries',     12.0,          true,  array['gluten','dairy']),
    ( 9, 'mains',    'Steak & Ale Pie',         'Slow braised beef, dark ale gravy, shortcrust pastry, mash',15.0,          false, array['gluten','dairy']),
    (10, 'desserts', 'Sticky Toffee Pudding',   'Warm sponge, toffee sauce, vanilla ice cream',               6.5,          true,  array['gluten','dairy']),
    (11, 'desserts', 'Chocolate Brownie',       'Warm brownie, whipped cream, chocolate drizzle',             6.0,          true,  array['gluten','dairy']),
    (12, 'desserts', 'Cheesecake of the Day',   'Ask your server for today''s flavour',                       6.5,          true,  array['gluten','dairy']),
    (13, 'drinks',   'Guinness',                'Pint · Irish dry stout, perfectly poured',                   5.5,          true,  array[]::text[]),
    (14, 'drinks',   'Kilkenny',                'Pint · Irish cream ale',                                     5.5,          true,  array[]::text[]),
    (15, 'drinks',   'House Wine',              'Glass 175ml · Red / White / Rosé',                           4.5,          true,  array[]::text[]),
    (16, 'drinks',   'Soft Drinks',             'Coca-Cola, Sprite, Fanta, Tonic, OJ',                        2.5,          true,  array[]::text[]),
    (17, 'drinks',   'Irish Coffee',            'Jameson whiskey, hot coffee, brown sugar, cream',            6.0,          true,  array['dairy'])
)
insert into public.products
  (restaurant_id, category_id, name, description, price, is_vegetarian, tags, sort_order)
select
  r.id,
  c.id,
  i.name,
  i.description,
  i.price,
  i.is_vegetarian,
  i.tags,
  i.sort_order
from new_restaurant r
cross join items i
join new_categories c on c.slug = i.cat_slug;
