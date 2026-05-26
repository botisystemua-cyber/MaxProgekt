import { useTranslation } from 'react-i18next';

interface Props {
  value: string;
  onChange: (value: string) => void;
}

export function SearchBar({ value, onChange }: Props) {
  const { t } = useTranslation();

  return (
    <div className="relative">
      <span
        aria-hidden
        className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <circle cx="7" cy="7" r="5" stroke="currentColor" strokeWidth="1.5" />
          <path d="M11 11l3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </span>
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={t('menu.search')}
        className="w-full rounded-full bg-white py-3 pl-11 pr-4 text-sm font-medium text-slate-800 shadow-soft outline-none ring-1 ring-slate-200/60 placeholder:font-normal placeholder:text-slate-400 focus:ring-2 focus:ring-brand-primary"
      />
      {value ? (
        <button
          type="button"
          onClick={() => onChange('')}
          aria-label="clear"
          className="absolute right-3 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition-colors hover:bg-slate-200"
        >
          ✕
        </button>
      ) : null}
    </div>
  );
}
