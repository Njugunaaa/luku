type SortableCategory = {
  id: number;
  slug?: string | null;
  name?: string | null;
  sortOrder?: number | null;
};

export function isVisibleCategorySlug(slug: string | null | undefined) {
  return Boolean(slug?.trim());
}

export function filterVisibleCategories<TCategory extends SortableCategory>(categories: TCategory[]) {
  return [...categories]
    .filter((category) => isVisibleCategorySlug(category.slug))
    .sort((left, right) => {
      const sortDiff = (left.sortOrder ?? 0) - (right.sortOrder ?? 0);
      if (sortDiff !== 0) return sortDiff;
      return String(left.name ?? "").localeCompare(String(right.name ?? ""));
    });
}

export function buildVisibleCategoryIdSet<
  TCategory extends { id: number; slug: string | null | undefined; sortOrder?: number | null; name?: string | null },
>(categories: TCategory[]) {
  return new Set(filterVisibleCategories(categories).map((category) => category.id));
}

export function filterProductsByVisibleCategoryIds<
  TProduct extends { categoryId: number | null | undefined },
>(products: TProduct[], visibleCategoryIds: Set<number>) {
  if (visibleCategoryIds.size === 0) return products;

  return products.filter(
    (product) => product.categoryId != null && visibleCategoryIds.has(product.categoryId),
  );
}

export function getCategoryHref(category: { slug?: string | null } | null | undefined) {
  return category?.slug ? `/category/${category.slug}` : "/";
}

export function getPrimaryCategory<TCategory extends SortableCategory>(categories: TCategory[]) {
  return filterVisibleCategories(categories)[0] ?? null;
}
