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

  // Ціна: спочатку daily_special (явна знижена ціна), потім item.discount_percent.
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
      className="group flex w-full items-stretch gap-3 rounded-2xl bg-white p-3 text-left shadow-sm transition-shadow hover:shadow-md disabled:opacity-50"
    >
      {item.image_url ? (
        <img
          src={item.image_url}
          alt=""
          loading="lazy"
          className="h-24 w-24 shrink-0 rounded-xl bg-slate-100 object-cover"
        />
      ) : (
        <div
          aria-hidden
          className="flex h-24 w-24 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-3xl"
        >
          🍽️
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-start justify-between gap-2">
          <h3 className="line-clamp-1 font-semibold text-slate-900">{name}</h3>
          <div className="flex shrink-0 flex-col items-end leading-tight">
            <span
              className={`text-sm font-bold ${hasDiscount ? 'text-rose-600' : 'text-slate-900'}`}
            >
              {finalPrice.toFixed(2)} {currency}
            </span>
            {hasDiscount ? (
              <span className="text-[11px] text-slate-400 line-through">
                {basePrice.toFixed(2)}
              </span>
            ) : null}
          </div>
        </div>

        {description ? (
          <p className="mt-0.5 line-clamp-2 text-sm text-slate-500">{description}</p>
        ) : null}

        <div className="mt-1.5 flex flex-wrap items-center gap-1">
          {item.is_new ? <Badge variant="primary">{t('menu.new')}</Badge> : null}
          {item.is_spicy ? <Badge variant="danger">🌶️ {t('menu.spicy')}</Badge> : null}
          {item.is_vegan ? (
            <Badge variant="success">🌱 {t('menu.vegan')}</Badge>
          ) : item.is_vegetarian ? (
            <Badge variant="success">🥗 {t('menu.vegetarian')}</Badge>
          ) : null}
          {item.is_gluten_free ? <Badge variant="warning">GF</Badge> : null}
          {!item.is_available ? <Badge>{t('menu.unavailable')}</Badge> : null}
        </div>
      </div>
    </button>
  );
}
