import { useEffect, useMemo, useRef, useState } from 'react';
import {
  BACKGROUNDS,
  BackgroundId,
  FILTERS,
  FilterId,
  compositeImage,
  loadImage,
  uploadProcessedImage,
} from '../utils/imageUpload';

interface Props {
  file: File;
  tenantSlug: string;
  itemId: string | undefined;
  onClose: () => void;
  onUploaded: (url: string) => void;
}

const THUMB_SIZE = 220;

export function PhotoStyleModal({ file, tenantSlug, itemId, onClose, onUploaded }: Props) {
  const [bgId, setBgId] = useState<BackgroundId>('white');
  const [fxId, setFxId] = useState<FilterId>('none');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [img, setImg] = useState<HTMLImageElement | null>(null);

  const previewRef = useRef<HTMLCanvasElement | null>(null);

  // Завантажуємо HTMLImageElement один раз — для всіх перерендерів превʼю.
  useEffect(() => {
    let cancelled = false;
    loadImage(file)
      .then((i) => {
        if (!cancelled) setImg(i);
      })
      .catch((e) => {
        if (!cancelled) setError((e as Error).message);
      });
    return () => {
      cancelled = true;
    };
  }, [file]);

  // Перерендер превʼю при зміні background / filter / image.
  useEffect(() => {
    const canvas = previewRef.current;
    if (!canvas || !img) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const bg = BACKGROUNDS.find((b) => b.id === bgId) ?? BACKGROUNDS[0];
    const fx = FILTERS.find((f) => f.id === fxId) ?? FILTERS[0];

    ctx.fillStyle = bg.color;
    ctx.fillRect(0, 0, THUMB_SIZE, THUMB_SIZE);

    const padding = THUMB_SIZE * 0.04;
    const usable = THUMB_SIZE - 2 * padding;
    const scale = Math.min(usable / img.width, usable / img.height);
    const w = img.width * scale;
    const h = img.height * scale;
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.filter = fx.css;
    ctx.drawImage(img, (THUMB_SIZE - w) / 2, (THUMB_SIZE - h) / 2, w, h);
    ctx.filter = 'none';
  }, [bgId, fxId, img]);

  const activeBg = useMemo(
    () => BACKGROUNDS.find((b) => b.id === bgId) ?? BACKGROUNDS[0],
    [bgId],
  );

  async function handleSave() {
    if (!img) return;
    setUploading(true);
    setError(null);
    try {
      const blob = await compositeImage(file, { background: bgId, filter: fxId });
      const url = await uploadProcessedImage(blob, tenantSlug, itemId);
      onUploaded(url);
    } catch (e) {
      setError((e as Error).message);
      setUploading(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-3 sm:items-center"
      onClick={(e) => {
        if (e.target === e.currentTarget && !uploading) onClose();
      }}
    >
      <div className="w-full max-w-md rounded-2xl bg-slate-900 p-4 shadow-2xl ring-1 ring-slate-800">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-base font-bold text-white">Стилізувати фото</h2>
          <button
            type="button"
            onClick={onClose}
            disabled={uploading}
            className="rounded-lg bg-slate-800 px-2.5 py-1 text-xs text-slate-300 disabled:opacity-50"
          >
            ✕
          </button>
        </div>

        {/* Live preview */}
        <div
          className="mb-4 flex aspect-square w-full items-center justify-center overflow-hidden rounded-xl ring-1 ring-slate-800"
          style={{ background: activeBg.color }}
        >
          <canvas
            ref={previewRef}
            width={THUMB_SIZE}
            height={THUMB_SIZE}
            className="h-full w-full"
          />
        </div>

        {error ? (
          <div className="mb-3 rounded-lg bg-rose-900/40 p-2 text-xs text-rose-200">{error}</div>
        ) : null}

        {/* Backgrounds */}
        <div className="mb-3">
          <div className="mb-1.5 text-[10px] font-bold uppercase tracking-widest text-slate-400">
            Фон
          </div>
          <div className="grid grid-cols-4 gap-2">
            {BACKGROUNDS.map((b) => {
              const active = b.id === bgId;
              return (
                <button
                  key={b.id}
                  type="button"
                  onClick={() => setBgId(b.id)}
                  disabled={uploading}
                  className={`flex flex-col items-center gap-1 rounded-lg p-1.5 ring-2 transition ${
                    active ? 'ring-brand-primary' : 'ring-slate-800 hover:ring-slate-600'
                  }`}
                >
                  <span
                    className="block h-8 w-full rounded ring-1 ring-black/20"
                    style={{ background: b.color }}
                  />
                  <span className="text-[10px] font-semibold text-slate-300">{b.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Filters */}
        <div className="mb-4">
          <div className="mb-1.5 text-[10px] font-bold uppercase tracking-widest text-slate-400">
            Фільтр
          </div>
          <div className="grid grid-cols-4 gap-2">
            {FILTERS.map((f) => {
              const active = f.id === fxId;
              return (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setFxId(f.id)}
                  disabled={uploading}
                  className={`rounded-lg px-2 py-2 text-[11px] font-semibold ring-2 transition ${
                    active
                      ? 'bg-brand-primary text-white ring-brand-primary'
                      : 'bg-slate-800 text-slate-300 ring-slate-800 hover:ring-slate-600'
                  }`}
                >
                  {f.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={uploading}
            className="flex-1 rounded-lg bg-slate-800 px-3 py-2.5 text-sm font-semibold text-slate-200 disabled:opacity-50"
          >
            Скасувати
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={uploading || !img}
            className="flex-1 rounded-lg bg-brand-primary px-3 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
          >
            {uploading ? 'Завантаження…' : 'Зберегти'}
          </button>
        </div>
      </div>
    </div>
  );
}
