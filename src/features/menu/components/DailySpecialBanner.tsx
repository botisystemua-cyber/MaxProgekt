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
      className="relative flex w-full items-center gap-4 overflow-hidden rounded-2xl bg-gradient-to-r from-orange-500 to-rose-500 p-4 text-left text-white shadow-lg"
    >
      <div className="text-3xl">{labelInfo.emoji}</div>
      <div className="min-w-0 flex-1">
        <div className="text-[11px] font-bold uppercase tracking-wider text-white/80">
          {t(labelInfo.key)}
        </div>
        <div className="truncate text-lg font-bold">{name}</div>
        <div className="text-sm">
          <span className="font-semibold">
            {finalPrice.toFixed(2)} {currency}
          </span>
          {special.special_price !== null && special.special_price < item.price ? (
            <span className="ml-2 text-white/60 line-through">
              {item.price.toFixed(2)} {currency}
            </span>
          ) : null}
        </div>
      </div>
      {countdown ? (
        <div className="rounded-lg bg-black/20 px-2 py-1 text-xs font-mono">{countdown}</div>
      ) : null}
    </button>
  );
}
