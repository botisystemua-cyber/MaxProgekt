import { useEffect, useRef } from 'react';
import type { Category, CategoryTranslation, Language } from '@/shared/types/database';
import { translateCategory } from '../utils/translate';

interface Props {
  categories: Category[];
  translations: CategoryTranslation[];
  language: Language;
  fallbackLanguage: Language;
  activeId: string | null;
  onSelect: (id: string) => void;
}

// Розпис емодзі → CSS-анімація (див. globals.css). Падаємо на 'bounce'
// за замовчуванням, щоб кожен таб мав хоч якусь "особистість".
function emojiAnimation(emoji: string | null): string {
  if (!emoji) return 'anim-bounce';
  // Перевіряємо по входженню — emoji може бути variation selector тощо.
  const e = emoji;
  if (/🍺|🍻|🥤|🍹|🥂|🍾/.test(e)) return 'anim-shake';      // напої — fizz
  if (/🍷|🍝|🌮|🥖|🍣/.test(e))    return 'anim-tilt';       // нахил
  if (/☕|🍵|🍜|🥣|🌯|🍲/.test(e)) return 'anim-steam';      // пар
  if (/🍮|🍰|🍩|🍪|🧁|🍦|🍧|🍫/.test(e)) return 'anim-pop'; // десерти — пухкі
  if (/🌶️|🥗|🥬|🌿|🥒|🍅/.test(e)) return 'anim-wiggle';   // салат — жвавий
  return 'anim-bounce';                                       // м'ясо/бургер/піца за замовчуванням
}

export function CategoryTabs({
  categories,
  translations,
  language,
  fallbackLanguage,
  activeId,
  onSelect,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const activeRef = useRef<HTMLButtonElement>(null);

  // Скрол активного табу у видиму зону при зміні.
  useEffect(() => {
    if (activeRef.current && containerRef.current) {
      activeRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'center',
      });
    }
  }, [activeId]);

  return (
    <nav
      ref={containerRef}
      className="-mx-5 flex gap-2.5 overflow-x-auto px-5 pb-2 pt-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
    >
      {categories.map((cat) => {
        const { name } = translateCategory(cat, translations, language, fallbackLanguage);
        const isActive = cat.id === activeId;
        const anim = emojiAnimation(cat.icon);

        return (
          <button
            key={cat.id}
            ref={isActive ? activeRef : undefined}
            type="button"
            onClick={() => onSelect(cat.id)}
            data-active={isActive}
            className={
              'category-chip flex min-h-[44px] shrink-0 items-center gap-2 rounded-full border px-4 py-2 text-[15px] font-medium whitespace-nowrap transition-all duration-200 ' +
              (isActive
                ? 'border-transparent bg-brand-primary text-white shadow-raised'
                : 'border-[#e4ddd3] bg-[#fffaf3] text-[#2b2520] shadow-soft hover:-translate-y-0.5 hover:border-transparent hover:bg-brand-primary hover:text-white')
            }
          >
            {cat.icon ? (
              <span
                aria-hidden
                className={`category-emoji ${anim} inline-block text-xl leading-none`}
              >
                {cat.icon}
              </span>
            ) : null}
            <span>{name}</span>
          </button>
        );
      })}
    </nav>
  );
}
