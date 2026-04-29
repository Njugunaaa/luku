import type { NextRequest } from "next/server";
import * as db from "@server/db";
import { parseIdParam, parseInput } from "@server/_core/api";
import { attachGuestCookie, resolveShopperIdentity } from "@server/_core/guest-session";
import { cartUpdateSchema } from "@server/_core/schemas";
import { handleRouteError, json } from "@server/_core/next-route";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ itemId: string }> },
) {
  try {
    const shopper = await resolveShopperIdentity(request);
    const { itemId: rawItemId } = await context.params;
    const itemId = parseIdParam(rawItemId, "cart item");
    const input = parseInput(cartUpdateSchema, await request.json());

    await db.updateCartItem(
      itemId,
      shopper.kind === "user"
        ? { userId: shopper.userId }
        : { guestId: shopper.guestId },
      input.quantity,
    );

    return attachGuestCookie(request, json({ success: true }), shopper);
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ itemId: string }> },
) {
  try {
    const shopper = await resolveShopperIdentity(request);
    const { itemId: rawItemId } = await context.params;
    const itemId = parseIdParam(rawItemId, "cart item");

    await db.removeCartItem(
      itemId,
      shopper.kind === "user"
        ? { userId: shopper.userId }
        : { guestId: shopper.guestId },
    );

    return attachGuestCookie(request, json({ success: true }), shopper);
  } catch (error) {
    return handleRouteError(error);
  }
}
