# BotiRestaurant v1.0

QR-меню + адмінка ресторану. Стек як у BotiLogistics:
React 19 + TypeScript + Vite + Tailwind 4 + Supabase, деплой через
GitHub Actions → lftp/SFTP → HOSTIQ (хостинг.ua).

Ключова відмінність від оригінальних QRMenu.html/MenuAdmin.html — заміна
`localStorage` на **Supabase Realtime**: адмін тисне «акція -20%» → клієнт
за столиком бачить новий банер за ~200мс без перезавантаження.

## Структура

```
boti-restaurant/
├── menu-client/         # QR-меню для гостей (anon read only)
├── menu-admin/          # Адмінка з Supabase Auth login
└── supabase/
    ├── config.toml      # project_id = delhfvhcdtbfikxkzpjr
    └── migrations/
        ├── 20260526120000_init_restaurant_schema.sql
        └── 20260526120100_secure_rls.sql
```

Deploy workflow: `.github/workflows/boti-restaurant-deploy.yml` (тригер
тільки на зміни в `boti-restaurant/**`).

## Перший запуск — покроково

### Крок 1. Скопіювати ключі Supabase

1. Dashboard → `BotiLocal` (project `delhfvhcdtbfikxkzpjr`) → **Settings → API**
2. Скопіювати:
   - **Project URL** — `https://delhfvhcdtbfikxkzpjr.supabase.co`
   - **anon public** ключ (довгий JWT який починається `eyJ...`)

### Крок 2. GitHub Secrets (MaxProgekt)

GitHub → `botisystemua-cyber/MaxProgekt` → **Settings → Secrets and variables
→ Actions → New repository secret**. Додати:

| Secret | Значення |
|---|---|
| `RESTAURANT_SUPABASE_URL` | Project URL з кроку 1 |
| `RESTAURANT_SUPABASE_ANON_KEY` | anon-key з кроку 1 |
| `SFTP_HOST` | HOSTIQ SFTP host |
| `SFTP_PORT` | HOSTIQ SFTP port |
| `SFTP_USER` | HOSTIQ SFTP user |
| `SFTP_PASSWORD` | HOSTIQ SFTP password |

SFTP-секрети якщо вже є в BotiLogistics — візьми самі значення.

### Крок 3. Застосувати SQL-міграції

Два варіанти — обери один:

**Варіант A: вручну в SQL Editor (швидко)**

1. Dashboard → **SQL Editor** → New query
2. Скопіювати вміст `supabase/migrations/20260526120000_init_restaurant_schema.sql` → Run
3. Новий query, скопіювати `supabase/migrations/20260526120100_secure_rls.sql` → Run
4. Перевірити: **Database → Tables** → мають бути `restaurant_settings`,
   `restaurant_items` (з 17 рядками), `restaurant_banner`
5. **Database → Replication** → всі 3 таблиці мають позначку Realtime

**Варіант B: автоматично через GitHub ↔ Supabase integration (одноразової setup, потім авто)**

1. Dashboard → **Integrations** → **GitHub** → Connect
2. Авторизувати, обрати репо `botisystemua-cyber/MaxProgekt`
3. **Supabase directory** → `boti-restaurant/supabase`
4. **Production branch** → `main`
5. Увімкнути **Automatic deployments**
6. При наступному пуші в `main` міграції з `supabase/migrations/` застосуються автоматично.

### Крок 4. Створити адмін-юзера

Оскільки RLS тепер вимагає роль `authenticated` для запису, адмін логіниться
через Supabase Auth (не PIN).

1. Dashboard → **Authentication → Users** → **Add user**
2. **Create new user** (не invite!)
3. Email: `admin@botisystem.com` (або будь-який інший), пароль на вибір
4. **Auto Confirm User** → увімкнути (інакше потрібне підтвердження через email)
5. Create

### Крок 5. Каталог на HOSTIQ

Через cPanel/SFTP створити:
```
/home3/onglerie/botisystem.com/BotiRestaurant-v1.0/
```

### Крок 6. Локальний dev (для тесту)

```bash
cd boti-restaurant/menu-client
cp .env.example .env
# вписати VITE_SUPABASE_URL та VITE_SUPABASE_ANON_KEY
npm install
npm run dev      # http://localhost:5173

# в іншому терміналі:
cd boti-restaurant/menu-admin
cp .env.example .env
npm install
npm run dev      # http://localhost:5174
```

Відкрий обидва екрани поруч. Увійди в адмінку з email/пароля з кроку 4 →
вмикай банер → зміни на клієнтському табі являються за ~200мс.

### Крок 7. Продакшн деплой

Мерджити PR `claude/gallant-feynman-Q32QB` → `main`. Через ~2 хв:
- **Меню:** https://botisystem.com/BotiRestaurant-v1.0/menu-client/
- **Адмінка:** https://botisystem.com/BotiRestaurant-v1.0/menu-admin/

## Схема даних

| Таблиця | Призначення |
|---|---|
| `restaurant_settings` | Один рядок `id='default'` — назва, адреса, рейтинг, години, WiFi |
| `restaurant_items` | Позиції меню (категорія, ціна, теги, popular/discount/hidden) |
| `restaurant_banner` | Один рядок `id='default'` — активний промо-банер |

Всі в `supabase_realtime` publication.

## RLS

Після `20260526120100_secure_rls.sql`:

- `anon` (клієнт з QR) — тільки `SELECT`
- `authenticated` (адмін після логіну) — повний доступ

Якщо потрібно обмежити доступ декільком конкретним email — замінити
`to authenticated using (true)` на `using (auth.jwt() ->> 'email' = any(array['admin@…']))`.

## Як додавати нові SQL-міграції

1. Створити файл `boti-restaurant/supabase/migrations/<YYYYMMDDHHMMSS>_<name>.sql`
2. Пушнути в `main`
3. Якщо GitHub-інтеграція увімкнена (крок 3, варіант B) — автоматично застосується.
Інакше — вручну в SQL Editor.
