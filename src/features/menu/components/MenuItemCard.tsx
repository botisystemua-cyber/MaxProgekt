import { useTranslation } from 'react-i18next';
import type {
  DailySpecial,
  Language,
  MenuItem,
  MenuItemTranslation,
} from '@/shared/types/database';
import { translateMenuItem } from '../utils/translate';
import { Badge } from './Badge';

interface Props {
  item: MenuItem;
  translations: MenuItemTranslation[];
  language: Language;
  fallbackLanguage: Language;
  currency: string;
  special?: DailySpecial;
  onClick: () => void;
}

export function MenuItemCard({
  item,
  translations,
  language,
  fallbackLanguage,
  currency,
  special,
  onClick,
}: Props) {
  const { t } = useTranslation();
  const { name, description } = translateMenuItem(item, translations, language, fallbackLanguage);

  const basePrice = item.price;
  const finalPrice =
    special?.special_price ??
    (item.discount_percent > 0
      ? +(basePrice * (1 - item.discount_percent / 100)).toFixed(2)
      : basePrice);
  const hasDiscount = finalPrice < basePrice;

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!item.is_available}
      className="group relative flex w-full items-stretch gap-4 overflow-hidden rounded-3xl bg-white p-3.5 text-left shadow-soft ring-1 ring-slate-200/40 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-raised active:scale-[0.98] disabled:opacity-50"
    >
      <div className="relative shrink-0">
        {item.image_url ? (
          <img
            src={item.image_url}
            alt=""
            loading="lazy"
            className="h-28 w-28 rounded-2xl object-cover ring-1 ring-slate-200/60"
          />
        ) : (
          <div
            aria-hidden
            className="flex h-28 w-28 items-center justify-center rounded-2xl bg-gradient-to-br from-slate-50 to-slate-100 text-4xl ring-1 ring-slate-200/60"
          >
            🍽️
          </div>
        )}
        {item.is_new ? (
          <span className="absolute -left-1 -top-1 rounded-full bg-brand-primary px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white shadow-raised">
            {t('menu.new')}
          </span>
        ) : null}
      </div>

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-start justify-between gap-3">
          <h3 className="line-clamp-1 text-base font-bold text-slate-900">{name}</h3>
        </div>

        {description ? (
          <p className="mt-1 line-clamp-2 text-[13px] leading-relaxed text-slate-500">
            {description}
          </p>
        ) : null}

        <div className="mt-auto flex items-end justify-between gap-2 pt-2">
          <div className="flex flex-wrap items-center gap-1">
            {item.is_spicy ? <Badge variant="danger">🌶️ {t('menu.spicy')}</Badge> : null}
            {item.is_vegan ? (
              <Badge variant="success">🌱 {t('menu.vegan')}</Badge>
            ) : item.is_vegetarian ? (
              <Badge variant="success">🥗 {t('menu.vegetarian')}</Badge>
            ) : null}
            {item.is_gluten_free ? <Badge variant="warning">GF</Badge> : null}
            {!item.is_available ? <Badge>{t('menu.unavailable')}</Badge> : null}
          </div>

          <div className="flex shrink-0 flex-col items-end leading-tight">
            {hasDiscount ? (
              <span className="text-[11px] font-medium text-slate-400 line-through">
                {basePrice.toFixed(2)}
              </span>
            ) : null}
            <span
              className={`text-base font-extrabold tabular-nums ${
                hasDiscount ? 'text-rose-600' : 'text-slate-900'
              }`}
            >
              {finalPrice.toFixed(2)} <span className="text-xs font-semibold text-slate-400">{currency}</span>
            </span>
          </div>
        </div>
      </div>
    </button>
  );
}
