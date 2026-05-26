import { useTranslation } from 'react-i18next';
import { useAppStore } from '@/shared/stores/appStore';
import type { Language } from '@/shared/types/database';

const labels: Record<Language, string> = {
  es: 'ES',
  en: 'EN',
  uk: 'UK',
  ru: 'RU',
};

interface Props {
  available: Language[];
}

export function LanguageSwitcher({ available }: Props) {
  const { i18n } = useTranslation();
  const language = useAppStore((s) => s.language);
  const setLanguage = useAppStore((s) => s.setLanguage);

  function change(lang: Language) {
    setLanguage(lang);
    void i18n.changeLanguage(lang);
  }

  return (
    <div className="flex items-center gap-1 rounded-full bg-white/10 p-0.5 backdrop-blur">
      {available.map((lang) => (
        <button
          key={lang}
          type="button"
          onClick={() => change(lang)}
          className={`rounded-full px-2 py-1 text-xs font-semibold transition-colors ${
            language === lang ? 'bg-white text-slate-900' : 'text-white/80 hover:text-white'
          }`}
        >
          {labels[lang]}
        </button>
      ))}
    </div>
  );
}
