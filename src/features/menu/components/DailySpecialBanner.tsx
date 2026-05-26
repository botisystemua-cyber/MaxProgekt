import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type {
  DailySpecial,
  Language,
  MenuItem,
  MenuItemTranslation,
} from '@/shared/types/database';
import { translateMenuItem } from '../utils/translate';

interface Props {
  special: DailySpecial;
  item: MenuItem | undefined;
  translations: MenuItemTranslation[];
  language: Language;
  fallbackLanguage: Language;
  currency: string;
  onClick: () => void;
}

function useCountdown(endsAt: string | null) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!endsAt) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [endsAt]);

  if (!endsAt) return null;
  const remaining = Math.max(0, new Date(endsAt).getTime() - now);
  if (remaining === 0) return '00:00:00';

  const totalSec = Math.floor(remaining / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

const typeLabel: Record<DailySpecial['special_type'], { emoji: string; key: string }> = {
  daily: { emoji: '🔥', key: 'menu.dailySpecial' },
  promo: { emoji: '⚡', key: 'menu.promo' },
  happy_hour: { emoji: '🍹', key: 'menu.promo' },
};

export function DailySpecialBanner({
  special,
  item,
  translations,
  language,
  fallbackLanguage,
  currency,
  onClick,
}: Props) {
  const { t } = useTranslation();
  const countdown = useCountdown(special.ends_at);

  if (!item) return null;

  const { name } = translateMenuItem(item, translations, language, fallbackLanguage);
  const finalPrice = special.special_price ?? item.price;
  const labelInfo = typeLabel[special.special_type];

  return (
    <button
      type="button"
      onClick={onClick}
      className="group relative flex w-full items-center gap-4 overflow-hidden rounded-3xl bg-gradient-to-br from-orange-500 via-rose-500 to-pink-600 p-5 text-left text-white shadow-raised transition-transform hover:-translate-y-0.5 active:scale-[0.98]"
    >
      {/* Декоративні кола для об'єму */}
      <div className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full bg-white/15 blur-2xl" />
      <div className="pointer-events-none absolute -bottom-16 -left-8 h-32 w-32 rounded-full bg-yellow-300/20 blur-2xl" />

      <div className="relative flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/20 text-3xl shadow-raised ring-1 ring-white/30 backdrop-blur">
        {labelInfo.emoji}
      </div>

      <div className="relative min-w-0 flex-1">
        <div className="text-[10px] font-bold uppercase tracking-widest text-white/85">
          {t(labelInfo.key)}
        </div>
        <div className="mt-0.5 truncate text-xl font-extrabold leading-tight">{name}</div>
        <div className="mt-1.5 flex items-baseline gap-2">
          <span className="text-2xl font-extrabold tabular-nums">
            {finalPrice.toFixed(2)}
            <span className="ml-1 text-sm font-semibold text-white/80">{currency}</span>
          </span>
          {special.special_price !== null && special.special_price < item.price ? (
            <span className="text-sm text-white/70 line-through">
              {item.price.toFixed(2)}
            </span>
          ) : null}
        </div>
      </div>

      {countdown ? (
        <div className="relative shrink-0 rounded-xl bg-black/30 px-2.5 py-1.5 font-mono text-xs font-bold shadow-inner-soft ring-1 ring-white/10 backdrop-blur">
          {countdown}
        </div>
      ) : null}
    </button>
  );
}
