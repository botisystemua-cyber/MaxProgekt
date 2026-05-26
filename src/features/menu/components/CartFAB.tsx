import { useTranslation } from 'react-i18next';
import { selectCartCount, selectCartTotal, useCartStore } from '@/shared/stores/cartStore';

interface Props {
  currency: string;
  onClick: () => void;
}

export function CartFAB({ currency, onClick }: Props) {
  const { t } = useTranslation();
  const count = useCartStore(selectCartCount);
  const total = useCartStore(selectCartTotal);

  if (count === 0) return null;

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={t('cart.title')}
      className="safe-bottom fixed bottom-4 left-1/2 z-40 flex w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 items-center justify-between gap-3 rounded-full bg-brand-primary px-4 py-3 text-white shadow-raised ring-1 ring-black/5 backdrop-blur transition-transform active:scale-[0.98] sm:max-w-md"
    >
      <span className="flex items-center gap-2.5">
        <span className="relative flex h-9 w-9 items-center justify-center rounded-full bg-white/15 ring-1 ring-white/20">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path
              d="M3 4h2.5l2 11.5a2 2 0 0 0 2 1.6h8.6a2 2 0 0 0 2-1.5L21.5 8H6.4"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <circle cx="10" cy="20" r="1.5" fill="currentColor" />
            <circle cx="17" cy="20" r="1.5" fill="currentColor" />
          </svg>
          <span className="absolute -right-1 -top-1 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-white px-1 text-[10px] font-bold text-brand-primary shadow-soft ring-2 ring-brand-primary">
            {count > 99 ? '99+' : count}
          </span>
        </span>
        <span className="text-sm font-semibold">{t('cart.title')}</span>
      </span>
      <span className="text-base font-extrabold tabular-nums">
        {total.toFixed(2)} <span className="text-xs font-semibold text-white/80">{currency}</span>
      </span>
    </button>
  );
}
