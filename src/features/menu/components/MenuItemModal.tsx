import { useEffect } from 'react';
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
  onClose: () => void;
}

export function MenuItemModal({
  item,
  translations,
  language,
  fallbackLanguage,
  currency,
  special,
  onClose,
}: Props) {
  const { t } = useTranslation();
  const { name, description } = translateMenuItem(item, translations, language, fallbackLanguage);

  useEffect(() => {
    const original = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = original;
      window.removeEventListener('keydown', onKey);
    };
  }, [onClose]);

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

  function handleAdd() {
    addToCart({
      id: item.id,
      name,
      price: finalPrice,
      currency,
      imageUrl: item.image_url,
    });
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={name}
      className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/70 backdrop-blur-sm animate-fade-in sm:items-center sm:p-4"
      onClick={onClose}
    >
      <div
        className="relative max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-t-[2rem] bg-white shadow-raised animate-slide-up sm:rounded-[2rem]"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label={t('common.cancel')}
          className="absolute right-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white/95 text-lg text-slate-700 shadow-raised backdrop-blur transition-transform hover:scale-105 active:scale-95"
        >
          ✕
        </button>

        {item.image_url ? (
          <img
            src={item.image_url}
            alt=""
            className="aspect-[4/3] w-full bg-slate-100 object-cover"
          />
        ) : (
          <div className="flex aspect-[4/3] w-full items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 text-7xl">
            🍽️
          </div>
        )}

        <div className="p-6 pb-10">
          <div className="flex items-start justify-between gap-4">
            <h2 className="text-2xl font-bold leading-tight tracking-tight text-slate-900">
              {name}
            </h2>
            <div className="shrink-0 text-right">
              {hasDiscount ? (
                <div className="text-sm font-medium text-slate-400 line-through">
                  {basePrice.toFixed(2)} {currency}
                </div>
              ) : null}
              <div
                className={`text-2xl font-extrabold tabular-nums ${
                  hasDiscount ? 'text-rose-600' : 'text-slate-900'
                }`}
              >
                {finalPrice.toFixed(2)}{' '}
                <span className="text-sm font-semibold text-slate-400">{currency}</span>
              </div>
            </div>
          </div>

          {description ? (
            <p className="mt-4 text-[15px] leading-relaxed text-slate-600">{description}</p>
          ) : null}

          <div className="mt-5 flex flex-wrap items-center gap-1.5">
            {item.is_new ? <Badge variant="primary">{t('menu.new')}</Badge> : null}
            {item.is_spicy ? <Badge variant="danger">🌶️ {t('menu.spicy')}</Badge> : null}
            {item.is_vegan ? (
              <Badge variant="success">🌱 {t('menu.vegan')}</Badge>
            ) : item.is_vegetarian ? (
              <Badge variant="success">🥗 {t('menu.vegetarian')}</Badge>
            ) : null}
            {item.is_gluten_free ? (
              <Badge variant="warning">GF · {t('menu.glutenFree')}</Badge>
            ) : null}
          </div>

          {(item.calories !== null || item.preparation_time !== null) && (
            <dl className="mt-6 grid grid-cols-2 gap-3 text-sm">
              {item.calories !== null ? (
                <div className="rounded-2xl bg-gradient-to-br from-slate-50 to-slate-100/50 p-4 shadow-inner-soft">
                  <dt className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                    kcal
                  </dt>
                  <dd className="mt-0.5 text-lg font-bold text-slate-900">{item.calories}</dd>
                </div>
              ) : null}
              {item.preparation_time !== null ? (
                <div className="rounded-2xl bg-gradient-to-br from-slate-50 to-slate-100/50 p-4 shadow-inner-soft">
                  <dt className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                    ⏱ min
                  </dt>
                  <dd className="mt-0.5 text-lg font-bold text-slate-900">
                    {item.preparation_time}
                  </dd>
                </div>
              ) : null}
            </dl>
          )}

          {item.allergens.length > 0 || item.tags.length > 0 ? (
            <div className="mt-6">
              <h3 className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                {t('menu.allergens')}
              </h3>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {[...item.allergens, ...item.tags].map((a) => (
                  <Badge key={a}>{a}</Badge>
                ))}
              </div>
            </div>
          ) : null}

          {item.is_available ? (
            <div className="mt-8">
              {qty > 0 ? (
                <div className="flex items-stretch gap-3">
                  <div className="flex flex-1 items-center justify-between rounded-2xl bg-slate-50 p-1.5 ring-1 ring-slate-200">
                    <button
                      type="button"
                      onClick={() => decrement(item.id)}
                      aria-label="−"
                      className="flex h-11 w-11 items-center justify-center rounded-xl bg-white text-lg font-bold text-slate-700 shadow-soft active:scale-95"
                    >
                      −
                    </button>
                    <span className="text-lg font-bold tabular-nums">{qty}</span>
                    <button
                      type="button"
                      onClick={() => increment(item.id)}
                      aria-label="+"
                      className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-primary text-lg font-bold text-white shadow-soft active:scale-95"
                    >
                      +
                    </button>
                  </div>
                  <div className="flex items-center rounded-2xl bg-brand-primary/10 px-4 text-sm font-bold tabular-nums text-brand-primary">
                    {(finalPrice * qty).toFixed(2)} {currency}
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={handleAdd}
                  className="flex w-full items-center justify-center gap-2 rounded-2xl bg-brand-primary py-4 text-base font-bold text-white shadow-raised transition-all hover:-translate-y-0.5 active:scale-[0.98]"
                >
                  <span className="text-xl">＋</span>
                  <span>{t('cart.add')} · {finalPrice.toFixed(2)} {currency}</span>
                </button>
              )}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
