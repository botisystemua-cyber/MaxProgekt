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
        className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
      >
        🔍
      </span>
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={t('menu.search')}
        className="w-full rounded-full border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-sm outline-none placeholder:text-slate-400 focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20"
      />
    </div>
  );
}
