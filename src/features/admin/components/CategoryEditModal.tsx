import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/shared/lib/supabase';
import type { Category } from '@/shared/types/database';

interface Props {
  tenantId: string;
  category: Category | null;            // null → create new
  existingCategories: Category[];
  onClose: () => void;
  onSaved: () => void;
}

const ICON_PRESETS = ['🍳', '🥗', '🍔', '🍕', '🍝', '🍣', '🍜', '🌮', '🥪', '🌯', '🥙', '🍖', '🍗', '🥩', '🍤', '🐟', '🦞', '🥬', '🌱', '🍮', '🍰', '🧁', '🍪', '🍦', '☕', '🍺', '🍷', '🍹', '🥃', '🍾', '🥤', '🧃', '🧒', '🍟', '🥔', '🌶️', '🧀', '🍽️', '🥡', '🔥'];

export function CategoryEditModal({ tenantId, category, existingCategories, onClose, onSaved }: Props) {
  const { t } = useTranslation();
  const isNew = category === null;
  const [label, setLabel] = useState(category?.label ?? '');
  const [icon, setIcon] = useState(category?.icon ?? '🍽️');
  const [slug, setSlug] = useState(category?.slug ?? '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function slugify(input: string): string {
    return input
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '')
      .slice(0, 40);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!label.trim()) {
      setError(t('admin.menuManagePage.labelRequired'));
      return;
    }
    setSaving(true);
    setError(null);

    const finalSlug = (isNew ? slugify(slug || label) : slug).trim();
    if (!finalSlug) {
      setSaving(false);
      setError(t('admin.menuManagePage.slugRequired'));
      return;
    }

    if (isNew) {
      const maxSort = existingCategories.reduce((m, c) => Math.max(m, c.sort_order), 0);
      const { error: err } = await supabase.from('categories').insert({
        tenant_id: tenantId,
        slug: finalSlug,
        label: label.trim(),
        icon,
        sort_order: maxSort + 1,
        is_visible: true,
      });
      setSaving(false);
      if (err) {
        setError(err.message);
        return;
      }
    } else {
      const { error: err } = await supabase
        .from('categories')
        .update({ label: label.trim(), icon })
        .eq('id', category.id);
      setSaving(false);
      if (err) {
        setError(err.message);
        return;
      }
    }
    onSaved();
  }

  async function handleDelete() {
    if (isNew) return;
    if (!confirm(t('admin.menuManagePage.deleteConfirm', { name: category.label }))) return;
    setSaving(true);
    setError(null);
    const { error: err } = await supabase.from('categories').delete().eq('id', category.id);
    setSaving(false);
    if (err) {
      // 23503 = foreign_key_violation — категорія має страви.
      if (err.code === '23503' || err.message.includes('violates foreign key')) {
        setError(t('admin.menuManagePage.deleteBlockedNonEmpty'));
      } else {
        setError(err.message);
      }
      return;
    }
    onSaved();
  }

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end justify-center bg-black/70 p-3 sm:items-center"
      onClick={(e) => {
        if (e.target === e.currentTarget && !saving) onClose();
      }}
    >
      <form
        onSubmit={handleSave}
        className="w-full max-w-md space-y-3 rounded-2xl bg-white p-4 shadow-2xl ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-800"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900 dark:text-white">
            {isNew ? t('admin.menuManagePage.newCategory') : t('admin.menuManagePage.editCategory')}
          </h2>
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs text-slate-700 disabled:opacity-50 dark:bg-slate-800 dark:text-slate-300"
          >
            ✕
          </button>
        </div>

        {/* Live preview */}
        <div className="flex items-center justify-center gap-3 rounded-xl bg-slate-50 p-4 ring-1 ring-slate-200 dark:bg-slate-800 dark:ring-slate-700">
          <span className="text-4xl">{icon}</span>
          <span className="text-lg font-bold text-slate-900 dark:text-white">{label || '…'}</span>
        </div>

        <label className="block">
          <span className="mb-1 block text-xs text-slate-500 dark:text-slate-400">
            {t('admin.menuManagePage.labelField')}
          </span>
          <input
            type="text"
            required
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder={t('admin.menuManagePage.labelPlaceholder')}
            className="w-full rounded-lg bg-slate-100 px-3 py-2 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-brand-primary dark:bg-slate-800 dark:text-white"
          />
        </label>

        {isNew ? (
          <label className="block">
            <span className="mb-1 block text-xs text-slate-500 dark:text-slate-400">
              {t('admin.menuManagePage.slugField')}
            </span>
            <input
              type="text"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder={slugify(label) || 'category-slug'}
              className="w-full rounded-lg bg-slate-100 px-3 py-2 font-mono text-xs text-slate-900 outline-none focus:ring-2 focus:ring-brand-primary dark:bg-slate-800 dark:text-white"
            />
          </label>
        ) : null}

        <div>
          <span className="mb-1 block text-xs text-slate-500 dark:text-slate-400">
            {t('admin.menuManagePage.iconField')}
          </span>
          <div className="grid grid-cols-8 gap-1.5 rounded-lg bg-slate-50 p-2 ring-1 ring-slate-200 dark:bg-slate-800/60 dark:ring-slate-700">
            {ICON_PRESETS.map((emoji) => (
              <button
                key={emoji}
                type="button"
                onClick={() => setIcon(emoji)}
                className={`flex h-9 w-9 items-center justify-center rounded-lg text-xl transition ${
                  icon === emoji
                    ? 'bg-brand-primary ring-2 ring-brand-primary'
                    : 'hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>

        {error ? (
          <div className="rounded-lg bg-rose-100 px-3 py-2 text-xs text-rose-700 dark:bg-rose-900/40 dark:text-rose-200">
            {error}
          </div>
        ) : null}

        <div className="flex gap-2">
          {!isNew ? (
            <button
              type="button"
              onClick={handleDelete}
              disabled={saving}
              className="rounded-lg bg-rose-100 px-3 py-2.5 text-xs font-semibold text-rose-700 hover:bg-rose-200 disabled:opacity-50 dark:bg-rose-900/40 dark:text-rose-300 dark:hover:bg-rose-900/60"
            >
              🗑 {t('common.delete')}
            </button>
          ) : null}
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="flex-1 rounded-lg bg-slate-100 px-3 py-2.5 text-sm font-semibold text-slate-700 disabled:opacity-50 dark:bg-slate-800 dark:text-slate-200"
          >
            {t('common.cancel')}
          </button>
          <button
            type="submit"
            disabled={saving}
            className="flex-1 rounded-lg bg-brand-primary px-3 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
          >
            {saving ? t('common.loading') : t('common.save')}
          </button>
        </div>
      </form>
    </div>
  );
}
