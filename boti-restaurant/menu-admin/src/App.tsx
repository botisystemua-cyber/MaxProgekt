import { useState, useEffect, useCallback } from 'react';
import {
  fetchItems, fetchBanner, subscribeToMenu,
  updateItem, setBanner, clearBanner, resetAllOverrides,
} from './lib/menu';
import type { MenuItem, Banner, BannerPreset, Category } from './types';

const ADMIN_PIN = '1234';

const CAT_ICONS: Record<Category, string> = { starters: '🥗', mains: '🍖', desserts: '🍮', drinks: '🍺' };
const CAT_LABELS: Record<Category, string> = { starters: 'Стартери', mains: 'Головне', desserts: 'Десерти', drinks: 'Напої' };

const BANNER_PRESETS: BannerPreset[] = [
  { text: 'Щасливі години: 17:00 – 19:00', subtext: 'Пиво -20% на всі пінти!',     emoji: '🍺', color: 'linear-gradient(135deg, #1a2744, #2d4a8a)' },
  { text: 'Меню дня — спеціальна ціна!',    subtext: 'Тільки сьогодні обмежена кількість', emoji: '⭐', color: 'linear-gradient(135deg, #f59e0b, #d97706)' },
  { text: 'Безкоштовний десерт при замовленні від €25', subtext: 'Дійсно весь вечірка',         emoji: '🎁', color: 'linear-gradient(135deg, #7c3aed, #4f46e5)' },
  { text: 'Свіжа риба сьогодні! 🐟',     subtext: 'Доставка з ринку щоранку',         emoji: '🐟', color: 'linear-gradient(135deg, #0ea5e9, #0284c7)' },
];

// ----- PIN SCREEN -----
function PinScreen({ onSuccess }: { onSuccess: () => void }) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);

  const handleDigit = (d: string) => {
    if (pin.length >= 4) return;
    const next = pin + d;
    setPin(next);
    if (next.length === 4) {
      if (next === ADMIN_PIN) {
        setTimeout(onSuccess, 200);
      } else {
        setError(true);
        setTimeout(() => { setPin(''); setError(false); }, 900);
      }
    }
  };

  const handleDel = () => setPin(p => p.slice(0, -1));

  return (
    <div style={{
      fontFamily: "'DM Sans', system-ui, sans-serif",
      background: '#0a0d17', minHeight: '100vh',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      padding: '20px',
    }}>
      <div style={{ marginBottom: '32px', textAlign: 'center' }}>
        <div style={{ fontSize: '32px', marginBottom: '8px' }}>🔒</div>
        <div style={{ fontSize: '22px', fontWeight: 800, color: '#f1f5f9' }}>Адмін-панель</div>
        <div style={{ fontSize: '13px', color: '#64748b', marginTop: '4px' }}>BotiRestaurant · Меню</div>
      </div>

      <div style={{ display: 'flex', gap: '16px', marginBottom: '40px' }}>
        {[0, 1, 2, 3].map(i => (
          <div key={i} style={{
            width: '20px', height: '20px', borderRadius: '50%',
            background: error ? '#ef4444' : pin.length > i ? '#3b82f6' : 'rgba(255,255,255,0.1)',
            border: `2px solid ${error ? '#ef4444' : pin.length > i ? '#3b82f6' : 'rgba(255,255,255,0.15)'}`,
            transition: 'all 0.15s',
          }} />
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', width: '240px' }}>
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(d => (
          <button key={d} onClick={() => handleDigit(String(d))} style={{
            height: '68px', borderRadius: '16px',
            background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)',
            color: '#f1f5f9', fontSize: '22px', fontWeight: 700,
            cursor: 'pointer', fontFamily: 'inherit',
            transition: 'background 0.1s',
          }}>{d}</button>
        ))}
        <div />
        <button onClick={() => handleDigit('0')} style={{
          height: '68px', borderRadius: '16px',
          background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)',
          color: '#f1f5f9', fontSize: '22px', fontWeight: 700,
          cursor: 'pointer', fontFamily: 'inherit',
        }}>0</button>
        <button onClick={handleDel} style={{
          height: '68px', borderRadius: '16px',
          background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)',
          color: '#94a3b8', fontSize: '22px',
          cursor: 'pointer', fontFamily: 'inherit',
        }}>⌫</button>
      </div>

      <div style={{ marginTop: '24px', fontSize: '12px', color: '#475569' }}>Демо PIN: 1234</div>
    </div>
  );
}

