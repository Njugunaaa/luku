import type { NextRequest } from "next/server";
import * as db from "@server/db";
import { parseIdParam } from "@server/_core/api";
import {
  getOptionalUser,
  handleRouteError,
  json,
  requireAdmin,
} from "@server/_core/next-route";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ productId: string }> },
) {
  try {
    requireAdmin(await getOptionalUser(request));
    const { productId: rawProductId } = await context.params;
    const productId = parseIdParam(rawProductId, "product");
    await db.deleteProduct(productId);
    return json({ success: true });
  } catch (error) {
    return handleRouteError(error);
  }
}
