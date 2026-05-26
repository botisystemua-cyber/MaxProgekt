import type { Tenant } from '@/shared/types/database';

interface Props {
  tenant: Tenant;
  children?: React.ReactNode;
}

export function RestaurantHeader({ tenant, children }: Props) {
  const cover = tenant.cover_image_url;

  return (
    <header
      className="safe-top relative isolate overflow-hidden text-white"
      style={{
        // Базовий бренд-фон + radial-glow зверху додають об'єму без cover.
        backgroundColor: tenant.secondary_color,
        backgroundImage: `radial-gradient(ellipse 80% 60% at 50% 0%, ${tenant.primary_color}40, transparent 70%)`,
      }}
    >
      {cover ? (
        <>
          <img
            src={cover}
            alt=""
            className="absolute inset-0 -z-10 h-full w-full object-cover opacity-50"
            loading="eager"
          />
          <div className="absolute inset-0 -z-10 bg-gradient-to-b from-black/40 via-black/30 to-black/80" />
        </>
      ) : null}

      <div className="relative px-5 pb-8 pt-5">
        {children ? (
          <div className="mb-5 flex items-center justify-end gap-2">{children}</div>
        ) : null}

        <div className="flex items-start gap-4">
          {tenant.logo_url ? (
            <img
              src={tenant.logo_url}
              alt={`${tenant.name} logo`}
              className="h-16 w-16 shrink-0 rounded-2xl bg-white/10 object-cover shadow-raised ring-1 ring-white/30"
            />
          ) : (
            <div
              className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl text-2xl font-bold text-white shadow-raised ring-1 ring-white/30"
              style={{
                background: `linear-gradient(135deg, ${tenant.primary_color}, ${tenant.primary_color}cc)`,
              }}
            >
              {tenant.name.charAt(0)}
            </div>
          )}

          <div className="min-w-0 flex-1 pt-1">
            <h1 className="text-2xl font-bold leading-tight tracking-tight">{tenant.name}</h1>
            {tenant.tagline ? (
              <p className="mt-1 text-sm text-white/75">{tenant.tagline}</p>
            ) : null}
            {tenant.rating !== null ? (
              <div className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-1 text-xs font-semibold backdrop-blur ring-1 ring-white/15">
                <span className="text-amber-300">★</span>
                <span>{tenant.rating.toFixed(1)}</span>
                {tenant.reviews > 0 ? (
                  <span className="text-white/60">({tenant.reviews.toLocaleString()})</span>
                ) : null}
              </div>
            ) : null}
          </div>
        </div>

        {tenant.description ? (
          <p className="mt-4 line-clamp-2 text-sm leading-relaxed text-white/85">
            {tenant.description}
          </p>
        ) : null}
      </div>

      {/* Декоративна нижня хвиля для м'якого переходу до контенту */}
      <div className="relative h-4 bg-gradient-to-b from-transparent to-slate-50" />
    </header>
  );
}
