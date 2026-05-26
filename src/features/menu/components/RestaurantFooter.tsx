import type { Tenant } from '@/shared/types/database';

interface Props {
  tenant: Tenant;
}

interface InfoRowProps {
  icon: string;
  children: React.ReactNode;
}

function InfoRow({ icon, children }: InfoRowProps) {
  return (
    <li className="flex items-start gap-3 text-sm">
      <span
        aria-hidden
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-50 text-base shadow-inner-soft ring-1 ring-slate-200/60"
      >
        {icon}
      </span>
      <span className="pt-1.5 text-slate-700">{children}</span>
    </li>
  );
}

export function RestaurantFooter({ tenant }: Props) {
  const social = tenant.social_links ?? {};

  return (
    <footer className="mt-10 border-t border-slate-200/60 bg-white px-5 pb-10 pt-8 text-slate-600">
      <ul className="space-y-2.5">
        {tenant.address ? <InfoRow icon="📍">{tenant.address}</InfoRow> : null}
        {tenant.phone ? (
          <InfoRow icon="📞">
            <a href={`tel:${tenant.phone}`} className="font-medium text-brand-primary">
              {tenant.phone}
            </a>
          </InfoRow>
        ) : null}
        {tenant.hours ? <InfoRow icon="🕐">{tenant.hours}</InfoRow> : null}
        {tenant.wifi ? (
          <InfoRow icon="📶">
            WiFi: <span className="font-mono font-semibold text-slate-900">{tenant.wifi}</span>
          </InfoRow>
        ) : null}
      </ul>

      {Object.keys(social).length > 0 ? (
        <div className="mt-6 flex flex-wrap gap-2">
          {Object.entries(social).map(([key, url]) => (
            <a
              key={key}
              href={url}
              target="_blank"
              rel="noreferrer"
              className="rounded-full bg-slate-100 px-3.5 py-1.5 text-xs font-semibold capitalize text-slate-700 shadow-soft transition-all hover:-translate-y-0.5 hover:shadow-raised"
            >
              {key}
            </a>
          ))}
        </div>
      ) : null}

      <p className="mt-8 text-center text-[11px] font-medium text-slate-400">
        Powered by <span className="font-bold text-slate-600">BotiLocal</span>
      </p>
    </footer>
  );
}
