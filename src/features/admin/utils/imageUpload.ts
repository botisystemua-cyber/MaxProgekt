import { supabase } from '@/shared/lib/supabase';

interface CompositeOptions {
  size?: number;       // вихідний квадрат, px
  paddingPct?: number; // відступ навколо страви, 0..1
  quality?: number;    // WebP quality 0..1
}

/**
 * Малює зображення на квадратному білому canvas з padding-ом — створює
 * "продуктовий" знімок (як у Wolt/Glovo): страва центрована, фон чистий.
 * Якщо фото зроблено на телефон без редагування — це дає миттєве "wow" без
 * реального background-removal AI (який живе у 5+ MB ONNX-моделях у браузері).
 */
async function compositeOnWhite(file: File, opts: CompositeOptions = {}): Promise<Blob> {
  const { size = 1024, paddingPct = 0.04, quality = 0.85 } = opts;

  const img = await loadImage(file);

  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D not supported');

  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, size, size);

  // object-contain з padding
  const usable = size * (1 - 2 * paddingPct);
  const scale = Math.min(usable / img.width, usable / img.height);
  const w = img.width * scale;
  const h = img.height * scale;
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(img, (size - w) / 2, (size - h) / 2, w, h);

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('toBlob failed'))),
      'image/webp',
      quality,
    );
  });
}

function loadImage(file: File): Promise<HTMLImageElement> {
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

export async function uploadMenuItemImage(
  file: File,
  tenantSlug: string,
  itemId: string | undefined,
): Promise<string> {
  const blob = await compositeOnWhite(file);
  // path: <slug>/<itemId-or-uuid>-<timestamp>.webp — slug-prefix вимагає RLS
  const fileId = itemId ?? crypto.randomUUID();
  const path = `${tenantSlug}/${fileId}-${Date.now()}.webp`;

  const { error } = await supabase.storage
    .from('menu-images')
    .upload(path, blob, { upsert: true, contentType: 'image/webp' });
  if (error) throw error;

  const { data } = supabase.storage.from('menu-images').getPublicUrl(path);
  return data.publicUrl;
}
