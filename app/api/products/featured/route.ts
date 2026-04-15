import * as db from "@server/db";
import { handleRouteError, json } from "@server/_core/next-route";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    return json(await db.getProducts({ featured: true, limit: 8 }));
  } catch (error) {
    return handleRouteError(error);
  }
}
