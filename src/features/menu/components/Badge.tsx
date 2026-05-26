import type { ReactNode } from 'react';

interface Props {
  children: ReactNode;
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'info';
}

const variantClass: Record<NonNullable<Props['variant']>, string> = {
  default: 'bg-slate-100 text-slate-700',
  primary: 'bg-orange-100 text-orange-700',
  success: 'bg-emerald-100 text-emerald-700',
  warning: 'bg-amber-100 text-amber-800',
  danger: 'bg-rose-100 text-rose-700',
  info: 'bg-sky-100 text-sky-700',
};

export function Badge({ children, variant = 'default' }: Props) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${variantClass[variant]}`}
    >
      {children}
    </span>
  );
}
