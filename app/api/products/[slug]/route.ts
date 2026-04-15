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
      throw NotFoundError("Product not found");
    }

    const product = await db.getProductBySlug(slug);
    if (!product) {
      throw NotFoundError("Product not found");
    }

    return json(product);
  } catch (error) {
    return handleRouteError(error);
  }
}
