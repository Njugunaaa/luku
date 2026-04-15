import type { NextRequest } from "next/server";
import { BadRequestError, NotFoundError } from "@shared/_core/errors";
import * as db from "@server/db";
import { parseInput } from "@server/_core/api";
import { cartAddSchema } from "@server/_core/schemas";
import { getOptionalUser, handleRouteError, json, requireUser } from "@server/_core/next-route";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const user = requireUser(await getOptionalUser(request));
    return json(await db.getCartItems(user.id));
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = requireUser(await getOptionalUser(request));
    const input = parseInput(cartAddSchema, await request.json());
    const product = await db.getProductById(input.productId);

    if (!product) {
      throw NotFoundError("Product not found");
    }

    if (!product.inStock) {
      throw BadRequestError("Product is out of stock");
    }

    await db.addToCart({ userId: user.id, ...input });
    return json({ success: true }, { status: 201 });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = requireUser(await getOptionalUser(request));
    await db.clearCart(user.id);
    return json({ success: true });
  } catch (error) {
    return handleRouteError(error);
  }
}
