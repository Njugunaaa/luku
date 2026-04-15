import type { NextRequest } from "next/server";
import * as db from "@server/db";
import {
  parseInput,
  sanitizeText,
  toOptionalNumber,
} from "@server/_core/api";
import { adminOrdersQuerySchema } from "@server/_core/schemas";
import {
  getOptionalUser,
  handleRouteError,
  json,
  requireAdmin,
} from "@server/_core/next-route";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    requireAdmin(await getOptionalUser(request));
    const { searchParams } = new URL(request.url);
    const input = parseInput(adminOrdersQuerySchema, {
      status: sanitizeText(searchParams.get("status") ?? undefined),
      limit: toOptionalNumber(searchParams.get("limit")),
      offset: toOptionalNumber(searchParams.get("offset")),
    });

    const orders = await db.getAllOrders(input);
    const result: Array<NonNullable<Awaited<ReturnType<typeof db.getOrderWithItems>>>> = [];

    for (const order of orders) {
      const full = await db.getOrderWithItems(order.id);
      if (full) result.push(full);
    }

    return json(result);
  } catch (error) {
    return handleRouteError(error);
  }
}
