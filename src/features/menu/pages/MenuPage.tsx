import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import { useTenant } from '../hooks/useTenant';
import { useMenu } from '../hooks/useMenu';
import { useAppStore } from '@/shared/stores/appStore';
import { useCartStore } from '@/shared/stores/cartStore';
import { translateMenuItem } from '../utils/translate';
import type { Language, MenuItem } from '@/shared/types/database';

import { RestaurantHeader } from '../components/RestaurantHeader';
import { LanguageSwitcher } from '../components/LanguageSwitcher';
import { SearchBar } from '../components/SearchBar';
import { CategoryTabs } from '../components/CategoryTabs';
import { MenuItemCard } from '../components/MenuItemCard';
import { MenuItemModal } from '../components/MenuItemModal';
import { SpecialsTicker } from '../components/SpecialsTicker';
import { CartFAB } from '../components/CartFAB';
import { CartDrawer } from '../components/CartDrawer';
import { MenuSkeleton } from '../components/Skeleton';

export default function MenuPage() {
  const { slug, itemId } = useParams<{ slug: string; itemId?: string }>();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();

  const { tenant, loading: tenantLoading, error: tenantError } = useTenant(slug);
  const { data, loading: menuLoading, error: menuError } = useMenu(tenant?.id);

  const language = useAppStore((s) => s.language) as Language;
  const setLanguage = useAppStore((s) => s.setLanguage);

  const [activeCategoryId, setActiveCategoryId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [openItem, setOpenItem] = useState<MenuItem | null>(null);
  const [cartOpen, setCartOpen] = useState(false);

  // Прив'язуємо cart store до тенанта — якщо браузер бачив інший заклад,
  // кошик скидається (логіка в setTenant).
  const setCartTenant = useCartStore((s) => s.setTenant);
  useEffect(() => {
    if (tenant) setCartTenant(tenant.id);
  }, [tenant, setCartTenant]);

  // При першому рендері тенанта — підлаштовуємо мову інтерфейсу:
  // якщо збережена мова не підтримується тенантом, беремо його default.
  useEffect(() => {
    if (!tenant) return;
    const supported = tenant.available_languages;
    const want = supported.includes(language) ? language : tenant.default_language;
    if (want !== i18n.language) {
      setLanguage(want);
      void i18n.changeLanguage(want);
    }
  }, [tenant, language, i18n, setLanguage]);

  // Перший таб активний за замовчуванням.
  useEffect(() => {
    if (!activeCategoryId && data?.categories.length) {
      setActiveCategoryId(data.categories[0].id);
    }
  }, [data, activeCategoryId]);

  // Deep-link на конкретну страву через /menu/:slug/item/:itemId.
  useEffect(() => {
    if (!itemId || !data) return;
    const it = data.items.find((i) => i.id === itemId);
    if (it) setOpenItem(it);
  }, [itemId, data]);

  const fallbackLang = (tenant?.default_language ?? 'es') as Language;
  const currency = tenant?.currency ?? 'EUR';

  const filteredItems = useMemo(() => {
    if (!data) return [];
    const q = search.trim().toLowerCase();
    return data.items
      .filter((i) => i.is_available)
      .filter((i) => {
        if (q) {
          const { name, description } = translateMenuItem(
            i,
            data.itemTranslations,
            language,
            fallbackLang,
          );
          const hay = `${name} ${description ?? ''}`.toLowerCase();
          if (!hay.includes(q)) return false;
        } else if (activeCategoryId && i.category_id !== activeCategoryId) {
          return false;
        }
        return true;
      });
  }, [data, search, activeCategoryId, language, fallbackLang]);

  const activeSpecial = useMemo(() => {
    if (!data || data.specials.length === 0) return null;
    // Беремо найсвіжіший активний special.
    return [...data.specials].sort(
      (a, b) => new Date(b.starts_at).getTime() - new Date(a.starts_at).getTime(),
    )[0];
  }, [data]);

  function handleOpenItem(item: MenuItem) {
    setOpenItem(item);
    if (slug) navigate(`/menu/${slug}/item/${item.id}`, { replace: false });
  }

  function handleCloseItem() {
    setOpenItem(null);
    if (slug && itemId) navigate(`/menu/${slug}`, { replace: true });
  }

  if (tenantLoading || (tenant && menuLoading)) {
    return (
      <main className="mx-auto min-h-full max-w-3xl">
        <MenuSkeleton />
      </main>
    );
  }

  if (tenantError) {
    return (
      <main className="flex min-h-full items-center justify-center p-6 text-rose-600">
        {t('common.error')}: {tenantError.message}
      </main>
    );
  }

  if (!tenant) {
    return (
      <main className="flex min-h-full items-center justify-center p-6 text-slate-500">
        {t('menu.tenantNotFound')}
      </main>
    );
  }

  const style = {
    '--color-brand-primary': tenant.primary_color,
    '--color-brand-secondary': tenant.secondary_color,
  } as React.CSSProperties;

  return (
    <div
      style={style}
      className="mx-auto flex min-h-full max-w-3xl flex-col bg-gradient-to-b from-slate-50 via-slate-50 to-slate-100/60"
    >
      <RestaurantHeader tenant={tenant}>
        <LanguageSwitcher available={tenant.available_languages} />
      </RestaurantHeader>

      {data && data.specials.length > 0 ? (
        <SpecialsTicker
          specials={data.specials}
          items={data.items}
          translations={data.itemTranslations}
          language={language}
          fallbackLanguage={fallbackLang}
          currency={currency}
          onItemClick={handleOpenItem}
        />
      ) : null}

      <div className="sticky top-0 z-30 bg-gradient-to-b from-slate-50 via-slate-50 to-slate-50/95 px-5 pb-3 pt-4 backdrop-blur-md">
        <SearchBar value={search} onChange={setSearch} />
        {!search ? (
          <div className="mt-3.5">
            <CategoryTabs
              categories={data?.categories ?? []}
              translations={data?.categoryTranslations ?? []}
              language={language}
              fallbackLanguage={fallbackLang}
              activeId={activeCategoryId}
              onSelect={setActiveCategoryId}
            />
          </div>
        ) : null}
      </div>

      <section className="flex-1 px-5 pt-3">
        {menuError ? (
          <p className="rounded-xl bg-rose-50 p-4 text-sm text-rose-700">
            {t('common.error')}: {menuError.message}
          </p>
        ) : filteredItems.length === 0 ? (
          <p className="py-10 text-center text-slate-500">{t('menu.noResults')}</p>
        ) : (
          <ul className="space-y-3 pb-32">
            {filteredItems.map((item) => (
              <li key={item.id}>
                <MenuItemCard
                  item={item}
                  translations={data?.itemTranslations ?? []}
                  language={language}
                  fallbackLanguage={fallbackLang}
                  currency={currency}
                  special={
                    activeSpecial?.menu_item_id === item.id ? activeSpecial : undefined
                  }
                  onClick={() => handleOpenItem(item)}
                />
              </li>
            ))}
          </ul>
        )}
      </section>

      <p className="pb-4 pt-2 text-center text-[10px] font-medium text-slate-400">
        Powered by <span className="font-bold text-slate-600">BotiLocal</span>
      </p>

      <CartFAB currency={currency} onClick={() => setCartOpen(true)} />
      <CartDrawer
        open={cartOpen}
        currency={currency}
        tenantSlug={slug ?? ''}
        onClose={() => setCartOpen(false)}
      />

      {openItem ? (
        <MenuItemModal
          item={openItem}
          translations={data?.itemTranslations ?? []}
          language={language}
          fallbackLanguage={fallbackLang}
          currency={currency}
          special={
            activeSpecial?.menu_item_id === openItem.id ? activeSpecial : undefined
          }
          onClose={handleCloseItem}
        />
      ) : null}
    </div>
  );
}
