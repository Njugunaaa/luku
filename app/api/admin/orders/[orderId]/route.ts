import type { NextRequest } from "next/server";
import { BadRequestError, NotFoundError } from "@shared/_core/errors";
import * as db from "@server/db";
import { parseIdParam, parseInput } from "@server/_core/api";
import { orderUpdateSchema } from "@server/_core/schemas";
import {
  getOptionalUser,
  handleRouteError,
  json,
  requireAdmin,
} from "@server/_core/next-route";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ orderId: string }> },
) {
  try {
    requireAdmin(await getOptionalUser(request));
    const { orderId: rawOrderId } = await context.params;
    const orderId = parseIdParam(rawOrderId, "order");
    const input = parseInput(orderUpdateSchema, await request.json());

    await db.updateOrderStatus(
      orderId,
      input.status ?? "pending",
      input.paymentStatus,
      input.notes,
    );

    return json({ success: true });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ orderId: string }> },
) {
  try {
    requireAdmin(await getOptionalUser(request));
    const { orderId: rawOrderId } = await context.params;
    const orderId = parseIdParam(rawOrderId, "order");
    const order = await db.getOrderById(orderId);

    if (!order) {
      throw NotFoundError("Order not found");
    }

    if (order.status !== "pending") {
      throw BadRequestError("Only pending orders can be deleted.");
    }

    await db.deleteOrder(orderId);
    return json({ success: true });
  } catch (error) {
    return handleRouteError(error);
  }
}
