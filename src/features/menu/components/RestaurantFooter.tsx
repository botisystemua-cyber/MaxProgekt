import type { Tenant } from '@/shared/types/database';

interface Props {
  tenant: Tenant;
}

export function RestaurantFooter({ tenant }: Props) {
  const social = tenant.social_links ?? {};

  return (
    <footer className="mt-8 border-t border-slate-200 bg-white px-5 py-6 text-sm text-slate-600">
      <div className="space-y-2">
        {tenant.address ? (
          <p>
            <span className="mr-1">📍</span>
            {tenant.address}
          </p>
        ) : null}

        {tenant.phone ? (
          <p>
            <span className="mr-1">📞</span>
            <a href={`tel:${tenant.phone}`} className="text-brand-primary">
              {tenant.phone}
            </a>
          </p>
        ) : null}

        {tenant.hours ? (
          <p>
            <span className="mr-1">🕐</span>
            {tenant.hours}
          </p>
        ) : null}

        {tenant.wifi ? (
          <p>
            <span className="mr-1">📶</span>
            WiFi: <span className="font-mono">{tenant.wifi}</span>
          </p>
        ) : null}
      </div>

      {Object.keys(social).length > 0 ? (
        <div className="mt-4 flex gap-3">
          {Object.entries(social).map(([key, url]) => (
            <a
              key={key}
              href={url}
              target="_blank"
              rel="noreferrer"
              className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium capitalize"
            >
              {key}
            </a>
          ))}
        </div>
      ) : null}

      <p className="mt-6 text-center text-xs text-slate-400">
        Powered by <span className="font-semibold">BotiLocal</span>
      </p>
    </footer>
  );
}
