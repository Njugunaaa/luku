import type { NextRequest } from "next/server";
import * as db from "@server/db";
import {
  firstValue,
  parseInput,
  sanitizeText,
  toOptionalBoolean,
  toOptionalNumber,
} from "@server/_core/api";
import { productListSchema } from "@server/_core/schemas";
import { handleRouteError, json } from "@server/_core/next-route";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const input = parseInput(productListSchema, {
      categoryId: toOptionalNumber(searchParams.get("categoryId")),
      featured: toOptionalBoolean(searchParams.get("featured")),
      search: sanitizeText(firstValue(searchParams.get("search")) as string | undefined),
      limit: toOptionalNumber(searchParams.get("limit")),
      offset: toOptionalNumber(searchParams.get("offset")),
      inStock: toOptionalBoolean(searchParams.get("inStock")),
    });

    return json(await db.getProducts(input));
  } catch (error) {
    return handleRouteError(error);
  }
}
