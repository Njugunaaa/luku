import { json, getOptionalUser, handleRouteError } from "@server/_core/next-route";
import { toPublicUser } from "@server/_core/api";
import type { NextRequest } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const user = await getOptionalUser(request);
    return json(toPublicUser(user));
  } catch (error) {
    return handleRouteError(error);
  }
}
