import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  selectCartCount,
  selectCartLines,
  selectCartTotal,
  useCartStore,
} from '@/shared/stores/cartStore';

interface Props {
  open: boolean;
  currency: string;
  onClose: () => void;
}

export function CartDrawer({ open, currency, onClose }: Props) {
  const { t } = useTranslation();
  const lines = useCartStore(selectCartLines);
  const count = useCartStore(selectCartCount);
  const total = useCartStore(selectCartTotal);
  const increment = useCartStore((s) => s.increment);
  const decrement = useCartStore((s) => s.decrement);
  const remove = useCartStore((s) => s.remove);
  const clear = useCartStore((s) => s.clear);
  const [showServer, setShowServer] = useState(false);

  // Lock body scroll while open + ESC.
  useEffect(() => {
    if (!open) return;
    const original = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = original;
      window.removeEventListener('keydown', onKey);
    };
  }, [open, onClose]);

  // Закриваємо "show server" коли закриваємо drawer.
  useEffect(() => {
    if (!open) setShowServer(false);
  }, [open]);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={t('cart.title')}
      className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/70 backdrop-blur-sm animate-fade-in sm:items-center sm:p-4"
      onClick={onClose}
    >
      <div
        className="relative flex max-h-[92vh] w-full max-w-lg flex-col overflow-hidden rounded-t-[2rem] bg-white shadow-raised animate-slide-up sm:rounded-[2rem]"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900">{t('cart.title')}</h2>
            {count > 0 ? (
              <p className="text-xs text-slate-500">{t('cart.items', { count })}</p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={t('common.cancel')}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-700 transition-colors hover:bg-slate-200"
          >
            ✕
          </button>
        </header>

        {showServer ? (
          <ServerView lines={lines} total={total} currency={currency} onBack={() => setShowServer(false)} />
        ) : count === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center px-6 py-16 text-center">
            <div className="mb-4 text-6xl opacity-60" aria-hidden>
              🛒
            </div>
            <p className="text-base font-semibold text-slate-700">{t('cart.empty')}</p>
            <p className="mt-1 text-sm text-slate-500">{t('cart.emptyHint')}</p>
          </div>
        ) : (
          <ul className="flex-1 divide-y divide-slate-100 overflow-y-auto px-5 py-2">
            {lines.map((line) => (
              <li key={line.id} className="flex items-center gap-3 py-3">
                {line.imageUrl ? (
                  <img
                    src={line.imageUrl}
                    alt=""
                    className="h-14 w-14 shrink-0 rounded-xl object-cover ring-1 ring-slate-200/60"
                  />
                ) : (
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-slate-50 to-slate-100 text-2xl">
                    🍽️
                  </div>
                )}

                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-semibold text-slate-900">{line.name}</div>
                  <div className="text-xs text-slate-500 tabular-nums">
                    {line.price.toFixed(2)} {line.currency}
                  </div>
                </div>

                <div className="flex shrink-0 items-center gap-1.5 rounded-full bg-slate-50 p-1 ring-1 ring-slate-200">
                  <button
                    type="button"
                    onClick={() => decrement(line.id)}
                    aria-label="−"
                    className="flex h-7 w-7 items-center justify-center rounded-full bg-white text-slate-700 shadow-soft active:scale-95"
                  >
                    −
                  </button>
                  <span className="min-w-[20px] text-center text-sm font-bold tabular-nums">
                    {line.qty}
                  </span>
                  <button
                    type="button"
                    onClick={() => increment(line.id)}
                    aria-label="+"
                    className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-primary text-white shadow-soft active:scale-95"
                  >
                    +
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => remove(line.id)}
                  aria-label={t('common.delete')}
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-slate-100 hover:text-rose-600"
                >
                  ✕
                </button>
              </li>
            ))}
          </ul>
        )}

        {!showServer && count > 0 ? (
          <footer className="safe-bottom space-y-3 border-t border-slate-100 px-5 pt-4">
            <div className="flex items-baseline justify-between">
              <span className="text-sm font-semibold text-slate-500">{t('cart.total')}</span>
              <span className="text-2xl font-extrabold tabular-nums text-slate-900">
                {total.toFixed(2)}{' '}
                <span className="text-sm font-semibold text-slate-400">{currency}</span>
              </span>
            </div>
            <div className="flex gap-2 pb-2">
              <button
                type="button"
                onClick={clear}
                className="flex-1 rounded-2xl bg-slate-100 py-3 text-sm font-semibold text-slate-700 shadow-soft transition-all active:scale-[0.98]"
              >
                {t('cart.clear')}
              </button>
              <button
                type="button"
                onClick={() => setShowServer(true)}
                className="flex-[2] rounded-2xl bg-brand-primary py-3 text-sm font-bold text-white shadow-raised transition-all active:scale-[0.98]"
              >
                {t('cart.showServer')}
              </button>
            </div>
          </footer>
        ) : null}
      </div>
    </div>
  );
}

// Окремий "great big screen" — щоб офіціант з телефона клієнта зчитав замовлення.
function ServerView({
  lines,
  total,
  currency,
  onBack,
}: {
  lines: ReturnType<typeof selectCartLines>;
  total: number;
  currency: string;
  onBack: () => void;
}) {
  const { t } = useTranslation();

  return (
    <div className="flex flex-1 flex-col bg-slate-950 text-white">
      <div className="px-5 pt-4 text-center">
        <p className="text-[10px] font-bold uppercase tracking-widest text-white/60">
          {t('cart.serverInstructions')}
        </p>
        <p className="mt-1 text-xs text-white/40">
          {new Date().toLocaleString()}
        </p>
      </div>

      <ul className="flex-1 space-y-2 overflow-y-auto px-5 py-5">
        {lines.map((line) => (
          <li
            key={line.id}
            className="flex items-baseline justify-between gap-3 rounded-2xl bg-white/5 px-4 py-3 ring-1 ring-white/10"
          >
            <span className="flex items-baseline gap-3">
              <span className="text-2xl font-extrabold tabular-nums text-amber-300">
                ×{line.qty}
              </span>
              <span className="text-base font-semibold">{line.name}</span>
            </span>
            <span className="font-bold tabular-nums">
              {(line.price * line.qty).toFixed(2)} {currency}
            </span>
          </li>
        ))}
      </ul>

      <footer className="safe-bottom border-t border-white/10 px-5 pb-4 pt-4">
        <div className="flex items-baseline justify-between">
          <span className="text-base font-semibold text-white/70">{t('cart.total')}</span>
          <span className="text-3xl font-extrabold tabular-nums">
            {total.toFixed(2)}{' '}
            <span className="text-base font-semibold text-white/60">{currency}</span>
          </span>
        </div>
        <button
          type="button"
          onClick={onBack}
          className="mt-4 w-full rounded-2xl bg-white/10 py-3 text-sm font-semibold text-white ring-1 ring-white/15 transition-all active:scale-[0.98]"
        >
          ← {t('common.back')}
        </button>
      </footer>
    </div>
  );
}
