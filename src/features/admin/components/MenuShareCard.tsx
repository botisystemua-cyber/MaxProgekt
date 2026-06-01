import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { QRCodeSVG } from 'qrcode.react';
import type { Tenant } from '@/shared/types/database';

interface Props {
  tenant: Tenant;
  variant?: 'full' | 'compact';
}

export function MenuShareCard({ tenant, variant = 'full' }: Props) {
  const { t } = useTranslation();
  const svgRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const url = `${window.location.origin}${import.meta.env.BASE_URL}menu/${tenant.slug}`;
  const shareText = `${tenant.name} · ${url}`;

  async function copyUrl() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch (e) {
      setError((e as Error).message);
    }
  }

  async function shareNative() {
    if (navigator.share) {
      try {
        await navigator.share({ title: tenant.name, text: shareText, url });
      } catch {
        // користувач скасував — silent
      }
    } else {
      void copyUrl();
    }
  }

  function downloadQr() {
    // SVG → Canvas → PNG. Беремо живий <svg> з ref і серіалізуємо.
    const svg = svgRef.current?.querySelector('svg');
    if (!svg) return;
    const xml = new XMLSerializer().serializeToString(svg);
    const blob = new Blob([xml], { type: 'image/svg+xml' });
    const objUrl = URL.createObjectURL(blob);
    const img = new Image();
    img.onload = () => {
      const size = 1024;
      const canvas = document.createElement('canvas');
      canvas.width = canvas.height = size;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, size, size);
      ctx.drawImage(img, 0, 0, size, size);
      URL.revokeObjectURL(objUrl);
      canvas.toBlob((png) => {
        if (!png) return;
        const dl = document.createElement('a');
        dl.href = URL.createObjectURL(png);
        dl.download = `${tenant.slug}-menu-qr.png`;
        dl.click();
        URL.revokeObjectURL(dl.href);
      }, 'image/png');
    };
    img.src = objUrl;
  }

  const waUrl = `https://wa.me/?text=${encodeURIComponent(shareText)}`;
  const tgUrl = `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(tenant.name)}`;

  const qrSize = variant === 'compact' ? 120 : 220;

  return (
    <div className="rounded-2xl bg-slate-900 p-4 ring-1 ring-slate-800">
      <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
        {t('admin.shareTitle')}
      </div>

      <div className={`mt-3 flex ${variant === 'compact' ? 'items-center gap-3' : 'flex-col items-center gap-4'}`}>
        <div ref={svgRef} className="shrink-0 rounded-xl bg-white p-2">
          <QRCodeSVG
            value={url}
            size={qrSize}
            level="M"
            marginSize={1}
            imageSettings={
              tenant.logo_url
                ? { src: tenant.logo_url, height: qrSize * 0.18, width: qrSize * 0.18, excavate: true }
                : undefined
            }
          />
        </div>

        <div className="min-w-0 flex-1 space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={copyUrl}
              className="rounded-lg bg-slate-800 px-3 py-2 text-xs font-semibold text-slate-100 transition-colors hover:bg-slate-700"
            >
              {copied ? '✓ Copied' : `📋 ${t('admin.copyLink')}`}
            </button>
            <a
              href={url}
              target="_blank"
              rel="noreferrer"
              className="rounded-lg bg-slate-800 px-3 py-2 text-center text-xs font-semibold text-slate-100 transition-colors hover:bg-slate-700"
            >
              ↗ {t('admin.openMenu')}
            </a>
            <button
              type="button"
              onClick={() => void shareNative()}
              className="rounded-lg bg-brand-primary px-3 py-2 text-xs font-bold text-white"
            >
              📤 {t('admin.share')}
            </button>
            <button
              type="button"
              onClick={downloadQr}
              className="rounded-lg bg-slate-800 px-3 py-2 text-xs font-semibold text-slate-100 transition-colors hover:bg-slate-700"
            >
              ⬇ QR PNG
            </button>
          </div>

          <div className="flex gap-2">
            <a
              href={waUrl}
              target="_blank"
              rel="noreferrer"
              className="flex-1 rounded-lg bg-[#25D366] px-3 py-2 text-center text-xs font-bold text-white"
            >
              💬 WhatsApp
            </a>
            <a
              href={tgUrl}
              target="_blank"
              rel="noreferrer"
              className="flex-1 rounded-lg bg-[#229ED9] px-3 py-2 text-center text-xs font-bold text-white"
            >
              ✈ Telegram
            </a>
          </div>

          {error ? <p className="text-xs text-rose-400">{error}</p> : null}
        </div>
      </div>
    </div>
  );
}
