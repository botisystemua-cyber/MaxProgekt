import { supabase } from '@/shared/lib/supabase';

// ─────────────────────────────────────────────────────────────────────
// Style presets — 4 backgrounds × 4 filters. Канвасом, без AI bg-removal:
// фото центрується з padding на кольоровому квадраті, фільтр накладається
// через ctx.filter (нативний Canvas API).
// ─────────────────────────────────────────────────────────────────────

export type BackgroundId = 'white' | 'cream' | 'slate' | 'forest';
export type FilterId = 'none' | 'bw' | 'vivid' | 'vintage';

export interface BackgroundPreset {
  id: BackgroundId;
  label: string;
  color: string;
  /** Колір тексту/іконок поверх фону — потрібен для контрасту thumbnail-кнопок. */
  fg: string;
}

export interface FilterPreset {
  id: FilterId;
  label: string;
  /** Значення CSS `filter` для `ctx.filter`. 'none' для оригіналу. */
  css: string;
}

export const BACKGROUNDS: BackgroundPreset[] = [
  { id: 'white',  label: 'Білий',    color: '#FFFFFF', fg: '#1A1A2E' },
  { id: 'cream',  label: 'Кремовий', color: '#F5EBDD', fg: '#1A1A2E' },
  { id: 'slate',  label: 'Темний',   color: '#2A2F3A', fg: '#FFFFFF' },
  { id: 'forest', label: 'Irish',    color: '#1B6B3A', fg: '#FFFFFF' },
];

export const FILTERS: FilterPreset[] = [
  { id: 'none',    label: 'Оригінал', css: 'none' },
  { id: 'bw',      label: 'Ч/Б',      css: 'grayscale(100%) contrast(1.1)' },
  { id: 'vivid',   label: 'Яскраво',  css: 'saturate(1.4) contrast(1.12) brightness(1.05)' },
  { id: 'vintage', label: 'Вінтаж',   css: 'sepia(0.45) contrast(1.05) brightness(1.05) saturate(1.1)' },
];

interface CompositeOptions {
  size?: number;        // вихідний квадрат, px
  paddingPct?: number;  // відступ навколо фото, 0..1
  quality?: number;     // WebP quality 0..1
  background?: BackgroundId;
  filter?: FilterId;
}

/**
 * Малює зображення на квадратному canvas з заданим фоном і CSS-фільтром.
 * Стиль "продуктового знімка" — фото центроване з padding, фон чистий.
 */
export async function compositeImage(file: File, opts: CompositeOptions = {}): Promise<Blob> {
  const {
    size = 1024,
    paddingPct = 0.04,
    quality = 0.85,
    background = 'white',
    filter = 'none',
  } = opts;

  const img = await loadImage(file);
  const bg = BACKGROUNDS.find((b) => b.id === background) ?? BACKGROUNDS[0];
  const fx = FILTERS.find((f) => f.id === filter) ?? FILTERS[0];

  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D not supported');

  ctx.fillStyle = bg.color;
  ctx.fillRect(0, 0, size, size);

  const usable = size * (1 - 2 * paddingPct);
  const scale = Math.min(usable / img.width, usable / img.height);
  const w = img.width * scale;
  const h = img.height * scale;
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.filter = fx.css;
  ctx.drawImage(img, (size - w) / 2, (size - h) / 2, w, h);
  ctx.filter = 'none';

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('toBlob failed'))),
      'image/webp',
      quality,
    );
  });
}

export function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = (e) => {
      URL.revokeObjectURL(url);
      reject(e);
    };
    img.src = url;
  });
}

/**
 * Заливає вже готовий blob у Supabase Storage і повертає публічний URL.
 * Прийнято розділяти "що рендерити" і "куди залити" — це дозволяє модалці
 * показати кілька превʼю до фінального аплоаду.
 */
export async function uploadProcessedImage(
  blob: Blob,
  tenantSlug: string,
  itemId: string | undefined,
): Promise<string> {
  const fileId = itemId ?? crypto.randomUUID();
  const path = `${tenantSlug}/${fileId}-${Date.now()}.webp`;

  const { error } = await supabase.storage
    .from('menu-images')
    .upload(path, blob, { upsert: true, contentType: 'image/webp' });
  if (error) throw error;

  const { data } = supabase.storage.from('menu-images').getPublicUrl(path);
  return data.publicUrl;
}

/**
 * Старий API — залишений для зворотної сумісності. Композитить файл з білим
 * фоном без фільтру і одразу заливає в storage. Тепер обгортка над двома
 * новими функціями.
 */
export async function uploadMenuItemImage(
  file: File,
  tenantSlug: string,
  itemId: string | undefined,
): Promise<string> {
  const blob = await compositeImage(file, { background: 'white', filter: 'none' });
  return uploadProcessedImage(blob, tenantSlug, itemId);
}
