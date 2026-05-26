import type { Tenant } from '@/shared/types/database';

interface Props {
  tenant: Tenant;
  children?: React.ReactNode;
}

export function RestaurantHeader({ tenant, children }: Props) {
  const cover = tenant.cover_image_url;

  return (
    <header
      className="safe-top relative overflow-hidden text-white"
      style={{ backgroundColor: tenant.secondary_color }}
    >
      {cover ? (
        <>
          <img
            src={cover}
            alt=""
            className="absolute inset-0 h-full w-full object-cover opacity-40"
            loading="eager"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/30 to-black/70" />
        </>
      ) : null}

      <div className="relative px-5 pb-6 pt-5">
        {children ? (
          <div className="mb-3 flex items-center justify-end gap-2">{children}</div>
        ) : null}

        <div className="flex items-center gap-3">
          {tenant.logo_url ? (
            <img
              src={tenant.logo_url}
              alt={`${tenant.name} logo`}
              className="h-14 w-14 rounded-xl bg-white/10 object-cover ring-1 ring-white/20"
            />
          ) : (
            <div
              className="flex h-14 w-14 items-center justify-center rounded-xl text-2xl font-bold"
              style={{ backgroundColor: tenant.primary_color }}
            >
              {tenant.name.charAt(0)}
            </div>
          )}

          <div className="min-w-0 flex-1">
            <h1 className="truncate text-xl font-bold">{tenant.name}</h1>
            {tenant.tagline ? (
              <p className="truncate text-sm text-white/70">{tenant.tagline}</p>
            ) : null}
          </div>
        </div>

        {tenant.description ? (
          <p className="mt-3 line-clamp-2 text-sm text-white/80">{tenant.description}</p>
        ) : null}
      </div>
    </header>
  );
}
