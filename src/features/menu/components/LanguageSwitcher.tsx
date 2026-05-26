import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAppStore } from '@/shared/stores/appStore';
import type { Language } from '@/shared/types/database';

// Без emoji-прапорців — на Windows вони рендеряться як LETTER PAIRS ("IE", "ES"...)
// що виглядає кострубато. Залишаємо короткий код мови + native назву.
const langs: Record<Language, { label: string; native: string }> = {
  es: { label: 'ES', native: 'Español' },
  en: { label: 'EN', native: 'English' },
  uk: { label: 'UK', native: 'Українська' },
  ru: { label: 'RU', native: 'Русский' },
  pl: { label: 'PL', native: 'Polski' },
  ga: { label: 'GA', native: 'Gaeilge' },
  de: { label: 'DE', native: 'Deutsch' },
};

function GlobeIcon({ className = '' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden
      className={className}
      width="14"
      height="14"
    >
      <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.4" />
      <ellipse cx="8" cy="8" rx="3" ry="6.5" stroke="currentColor" strokeWidth="1.4" />
      <path d="M1.5 8h13" stroke="currentColor" strokeWidth="1.4" />
    </svg>
  );
}

interface Props {
  available: Language[];
}

export function LanguageSwitcher({ available }: Props) {
  const { i18n } = useTranslation();
  const language = useAppStore((s) => s.language);
  const setLanguage = useAppStore((s) => s.setLanguage);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', onClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  function change(lang: Language) {
    setLanguage(lang);
    void i18n.changeLanguage(lang);
    setOpen(false);
  }

  const current = langs[language];

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-label="Change language"
        className="flex items-center gap-1.5 rounded-full bg-white/15 px-2.5 py-1.5 text-xs font-bold uppercase tracking-wider text-white shadow-soft ring-1 ring-white/20 backdrop-blur-md transition-all hover:bg-white/25 active:scale-95"
      >
        <GlobeIcon className="text-white/85" />
        <span>{current.label}</span>
        <svg
          aria-hidden
          width="8"
          height="8"
          viewBox="0 0 10 10"
          className={`transition-transform ${open ? 'rotate-180' : ''}`}
        >
          <path
            d="M1 3l4 4 4-4"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {open ? (
        <ul
          role="menu"
          className="animate-pop-in absolute right-0 top-full z-40 mt-2 w-44 overflow-hidden rounded-2xl bg-white py-1 shadow-raised ring-1 ring-slate-900/5"
        >
          {available.map((lang) => {
            const info = langs[lang];
            if (!info) return null;
            const active = lang === language;
            return (
              <li key={lang}>
                <button
                  type="button"
                  onClick={() => change(lang)}
                  className={`flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm transition-colors ${
                    active
                      ? 'bg-brand-primary/10 font-semibold text-slate-900'
                      : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <span className="w-7 shrink-0 font-mono text-[11px] font-bold text-slate-400">
                    {info.label}
                  </span>
                  <span className="flex-1 truncate">{info.native}</span>
                  {active ? <span className="text-brand-primary">✓</span> : null}
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}
