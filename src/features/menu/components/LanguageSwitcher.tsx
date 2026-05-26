import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAppStore } from '@/shared/stores/appStore';
import type { Language } from '@/shared/types/database';

const langs: Record<Language, { flag: string; label: string; native: string }> = {
  es: { flag: '🇪🇸', label: 'ES', native: 'Español' },
  en: { flag: '🇬🇧', label: 'EN', native: 'English' },
  uk: { flag: '🇺🇦', label: 'UK', native: 'Українська' },
  ru: { flag: '🇷🇺', label: 'RU', native: 'Русский' },
  pl: { flag: '🇵🇱', label: 'PL', native: 'Polski' },
  ga: { flag: '🇮🇪', label: 'GA', native: 'Gaeilge' },
  de: { flag: '🇩🇪', label: 'DE', native: 'Deutsch' },
};

interface Props {
  available: Language[];
}

export function LanguageSwitcher({ available }: Props) {
  const { i18n } = useTranslation();
  const language = useAppStore((s) => s.language);
  const setLanguage = useAppStore((s) => s.setLanguage);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Закриваємо dropdown по кліку зовні / ESC.
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
        className="flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1.5 text-sm font-semibold text-white shadow-soft backdrop-blur-md ring-1 ring-white/20 transition-all hover:bg-white/25 active:scale-95"
      >
        <span className="text-base leading-none">{current.flag}</span>
        <span>{current.label}</span>
        <svg
          aria-hidden
          width="10"
          height="10"
          viewBox="0 0 10 10"
          className={`transition-transform ${open ? 'rotate-180' : ''}`}
        >
          <path d="M1 3l4 4 4-4" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {open ? (
        <ul
          role="menu"
          className="animate-pop-in absolute right-0 top-full z-40 mt-2 w-48 overflow-hidden rounded-2xl bg-white shadow-raised ring-1 ring-slate-900/5"
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
                  className={`flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm transition-colors ${
                    active ? 'bg-brand-primary/10 font-semibold text-slate-900' : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <span className="text-lg leading-none">{info.flag}</span>
                  <span className="flex-1">{info.native}</span>
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
