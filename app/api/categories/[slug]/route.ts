import { NotFoundError } from "@shared/_core/errors";
import * as db from "@server/db";
import { handleRouteError, json } from "@server/_core/next-route";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  context: { params: Promise<{ slug: string }> },
) {
  try {
    const { slug } = await context.params;
    if (!slug?.trim()) {
      throw NotFoundError("Category not found");
    }

    const category = await db.getCategoryBySlug(slug);
    if (!category) {
      throw NotFoundError("Category not found");
    }

    return json(category);
  } catch (error) {
    return handleRouteError(error);
  }
}