// ----- MAIN ADMIN -----
export default function App() {
  const [authed, setAuthed] = useState(false);
  const [tab, setTab] = useState<'items' | 'banner' | 'settings'>('items');
  const [items, setItems] = useState<MenuItem[]>([]);
  const [banner, setBannerState] = useState<Banner | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [filterCat, setFilterCat] = useState<'all' | Category>('all');
  const [editItemId, setEditItemId] = useState<number | null>(null);
  const [discountInput, setDiscountInput] = useState('');
  const [customBanner, setCustomBanner] = useState<BannerPreset>({
    text: '', subtext: '', emoji: '🎉',
    color: 'linear-gradient(135deg, #f59e0b, #d97706)',
  });
  const [showCustomBanner, setShowCustomBanner] = useState(false);

  const reload = useCallback(async () => {
    const [i, b] = await Promise.all([fetchItems(), fetchBanner()]);
    setItems(i);
    setBannerState(b);
  }, []);

  useEffect(() => {
    if (!authed) return;
    void reload();
    const unsubscribe = subscribeToMenu(() => { void reload(); });
    return unsubscribe;
  }, [authed, reload]);

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 2500); };

  // Helper для безпечних мутацій — показує toast при помилці замість throw.
  const tryDo = async (fn: () => Promise<void>, okMsg: string) => {
    try {
      await fn();
      showToast(okMsg);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'unknown';
      showToast(`Помилка: ${msg}`);
    }
  };

  const togglePopular = (item: MenuItem) =>
    tryDo(() => updateItem(item.id, { popular: !item.popular }), 'Збережено ✓');

  const toggleHidden = (item: MenuItem) =>
    tryDo(() => updateItem(item.id, { hidden: !item.hidden }), 'Збережено ✓');

  const applyDiscount = (item: MenuItem, pct: number) =>
    tryDo(async () => {
      await updateItem(item.id, { discount: pct });
      setEditItemId(null);
    }, `Знижка ${pct}% застосована ✓`);

  const clearDiscount = (item: MenuItem) =>
    tryDo(() => updateItem(item.id, { discount: 0 }), 'Знижку знято ✓');

  const activateBanner = (b: BannerPreset) =>
    tryDo(() => setBanner(b), 'Банер активовано ✓');

  const deactivateBanner = () =>
    tryDo(() => clearBanner(), 'Банер прибрано ✓');

  const resetAll = () =>
    tryDo(() => resetAllOverrides(), 'Всі зміни скинуто ✓');

  if (!authed) return <PinScreen onSuccess={() => setAuthed(true)} />;

  const popularCount = items.filter(i => i.popular).length;
  const discountCount = items.filter(i => i.discount > 0).length;
  const hiddenCount = items.filter(i => i.hidden).length;

  const filteredItems = filterCat === 'all'
    ? items
    : items.filter(i => i.category === filterCat);

  const categories: ('all' | Category)[] = ['all', 'starters', 'mains', 'desserts', 'drinks'];

  return (
    <div style={{
      fontFamily: "'DM Sans', system-ui, sans-serif",
      background: '#0a0d17', color: '#e2e8f0',
      minHeight: '100vh', maxWidth: '420px', margin: '0 auto',
      paddingBottom: '80px',
    }}>
      {/* HEADER */}
      <div style={{ background: 'linear-gradient(160deg, #1a2744, #0f1a35)', padding: '24px 20px 20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '4px' }}>Адмін-панель</div>
            <div style={{ fontSize: '20px', fontWeight: 800 }}>BotiRestaurant</div>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <a href="../menu-client/" style={{ background: 'rgba(255,255,255,0.1)', borderRadius: '10px', padding: '8px 12px', fontSize: '12px', fontWeight: 600, color: 'white', textDecoration: 'none' }}>
              👁 Меню
            </a>
            <button onClick={() => setAuthed(false)} style={{ background: 'rgba(255,255,255,0.06)', border: 'none', borderRadius: '10px', padding: '8px 12px', fontSize: '12px', color: '#94a3b8', cursor: 'pointer', fontFamily: 'inherit' }}>
              🔒
            </button>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
          {[
            { label: 'Топ позицій', val: popularCount,  color: '#fbbf24', icon: '🔥' },
            { label: 'Акції',     val: discountCount, color: '#34d399', icon: '🏷️' },
            { label: 'Приховано', val: hiddenCount,   color: '#f87171', icon: '👁' },
          ].map(s => (
            <div key={s.label} style={{ flex: 1, background: 'rgba(255,255,255,0.05)', borderRadius: '12px', padding: '10px 12px', textAlign: 'center' }}>
              <div style={{ fontSize: '20px', fontWeight: 800, color: s.color }}>{s.icon} {s.val}</div>
              <div style={{ fontSize: '10px', color: '#64748b', marginTop: '2px' }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* TABS */}
      <div style={{ display: 'flex', gap: '0', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        {([
          { id: 'items',    label: '📋 Позиції' },
          { id: 'banner',   label: '📢 Банер' },
          { id: 'settings', label: '⚙️ Налаштування' },
        ] as const).map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            flex: 1, padding: '14px 0', fontSize: '12px', fontWeight: 700,
            background: 'transparent', border: 'none', cursor: 'pointer',
            fontFamily: 'inherit',
            color: tab === t.id ? '#3b82f6' : '#64748b',
            borderBottom: tab === t.id ? '2px solid #3b82f6' : '2px solid transparent',
          }}>{t.label}</button>
        ))}
      </div>

      {/* ITEMS TAB */}
      {tab === 'items' && (
        <div style={{ padding: '16px' }}>
          <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', scrollbarWidth: 'none', marginBottom: '14px' }}>
            {categories.map(c => (
              <button key={c} onClick={() => setFilterCat(c)} style={{
                background: filterCat === c ? '#3b82f6' : 'rgba(255,255,255,0.05)',
                border: 'none', borderRadius: '20px', padding: '6px 12px',
                fontSize: '11px', fontWeight: 700, cursor: 'pointer',
                color: filterCat === c ? 'white' : '#94a3b8',
                whiteSpace: 'nowrap', fontFamily: 'inherit',
              }}>
                {c === 'all' ? '🍽️ Всі' : `${CAT_ICONS[c]} ${CAT_LABELS[c]}`}
              </button>
            ))}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {filteredItems.length === 0 && (
              <div style={{ textAlign: 'center', color: '#64748b', padding: '40px 0', fontSize: '13px' }}>Немає позицій</div>
            )}
            {filteredItems.map(item => {
              const isEditing = editItemId === item.id;
              return (
                <div key={item.id} style={{
                  background: item.hidden ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.04)',
                  border: `1px solid ${item.hidden ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.08)'}`,
                  borderRadius: '14px',
                  opacity: item.hidden ? 0.5 : 1,
                  overflow: 'hidden',
                }}>
                  <div style={{ padding: '14px 16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                          <span style={{ fontSize: '14px', fontWeight: 700 }}>{item.name}</span>
                          {item.popular && <span style={{ background: 'rgba(251,191,36,0.15)', color: '#fbbf24', fontSize: '10px', fontWeight: 700, padding: '1px 6px', borderRadius: '4px' }}>🔥 Топ</span>}
                          {item.discount > 0 && <span style={{ background: 'rgba(52,211,153,0.15)', color: '#34d399', fontSize: '10px', fontWeight: 700, padding: '1px 6px', borderRadius: '4px' }}>-{item.discount}%</span>}
                          {item.hidden && <span style={{ background: 'rgba(248,113,113,0.15)', color: '#f87171', fontSize: '10px', fontWeight: 700, padding: '1px 6px', borderRadius: '4px' }}>Прих.</span>}
                        </div>
                        <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
                          €{item.price.toFixed(2)}
                          {item.discount > 0 && <span style={{ color: '#34d399', marginLeft: '6px' }}>→ €{(item.price * (1 - item.discount / 100)).toFixed(2)}</span>}
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                        <button onClick={() => togglePopular(item)} title="Топ продаж" style={{
                          width: '34px', height: '34px', borderRadius: '10px',
                          background: item.popular ? 'rgba(251,191,36,0.2)' : 'rgba(255,255,255,0.05)',
                          border: `1px solid ${item.popular ? '#fbbf24' : 'rgba(255,255,255,0.08)'}`,
                          fontSize: '15px', cursor: 'pointer',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>🔥</button>

                        <button onClick={() => { setEditItemId(isEditing ? null : item.id); setDiscountInput(String(item.discount || '')); }} title="Знижка" style={{
                          width: '34px', height: '34px', borderRadius: '10px',
                          background: item.discount > 0 ? 'rgba(52,211,153,0.2)' : 'rgba(255,255,255,0.05)',
                          border: `1px solid ${item.discount > 0 ? '#34d399' : 'rgba(255,255,255,0.08)'}`,
                          fontSize: '15px', cursor: 'pointer',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>🏷️</button>

                        <button onClick={() => toggleHidden(item)} title="Показати/Приховати" style={{
                          width: '34px', height: '34px', borderRadius: '10px',
                          background: item.hidden ? 'rgba(248,113,113,0.2)' : 'rgba(255,255,255,0.05)',
                          border: `1px solid ${item.hidden ? '#f87171' : 'rgba(255,255,255,0.08)'}`,
                          fontSize: '15px', cursor: 'pointer',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>👁</button>
                      </div>
                    </div>

                    {isEditing && (
                      <div style={{ marginTop: '12px', padding: '12px', background: 'rgba(52,211,153,0.06)', borderRadius: '10px', border: '1px solid rgba(52,211,153,0.15)' }}>
                        <div style={{ fontSize: '12px', color: '#34d399', fontWeight: 700, marginBottom: '8px' }}>🏷️ Встановити знижку (%)</div>
                        <div style={{ display: 'flex', gap: '6px', marginBottom: '8px', flexWrap: 'wrap' }}>
                          {[10, 15, 20, 25, 30, 50].map(pct => (
                            <button key={pct} onClick={() => setDiscountInput(String(pct))} style={{
                              background: discountInput === String(pct) ? '#34d399' : 'rgba(255,255,255,0.06)',
                              color: discountInput === String(pct) ? '#0a0d17' : '#94a3b8',
                              border: 'none', borderRadius: '8px', padding: '5px 10px',
                              fontSize: '12px', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
                            }}>{pct}%</button>
                          ))}
                        </div>
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <input
                            value={discountInput}
                            onChange={e => setDiscountInput(e.target.value.replace(/\D/g, ''))}
                            placeholder="Інший %"
                            style={{
                              flex: 1, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
                              borderRadius: '8px', padding: '8px 12px', color: '#f1f5f9',
                              fontSize: '14px', fontFamily: 'inherit', outline: 'none',
                            }}
                          />
                          <button onClick={() => applyDiscount(item, Number(discountInput) || 0)} style={{
                            background: '#34d399', color: '#0a0d17', border: 'none', borderRadius: '8px',
                            padding: '8px 14px', fontWeight: 700, fontSize: '13px', cursor: 'pointer', fontFamily: 'inherit',
                          }}>✓</button>
                          {item.discount > 0 && (
                            <button onClick={() => clearDiscount(item)} style={{
                              background: 'rgba(248,113,113,0.15)', color: '#f87171', border: 'none', borderRadius: '8px',
                              padding: '8px 14px', fontWeight: 700, fontSize: '13px', cursor: 'pointer', fontFamily: 'inherit',
                            }}>✕</button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* BANNER TAB */}
      {tab === 'banner' && (
        <div style={{ padding: '16px' }}>
          {banner?.active && banner.text && (
            <div style={{ marginBottom: '16px' }}>
              <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '8px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Активний банер</div>
              <div style={{
                background: banner.color ?? 'linear-gradient(135deg, #f59e0b, #ef4444)',
                borderRadius: '14px', padding: '16px',
                display: 'flex', alignItems: 'center', gap: '12px', color: 'white',
              }}>
                <span style={{ fontSize: '28px' }}>{banner.emoji ?? '🎉'}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 800, fontSize: '14px' }}>{banner.text}</div>
                  {banner.subtext && <div style={{ fontSize: '12px', opacity: 0.8, marginTop: '2px' }}>{banner.subtext}</div>}
                </div>
                <button onClick={deactivateBanner} style={{
                  background: 'rgba(0,0,0,0.2)', border: 'none', borderRadius: '8px',
                  padding: '6px 10px', color: 'white', cursor: 'pointer', fontSize: '12px',
                  fontWeight: 700, fontFamily: 'inherit',
                }}>✕ Зняти</button>
              </div>
            </div>
          )}

          <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Швидкі пресети</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {BANNER_PRESETS.map((preset, i) => (
              <div key={i} style={{
                background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)',
                borderRadius: '14px', padding: '14px 16px',
                display: 'flex', alignItems: 'center', gap: '12px',
              }}>
                <span style={{ fontSize: '24px' }}>{preset.emoji}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '13px', fontWeight: 700 }}>{preset.text}</div>
                  <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>{preset.subtext}</div>
                </div>
                <button onClick={() => activateBanner(preset)} style={{
                  background: '#3b82f6', border: 'none', borderRadius: '10px',
                  padding: '8px 14px', color: 'white', cursor: 'pointer',
                  fontSize: '12px', fontWeight: 700, fontFamily: 'inherit',
                }}>Включити</button>
              </div>
            ))}
          </div>

          <div style={{ marginTop: '16px' }}>
            <button onClick={() => setShowCustomBanner(!showCustomBanner)} style={{
              width: '100%', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '14px', padding: '14px', color: '#94a3b8', cursor: 'pointer',
              fontSize: '13px', fontWeight: 700, fontFamily: 'inherit',
            }}>✏️ Свій банер...</button>

            {showCustomBanner && (
              <div style={{ marginTop: '10px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '14px', padding: '16px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <input
                    value={customBanner.text}
                    onChange={e => setCustomBanner(b => ({ ...b, text: e.target.value }))}
                    placeholder="Текст банера..."
                    style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '10px 12px', color: '#f1f5f9', fontSize: '14px', fontFamily: 'inherit', outline: 'none' }}
                  />
                  <input
                    value={customBanner.subtext}
                    onChange={e => setCustomBanner(b => ({ ...b, subtext: e.target.value }))}
                    placeholder="Підзаголовок (необов'язково)..."
                    style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '10px 12px', color: '#f1f5f9', fontSize: '14px', fontFamily: 'inherit', outline: 'none' }}
                  />
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input
                      value={customBanner.emoji}
                      onChange={e => setCustomBanner(b => ({ ...b, emoji: e.target.value }))}
                      placeholder="Емодзі"
                      style={{ width: '60px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '10px 12px', color: '#f1f5f9', fontSize: '20px', fontFamily: 'inherit', outline: 'none', textAlign: 'center' }}
                    />
                    <button
                      onClick={() => activateBanner(customBanner)}
                      disabled={!customBanner.text}
                      style={{ flex: 1, background: customBanner.text ? '#3b82f6' : 'rgba(255,255,255,0.05)', border: 'none', borderRadius: '8px', padding: '10px', color: customBanner.text ? 'white' : '#475569', fontWeight: 700, fontSize: '13px', cursor: customBanner.text ? 'pointer' : 'default', fontFamily: 'inherit' }}
                    >Активувати банер</button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* SETTINGS TAB */}
      {tab === 'settings' && (
        <div style={{ padding: '16px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '14px', padding: '16px' }}>
              <div style={{ fontSize: '14px', fontWeight: 700, marginBottom: '4px' }}>📊 Статус меню</div>
              <div style={{ fontSize: '12px', color: '#64748b', lineHeight: 1.6 }}>
                Позицій всього: <b style={{ color: '#e2e8f0' }}>{items.length}</b><br />
                Топ продажів: <b style={{ color: '#fbbf24' }}>{popularCount}</b><br />
                Активних акцій: <b style={{ color: '#34d399' }}>{discountCount}</b><br />
                Прихованих: <b style={{ color: '#f87171' }}>{hiddenCount}</b><br />
                Банер: <b style={{ color: banner?.active ? '#34d399' : '#94a3b8' }}>{banner?.active ? 'Активний' : 'Вимкнено'}</b>
              </div>
            </div>

            <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '14px', padding: '16px' }}>
              <div style={{ fontSize: '14px', fontWeight: 700, marginBottom: '4px' }}>🔗 Посилання на меню</div>
              <div style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '10px' }}>Надайте клієнтам посилання або роздрукуйте QR</div>
              <a href="../menu-client/" style={{ display: 'block', background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.2)', borderRadius: '8px', padding: '10px 12px', fontSize: '13px', color: '#93c5fd', fontWeight: 600, textDecoration: 'none' }}>
                → Відкрити меню
              </a>
            </div>

            <div style={{ background: 'rgba(248,113,113,0.06)', border: '1px solid rgba(248,113,113,0.15)', borderRadius: '14px', padding: '16px' }}>
              <div style={{ fontSize: '14px', fontWeight: 700, color: '#f87171', marginBottom: '4px' }}>⚠️ Скинути всі зміни</div>
              <div style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '12px' }}>Прибирає всі акції, топ-позиції та банери. Меню повернеться до базового вигляду.</div>
              <button onClick={resetAll} style={{
                background: 'rgba(248,113,113,0.15)', color: '#f87171', border: '1px solid rgba(248,113,113,0.25)',
                borderRadius: '10px', padding: '10px 18px', fontWeight: 700, fontSize: '13px',
                cursor: 'pointer', fontFamily: 'inherit',
              }}>Скинути все</button>
            </div>
          </div>
        </div>
      )}

      {/* TOAST */}
      {toast && (
        <div style={{
          position: 'fixed', bottom: '24px', left: '50%', transform: 'translateX(-50%)',
          background: '#1a2744', color: '#34d399', borderRadius: '12px',
          padding: '12px 20px', fontSize: '13px', fontWeight: 700,
          boxShadow: '0 8px 24px rgba(0,0,0,0.4)', zIndex: 300,
          border: '1px solid rgba(52,211,153,0.2)',
          animation: 'fadeIn 0.2s ease',
        }}>
          {toast}
        </div>
      )}
    </div>
  );
}
