import type { NextRequest } from "next/server";
import { handleRouteError, json, withoutSessionCookie } from "@server/_core/next-route";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    return withoutSessionCookie(request, json({ success: true }));
  } catch (error) {
    return handleRouteError(error);
  }
}
