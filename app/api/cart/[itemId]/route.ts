import type { NextRequest } from "next/server";
import * as db from "@server/db";
import { parseIdParam, parseInput } from "@server/_core/api";
import { cartUpdateSchema } from "@server/_core/schemas";
import { getOptionalUser, handleRouteError, json, requireUser } from "@server/_core/next-route";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ itemId: string }> },
) {
  try {
    const user = requireUser(await getOptionalUser(request));
    const { itemId: rawItemId } = await context.params;
    const itemId = parseIdParam(rawItemId, "cart item");
    const input = parseInput(cartUpdateSchema, await request.json());

    await db.updateCartItem(itemId, user.id, input.quantity);
    return json({ success: true });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ itemId: string }> },
) {
  try {
    const user = requireUser(await getOptionalUser(request));
    const { itemId: rawItemId } = await context.params;
    const itemId = parseIdParam(rawItemId, "cart item");

    await db.removeCartItem(itemId, user.id);
    return json({ success: true });
  } catch (error) {
    return handleRouteError(error);
  }
}
