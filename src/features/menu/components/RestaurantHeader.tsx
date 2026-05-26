import type { Tenant } from '@/shared/types/database';

interface Props {
  tenant: Tenant;
  children?: React.ReactNode;
}

export function RestaurantHeader({ tenant, children }: Props) {
  const cover = tenant.cover_image_url;

  return (
    <header
      className="safe-top relative isolate text-white"
      style={{
        backgroundColor: tenant.secondary_color,
        backgroundImage: `radial-gradient(ellipse 80% 60% at 50% 0%, ${tenant.primary_color}40, transparent 70%)`,
      }}
    >
      {/* Cover image у власному overflow-hidden контейнері, щоб не обрізати
          dropdown LanguageSwitcher який вилазить нижче header. */}
      {cover ? (
        <div className="absolute inset-0 -z-10 overflow-hidden">
          <img
            src={cover}
            alt=""
            className="h-full w-full object-cover opacity-50"
            loading="eager"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/30 to-black/80" />
        </div>
      ) : null}

      <div className="relative flex items-center gap-3 px-4 py-3">
        {tenant.logo_url ? (
          <img
            src={tenant.logo_url}
            alt={`${tenant.name} logo`}
            className="h-11 w-11 shrink-0 rounded-xl bg-white/10 object-cover shadow-raised ring-1 ring-white/30"
          />
        ) : (
          <div
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-lg font-bold text-white shadow-raised ring-1 ring-white/30"
            style={{
              background: `linear-gradient(135deg, ${tenant.primary_color}, ${tenant.primary_color}cc)`,
            }}
          >
            {tenant.name.charAt(0)}
          </div>
        )}

        <div className="min-w-0 flex-1">
          <h1 className="truncate text-base font-bold leading-tight tracking-tight">
            {tenant.name}
          </h1>
          <div className="mt-0.5 flex items-center gap-2 text-[11px] text-white/70">
            {tenant.tagline ? <span className="truncate">{tenant.tagline}</span> : null}
            {tenant.rating !== null ? (
              <>
                <span aria-hidden className="opacity-40">·</span>
                <span className="flex shrink-0 items-center gap-0.5">
                  <span className="text-amber-300">★</span>
                  <span className="font-semibold tabular-nums text-white">
                    {tenant.rating.toFixed(1)}
                  </span>
                </span>
              </>
            ) : null}
          </div>
        </div>

        {children ? <div className="shrink-0">{children}</div> : null}
      </div>
    </header>
  );
}
