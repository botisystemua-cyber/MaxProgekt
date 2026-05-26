// =====================================================================
// TypeScript-типи для Supabase-схеми BotiLocal.
// Синхронізовано з supabase/migrations/20260526190000_extend_to_botilocal_saas.sql
//
// Якщо у майбутньому зміниш міграцію — згенеруй типи автоматично:
//   npx supabase gen types typescript --project-id <id> > src/shared/types/supabase.gen.ts
// і замінити цей файл re-export-ом. Поки що тримаємо вручну для простоти.
// =====================================================================

export type Language = 'es' | 'en' | 'uk' | 'ru' | 'pl' | 'ga' | 'de';
export type Role = 'owner' | 'admin' | 'waiter';
export type SpecialType = 'daily' | 'promo' | 'happy_hour';
export type SubscriptionPlan = 'basic' | 'pro' | 'premium';

export interface Tenant {
  id: string;
  slug: string;
  name: string;
  tagline: string | null;
  description: string | null;
  logo_url: string | null;
  cover_image_url: string | null;
  primary_color: string;
  secondary_color: string;
  currency: string;
  default_language: Language;
  available_languages: Language[];
  address: string | null;
  phone: string | null;
  hours: string | null;
  wifi: string | null;
  opening_hours: Record<string, string> | null;
  social_links: Record<string, string> | null;
  rating: number | null;
  reviews: number;
  is_active: boolean;
  subscription_plan: SubscriptionPlan;
  subscription_expires_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: string;
  tenant_id: string;
  slug: string;
  label: string;
  icon: string | null;
  sort_order: number;
  is_visible: boolean;
  created_at: string;
}

export interface CategoryTranslation {
  id: string;
  category_id: string;
  language: Language;
  name: string;
  description: string | null;
}

export interface MenuItem {
  id: string;
  tenant_id: string;
  category_id: string;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  sort_order: number;
  is_available: boolean;
  is_new: boolean;
  is_featured: boolean;
  is_popular: boolean;
  is_vegetarian: boolean;
  is_vegan: boolean;
  is_spicy: boolean;
  is_gluten_free: boolean;
  allergens: string[];
  tags: string[];
  calories: number | null;
  preparation_time: number | null;
  featured_until: string | null;
  discount_percent: number;
  created_at: string;
  updated_at: string;
}

export interface MenuItemTranslation {
  id: string;
  menu_item_id: string;
  language: Language;
  name: string;
  description: string | null;
}

export interface AppUser {
  id: string;
  tenant_id: string;
  role: Role;
  full_name: string | null;
  avatar_url: string | null;
  is_active: boolean;
  created_at: string;
}

export interface Banner {
  id: string;
  tenant_id: string;
  text: string;
  subtext: string | null;
  emoji: string;
  color: string | null;
  is_active: boolean;
  created_at: string;
}

export interface DailySpecial {
  id: string;
  tenant_id: string;
  menu_item_id: string;
  special_type: SpecialType;
  special_price: number | null;
  starts_at: string;
  ends_at: string | null;
  is_active: boolean;
  created_at: string;
}
