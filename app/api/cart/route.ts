import type { NextRequest } from "next/server";
import { BadRequestError, NotFoundError } from "@shared/_core/errors";
import * as db from "@server/db";
import { parseInput } from "@server/_core/api";
import { attachGuestCookie, resolveShopperIdentity } from "@server/_core/guest-session";
import { cartAddSchema } from "@server/_core/schemas";
import { handleRouteError, json } from "@server/_core/next-route";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const shopper = await resolveShopperIdentity(request);
    const items =
      shopper.kind === "user"
        ? await db.getCartItems({ userId: shopper.userId })
        : await db.getCartItems({ guestId: shopper.guestId });

    return attachGuestCookie(request, json(items), shopper);
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const shopper = await resolveShopperIdentity(request);
    const input = parseInput(cartAddSchema, await request.json());
    const product = await db.getProductById(input.productId);

    if (!product) {
      throw NotFoundError("Product not found");
    }

    if (!product.inStock) {
      throw BadRequestError("Product is out of stock");
    }

    await db.addToCart(
      shopper.kind === "user"
        ? { userId: shopper.userId, ...input }
        : { guestId: shopper.guestId, ...input },
    );

    return attachGuestCookie(request, json({ success: true }, { status: 201 }), shopper);
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const shopper = await resolveShopperIdentity(request);

    await db.clearCart(
      shopper.kind === "user"
        ? { userId: shopper.userId }
        : { guestId: shopper.guestId },
    );

    return attachGuestCookie(request, json({ success: true }), shopper);
  } catch (error) {
    return handleRouteError(error);
  }
}
