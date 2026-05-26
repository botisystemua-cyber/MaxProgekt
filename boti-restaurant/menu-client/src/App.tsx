import { useState, useMemo, useEffect, useCallback } from 'react';
import { fetchSettings, fetchItems, fetchBanner, subscribeToMenu } from './lib/menu';
import type { RestaurantSettings, MenuItem, Banner } from './types';

// Категорії фільтра — статичний список в UI, самі позиції вже їх
// зв'язують через поле `category`. Якщо додаватимем нові категорії —
// просто розширити цей масив.
const CATEGORIES = [
  { id: 'all',      label: 'Все',       icon: '🍽️' },
  { id: 'starters', label: 'Стартери', icon: '🥗' },
  { id: 'mains',    label: 'Головне',  icon: '🍖' },
  { id: 'desserts', label: 'Десерти', icon: '🍮' },
  { id: 'drinks',   label: 'Напої',     icon: '🍺' },
] as const;

const QR_PATTERN: number[][] = [
  [1,1,1,1,1,1,1,0,1,0,0,0,1,0,1,1,1,1,1,1,1],
  [1,0,0,0,0,0,1,0,0,1,0,1,0,0,1,0,0,0,0,0,1],
  [1,0,1,1,1,0,1,0,1,0,1,0,1,0,1,0,1,1,1,0,1],
  [1,0,1,1,1,0,1,0,0,0,0,1,1,0,1,0,1,1,1,0,1],
  [1,0,1,1,1,0,1,0,1,1,0,0,0,0,1,0,1,1,1,0,1],
  [1,0,0,0,0,0,1,0,0,1,0,1,0,0,1,0,0,0,0,0,1],
  [1,1,1,1,1,1,1,0,1,0,1,0,1,0,1,1,1,1,1,1,1],
  [0,0,0,0,0,0,0,0,0,1,0,1,0,0,0,0,0,0,0,0,0],
  [1,0,1,1,0,1,1,1,0,0,1,0,1,1,0,1,1,0,1,0,1],
  [0,1,0,0,1,1,0,0,1,0,0,1,0,0,1,0,0,1,1,0,0],
  [1,1,0,1,0,0,1,1,0,1,1,0,1,1,0,0,1,0,1,1,0],
  [0,0,1,0,1,0,0,0,1,1,0,1,0,0,1,1,0,0,0,1,0],
  [1,0,1,1,0,1,1,1,0,0,1,0,1,1,0,1,1,0,1,0,1],
  [0,0,0,0,0,0,0,0,1,0,1,0,1,0,0,0,1,0,0,1,0],
  [1,1,1,1,1,1,1,0,0,1,0,1,0,0,1,0,1,1,0,0,1],
  [1,0,0,0,0,0,1,0,1,0,1,0,1,1,0,1,0,0,1,0,0],
  [1,0,1,1,1,0,1,0,0,1,1,0,0,0,1,0,1,0,1,1,0],
  [1,0,1,1,1,0,1,0,1,0,0,1,0,1,0,1,0,1,0,0,1],
  [1,0,1,1,1,0,1,0,0,0,1,0,1,0,1,0,1,1,0,1,0],
  [1,0,0,0,0,0,1,0,1,1,0,1,0,1,0,1,0,0,1,0,1],
  [1,1,1,1,1,1,1,0,0,0,1,0,1,0,1,0,1,0,0,1,1],
];

function QRCode({ size = 140 }: { size?: number }) {
  const cell = size / 21;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {QR_PATTERN.map((row, r) =>
        row.map((val, c) =>
          val ? <rect key={`${r}-${c}`} x={c * cell} y={r * cell} width={cell} height={cell} fill="#1a2744" rx="1" /> : null
        )
      )}
    </svg>
  );
}

