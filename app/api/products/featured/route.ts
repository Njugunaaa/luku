import * as db from "@server/db";
import { handleRouteError, json } from "@server/_core/next-route";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function shuffle<T>(items: T[]) {
  const copy = [...items];

  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [copy[index], copy[swapIndex]] = [copy[swapIndex], copy[index]];
  }

  return copy;
}

function selectCatalogHighlights<
  TProduct extends { id: number; categoryId: number | null | undefined; inStock?: boolean | null },
>(products: TProduct[], limit = 8) {
  const liveProducts = products.filter((product) => product.inStock !== false);
  const source = liveProducts.length > 0 ? liveProducts : products;
  const grouped = new Map<number, TProduct[]>();

  source.forEach((product) => {
    if (product.categoryId == null) {
      return;
    }

    const items = grouped.get(product.categoryId) ?? [];
    items.push(product);
    grouped.set(product.categoryId, items);
  });

  const selected: TProduct[] = [];
  const usedIds = new Set<number>();

  shuffle([...grouped.entries()]).forEach(([, items]) => {
    if (selected.length >= limit) {
      return;
    }

    const firstPick = shuffle(items)[0];
    if (!firstPick || usedIds.has(firstPick.id)) {
      return;
    }

    selected.push(firstPick);
    usedIds.add(firstPick.id);
  });

  shuffle(source).forEach((product) => {
    if (selected.length >= limit || usedIds.has(product.id)) {
      return;
    }

    selected.push(product);
    usedIds.add(product.id);
  });

  return shuffle(selected).slice(0, limit);
}

export async function GET() {
  try {
    const [products, categories] = await Promise.all([
      db.getProducts({ limit: 100 }),
      db.getAllCategories(),
    ]);
    const visibleCategoryIds = new Set(
      categories.filter((category) => Boolean(category.slug?.trim())).map((category) => category.id),
    );
    const catalogProducts =
      visibleCategoryIds.size === 0
        ? products
        : products.filter((product) => visibleCategoryIds.has(product.categoryId));

    return json(selectCatalogHighlights(catalogProducts, 8));
  } catch (error) {
    return handleRouteError(error);
  }
}
