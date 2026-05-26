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

// Unique channel suffix — запобігає "cannot add postgres_changes callbacks
// after subscribe()" при швидкому re-mount (StrictMode двоїть ефекти).
// Сама проблема описана у BotiLogistics/client-crm/src/lib/chat.ts.
function uniqueId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

// Один канал на всю «вітрину». Будь-яка зміна в settings/items/banner
// викликає onChange — фронт робить повний reload (3 паралельних fetch).
// При объємі Меню ~20 позицій це дешевше ніж дифф-логіка.
export function subscribeToMenu(onChange: () => void): () => void {
  const channel = supabase
    .channel(`restaurant-menu-${uniqueId()}`)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'restaurant_items' }, () => onChange())
    .on('postgres_changes', { event: '*', schema: 'public', table: 'restaurant_banner' }, () => onChange())
    .on('postgres_changes', { event: '*', schema: 'public', table: 'restaurant_settings' }, () => onChange())
    .subscribe();
  return () => { void supabase.removeChannel(channel); };
}
