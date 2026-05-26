import { useTranslation } from 'react-i18next';
import type {
  DailySpecial,
  Language,
  MenuItem,
  MenuItemTranslation,
} from '@/shared/types/database';
import { translateMenuItem } from '../utils/translate';
import { useCartStore } from '@/shared/stores/cartStore';
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

  const qty = useCartStore((s) => s.lines[item.id]?.qty ?? 0);
  const addToCart = useCartStore((s) => s.add);
  const increment = useCartStore((s) => s.increment);
  const decrement = useCartStore((s) => s.decrement);

  function handleAdd(e: React.MouseEvent) {
    e.stopPropagation();
    addToCart({
      id: item.id,
      name,
      price: finalPrice,
      currency,
      imageUrl: item.image_url,
    });
  }

  function handleInc(e: React.MouseEvent) {
    e.stopPropagation();
    increment(item.id);
  }

  function handleDec(e: React.MouseEvent) {
    e.stopPropagation();
    decrement(item.id);
  }

  return (
    <article
      onClick={item.is_available ? onClick : undefined}
      onKeyDown={(e) => {
        if (!item.is_available) return;
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      }}
      role="button"
      tabIndex={item.is_available ? 0 : -1}
      aria-disabled={!item.is_available}
      className={`group relative flex w-full cursor-pointer items-stretch gap-4 overflow-hidden rounded-3xl bg-white p-3.5 text-left shadow-soft ring-1 ring-slate-200/40 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-raised focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary active:scale-[0.98] ${
        !item.is_available ? 'opacity-50' : ''
      }`}
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
        <h3 className="line-clamp-1 text-base font-bold text-slate-900">{name}</h3>

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
              {finalPrice.toFixed(2)}{' '}
              <span className="text-xs font-semibold text-slate-400">{currency}</span>
            </span>
          </div>
        </div>
      </div>

      {/* Quick-add контроли — над карткою, не triггерять onClick */}
      {item.is_available ? (
        <div className="absolute bottom-3 right-3">
          {qty > 0 ? (
            <div className="flex items-center gap-1 rounded-full bg-white p-1 shadow-raised ring-1 ring-slate-200">
              <button
                type="button"
                onClick={handleDec}
                aria-label="−"
                className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 text-slate-700 active:scale-90"
              >
                −
              </button>
              <span className="min-w-[16px] text-center text-sm font-bold tabular-nums">
                {qty}
              </span>
              <button
                type="button"
                onClick={handleInc}
                aria-label="+"
                className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-primary text-white active:scale-90"
              >
                +
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={handleAdd}
              aria-label={t('cart.add')}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-primary text-xl font-bold text-white shadow-raised ring-1 ring-black/5 transition-all hover:scale-110 active:scale-95"
            >
              +
            </button>
          )}
        </div>
      ) : null}
    </article>
  );
}
