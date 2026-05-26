# BotiLocal

SaaS digital menu для ресторанів і барів. Multi-tenant на Supabase: кожен заклад має свій slug і власне меню за посиланням `botilocal.app/menu/<slug>`.

## Стек

- **Frontend**: React 18 + TypeScript + Vite + Tailwind CSS
- **Backend**: Supabase (Postgres + Auth + Storage + Realtime + RLS)
- **i18n**: react-i18next (ES / EN / UK / RU)
- **Router**: react-router-dom v6
- **State**: Zustand
- **Forms**: React Hook Form
- **QR**: qrcode.react

## Локальний старт

```bash
npm install
cp .env.example .env.local   # заповнити VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY
npm run dev
```

Доступно на <http://localhost:5173>. Демо-меню: `/menu/paddys`.

## Структура

```
src/
├── app/                       # App shell + router + providers
├── features/
│   ├── menu/                  # Публічне меню (/menu/:slug)
│   ├── admin/                 # Адмін-панель (/admin/*)
│   └── auth/                  # Supabase Auth provider + ProtectedRoute
├── shared/
│   ├── lib/                   # supabase client, i18n
│   ├── stores/                # Zustand
│   └── types/                 # TypeScript-типи БД
├── locales/                   # es / en / uk / ru
└── styles/globals.css
supabase/
├── migrations/                # SQL-міграції (включає init + BotiLocal extension)
└── seed.sql                   # Demo tenant "Paddy's Point"
```

## Deploy

GitHub Actions (`.github/workflows/deploy-hostiq.yml`) на push в `main`:

1. `npm ci && npm run build` → `dist/`
2. Генерує `dist/config.js` із Supabase URL/anon-key з GitHub Secrets
3. Заливає `dist/` на HOSTIQ через FTPS (`lftp mirror`)
4. SPA-fallback через `.htaccess`

Production: <https://botisystem.com/BotiLocal/>.

## Що зроблено

- Multi-tenant SQL-схема (tenants, categories, menu_items, translations, users, daily_specials)
- RLS: публічне read тільки активних тенантів, write — лише для команди свого тенанта
- Vite + React + TS + Tailwind + Supabase + i18n scaffold
- Заглушки сторінок `/menu/:slug` і `/admin/*` + Supabase Auth login

## Що далі

- Повний UI публічного меню: категорії, картки страв, daily-special banner, пошук, перемикач мови
- Адмін-панель: CRUD меню, image upload в Storage, drag-and-drop, форма страви, QR-генерація
- PWA: service worker + offline кеш меню
- Realtime: live-оновлення меню для клієнтів
