import { supabase } from './supabase';
import type { RestaurantSettings, MenuItem, Banner } from '../types';

export async function fetchSettings(): Promise<RestaurantSettings | null> {
  const { data, error } = await supabase
    .from('restaurant_settings')
    .select('*')
    .eq('id', 'default')
    .maybeSingle();
  if (error) {
    console.error('[menu] fetchSettings:', error);
    return null;
  }
  return data as RestaurantSettings | null;
}

export async function fetchItems(): Promise<MenuItem[]> {
  const { data, error } = await supabase
    .from('restaurant_items')
    .select('*')
    .order('sort_order', { ascending: true });
  if (error) {
    console.error('[menu] fetchItems:', error);
    return [];
  }
  return (data ?? []) as MenuItem[];
}

export async function fetchBanner(): Promise<Banner | null> {
  const { data, error } = await supabase
    .from('restaurant_banner')
    .select('*')
    .eq('id', 'default')
    .maybeSingle();
  if (error) {
    console.error('[menu] fetchBanner:', error);
    return null;
  }
  return data as Banner | null;
}

function uniqueId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

// Адмін-панель теж підписується на реалтайм — щоб якщо два адміни в
// різних вкладках/пристроях редагували одночасно — обоє бачили
// останній стан. Без цього один бачив би stale-версію до власної дії.
export function subscribeToMenu(onChange: () => void): () => void {
  const channel = supabase
    .channel(`restaurant-admin-${uniqueId()}`)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'restaurant_items' }, () => onChange())
    .on('postgres_changes', { event: '*', schema: 'public', table: 'restaurant_banner' }, () => onChange())
    .on('postgres_changes', { event: '*', schema: 'public', table: 'restaurant_settings' }, () => onChange())
    .subscribe();
  return () => { void supabase.removeChannel(channel); };
}

// ----- Mutations -----

export async function updateItem(
  id: number,
  patch: Partial<Pick<MenuItem, 'popular' | 'hidden' | 'discount'>>,
): Promise<void> {
  const { error } = await supabase
    .from('restaurant_items')
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq('id', id);
  if (error) throw error;
}

export interface BannerInput {
  text: string;
  subtext?: string | null;
  emoji?: string | null;
  color?: string | null;
}

export async function setBanner(b: BannerInput): Promise<void> {
  const { error } = await supabase
    .from('restaurant_banner')
    .update({
      active: true,
      text: b.text,
      subtext: b.subtext ?? null,
      emoji: b.emoji ?? '🎉',
      color: b.color ?? 'linear-gradient(135deg, #f59e0b, #ef4444)',
      updated_at: new Date().toISOString(),
    })
    .eq('id', 'default');
  if (error) throw error;
}

export async function clearBanner(): Promise<void> {
  const { error } = await supabase
    .from('restaurant_banner')
    .update({ active: false, updated_at: new Date().toISOString() })
    .eq('id', 'default');
  if (error) throw error;
}

export async function resetAllOverrides(): Promise<void> {
  // Один UPDATE на всі рядки — без PostgREST-воркера дозволу «update without
  // WHERE» немає, тому використовуємо neq('id', 0) як безпечний ловушку.
  const { error } = await supabase
    .from('restaurant_items')
    .update({ popular: false, discount: 0, hidden: false, updated_at: new Date().toISOString() })
    .neq('id', 0);
  if (error) throw error;
  await clearBanner();
}
