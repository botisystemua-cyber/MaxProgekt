import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AdminShell } from '../components/AdminShell';
import { useAdminTenant } from '../hooks/useAdminTenant';
import { useAdminMenu } from '../hooks/useAdminMenu';
import { supabase } from '@/shared/lib/supabase';
import type { Language, MenuItem, MenuItemTranslation } from '@/shared/types/database';

interface TranslationField {
  name: string;
  description: string;
}

type TranslationsState = Partial<Record<Language, TranslationField>>;

function blankItem(): Partial<MenuItem> {
  return {
    name: '',
    description: '',
    price: 0,
    image_url: null,
    sort_order: 0,
    is_available: true,
    is_new: false,
    is_featured: false,
    is_popular: false,
    is_vegetarian: false,
    is_vegan: false,
    is_spicy: false,
    is_gluten_free: false,
    allergens: [],
    tags: [],
    calories: null,
    preparation_time: null,
    discount_percent: 0,
  };
}

export default function ItemEditPage() {
  const { id } = useParams<{ id: string }>();
  const isNew = !id;
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { tenant } = useAdminTenant();
  const { data, reload } = useAdminMenu(tenant?.id);

  const [form, setForm] = useState<Partial<MenuItem>>(blankItem());
  const [translations, setTranslations] = useState<TranslationsState>({});
  const [trLang, setTrLang] = useState<Language>('es');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const available = tenant?.available_languages ?? (['es'] as Language[]);
  const defaultLang = (tenant?.default_language ?? 'es') as Language;

  // Завантажуємо item + його translations коли data приходить.
  useEffect(() => {
    if (!data || isNew) return;
    const item = data.items.find((i) => i.id === id);
    if (!item) return;
    setForm(item);
    const itemTr = data.itemTranslations.filter((tr) => tr.menu_item_id === id);
    const map: TranslationsState = {};
    for (const tr of itemTr) {
      map[tr.language] = { name: tr.name, description: tr.description ?? '' };
    }
    setTranslations(map);
  }, [data, id, isNew]);

  useEffect(() => {
    // Якщо trLang не входить у available мови тенанта — повертаємось до
    // default. Перевіряти "чи є переклад" — невірно: тоді користувач не
    // може клацнути порожній таб щоб ВВЕСТИ переклад (effect скине назад).
    if (tenant && !available.includes(trLang)) {
      setTrLang(defaultLang);
    }
  }, [tenant, available, defaultLang, trLang]);

  const categories = data?.categories ?? [];

  function patch<K extends keyof MenuItem>(key: K, value: MenuItem[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function patchTr(lang: Language, key: keyof TranslationField, value: string) {
    setTranslations((tr) => ({
      ...tr,
      [lang]: { ...(tr[lang] ?? { name: '', description: '' }), [key]: value },
    }));
  }

  const currentTr = useMemo<TranslationField>(
    () => translations[trLang] ?? { name: '', description: '' },
    [translations, trLang],
  );

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!tenant) return;
    setSaving(true);
    setError(null);

    try {
      // 1. Upsert menu_items.
      // Базова name — fallback коли translations порожні. Шукаємо у послідовності:
      // default-lang → перша непуста серед filled → form.name → 'Untitled'.
      const filledEntries = Object.entries(translations).filter(
        ([, tr]) => tr?.name?.trim(),
      );
      const fallbackName =
        translations[defaultLang]?.name?.trim() ||
        filledEntries[0]?.[1]?.name?.trim() ||
        form.name?.trim() ||
        'Untitled';
      const fallbackDescription =
        translations[defaultLang]?.description?.trim() ||
        filledEntries[0]?.[1]?.description?.trim() ||
        form.description ||
        null;

      let itemId = id;
      const payload = {
        ...form,
        tenant_id: tenant.id,
        name: fallbackName,
        description: fallbackDescription,
        price: Number(form.price) || 0,
      };

      if (isNew) {
        const { data: created, error: err } = await supabase
          .from('menu_items')
          .insert(payload)
          .select('id')
          .single();
        if (err) throw err;
        itemId = (created as { id: string }).id;
      } else {
        const { error: err } = await supabase
          .from('menu_items')
          .update(payload)
          .eq('id', id!);
        if (err) throw err;
      }

      // 2. Upsert menu_item_translations (тільки заповнені)
      const filledTr: MenuItemTranslation[] = [];
      for (const [lang, tr] of Object.entries(translations)) {
        if (!tr) continue;
        if (!tr.name?.trim() && !tr.description?.trim()) continue;
        filledTr.push({
          id: '',
          menu_item_id: itemId!,
          language: lang as Language,
          name: tr.name.trim(),
          description: tr.description?.trim() || null,
        });
      }
      if (filledTr.length > 0) {
        const { error: err } = await supabase.from('menu_item_translations').upsert(
          filledTr.map(({ id: _id, ...rest }) => rest),
          { onConflict: 'menu_item_id,language' },
        );
        if (err) throw err;
      }

      await reload();
      navigate('/admin/menu');
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!id || isNew) return;
    if (!confirm('Delete this item permanently?')) return;
    setSaving(true);
    const { error: err } = await supabase.from('menu_items').delete().eq('id', id);
    setSaving(false);
    if (err) {
      setError(err.message);
      return;
    }
    await reload();
    navigate('/admin/menu');
  }

  return (
    <AdminShell>
      <form onSubmit={handleSave} className="mx-auto max-w-3xl space-y-5 p-4">
        <Link to="/admin/menu" className="text-sm text-brand-primary">
          ← {t('common.back')}
        </Link>
        <h1 className="text-xl font-bold">
          {isNew ? t('admin.newItem') : `Edit · ${form.name || ''}`}
        </h1>

        {error ? (
          <div className="rounded-xl bg-rose-900/40 p-3 text-sm text-rose-200 ring-1 ring-rose-900">
            {error}
          </div>
        ) : null}

        {/* TRANSLATIONS */}
        <fieldset className="space-y-3 rounded-2xl bg-slate-900 p-4 ring-1 ring-slate-800">
          <legend className="text-xs font-bold uppercase tracking-widest text-slate-400">
            Name & description
          </legend>

          <div className="flex flex-wrap gap-1.5">
            {available.map((lang) => {
              const filled = translations[lang]?.name?.trim();
              return (
                <button
                  key={lang}
                  type="button"
                  onClick={() => setTrLang(lang)}
                  className={`relative rounded-full px-3 py-1 text-xs font-mono font-bold uppercase ${
                    trLang === lang
                      ? 'bg-brand-primary text-white'
                      : 'bg-slate-800 text-slate-300'
                  }`}
                >
                  {lang}
                  {filled ? (
                    <span className="ml-1 text-[8px] text-emerald-400">●</span>
                  ) : null}
                </button>
              );
            })}
          </div>

          <label className="block">
            <span className="mb-1 block text-xs text-slate-400">Name [{trLang}]</span>
            <input
              type="text"
              value={currentTr.name}
              onChange={(e) => patchTr(trLang, 'name', e.target.value)}
              className="w-full rounded-lg bg-slate-800 px-3 py-2 outline-none focus:ring-2 focus:ring-brand-primary"
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-xs text-slate-400">Description [{trLang}]</span>
            <textarea
              value={currentTr.description}
              onChange={(e) => patchTr(trLang, 'description', e.target.value)}
              rows={3}
              className="w-full rounded-lg bg-slate-800 px-3 py-2 outline-none focus:ring-2 focus:ring-brand-primary"
            />
          </label>
        </fieldset>

        {/* CATEGORY + PRICE + DISCOUNT */}
        <fieldset className="grid grid-cols-2 gap-3 rounded-2xl bg-slate-900 p-4 ring-1 ring-slate-800">
          <label className="col-span-2 block">
            <span className="mb-1 block text-xs text-slate-400">Category</span>
            <select
              value={form.category_id ?? ''}
              onChange={(e) => patch('category_id', e.target.value)}
              className="w-full rounded-lg bg-slate-800 px-3 py-2 outline-none"
              required
            >
              <option value="" disabled>
                —
              </option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.icon} {c.label}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="mb-1 block text-xs text-slate-400">Price</span>
            <input
              type="number"
              step="0.01"
              min="0"
              value={form.price ?? 0}
              onChange={(e) => patch('price', Number(e.target.value))}
              className="w-full rounded-lg bg-slate-800 px-3 py-2 outline-none focus:ring-2 focus:ring-brand-primary"
              required
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-xs text-slate-400">Discount %</span>
            <input
              type="number"
              min="0"
              max="100"
              value={form.discount_percent ?? 0}
              onChange={(e) => patch('discount_percent', Number(e.target.value))}
              className="w-full rounded-lg bg-slate-800 px-3 py-2 outline-none focus:ring-2 focus:ring-brand-primary"
            />
          </label>
        </fieldset>

        {/* IMAGE URL */}
        <fieldset className="rounded-2xl bg-slate-900 p-4 ring-1 ring-slate-800">
          <label className="block">
            <span className="mb-1 block text-xs text-slate-400">Image URL</span>
            <input
              type="url"
              value={form.image_url ?? ''}
              onChange={(e) => patch('image_url', e.target.value || null)}
              placeholder="https://…"
              className="w-full rounded-lg bg-slate-800 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-primary"
            />
          </label>
          {form.image_url ? (
            <img
              src={form.image_url}
              alt=""
              className="mt-3 h-32 w-32 rounded-xl object-cover ring-1 ring-slate-800"
            />
          ) : null}
        </fieldset>

        {/* BADGES */}
        <fieldset className="grid grid-cols-2 gap-3 rounded-2xl bg-slate-900 p-4 ring-1 ring-slate-800">
          <legend className="col-span-2 text-xs font-bold uppercase tracking-widest text-slate-400">
            Flags
          </legend>
          {[
            ['is_available', '✅ Available'],
            ['is_new', '✨ New'],
            ['is_spicy', '🌶️ Spicy'],
            ['is_vegetarian', '🥗 Vegetarian'],
            ['is_vegan', '🌱 Vegan'],
            ['is_gluten_free', 'GF Gluten-free'],
          ].map(([key, label]) => (
            <label key={key} className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={Boolean(form[key as keyof MenuItem])}
                onChange={(e) => patch(key as keyof MenuItem, e.target.checked as never)}
                className="h-4 w-4 rounded accent-brand-primary"
              />
              {label}
            </label>
          ))}
        </fieldset>

        {/* META */}
        <fieldset className="grid grid-cols-2 gap-3 rounded-2xl bg-slate-900 p-4 ring-1 ring-slate-800">
          <label className="block">
            <span className="mb-1 block text-xs text-slate-400">kcal</span>
            <input
              type="number"
              min="0"
              value={form.calories ?? ''}
              onChange={(e) =>
                patch('calories', e.target.value ? Number(e.target.value) : (null as never))
              }
              className="w-full rounded-lg bg-slate-800 px-3 py-2 outline-none"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs text-slate-400">prep · min</span>
            <input
              type="number"
              min="0"
              value={form.preparation_time ?? ''}
              onChange={(e) =>
                patch(
                  'preparation_time',
                  e.target.value ? Number(e.target.value) : (null as never),
                )
              }
              className="w-full rounded-lg bg-slate-800 px-3 py-2 outline-none"
            />
          </label>
          <label className="col-span-2 block">
            <span className="mb-1 block text-xs text-slate-400">Tags (comma-separated)</span>
            <input
              type="text"
              value={(form.tags ?? []).join(', ')}
              onChange={(e) =>
                patch(
                  'tags',
                  e.target.value
                    .split(',')
                    .map((s) => s.trim())
                    .filter(Boolean) as never,
                )
              }
              placeholder="gluten, dairy, fish, meat, nuts…"
              className="w-full rounded-lg bg-slate-800 px-3 py-2 text-sm outline-none"
            />
          </label>
        </fieldset>

        {/* ACTIONS */}
        <div className="flex gap-3">
          <button
            type="submit"
            disabled={saving}
            className="flex-1 rounded-2xl bg-brand-primary py-3 font-bold text-white shadow-raised disabled:opacity-50"
          >
            {saving ? t('common.loading') : t('common.save')}
          </button>
          {!isNew ? (
            <button
              type="button"
              onClick={() => void handleDelete()}
              disabled={saving}
              className="rounded-2xl bg-rose-900/40 px-5 font-semibold text-rose-200 ring-1 ring-rose-900 disabled:opacity-50"
            >
              {t('common.delete')}
            </button>
          ) : null}
        </div>
      </form>
    </AdminShell>
  );
}
