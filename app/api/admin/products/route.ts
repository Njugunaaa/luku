import type { NextRequest } from "next/server";
import * as db from "@server/db";
import { parseInput } from "@server/_core/api";
import { productUpsertSchema } from "@server/_core/schemas";
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
    return json(await db.getProducts({ limit: 200 }));
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    requireAdmin(await getOptionalUser(request));
    const input = parseInput(productUpsertSchema, await request.json());
    await db.upsertProduct(input as any);
    return json({ success: true });
  } catch (error) {
    return handleRouteError(error);
  }
}
