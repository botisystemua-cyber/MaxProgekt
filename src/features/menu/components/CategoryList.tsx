import { useTranslation } from 'react-i18next';
import type { Category, CategoryTranslation, Language, MenuItem } from '@/shared/types/database';
import { translateCategory } from '../utils/translate';

interface Props {
  categories: Category[];
  items: MenuItem[];
  translations: CategoryTranslation[];
  language: Language;
  fallbackLanguage: Language;
  onSelect: (categoryId: string) => void;
}

/**
 * Вертикальний "категорійний лендінг" клієнтського меню — показується
 * до того як юзер обере конкретну категорію. Великі картки в стовпчик
 * щоб тап був зручний на мобільному, без горизонтального скролу.
 */
export function CategoryList({
  categories,
  items,
  translations,
  language,
  fallbackLanguage,
  onSelect,
}: Props) {
  const { t } = useTranslation();
  const visible = categories.filter((c) => c.is_visible !== false);

  return (
    <ul className="space-y-2.5 pb-32">
      {visible.map((cat) => {
        const { name } = translateCategory(cat, translations, language, fallbackLanguage);
        const count = items.filter((i) => i.is_available && i.category_id === cat.id).length;
        return (
          <li key={cat.id}>
            <button
              type="button"
              onClick={() => onSelect(cat.id)}
              className="flex w-full items-center gap-4 rounded-2xl bg-white p-4 text-left shadow-soft ring-1 ring-slate-200 transition active:scale-[0.98] hover:bg-slate-50"
            >
              <span
                className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-3xl"
                style={{
                  background: `linear-gradient(135deg, var(--color-brand-primary)15, var(--color-brand-primary)05)`,
                }}
              >
                {cat.icon}
              </span>
              <div className="min-w-0 flex-1">
                <div className="truncate text-base font-bold text-slate-900">{name}</div>
                <div className="mt-0.5 text-xs text-slate-500">
                  {t('menu.itemsCount', { count, defaultValue: '{{count}} dishes' })}
                </div>
              </div>
              <span className="shrink-0 text-slate-300" aria-hidden>
                ›
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
