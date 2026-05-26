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

  // Скролимо активний таб у видиму зону при зміні (особливо корисно
  // коли активна категорія міняється від скролу контенту).
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
      className="-mx-5 flex gap-2 overflow-x-auto px-5 pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
    >
      {categories.map((cat) => {
        const { name } = translateCategory(cat, translations, language, fallbackLanguage);
        const isActive = cat.id === activeId;
        return (
          <button
            key={cat.id}
            ref={isActive ? activeRef : undefined}
            type="button"
            onClick={() => onSelect(cat.id)}
            className={`flex shrink-0 items-center gap-1.5 rounded-full border px-3.5 py-2 text-sm font-medium transition-colors ${
              isActive
                ? 'border-transparent bg-brand-primary text-white'
                : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
            }`}
          >
            {cat.icon ? <span aria-hidden>{cat.icon}</span> : null}
            <span>{name}</span>
          </button>
        );
      })}
    </nav>
  );
}
