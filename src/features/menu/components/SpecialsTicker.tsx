import { useTranslation } from 'react-i18next';
import type {
  DailySpecial,
  Language,
  MenuItem,
  MenuItemTranslation,
} from '@/shared/types/database';
import { translateMenuItem } from '../utils/translate';

interface Props {
  specials: DailySpecial[];
  items: MenuItem[];
  translations: MenuItemTranslation[];
  language: Language;
  fallbackLanguage: Language;
  currency: string;
  onItemClick: (item: MenuItem) => void;
}

const typeMeta: Record<DailySpecial['special_type'], { emoji: string; labelKey: string }> = {
  daily: { emoji: '🔥', labelKey: 'menu.dailySpecial' },
  promo: { emoji: '⚡', labelKey: 'menu.promo' },
  happy_hour: { emoji: '🍹', labelKey: 'menu.promo' },
};

export function SpecialsTicker({
  specials,
  items,
  translations,
  language,
  fallbackLanguage,
  currency,
  onItemClick,
}: Props) {
  const { t } = useTranslation();

  // Збираємо entries з прив'язаною стравою. Якщо страви немає — пропускаємо.
  const entries = specials
    .map((s) => {
      const item = items.find((i) => i.id === s.menu_item_id);
      if (!item) return null;
      const { name } = translateMenuItem(item, translations, language, fallbackLanguage);
      const price = s.special_price ?? item.price;
      const meta = typeMeta[s.special_type];
      return { id: s.id, item, name, price, meta };
    })
    .filter(Boolean) as Array<{
    id: string;
    item: MenuItem;
    name: string;
    price: number;
    meta: { emoji: string; labelKey: string };
  }>;

  if (entries.length === 0) return null;

  // Дублюємо вміст щоб петля translateX(-50%) виглядала безшовно.
  const looped = [...entries, ...entries];

  return (
    <div
      className="ticker-strip relative isolate overflow-hidden bg-gradient-to-r from-orange-600 via-rose-600 to-pink-600 py-2 text-white shadow-soft"
      role="region"
      aria-label="Daily specials"
    >
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-8 bg-gradient-to-r from-orange-600 to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-8 bg-gradient-to-l from-pink-600 to-transparent" />

      <div className="ticker-track flex w-max gap-8 will-change-transform">
        {looped.map((entry, idx) => (
          <button
            key={`${entry.id}-${idx}`}
            type="button"
            onClick={() => onItemClick(entry.item)}
            className="flex shrink-0 items-center gap-2 text-sm font-semibold"
          >
            <span aria-hidden className="text-base">{entry.meta.emoji}</span>
            <span className="text-[10px] font-bold uppercase tracking-widest text-white/80">
              {t(entry.meta.labelKey)}
            </span>
            <span className="text-white">{entry.name}</span>
            <span className="tabular-nums text-white">
              {entry.price.toFixed(2)} {currency}
            </span>
            <span aria-hidden className="text-white/40">•</span>
          </button>
        ))}
      </div>
    </div>
  );
}
