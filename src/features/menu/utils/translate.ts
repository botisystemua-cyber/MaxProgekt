import type {
  Category,
  CategoryTranslation,
  Language,
  MenuItem,
  MenuItemTranslation,
} from '@/shared/types/database';

// Витягуємо локалізовану назву/опис; якщо переклад відсутній — падаємо
// на default_language тенанта, далі на базове поле name (з таблиці categories/menu_items).
export interface Translated {
  name: string;
  description: string | null;
}

export function translateCategory(
  category: Category,
  translations: CategoryTranslation[],
  language: Language,
  fallbackLanguage: Language,
): Translated {
  const byLang = (lang: Language) =>
    translations.find((t) => t.category_id === category.id && t.language === lang);
  const t = byLang(language) ?? byLang(fallbackLanguage);
  return {
    name: t?.name ?? category.label,
    description: t?.description ?? null,
  };
}

export function translateMenuItem(
  item: MenuItem,
  translations: MenuItemTranslation[],
  language: Language,
  fallbackLanguage: Language,
): Translated {
  const byLang = (lang: Language) =>
    translations.find((t) => t.menu_item_id === item.id && t.language === lang);
  const t = byLang(language) ?? byLang(fallbackLanguage);
  return {
    name: t?.name ?? item.name,
    description: t?.description ?? item.description,
  };
}
