import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AdminShell } from '../components/AdminShell';
import { useAdminTenant } from '../hooks/useAdminTenant';
import { useOrders, type Order, type OrderStatus } from '../hooks/useOrders';

// Кольори і назви для статус-табів та бейджів.
const STATUS_META: Record<OrderStatus, { key: string; cls: string; dot: string }> = {
  new:       { key: 'admin.orders.statusNew',       cls: 'bg-amber-500/15 text-amber-300',     dot: 'bg-amber-400' },
  cooking:   { key: 'admin.orders.statusCooking',   cls: 'bg-sky-500/15 text-sky-300',         dot: 'bg-sky-400' },
  ready:     { key: 'admin.orders.statusReady',     cls: 'bg-emerald-500/15 text-emerald-300', dot: 'bg-emerald-400' },
  served:    { key: 'admin.orders.statusServed',    cls: 'bg-slate-700 text-slate-300',        dot: 'bg-slate-400' },
  cancelled: { key: 'admin.orders.statusCancelled', cls: 'bg-rose-500/15 text-rose-300',       dot: 'bg-rose-400' },
};

// Який статус ставимо при натисканні primary-кнопки.
const NEXT_STATUS: Partial<Record<OrderStatus, OrderStatus>> = {
  new: 'cooking',
  cooking: 'ready',
  ready: 'served',
};

export default function OrdersPage() {
  const { t } = useTranslation();
  const { tenant } = useAdminTenant();
  const { orders, loading, error, updateStatus } = useOrders(tenant?.id);
  const [filter, setFilter] = useState<OrderStatus | 'all'>('new');

  const filtered = useMemo(
    () => (filter === 'all' ? orders : orders.filter((o) => o.status === filter)),
    [orders, filter],
  );

  const counts = useMemo(() => {
    const c: Record<OrderStatus | 'all', number> = {
      all: orders.length, new: 0, cooking: 0, ready: 0, served: 0, cancelled: 0,
    };
    for (const o of orders) c[o.status]++;
    return c;
  }, [orders]);

  return (
    <AdminShell>
      <div className="mx-auto max-w-3xl space-y-3 p-4">
        <h1 className="text-xl font-bold">{t('admin.tile.ordersTitle')}</h1>

        {/* Status filter tabs */}
        <div className="flex gap-1.5 overflow-x-auto pb-1">
          {(['new', 'cooking', 'ready', 'served', 'all'] as const).map((s) => {
            const meta = s === 'all' ? null : STATUS_META[s];
            const active = filter === s;
            return (
              <button
                key={s}
                type="button"
                onClick={() => setFilter(s)}
                className={`flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold ring-1 transition ${
                  active
                    ? 'bg-brand-primary text-white ring-brand-primary'
                    : 'bg-slate-900 text-slate-300 ring-slate-800'
                }`}
              >
                {meta ? <span className={`h-1.5 w-1.5 rounded-full ${meta.dot}`} /> : null}
                {s === 'all' ? t('admin.orders.allTab') : t(STATUS_META[s].key)}
                <span className="rounded-full bg-black/20 px-1.5 text-[10px] tabular-nums">{counts[s]}</span>
              </button>
            );
          })}
        </div>

        {error ? (
          <div className="rounded-xl bg-rose-900/40 p-3 text-sm text-rose-200">{error}</div>
        ) : null}

        {loading && orders.length === 0 ? (
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-24 animate-pulse rounded-2xl bg-slate-900" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-2xl bg-slate-900 p-8 text-center text-sm text-slate-400 ring-1 ring-slate-800">
            {t('admin.orders.empty')}
          </div>
        ) : (
          <ul className="space-y-2">
            {filtered.map((o) => (
              <OrderCard key={o.id} order={o} onStatus={updateStatus} />
            ))}
          </ul>
        )}
      </div>
    </AdminShell>
  );
}

function OrderCard({ order, onStatus }: { order: Order; onStatus: (id: string, s: OrderStatus) => void }) {
  const { t } = useTranslation();
  const meta = STATUS_META[order.status];
  const next = NEXT_STATUS[order.status];
  const ago = relativeMinutes(order.created_at, t);

  return (
    <li className="rounded-2xl bg-slate-900 p-3 ring-1 ring-slate-800">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs text-slate-400">#{order.id.slice(0, 8).toUpperCase()}</span>
            {order.table_label ? (
              <span className="rounded bg-slate-800 px-1.5 py-0.5 text-[10px] font-bold text-slate-200">
                {order.table_label}
              </span>
            ) : null}
            <span className="text-[10px] text-slate-500">· {ago}</span>
          </div>
          {order.customer_note ? (
            <p className="mt-1 text-[11px] italic text-slate-400">"{order.customer_note}"</p>
          ) : null}
        </div>
        <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${meta.cls}`}>
          {t(meta.key)}
        </span>
      </div>

      <ul className="mt-2 space-y-1 border-t border-slate-800 pt-2 text-sm">
        {order.items.map((it) => (
          <li key={it.id} className="flex items-center justify-between gap-2 text-slate-200">
            <span>
              <span className="font-bold text-amber-300">×{it.qty}</span> {it.name}
            </span>
            <span className="tabular-nums text-slate-400">{(it.price * it.qty).toFixed(2)}</span>
          </li>
        ))}
      </ul>

      <div className="mt-2 flex items-baseline justify-between border-t border-slate-800 pt-2">
        <span className="text-[11px] text-slate-400">{t('cart.total')}</span>
        <span className="text-base font-extrabold tabular-nums text-white">
          {order.total.toFixed(2)} <span className="text-xs text-slate-400">{order.currency}</span>
        </span>
      </div>

      {order.status !== 'served' && order.status !== 'cancelled' ? (
        <div className="mt-3 flex gap-1.5">
          {next ? (
            <button
              type="button"
              onClick={() => onStatus(order.id, next)}
              className="flex-1 rounded-lg bg-brand-primary py-2 text-xs font-bold text-white"
            >
              {t(STATUS_META[next].key)} →
            </button>
          ) : null}
          <button
            type="button"
            onClick={() => onStatus(order.id, 'cancelled')}
            className="rounded-lg bg-slate-800 px-3 py-2 text-xs font-semibold text-rose-300 hover:bg-slate-700"
          >
            ✕
          </button>
        </div>
      ) : null}
    </li>
  );
}

function relativeMinutes(iso: string, t: (k: string, opts?: Record<string, unknown>) => string): string {
  const minutes = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
  if (minutes < 1) return t('admin.orders.justNow');
  if (minutes < 60) return t('admin.orders.minutesAgo', { count: minutes });
  const hours = Math.round(minutes / 60);
  return t('admin.orders.hoursAgo', { count: hours });
}
