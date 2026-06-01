-- =====================================================================
-- Seed: Paddy's Point Irish Bar — повне реальне меню (La Zenia)
-- Джерело: paddys_point_menu_completo.pdf (офіційне меню закладу)
-- =====================================================================

with new_tenant as (
  insert into public.tenants
    (slug, name, tagline, description, address, phone, hours, wifi,
     rating, reviews, primary_color, secondary_color, default_language,
     available_languages, is_active)
  values
    ('paddys',
     'Paddy''s Point Irish Bar',
     'Irish Pub & Kitchen · La Zenia',
     'Authentic Irish pub з домашньою кухнею, живою музикою та найкращим Guinness на узбережжі.',
     'Av. de las Naciones, La Zenia, Orihuela Costa',
     '+34 966 73 05 27',
     '11:00 – 01:00',
     'PaddysPoint2024',
     4.6,
     3787,
     '#1B6B3A',  -- Irish green
     '#1A1A2E',
     'es',
     '["es","en","uk","ru"]'::jsonb,
     true)
  returning id
),
new_categories as (
  insert into public.categories (tenant_id, slug, label, icon, sort_order)
  select t.id, c.slug, c.label, c.icon, c.sort_order
  from new_tenant t
  cross join (values
    ('breakfast',   'Сніданки',             '🍳',  1),
    ('starters',    'Стартери & Закуски',   '🥗',  2),
    ('nachos',      'Начос & Картопля',     '🍟',  3),
    ('salads',      'Салати',               '🥬',  4),
    ('mains',       'Головне',              '🍖',  5),
    ('burgers',     'Бургери',              '🍔',  6),
    ('veggie',      'Веґетаріанські',       '🌱',  7),
    ('sandwiches',  'Сендвічі & Паніні',    '🥪',  8),
    ('wraps',       'Врапи',                '🌯',  9),
    ('kids',        'Дитяче меню',          '🧒', 10),
    ('desserts',    'Десерти & Шейки',      '🍮', 11),
    ('cocktails',   'Коктейлі & Шоти',      '🍹', 12),
    ('sides',       'Гарніри & Соуси',      '🍽️', 13)
  ) as c (slug, label, icon, sort_order)
  returning id, slug
),
items (sort_order, cat_slug, name, description, price, is_vegetarian, tags) as (
  values
    -- ─────────────────────────────────────────────────────────────────
    -- 1. DESAYUNOS (BREAKFAST) — до 14:00
    -- ─────────────────────────────────────────────────────────────────
    (  1, 'breakfast', 'Full Irish',                                    '2 Bacon, 2 Sausage, 2 Fried Eggs, Grilled Tomato, Mushrooms, Baked Beans, Black Pudding & Toast',  8.95::numeric, false, array['gluten']),
    (  2, 'breakfast', 'Half Irish',                                    'Bacon, Sausage, Fried Egg, Grilled Tomato, Baked Beans, Black Pudding & Toast',                  5.50,          false, array['gluten']),
    (  3, 'breakfast', 'Vegetarian Breakfast',                          '2 Fried Eggs, Mushrooms, Grilled Tomato, Hash Brown, Baked Beans & Toast',                       5.95,          true,  array['gluten']),
    (  4, 'breakfast', 'Breakfast Baguette',                            '2 Bacon, 2 Sausage & Fried Egg',                                                                 5.95,          false, array['gluten']),
    (  5, 'breakfast', 'Scrambled Egg & Toast',                         'Huevos revueltos con tostada',                                                                   4.50,          true,  array['gluten']),
    (  6, 'breakfast', 'Scrambled Egg, 2 Bacon & Toast',                'Huevos revueltos з 2 смужками бекону та тостом',                                                  5.95,          false, array['gluten']),
    (  7, 'breakfast', 'Scrambled Egg, 2 Bacon & Toasted Soda Bread',   'Huevos revueltos, 2 смужки бекону та тостований ірландський soda bread',                          6.70,          false, array['gluten']),
    (  8, 'breakfast', 'Healthy Option',                                '2 Poached Eggs, Brown Toast with Granola & Natural Yoghurt',                                     6.95,          true,  array['gluten','dairy']),
    (  9, 'breakfast', 'Omelette',                                      'Light fluffy omelette з 2 наповнювачами на вибір',                                                5.50,          true,  array['eggs']),
    ( 10, 'breakfast', 'Omelette Meal',                                 'Omelette з 2 наповнювачами на вибір + chips',                                                     7.50,          true,  array['eggs']),
    ( 11, 'breakfast', 'Breakfast Bap',                                 'Soft Bap (мʼякий мольєте), Bacon, Sausage & Fried Egg',                                          4.00,          false, array['gluten']),
    ( 12, 'breakfast', 'Gluten Free Toast, 2 Bacon & Scrambled Egg',    'Тостовий хліб без глютену, 2 смужки бекону та scrambled egg',                                     6.60,          false, array['eggs']),
    ( 13, 'breakfast', 'Tostada (Butter & Jam)',                        'Toasted Sourdough, Butter & Jam',                                                                2.00,          true,  array['gluten','dairy']),
    ( 14, 'breakfast', 'Tostada (Tomato & Olive Oil)',                  'Toasted Sourdough, Tomato & Olive Oil',                                                          2.50,          true,  array['gluten']),
    ( 15, 'breakfast', 'Special Tostada',                               'Toasted Sourdough, Bacon, Cheese & Tomato',                                                      5.25,          false, array['gluten','dairy']),
    ( 16, 'breakfast', 'Extra Special Tostada',                         'Toasted Sourdough, Bacon, Cheese, Tomato & Fried Eggs',                                          6.50,          false, array['gluten','dairy']),
    ( 17, 'breakfast', 'Something Sweet',                               'Toasted Waffle or Pancakes served with Cream & Chocolate Sauce',                                  4.95,          true,  array['gluten','dairy']),
    -- Breakfast extras
    ( 18, 'breakfast', 'Soda Bread',                                    'Порція ірландського soda bread',                                                                 1.20,          true,  array['gluten']),
    ( 19, 'breakfast', 'Toasted Soda Bread',                            'Тостований ірландський soda bread',                                                              1.30,          true,  array['gluten']),
    ( 20, 'breakfast', 'Hash Brown',                                    'Картопляний драник',                                                                             1.00,          true,  array[]::text[]),
    ( 21, 'breakfast', 'Extra Filling',                                 'Додатковий інгредієнт до сніданку',                                                              0.90,          true,  array[]::text[]),
    -- Breakfast cocktails
    ( 22, 'breakfast', 'The Morning Mule',                              'Vodka, Ginger Beer & Orange Juice',                                                              6.50,          true,  array['alcohol']),
    ( 23, 'breakfast', 'Bloody Mary',                                   'Класичний коктейль на сніданок',                                                                 6.00,          true,  array['alcohol']),
    ( 24, 'breakfast', 'Mimosa',                                        'Cava + свіжий апельсиновий сік',                                                                 5.00,          true,  array['alcohol']),

    -- ─────────────────────────────────────────────────────────────────
    -- 2. ENTRANTES Y SNACKS (STARTERS & SNACKS)
    -- ─────────────────────────────────────────────────────────────────
    (  1, 'starters', 'Garlic Bread',                       'Пан-де-айо (часниковий хліб)',                                                4.00, true,  array['gluten','dairy']),
    (  2, 'starters', 'Cheesy Garlic Bread',                'Часниковий хліб запечений із сиром',                                          4.50, true,  array['gluten','dairy']),
    (  3, 'starters', 'Classic Prawn Cocktail',             'Served with Guinness Wheaten Bread or Crusty Baguette',                       7.95, false, array['gluten','shellfish']),
    (  4, 'starters', 'Hot Wings',                          'In a Spicy Honey Glaze Sauce & Served with Ranch Dressing',                   7.95, false, array['dairy']),
    (  5, 'starters', 'BBQ Chicken Wings',                  'Курячі крильця в соусі барбекю',                                              7.50, false, array[]::text[]),
    (  6, 'starters', 'Crispy Chicken Strips',              'Хрусткі курячі смужки з Chilli Mayo',                                         6.95, false, array['gluten','eggs']),
    (  7, 'starters', 'Southern Fried Chicken Goujons',     'Served with Sweet Chilli Sauce',                                              7.50, false, array['gluten']),
    (  8, 'starters', 'Small Goats Cheese Salad',           'With Apple, Candied Walnuts & Beetroot',                                      6.50, true,  array['dairy','nuts']),
    (  9, 'starters', 'Potato Skins',                       'With Bacon, Cheese & Sour Cream',                                             6.50, false, array['dairy']),

    -- ─────────────────────────────────────────────────────────────────
    -- 3. NACHOS, LOADED FRIES & JACKET POTATOES
    -- ─────────────────────────────────────────────────────────────────
    (  1, 'nachos', 'Nachos (Classic)',                          'Tortilla chips, Cheese, Sour Cream & Guacamole. REG €5.00 / LRG €6.50',                  5.00, true,  array['gluten','dairy']),
    (  2, 'nachos', 'Cheesy Nachos with Spicy Jalapeño Salsa',   'Sour Cream & Guacamole. REG €5.00 / LRG €6.50',                                          5.00, true,  array['gluten','dairy']),
    (  3, 'nachos', 'Cheesy Chilli Beef Nachos',                 'REG €7.50 / LRG €9.50',                                                                  7.50, false, array['gluten','dairy']),
    (  4, 'nachos', 'BBQ Pulled Pork Nachos',                    'BBQ Pulled Pork & Cheese. REG €7.95 / LRG €9.95',                                        7.95, false, array['gluten','dairy']),
    (  5, 'nachos', 'Cajun Chicken Nachos',                      'Cajun Chicken, Salsa & Cheese. REG €7.95 / LRG €9.95',                                   7.95, false, array['gluten','dairy']),
    (  6, 'nachos', 'Cheesy Chips',                              'Картопля фрі з розплавленим сиром. REG €5.50 / LRG €7.50',                               5.50, true,  array['dairy']),
    (  7, 'nachos', 'Cheesy Chilli Beef Chips',                  'REG €7.50 / LRG €9.50',                                                                  7.50, false, array['dairy']),
    (  8, 'nachos', 'Bacon & Cheese Chips',                      'REG €7.50 / LRG €9.50',                                                                  7.50, false, array['dairy']),
    (  9, 'nachos', 'Chilli Beef Jacket',                        'Запечена картопля з chilli beef',                                                        9.00, false, array['dairy']),
    ( 10, 'nachos', 'Tuna Mayo Jacket',                          'Запечена картопля з тунцем у майонезі',                                                  8.50, false, array['fish','eggs']),
    ( 11, 'nachos', 'Prawn Jacket with Marie Rose',              'Запечена картопля з креветками у соусі Marie Rose',                                      9.50, false, array['shellfish','eggs']),
    ( 12, 'nachos', 'Cheesy Jacket with Coleslaw',               'Запечена картопля з сиром та коулсло',                                                   6.00, true,  array['dairy','eggs']),
    ( 13, 'nachos', 'Bacon & Cheese Jacket',                     'Запечена картопля з беконом та сиром',                                                   7.95, false, array['dairy']),

    -- ─────────────────────────────────────────────────────────────────
    -- 4. ENSALADAS (SALADS)
    -- ─────────────────────────────────────────────────────────────────
    (  1, 'salads', 'Caesar Salad with Chicken & Bacon',   'Ensalada César з куркою та беконом',                                          9.95,  false, array['gluten','dairy','eggs']),
    (  2, 'salads', 'Goats Cheese Salad',                  'With Apple, Beetroot & Candied Walnuts',                                     10.95,  true,  array['dairy','nuts']),
    (  3, 'salads', 'Tuna Mayo Salad',                     'Ensalada з тунця з майонезом',                                               10.95,  false, array['fish','eggs']),
    (  4, 'salads', 'Piri Piri Chicken Salad',             'Spicy Marinated Breast of Chicken served with Lemon Mayonnaise',             10.95,  false, array['eggs']),
    (  5, 'salads', 'Prawn & Marie Rose Salad',            'Ensalada з креветок у соусі Marie Rose',                                     12.50,  false, array['shellfish','eggs']),
    (  6, 'salads', 'Tuna Nicoise Salad',                  'With Hard Boiled Eggs, Olives & Anchovies',                                  11.50,  false, array['fish','eggs']),

    -- ─────────────────────────────────────────────────────────────────
    -- 5. PLATOS PRINCIPALES (MAINS)
    -- ─────────────────────────────────────────────────────────────────
    (  1, 'mains', 'Paddy''s Point 10oz Sirloin',                       'Chips, Beer Battered Onion Rings & a choice of sauce',           20.95, false, array['gluten']),
    (  2, 'mains', 'Paddy''s Point 12oz Ribeye',                        'Chips, Beer Battered Onion Rings & a choice of sauce',           22.95, false, array['gluten']),
    (  3, 'mains', 'Open Steak Sandwich',                                '5oz Sirloin, Toasted Sour Dough, Sautéed Onions, Rocket, Chips. +€1.50 Sautéed Mushrooms', 13.95, false, array['gluten']),
    (  4, 'mains', 'Full Rack of Ribs',                                  'Glazed in a rich BBQ sauce & served with Cajun Chips & Coleslaw', 20.95, false, array['eggs']),
    (  5, 'mains', 'Pan Fried Chicken',                                  'Chips, Salad & Pepper Sauce',                                    10.95, false, array['dairy']),
    (  6, 'mains', 'Piri Piri Breast of Chicken',                        'Chips, Salad & Lemon Mayonnaise',                                12.50, false, array['eggs']),
    (  7, 'mains', 'Scampi & Chips',                                     'Chips, Salad and homemade Tartare Sauce',                        12.95, false, array['gluten','shellfish','eggs']),
    (  8, 'mains', 'Paddy''s Point Chicken Curry',                       'Served with Chips & Rice',                                        9.95, false, array['gluten']),
    (  9, 'mains', 'Southern Fried Chicken Goujons',                     'Chips & Sweet Chilli Dip',                                       12.50, false, array['gluten']),
    ( 10, 'mains', 'Bangers & Mash',                                     'Pork & Leek Sausages, Creamy Mash, Gravy & Crispy Onions',        8.95, false, array['gluten','dairy']),
    ( 11, 'mains', 'The Famous Paddy''s Point Fish Goujons',             'Lightly Battered Fish Goujons, Chips, Curry Coleslaw & Salad',   12.95, false, array['gluten','fish','eggs']),
    ( 12, 'mains', 'Homemade Lasagne',                                   'Served with Garlic Bread & Rocket Salad',                        10.50, false, array['gluten','dairy','eggs']),

    -- ─────────────────────────────────────────────────────────────────
    -- 6. GOURMET BURGERS (6oz, brioche, lettuce, tomato + chips)
    -- ─────────────────────────────────────────────────────────────────
    (  1, 'burgers', 'The Classic with Fried Onions',                 '6oz beef patty, brioche bun, lettuce, tomato + chips',           10.50, false, array['gluten']),
    (  2, 'burgers', 'The Classic with Cheese & Fried Onions',        '6oz beef patty з сиром та смаженою цибулею',                     11.95, false, array['gluten','dairy']),
    (  3, 'burgers', 'The Texan',                                     'Bacon, Cheese & BBQ Sauce',                                      11.95, false, array['gluten','dairy']),
    (  4, 'burgers', 'Southern Fried Chicken Burger',                 'Chilli Mayo, Gherkins, Guacamole & Bacon',                       11.95, false, array['gluten','eggs']),
    (  5, 'burgers', 'The Pulled Pork Burger',                        'Beef Burger Topped with BBQ Pulled Pork, Cheese & Onion Ring',   13.50, false, array['gluten','dairy']),
    (  6, 'burgers', 'Paddy''s Point Burger',                         'Double Beef, Bacon, Cheese, Fried Onion & Beer Battered Onion Rings. Gluten-free доступно', 17.50, false, array['gluten','dairy']),

    -- ─────────────────────────────────────────────────────────────────
    -- 7. VEGETARIAN OPTIONS
    -- ─────────────────────────────────────────────────────────────────
    (  1, 'veggie', 'Veggie Potato Skins',                  'With Cheese, Onion & Sour Cream',                                          6.50, true,  array['dairy']),
    (  2, 'veggie', 'Paddy''s Point Vegetable Curry',       'Served with Chips & Rice',                                                12.95, true,  array['gluten']),
    (  3, 'veggie', 'Beyond Burger',                        'Plant Based Burger з сиром та смаженою цибулею + chips. Веган опція доступна', 12.50, true, array['gluten','dairy']),

    -- ─────────────────────────────────────────────────────────────────
    -- 8. SÁNDWICHES / PANINIS / BAGUETTES / TOASTIES — до 18:00
    -- ─────────────────────────────────────────────────────────────────
    (  1, 'sandwiches', 'Ham Salad Sandwich',                                   'Класичний сендвіч',                                                 4.50, false, array['gluten']),
    (  2, 'sandwiches', 'Chicken & Stuffing Sandwich',                          'Курка з ірландською начинкою',                                       4.50, false, array['gluten']),
    (  3, 'sandwiches', 'Chopped Chicken, Salad & Mayo Sandwich',               'Подрібнена курка з салатом і майонезом',                             4.95, false, array['gluten','eggs']),
    (  4, 'sandwiches', 'Tuna Mayo Sandwich',                                   'Тунець з майонезом',                                                 5.95, false, array['gluten','fish','eggs']),
    (  5, 'sandwiches', 'Prawn & Marie Rose Sandwich',                          'Креветки у соусі Marie Rose',                                        6.50, false, array['gluten','shellfish','eggs']),
    (  6, 'sandwiches', 'Panini · Crispy Chicken & Mozzarella',                 'Crispy Chicken, Red Onion, Sweet Chilli, Mozzarella & Rocket',       7.50, false, array['gluten','dairy']),
    (  7, 'sandwiches', 'Panini · Ham & Cheese',                                'Хам та сир',                                                         5.50, false, array['gluten','dairy']),
    (  8, 'sandwiches', 'Panini · Ham, Cheese, Tomato & Onion',                 'Хам, сир, помідор та цибуля',                                        5.95, false, array['gluten','dairy']),
    (  9, 'sandwiches', 'Panini · Tuna Mayo & Cheese',                          'Тунець з майонезом та сиром',                                        6.95, false, array['gluten','fish','dairy','eggs']),
    ( 10, 'sandwiches', 'Panini · Bacon, Cheese & Mushroom',                    'Бекон, сир та печериці',                                             6.95, false, array['gluten','dairy']),
    ( 11, 'sandwiches', 'Panini · Cajun Chicken & Cheese',                      'Cajun курка з сиром',                                                6.95, false, array['gluten','dairy']),
    ( 12, 'sandwiches', 'Baguette · Ham Salad',                                 'Свіжа багета з шинкою та салатом',                                   5.50, false, array['gluten']),
    ( 13, 'sandwiches', 'Baguette · Chopped Chicken, Salad & Mayo',             'Багета з куркою',                                                    5.95, false, array['gluten','eggs']),
    ( 14, 'sandwiches', 'Baguette · B.L.T.',                                    'Bacon, Lettuce & Tomato',                                            6.25, false, array['gluten']),
    ( 15, 'sandwiches', 'Baguette · Prawn & Marie Rose',                        'Креветки в соусі Marie Rose',                                        8.20, false, array['gluten','shellfish','eggs']),
    ( 16, 'sandwiches', 'Baguette · Tuna Mayo & Cheese',                        'Тунець з майонезом та сиром',                                        8.50, false, array['gluten','fish','dairy','eggs']),
    ( 17, 'sandwiches', 'Toasted Special',                                      'Ham, Cheese, Tomato & Onion',                                        4.95, false, array['gluten','dairy']),
    ( 18, 'sandwiches', 'B.L.T. Toasted',                                       'Тостований Bacon, Lettuce & Tomato',                                 4.95, false, array['gluten']),
    ( 19, 'sandwiches', 'Paddy''s Point Club Sandwich',                         'Chicken, Bacon, Cheese, Pickled Onion, Boiled Egg, Rocket, Relish + Battered Black Pudding', 10.95, false, array['gluten','dairy','eggs']),

    -- ─────────────────────────────────────────────────────────────────
    -- 9. WRAPS (всі з chips)
    -- ─────────────────────────────────────────────────────────────────
    (  1, 'wraps', 'Pulled Pork Wrap',                       'Marinated Pulled Pork, Lettuce, Radish & Chilli Mayo + chips',           11.95, false, array['gluten','eggs']),
    (  2, 'wraps', 'Southern Fried Chicken Goujon Wrap',     'Lettuce, Cherry Tomato, Red Onion, Avocado & Ranch Dressing + chips',    11.50, false, array['gluten','dairy']),
    (  3, 'wraps', 'Caesar Salad Wrap',                      'Chicken, Bacon, Lettuce & Caesar Dressing + chips',                      10.95, false, array['gluten','dairy','eggs']),

    -- ─────────────────────────────────────────────────────────────────
    -- 10. KIDS MENU (всі +безкоштовне морозиво)
    -- ─────────────────────────────────────────────────────────────────
    (  1, 'kids', 'Burger & Chips',                          'Алергени: глютен, яйця, молоко. Безкоштовне морозиво',                    5.50, false, array['gluten','eggs','dairy']),
    (  2, 'kids', 'Chicken Bites & Chips',                   'Алергени: глютен, яйця, молоко. Безкоштовне морозиво',                    5.50, false, array['gluten','eggs','dairy']),
    (  3, 'kids', 'Fish Fingers & Chips',                    'Алергени: глютен, яйця, риба, молоко. Безкоштовне морозиво',              5.50, false, array['gluten','eggs','fish','dairy']),
    (  4, 'kids', 'Sausage & Chips',                         'Алергени: глютен, молоко. Безкоштовне морозиво',                          5.50, false, array['gluten','dairy']),
    (  5, 'kids', 'Chicken Breast, Mash & Gravy',            'Алергени: глютен, молоко. Безкоштовне морозиво',                          5.50, false, array['gluten','dairy']),

    -- ─────────────────────────────────────────────────────────────────
    -- 11. DESSERTS, MILKSHAKES, SPECIAL COFFEES
    -- ─────────────────────────────────────────────────────────────────
    (  1, 'desserts', 'Paddy''s Point Cheesecake',                       'З морозивом',                                                  6.50, true,  array['gluten','dairy','eggs']),
    (  2, 'desserts', 'Traditional Apple Pie',                           'З custard або морозивом',                                      4.50, true,  array['gluten','dairy','eggs']),
    (  3, 'desserts', 'Warm Chocolate Fudge Cake',                       'З морозивом',                                                  5.50, true,  array['gluten','dairy','eggs']),
    (  4, 'desserts', 'Carrot Cake (Gluten Free)',                       'Зі сметаною або морозивом',                                    5.95, true,  array['dairy','eggs','nuts']),
    (  5, 'desserts', 'Toasted Waffle',                                  'З морозивом, вершками та шоколадним соусом',                   4.95, true,  array['gluten','dairy','eggs']),
    (  6, 'desserts', 'Cadbury''s Caramel Sundae',                       'NEW! Карамельний санде',                                       6.50, true,  array['dairy','eggs']),
    (  7, 'desserts', 'Vanilla Milkshake',                               'Ванільний молочний коктейль',                                  4.95, true,  array['dairy']),
    (  8, 'desserts', 'Strawberry Milkshake',                            'Полуничний молочний коктейль',                                 4.95, true,  array['dairy']),
    (  9, 'desserts', 'Chocolate Milkshake',                             'Шоколадний молочний коктейль',                                 4.95, true,  array['dairy']),
    ( 10, 'desserts', 'Baileys Milkshake',                               'З ванільним морозивом',                                        6.95, true,  array['dairy','alcohol']),
    ( 11, 'desserts', 'Baileys Strawberry Milkshake',                    'Baileys + полуниця',                                           6.95, true,  array['dairy','alcohol']),
    ( 12, 'desserts', 'Irish Coffee',                                    'Jameson whiskey, hot coffee, brown sugar, cream',              6.75, true,  array['dairy','alcohol']),
    ( 13, 'desserts', 'Baileys Coffee',                                  'Кава з Baileys',                                               6.75, true,  array['dairy','alcohol']),
    ( 14, 'desserts', 'Calypso Coffee',                                  'Кава з Tia Maria',                                             6.75, true,  array['dairy','alcohol']),
    ( 15, 'desserts', 'Brandy Coffee',                                   'Кава з бренді',                                                6.00, true,  array['dairy','alcohol']),
    ( 16, 'desserts', 'Hennessy Coffee',                                 'Кава з Hennessy',                                              8.50, true,  array['dairy','alcohol']),
    ( 17, 'desserts', 'Hot Whiskey',                                     'Гарячий віскі з гвоздикою та лимоном',                         4.60, true,  array['alcohol']),
    ( 18, 'desserts', 'Hot Brandy',                                      'Гарячий бренді',                                               4.00, true,  array['alcohol']),

    -- ─────────────────────────────────────────────────────────────────
    -- 12. COCKTAILS & SHOTS
    -- ─────────────────────────────────────────────────────────────────
    (  1, 'cocktails', 'Dark ''N'' Stormy',                              'NEW! Темний ром, ginger beer, лайм',                           7.50, true,  array['alcohol']),
    (  2, 'cocktails', 'Pink Grapefruit Fizz',                           'NEW! Освіжаючий грейпфрутовий коктейль',                       7.50, true,  array['alcohol']),
    (  3, 'cocktails', 'Pina Colada',                                    'Ром, кокос, ананас',                                           7.50, true,  array['alcohol','dairy']),
    (  4, 'cocktails', 'Solero',                                         'Тропічний коктейль у стилі морозива',                          7.50, true,  array['alcohol','dairy']),
    (  5, 'cocktails', 'Mud Slide',                                      'Baileys, Kahlua, vodka, cream',                                7.50, true,  array['alcohol','dairy']),
    (  6, 'cocktails', 'Strawberry Daiquiri',                            'Ром, полуниця, лайм',                                          7.50, true,  array['alcohol']),
    (  7, 'cocktails', 'Mojito',                                         'Білий ром, мята, лайм, цукор, газована вода',                  7.00, true,  array['alcohol']),
    (  8, 'cocktails', 'Amaretto Sour',                                  'Amaretto, лимонний сік, цукровий сироп',                       7.00, true,  array['alcohol']),
    (  9, 'cocktails', 'Irish Whiskey Sour',                             'Ірландський віскі сауер',                                      7.00, true,  array['alcohol','eggs']),
    ( 10, 'cocktails', 'Espresso Martini',                               'Vodka, kahlua, espresso',                                      7.00, true,  array['alcohol']),
    ( 11, 'cocktails', 'Long Island Iced Tea',                           'Класика крутих коктейлів',                                     7.00, true,  array['alcohol']),
    ( 12, 'cocktails', 'Sex on the Beach',                               'Vodka, peach, журавлина, апельсин',                            6.50, true,  array['alcohol']),
    ( 13, 'cocktails', 'Tequila Sunrise',                                'Tequila, апельсиновий сік, гренадин',                          6.50, true,  array['alcohol']),
    ( 14, 'cocktails', 'Cosmopolitan',                                   'Vodka, Cointreau, журавлина, лайм',                            6.50, true,  array['alcohol']),
    ( 15, 'cocktails', 'Aperol Spritz',                                  'Aperol, prosecco, газована вода',                              6.50, true,  array['alcohol']),
    ( 16, 'cocktails', 'Sangria',                                        'Іспанська класика з фруктами',                                 5.00, true,  array['alcohol']),
    ( 17, 'cocktails', 'Love on the Beach (no alcohol)',                 'Безалкогольний коктейль',                                      4.50, true,  array[]::text[]),
    ( 18, 'cocktails', 'Nojito (no alcohol)',                            'Безалкогольний mojito',                                        4.95, true,  array[]::text[]),
    ( 19, 'cocktails', 'Virgin Strawberry Daiquiri',                     'Безалкогольний полуничний дайкірі',                            4.95, true,  array[]::text[]),
    -- Shots
    ( 20, 'cocktails', 'Shot · Baby Guinness',                           'Kahlua + Baileys',                                             3.20, true,  array['alcohol','dairy']),
    ( 21, 'cocktails', 'Shot · After 8',                                 'Mint chocolate шот',                                           3.20, true,  array['alcohol']),
    ( 22, 'cocktails', 'Shot · Slippery Nipple',                         'Baileys + Sambuca',                                            3.20, true,  array['alcohol','dairy']),
    ( 23, 'cocktails', 'Shot · Milky Bar',                               'Білий шоколадний шот',                                         3.00, true,  array['alcohol','dairy']),
    ( 24, 'cocktails', 'Shot · Tequila Rosé',                            'Tequila Rosé',                                                 3.00, true,  array['alcohol']),
    ( 25, 'cocktails', 'Shot · Irish Flag',                              'Three-layer Crème de menthe / Baileys / Grand Marnier',        4.00, true,  array['alcohol','dairy']),
    ( 26, 'cocktails', 'Shot · Jager Bomb',                              'Jägermeister + Red Bull',                                      4.00, true,  array['alcohol']),
    ( 27, 'cocktails', 'Shot · Vegas Bomb',                              'Crown Royal, Peach Schnapps + Red Bull',                       4.00, true,  array['alcohol']),

    -- ─────────────────────────────────────────────────────────────────
    -- 13. SIDES & EXTRA SAUCES
    -- ─────────────────────────────────────────────────────────────────
    (  1, 'sides', 'Gravy Chips',                       'Patatas з мʼясною підливою',                                                    5.00, false, array['gluten','dairy']),
    (  2, 'sides', 'Cajun Chips',                       'Картопля фрі з cajun spice',                                                    4.00, true,  array[]::text[]),
    (  3, 'sides', 'Portion of Wedges',                 'Картопляні часточки',                                                           4.00, true,  array[]::text[]),
    (  4, 'sides', 'Beer Battered Onion Rings',         'Кільця цибулі в пивному клярі',                                                 3.50, true,  array['gluten']),
    (  5, 'sides', 'Portion of Chips',                  'Ракія картоплі фрі',                                                            3.50, true,  array[]::text[]),
    (  6, 'sides', 'Creamy Mash',                       'Кремове картопляне пюре',                                                       3.00, true,  array['dairy']),
    (  7, 'sides', 'Fresh Vegetables',                  'Свіжі овочі сезону',                                                            3.00, true,  array[]::text[]),
    (  8, 'sides', 'Extra Crispy Chicken Strips',       'Додаткова порція хрустких курячих смужок',                                      6.95, false, array['gluten']),
    (  9, 'sides', 'Sauce · Pepper',                    'Перцевий соус',                                                                 1.50, true,  array['dairy']),
    ( 10, 'sides', 'Sauce · Curry',                     'Соус каррі',                                                                    1.50, true,  array[]::text[]),
    ( 11, 'sides', 'Sauce · Garlic Mayo',               'Часниковий майонез',                                                            1.50, true,  array['eggs']),
    ( 12, 'sides', 'Sauce · Sweet Chilli',              'Солодкий чилі',                                                                 1.50, true,  array[]::text[]),
    ( 13, 'sides', 'Sauce · Chilli Mayo',               'Чилі майонез',                                                                  1.50, true,  array['eggs']),
    ( 14, 'sides', 'Sauce · BBQ',                       'Барбекю соус',                                                                  1.50, true,  array[]::text[])
)
insert into public.menu_items
  (tenant_id, category_id, name, description, price, is_vegetarian, tags, sort_order)
select
  t.id,
  c.id,
  i.name,
  i.description,
  i.price,
  i.is_vegetarian,
  i.tags,
  i.sort_order
from new_tenant t
cross join items i
join new_categories c on c.slug = i.cat_slug;
