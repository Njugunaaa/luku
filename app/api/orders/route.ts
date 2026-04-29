import type { NextRequest } from "next/server";
import * as db from "@server/db";
import { parseInput } from "@server/_core/api";
import { attachGuestCookie, resolveShopperIdentity } from "@server/_core/guest-session";
import { websiteOrderSchema } from "@server/_core/schemas";
import { getOptionalUser, handleRouteError, json, requireUser } from "@server/_core/next-route";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const user = requireUser(await getOptionalUser(request));
    return json(await db.getOrdersByUserId(user.id));
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getOptionalUser(request);
    const shopper = user
      ? { kind: "user" as const, userId: user.id }
      : await resolveShopperIdentity(request);
    const input = parseInput(websiteOrderSchema, await request.json());
    const subtotal = input.items.reduce(
      (sum, item) => sum + Number.parseFloat(item.price) * item.quantity,
      0,
    );
    const deliveryFee = input.needsDelivery ? 50 : 0;
    const total = subtotal + deliveryFee;

    const order = await db.createOrder(
      {
        userId: user?.id ?? null,
        guestId: shopper.kind === "guest" ? shopper.guestId : null,
        customerName: input.customerName,
        customerEmail: input.customerEmail,
        customerPhone: input.customerPhone,
        needsDelivery: input.needsDelivery,
        deliveryAddress: input.deliveryAddress,
        deliveryCity: input.deliveryCity,
        deliveryNotes: input.deliveryNotes,
        subtotal: subtotal.toFixed(2),
        deliveryFee: deliveryFee.toFixed(2),
        total: total.toFixed(2),
        source: "website",
      },
      input.items,
    );

    await db.clearCart(
      shopper.kind === "user"
        ? { userId: shopper.userId }
        : { guestId: shopper.guestId },
    );

    return attachGuestCookie(request, json(order, { status: 201 }), shopper);
  } catch (error) {
    return handleRouteError(error);
  }
}
