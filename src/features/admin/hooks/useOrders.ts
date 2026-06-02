import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/shared/lib/supabase';

export type OrderStatus = 'new' | 'cooking' | 'ready' | 'served' | 'cancelled';

export interface OrderItem {
  id: string;
  menu_item_id: string | null;
  name: string;
  price: number;
  qty: number;
}

export interface Order {
  id: string;
  tenant_id: string;
  status: OrderStatus;
  table_label: string | null;
  customer_note: string | null;
  currency: string;
  total: number;
  created_at: string;
  updated_at: string;
  items: OrderItem[];
}

/**
 * Завантажує замовлення тенанта + підписується на realtime-зміни.
 * Polling fallback кожні 20с — на випадок коли realtime-канал відвалився.
 */
export function useOrders(tenantId: string | undefined) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!tenantId) return;
    setError(null);
    const { data: ordersData, error: ordersErr } = await supabase
      .from('orders')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false })
      .limit(100);
    if (ordersErr) {
      setError(ordersErr.message);
      setLoading(false);
      return;
    }
    const ids = (ordersData ?? []).map((o) => o.id as string);
    let items: OrderItem[] = [];
    if (ids.length > 0) {
      const { data: itemsData } = await supabase
        .from('order_items')
        .select('*')
        .in('order_id', ids);
      items = (itemsData ?? []) as unknown as (OrderItem & { order_id: string })[];
    }
    const itemsByOrder: Record<string, OrderItem[]> = {};
    for (const item of items as (OrderItem & { order_id: string })[]) {
      (itemsByOrder[item.order_id] ??= []).push(item);
    }
    setOrders(
      (ordersData ?? []).map((o) => ({ ...(o as Order), items: itemsByOrder[o.id as string] ?? [] })),
    );
    setLoading(false);
  }, [tenantId]);

  useEffect(() => {
    if (!tenantId) return;
    setLoading(true);
    void load();

    const channel = supabase
      .channel(`orders-tenant-${tenantId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders', filter: `tenant_id=eq.${tenantId}` },
        () => void load(),
      )
      .subscribe();

    const pollId = setInterval(() => void load(), 20000);

    return () => {
      void supabase.removeChannel(channel);
      clearInterval(pollId);
    };
  }, [tenantId, load]);

  async function updateStatus(orderId: string, status: OrderStatus): Promise<void> {
    const { error: err } = await supabase
      .from('orders')
      .update({ status })
      .eq('id', orderId);
    if (err) {
      setError(err.message);
      return;
    }
    await load();
  }

  return { orders, loading, error, reload: load, updateStatus };
}
