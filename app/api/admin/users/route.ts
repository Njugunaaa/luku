import type { NextRequest } from "next/server";
import * as db from "@server/db";
import { toPublicUser } from "@server/_core/api";
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
    const users = await db.getAllUsers();
    return json(users.map((user) => toPublicUser(user)));
  } catch (error) {
    return handleRouteError(error);
  }
}