export default function App() {
  const [settings, setSettings] = useState<RestaurantSettings | null>(null);
  const [items, setItems] = useState<MenuItem[]>([]);
  const [banner, setBanner] = useState<Banner | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [cart, setCart] = useState<Record<number, number>>({});
  const [showCart, setShowCart] = useState(false);
  const [showQR, setShowQR] = useState(false);

  const reload = useCallback(async () => {
    const [s, i, b] = await Promise.all([fetchSettings(), fetchItems(), fetchBanner()]);
    setSettings(s);
    setItems(i);
    setBanner(b);
  }, []);

  useEffect(() => {
    void reload();
    // Realtime: будь-яка зміна в адмінці прилітає сюди за ~200мс.
    // Раніше (у QRMenu.html) був setInterval(5000) на localStorage — видалено.
    const unsubscribe = subscribeToMenu(() => { void reload(); });
    return unsubscribe;
  }, [reload]);

  const visibleItems = useMemo(() => {
    return items
      .filter(i => !i.hidden)
      .map(i => ({
        ...i,
        salePrice: i.discount > 0 ? +(i.price * (1 - i.discount / 100)).toFixed(2) : null,
      }));
  }, [items]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return visibleItems.filter(item => {
      const catMatch = activeCategory === 'all' || item.category === activeCategory;
      const searchMatch = !q || item.name.toLowerCase().includes(q);
      return catMatch && searchMatch;
    });
  }, [visibleItems, activeCategory, search]);

  const totalItems = Object.values(cart).reduce((a, b) => a + b, 0);
  const totalPrice = Object.entries(cart).reduce((a, [id, qty]) => {
    const item = visibleItems.find(i => i.id === Number(id));
    if (!item) return a;
    return a + (item.salePrice ?? item.price) * qty;
  }, 0);

  const addToCart = (id: number) => setCart(prev => ({ ...prev, [id]: (prev[id] ?? 0) + 1 }));
  const removeFromCart = (id: number) => setCart(prev => {
    const next = { ...prev, [id]: (prev[id] ?? 1) - 1 };
    if (next[id] <= 0) delete next[id];
    return next;
  });

  if (!settings) {
    return (
      <div style={{ padding: 24, textAlign: 'center', color: '#94a3b8', fontSize: 14 }}>
        Завантаження меню…
      </div>
    );
  }

  const showBanner = banner?.active && !!banner.text;

  return (
    <div style={{
      fontFamily: "'DM Sans', system-ui, sans-serif",
      background: '#f8f7f4',
      minHeight: '100vh',
      maxWidth: '420px',
      margin: '0 auto',
      position: 'relative',
      paddingBottom: totalItems > 0 ? '90px' : '24px',
    }}>
      {/* HEADER */}
      <div style={{
        background: 'linear-gradient(160deg, #1a2744 0%, #0f1a35 100%)',
        padding: '24px 20px 20px',
        color: 'white',
        position: 'relative',
        overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', right: '-30px', top: '-30px', width: '120px', height: '120px', borderRadius: '50%', background: 'rgba(255,255,255,0.04)' }} />

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
          <div>
            <div style={{ fontSize: '22px', fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 1.1, marginBottom: '4px' }}>{settings.name}</div>
            {settings.tagline && <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.55)', fontWeight: 500 }}>{settings.tagline}</div>}
          </div>
          <button onClick={() => setShowQR(true)} style={{
            background: 'rgba(255,255,255,0.12)', border: 'none', borderRadius: '10px',
            padding: '8px 12px', color: 'white', fontSize: '12px', fontWeight: 700,
            cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px',
            backdropFilter: 'blur(4px)',
          }}>📱 QR</button>
        </div>

        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {settings.rating != null && (
            <span style={{ background: 'rgba(255,255,255,0.1)', borderRadius: '8px', padding: '5px 10px', fontSize: '12px', fontWeight: 600 }}>
              ⭐ {settings.rating}{settings.reviews ? ` · ${settings.reviews.toLocaleString()}` : ''}
            </span>
          )}
          {settings.hours && (
            <span style={{ background: 'rgba(255,255,255,0.1)', borderRadius: '8px', padding: '5px 10px', fontSize: '12px' }}>
              🕐 {settings.hours}
            </span>
          )}
          {settings.phone && (
            <a href={`tel:${settings.phone}`} style={{ background: 'rgba(255,255,255,0.1)', borderRadius: '8px', padding: '5px 10px', fontSize: '12px', color: 'white', textDecoration: 'none' }}>
              📞 Зателефонувати
            </a>
          )}
        </div>
      </div>

      {/* PROMO BANNER — рендериться одразу як адмін вмикає active=true */}
      {showBanner && (
        <div style={{
          margin: '12px 16px 0',
          background: banner!.color ?? 'linear-gradient(135deg, #f59e0b, #ef4444)',
          borderRadius: '14px',
          padding: '14px 18px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          color: 'white',
          boxShadow: '0 4px 16px rgba(245,158,11,0.3)',
        }}>
          <span style={{ fontSize: '24px' }}>{banner!.emoji ?? '🎉'}</span>
          <div>
            <div style={{ fontSize: '14px', fontWeight: 800 }}>{banner!.text}</div>
            {banner!.subtext && <div style={{ fontSize: '12px', opacity: 0.85, marginTop: '2px' }}>{banner!.subtext}</div>}
          </div>
        </div>
      )}

      {/* SEARCH */}
      <div style={{ padding: '14px 16px 0' }}>
        <div style={{
          background: 'white', borderRadius: '12px', display: 'flex', alignItems: 'center',
          gap: '8px', padding: '10px 14px',
          boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
        }}>
          <span style={{ fontSize: '16px', opacity: 0.4 }}>🔍</span>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Пошук в меню..."
            style={{ border: 'none', outline: 'none', flex: 1, fontSize: '14px', background: 'transparent', fontFamily: 'inherit', color: '#1a1a2e' }}
          />
          {search && <button onClick={() => setSearch('')} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '16px', opacity: 0.4 }}>✕</button>}
        </div>
      </div>

      {/* CATEGORY TABS */}
      <div style={{ padding: '12px 0 4px', display: 'flex', gap: '8px', paddingLeft: '16px', paddingRight: '16px', overflowX: 'auto', scrollbarWidth: 'none' }}>
        {CATEGORIES.map(cat => {
          const isActive = activeCategory === cat.id;
          return (
            <button key={cat.id} onClick={() => setActiveCategory(cat.id)} style={{
              background: isActive ? '#1a2744' : 'white',
              color: isActive ? 'white' : '#64748b',
              border: 'none', borderRadius: '20px', padding: '8px 14px', fontSize: '12px',
              fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap',
              display: 'flex', alignItems: 'center', gap: '4px',
              boxShadow: isActive ? '0 4px 12px rgba(26,39,68,0.3)' : '0 2px 8px rgba(0,0,0,0.06)',
              transition: 'all 0.2s', fontFamily: 'inherit',
            }}>
              {cat.icon} {cat.label}
            </button>
          );
        })}
      </div>

      {/* MENU ITEMS */}
      <div style={{ padding: '8px 16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {filtered.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px 0', color: '#94a3b8', fontSize: '14px' }}>Нічого не знайдено 🙁</div>
        )}
        {filtered.map(item => {
          const qty = cart[item.id] ?? 0;
          const displayPrice = item.salePrice ?? item.price;

          return (
            <div key={item.id} style={{
              background: 'white', borderRadius: '16px', overflow: 'hidden',
              boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
              border: qty > 0 ? '2px solid #1a2744' : item.discount > 0 ? '2px solid #f59e0b' : '2px solid transparent',
              transition: 'border 0.2s',
            }}>
              {item.discount > 0 && (
                <div style={{ background: 'linear-gradient(90deg, #f59e0b, #ef4444)', padding: '4px 14px', fontSize: '11px', fontWeight: 700, color: 'white', display: 'flex', justifyContent: 'space-between' }}>
                  <span>🔥 АКЦІЯ</span>
                  <span>-{item.discount}%</span>
                </div>
              )}

              <div style={{ padding: '14px 16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '15px', fontWeight: 700, color: '#1a2744' }}>{item.name}</span>
                      {item.popular && <span style={{ background: '#fff3e0', color: '#f59e0b', fontSize: '10px', fontWeight: 700, padding: '1px 6px', borderRadius: '4px' }}>🔥 Топ</span>}
                      {item.veg && <span style={{ background: '#f0fdf4', color: '#22c55e', fontSize: '10px', fontWeight: 700, padding: '1px 6px', borderRadius: '4px' }}>🌱</span>}
                    </div>
                    {item.description && <div style={{ fontSize: '12px', color: '#94a3b8', lineHeight: 1.4 }}>{item.description}</div>}
                    {item.tags.length > 0 && (
                      <div style={{ display: 'flex', gap: '4px', marginTop: '6px', flexWrap: 'wrap' }}>
                        {item.tags.map(tag => <span key={tag} style={{ fontSize: '10px', background: '#f1f5f9', color: '#64748b', padding: '1px 6px', borderRadius: '4px' }}>{tag}</span>)}
                      </div>
                    )}
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    {item.discount > 0 && (
                      <div style={{ fontSize: '12px', color: '#94a3b8', textDecoration: 'line-through' }}>€{item.price.toFixed(2)}</div>
                    )}
                    <div style={{ fontSize: '17px', fontWeight: 800, color: item.discount > 0 ? '#ef4444' : '#1a2744' }}>
                      €{displayPrice.toFixed(2)}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '10px' }}>
                  {qty === 0 ? (
                    <button onClick={() => addToCart(item.id)} style={{
                      background: '#1a2744', color: 'white', border: 'none',
                      borderRadius: '10px', padding: '7px 16px', fontSize: '12px',
                      fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
                    }}>+ Додати</button>
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <button onClick={() => removeFromCart(item.id)} style={{ width: '30px', height: '30px', borderRadius: '8px', background: '#f1f5f9', border: 'none', fontSize: '16px', cursor: 'pointer' }}>−</button>
                      <span style={{ fontWeight: 800, fontSize: '16px', color: '#1a2744', minWidth: '20px', textAlign: 'center' }}>{qty}</span>
                      <button onClick={() => addToCart(item.id)} style={{ width: '30px', height: '30px', borderRadius: '8px', background: '#1a2744', border: 'none', fontSize: '16px', color: 'white', cursor: 'pointer' }}>+</button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* INFO FOOTER */}
      <div style={{ margin: '12px 16px 0', background: 'white', borderRadius: '16px', padding: '16px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
        <div style={{ fontSize: '13px', fontWeight: 700, color: '#1a2744', marginBottom: '10px' }}>ℹ️ Інфо</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '12px', color: '#64748b' }}>
          {settings.address && <div>📍 {settings.address}</div>}
          {settings.phone && <div>📞 <a href={`tel:${settings.phone}`} style={{ color: '#1a2744', textDecoration: 'none', fontWeight: 600 }}>{settings.phone}</a></div>}
          {settings.hours && <div>🕐 Щодня {settings.hours}</div>}
          {settings.wifi && <div>📶 WiFi: <b style={{ color: '#1a2744' }}>{settings.wifi}</b></div>}
        </div>
        <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid #f1f5f9', textAlign: 'center' }}>
          <div style={{ fontSize: '11px', color: '#cbd5e1' }}>Powered by</div>
          <div style={{ fontSize: '13px', fontWeight: 800, color: '#3b82f6' }}>BotiRestaurant</div>
        </div>
      </div>

      {/* CART BUTTON */}
      {totalItems > 0 && (
        <div style={{ position: 'fixed', bottom: '20px', left: '50%', transform: 'translateX(-50%)', zIndex: 100, width: 'calc(100% - 32px)', maxWidth: '388px' }}>
          <button onClick={() => setShowCart(true)} style={{
            width: '100%', background: 'linear-gradient(135deg, #1a2744, #2d4a8a)', color: 'white',
            border: 'none', borderRadius: '16px', padding: '16px 20px', fontSize: '15px', fontWeight: 700,
            cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            boxShadow: '0 8px 24px rgba(26,39,68,0.4)', fontFamily: 'inherit',
          }}>
            <span style={{ background: 'rgba(255,255,255,0.2)', borderRadius: '8px', padding: '2px 10px', fontSize: '13px' }}>{totalItems} шт</span>
            <span>🛒 Замовлення</span>
            <span style={{ fontWeight: 800 }}>€{totalPrice.toFixed(2)}</span>
          </button>
        </div>
      )}

      {/* CART MODAL */}
      {showCart && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 200, display: 'flex', alignItems: 'flex-end' }} onClick={() => setShowCart(false)}>
          <div style={{ background: 'white', borderRadius: '20px 20px 0 0', width: '100%', maxWidth: '420px', margin: '0 auto', padding: '20px', maxHeight: '80vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
            <div style={{ fontWeight: 800, fontSize: '17px', marginBottom: '16px', color: '#1a2744' }}>🛒 Ваше замовлення</div>
            {Object.entries(cart).map(([id, qty]) => {
              const item = visibleItems.find(i => i.id === Number(id));
              if (!item) return null;
              const displayPrice = item.salePrice ?? item.price;
              return (
                <div key={id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', paddingBottom: '12px', borderBottom: '1px solid #f1f5f9' }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '14px', color: '#1a2744' }}>{item.name}</div>
                    <div style={{ fontSize: '12px', color: '#94a3b8' }}>€{displayPrice.toFixed(2)} × {qty}</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <button onClick={() => removeFromCart(item.id)} style={{ width: '28px', height: '28px', borderRadius: '8px', background: '#f1f5f9', border: 'none', cursor: 'pointer', fontWeight: 700 }}>−</button>
                    <span style={{ fontWeight: 700, color: '#1a2744' }}>{qty}</span>
                    <button onClick={() => addToCart(item.id)} style={{ width: '28px', height: '28px', borderRadius: '8px', background: '#1a2744', color: 'white', border: 'none', cursor: 'pointer', fontWeight: 700 }}>+</button>
                  </div>
                </div>
              );
            })}
            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800, fontSize: '16px', color: '#1a2744', marginBottom: '16px' }}>
              <span>Разом</span>
              <span>€{totalPrice.toFixed(2)}</span>
            </div>
            <button style={{ width: '100%', background: '#1a2744', color: 'white', border: 'none', borderRadius: '14px', padding: '14px', fontSize: '15px', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
              ✅ Підтвердити замовлення
            </button>
            <div style={{ textAlign: 'center', marginTop: '8px', fontSize: '11px', color: '#cbd5e1' }}>Офіціант прийде до вашого столика</div>
          </div>
        </div>
      )}

      {/* QR MODAL */}
      {showQR && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setShowQR(false)}>
          <div style={{ background: 'white', borderRadius: '24px', padding: '32px 28px', textAlign: 'center', maxWidth: '300px', width: '90%' }} onClick={e => e.stopPropagation()}>
            <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '16px', fontWeight: 500 }}>QR-код вашого меню</div>
            <div style={{ background: 'white', padding: '16px', borderRadius: '16px', display: 'inline-block', border: '1px solid #e2e8f0' }}>
              <QRCode size={160} />
            </div>
            <div style={{ marginTop: '16px', fontSize: '18px', fontWeight: 800, color: '#1a2744' }}>{settings.name}</div>
            <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '4px' }}>Скануйте щоб відкрити меню</div>
            {settings.menu_url && (
              <div style={{ marginTop: '16px', padding: '10px 14px', background: '#f8f7f4', borderRadius: '12px' }}>
                <div style={{ fontSize: '11px', color: '#94a3b8' }}>Посилання на меню</div>
                <div style={{ fontSize: '13px', fontWeight: 700, color: '#3b82f6' }}>{settings.menu_url}</div>
              </div>
            )}
            <button onClick={() => setShowQR(false)} style={{ marginTop: '16px', background: '#1a2744', color: 'white', border: 'none', borderRadius: '12px', padding: '12px 32px', fontSize: '14px', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
              Закрити
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
