export type Category = 'starters' | 'mains' | 'desserts' | 'drinks';

export interface RestaurantSettings {
  id: string;
  name: string;
  tagline: string | null;
  address: string | null;
  phone: string | null;
  hours: string | null;
  wifi: string | null;
  rating: number | null;
  reviews: number | null;
  menu_url: string | null;
}

export interface MenuItem {
  id: number;
  category: Category;
  name: string;
  description: string | null;
  price: number;
  veg: boolean;
  tags: string[];
  popular: boolean;
  discount: number;
  hidden: boolean;
  sort_order: number;
}

export interface Banner {
  id: string;
  active: boolean;
  text: string | null;
  subtext: string | null;
  emoji: string | null;
  color: string | null;
}

export interface BannerPreset {
  text: string;
  subtext: string;
  emoji: string;
  color: string;
}
