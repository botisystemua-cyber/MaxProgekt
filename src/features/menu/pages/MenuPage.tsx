import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import { useTenant } from '../hooks/useTenant';
import { useMenu } from '../hooks/useMenu';
import { useAppStore } from '@/shared/stores/appStore';
import { translateMenuItem } from '../utils/translate';
import type { Language, MenuItem } from '@/shared/types/database';

import { RestaurantHeader } from '../components/RestaurantHeader';
import { LanguageSwitcher } from '../components/LanguageSwitcher';
import { SearchBar } from '../components/SearchBar';
import { CategoryTabs } from '../components/CategoryTabs';
import { MenuItemCard } from '../components/MenuItemCard';
import { MenuItemModal } from '../components/MenuItemModal';
import { DailySpecialBanner } from '../components/DailySpecialBanner';
import { RestaurantFooter } from '../components/RestaurantFooter';
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

  const specialItem = useMemo(() => {
    if (!activeSpecial || !data) return undefined;
    return data.items.find((i) => i.id === activeSpecial.menu_item_id);
  }, [activeSpecial, data]);

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

  // Знайдений special-страву показуємо у банері, але приховуємо її окрему картку
  // у списку — інакше вона дублюється (банер + картка).
  const specialItemId = activeSpecial?.menu_item_id;

  return (
    <div style={style} className="mx-auto flex min-h-full max-w-3xl flex-col bg-slate-50">
      <RestaurantHeader tenant={tenant}>
        <LanguageSwitcher available={tenant.available_languages} />
      </RestaurantHeader>

      <div className="sticky top-0 z-30 -mb-2 bg-slate-50 px-5 pb-3 pt-4 shadow-sm">
        <SearchBar value={search} onChange={setSearch} />
        {!search ? (
          <div className="mt-3">
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

      <section className="flex-1 px-5 pt-5">
        {activeSpecial && specialItem && !search ? (
          <div className="mb-5">
            <DailySpecialBanner
              special={activeSpecial}
              item={specialItem}
              translations={data?.itemTranslations ?? []}
              language={language}
              fallbackLanguage={fallbackLang}
              currency={currency}
              onClick={() => handleOpenItem(specialItem)}
            />
          </div>
        ) : null}

        {menuError ? (
          <p className="rounded-xl bg-rose-50 p-4 text-sm text-rose-700">
            {t('common.error')}: {menuError.message}
          </p>
        ) : filteredItems.length === 0 ? (
          <p className="py-10 text-center text-slate-500">{t('menu.noResults')}</p>
        ) : (
          <ul className="space-y-3 pb-6">
            {filteredItems
              .filter((i) => search || i.id !== specialItemId)
              .map((item) => (
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

      <RestaurantFooter tenant={tenant} />

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
