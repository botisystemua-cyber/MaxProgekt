# BotiRestaurant v1.0

QR-меню + адмінка ресторану на тому ж стеку що й BotiLogistics:
React 19 + TypeScript + Vite + Tailwind + Supabase, деплой через
GitHub Actions → lftp/SFTP → HOSTIQ (хостинг.ua).

Логотип адмін-панелі — заміна `localStorage` на **Supabase Realtime**:
адмін тиснe «акція -20%» → клієнт за столиком бачить новий банер
за ~200мс, без перезавантаження.

## Структура

```
boti-restaurant/
├── menu-client/         # QR-меню для гостей (Vite + React + Supabase)
├── menu-admin/          # Адмінка офіціанта/власника (PIN 1234)
└── sql/
    └── 001-init-restaurant-schema.sql
```

GitHub Actions workflow живе у репозиторії на рівні
`.github/workflows/boti-restaurant-deploy.yml` і тригериться лише на
пуш-зміни всередині `boti-restaurant/**`.

## Перший запуск (one-time setup)

### 1. Supabase

1. Створи новий проект на https://supabase.com (free tier OK).
2. Зайди в **SQL Editor** → встав вміст `sql/001-init-restaurant-schema.sql` → Run.
3. Перевір: **Database → Replication** → переконайся що `restaurant_settings`,
   `restaurant_items`, `restaurant_banner` мають Realtime увімкнено (галочка).
4. Скопіюй з **Settings → API**:
   - Project URL (виглядає як `https://abcxyz.supabase.co`)
   - anon public key

### 2. GitHub Secrets

Додай у **Settings → Secrets and variables → Actions** репозиторію
`botisystemua-cyber/MaxProgekt` ці секрети (якщо ще не існують):

| Secret | Значення |
|---|---|
| `RESTAURANT_SUPABASE_URL` | Project URL з кроку 1 |
| `RESTAURANT_SUPABASE_ANON_KEY` | anon-key з кроку 1 |
| `SFTP_HOST` | HOSTIQ SFTP host (той самий що для BotiLogistics) |
| `SFTP_PORT` | HOSTIQ SFTP port |
| `SFTP_USER` | HOSTIQ SFTP user |
| `SFTP_PASSWORD` | HOSTIQ SFTP password |

### 3. Папка на HOSTIQ

Через cPanel або SFTP створи каталог:
```
/home3/onglerie/botisystem.com/BotiRestaurant-v1.0/
```
(Якщо шлях інший — поправ `SFTP_REMOTE_PATH` у workflow.)

### 4. Локальний dev

```bash
cd boti-restaurant/menu-client
cp .env.example .env
# вписати реальні VITE_SUPABASE_URL та VITE_SUPABASE_ANON_KEY
npm install
npm run dev

# в іншому терміналі — адмінка:
cd ../menu-admin
cp .env.example .env
# (значення ті самі — менеджер та гість дивляться на одну БД)
npm install
npm run dev
```

Відкрий обидва екрани поруч — зміни в `/menu-admin/` миттєво
з'являються в `/menu-client/`.

## Деплой

Після мерджу гілки в `main` (або через **Actions → Deploy BotiRestaurant
to HOSTIQ → Run workflow**) обидва додатки збираються і заливаються
на HOSTIQ. Результат:

- **Меню для гостей:** https://botisystem.com/BotiRestaurant-v1.0/menu-client/
- **Адмінка:** https://botisystem.com/BotiRestaurant-v1.0/menu-admin/  (PIN: `1234`)

Workflow майже один-в-один з BotiLogistics: matrix-білд кожного React-app,
artifact upload, потім один deploy-джоб збирає `_deploy/` і ллє через
lftp mirror з тим же `touch` хаком на mtime.

## Схема даних (Supabase)

| Таблиця | Призначення |
|---|---|
| `restaurant_settings` | Одна строка `id='default'` — назва, адреса, рейтинг, години, WiFi |
| `restaurant_items` | Позиції меню (категорія, ціна, теги, popular/discount/hidden) |
| `restaurant_banner` | Одна строка `id='default'` — активний промо-банер |

Всі три в `supabase_realtime` publication — клієнт підписується одним
`subscribe()` на всі три таблиці через `subscribeToMenu()` у `lib/menu.ts`.

## Безпека

⚠️ Поточні RLS-політики дозволяють `anon` запис у всі три таблиці —
це MVP-режим достатній для демки/прототипу. PIN `1234` в адмінці
перевіряється тільки на фронті — будь-хто з anon-key може писати
в базу напряму.

Для продакшна замінити політики на «public read only» + перенести
адмін-мутації на server-side Supabase Edge Function із службовим
ключем, гейтнуту реальною авторизацією (наприклад owner-crm з
BotiLogistics як референс — там через RPC і `auth.uid()`).
