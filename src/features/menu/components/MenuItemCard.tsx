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
    addToCart({ id: item.id, name, price: finalPrice, currency, imageUrl: item.image_url });
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
      className={`group relative flex w-full cursor-pointer items-stretch gap-3 overflow-hidden rounded-3xl bg-white p-3 text-left shadow-soft ring-1 ring-slate-200/40 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-raised focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary active:scale-[0.98] ${
        !item.is_available ? 'opacity-50' : ''
      }`}
    >
      {/* IMAGE */}
      <div className="relative shrink-0">
        {item.image_url ? (
          <img
            src={item.image_url}
            alt=""
            loading="lazy"
            className="h-24 w-24 rounded-2xl object-cover ring-1 ring-slate-200/60"
          />
        ) : (
          <div
            aria-hidden
            className="flex h-24 w-24 items-center justify-center rounded-2xl bg-gradient-to-br from-slate-50 to-slate-100 text-3xl ring-1 ring-slate-200/60"
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

      {/* TEXT */}
      <div className="flex min-w-0 flex-1 flex-col">
        <h3 className="line-clamp-1 text-[15px] font-bold leading-tight text-slate-900">
          {name}
        </h3>
        {description ? (
          <p className="mt-1 line-clamp-2 text-[12px] leading-snug text-slate-500">
            {description}
          </p>
        ) : null}
        <div className="mt-auto flex flex-wrap items-center gap-1 pt-1.5">
          {item.is_spicy ? <Badge variant="danger">🌶️</Badge> : null}
          {item.is_vegan ? (
            <Badge variant="success">🌱</Badge>
          ) : item.is_vegetarian ? (
            <Badge variant="success">🥗</Badge>
          ) : null}
          {item.is_gluten_free ? <Badge variant="warning">GF</Badge> : null}
          {!item.is_available ? <Badge>{t('menu.unavailable')}</Badge> : null}
        </div>
      </div>

      {/* PRICE + ACTION (окремий правий стовпчик — не перекриває контент) */}
      <div className="flex shrink-0 flex-col items-end justify-between gap-2">
        <div className="text-right leading-tight">
          {hasDiscount ? (
            <div className="text-[10px] font-medium text-slate-400 line-through">
              {basePrice.toFixed(2)}
            </div>
          ) : null}
          <div
            className={`whitespace-nowrap text-[15px] font-extrabold tabular-nums ${
              hasDiscount ? 'text-rose-600' : 'text-slate-900'
            }`}
          >
            {finalPrice.toFixed(2)}
            <span className="ml-0.5 text-[10px] font-semibold text-slate-400">{currency}</span>
          </div>
        </div>

        {item.is_available ? (
          qty > 0 ? (
            <div className="flex items-center gap-1 rounded-full bg-white p-0.5 shadow-soft ring-1 ring-slate-200">
              <button
                type="button"
                onClick={handleDec}
                aria-label="−"
                className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 text-base font-bold text-slate-700 active:scale-90"
              >
                −
              </button>
              <span className="min-w-[18px] text-center text-sm font-bold tabular-nums">
                {qty}
              </span>
              <button
                type="button"
                onClick={handleInc}
                aria-label="+"
                className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-primary text-base font-bold text-white active:scale-90"
              >
                +
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={handleAdd}
              aria-label={t('cart.add')}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-primary text-lg font-bold leading-none text-white shadow-raised ring-1 ring-black/5 transition-all hover:scale-110 active:scale-95"
            >
              +
            </button>
          )
        ) : null}
      </div>
    </article>
  );
}
