import type { NextRequest } from "next/server";
import * as db from "@server/db";
import { parseInput } from "@server/_core/api";
import { forgotPasswordSchema } from "@server/_core/schemas";
import {
  buildPasswordResetUrl,
  createPasswordResetToken,
} from "@server/_core/passwordReset";
import { handleRouteError, json } from "@server/_core/next-route";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const input = parseInput(forgotPasswordSchema, await request.json());
    const user = await db.getUserByEmail(input.email);

    if (!user?.email) {
      return json({ success: true });
    }

    const token = await createPasswordResetToken(user.email);
    return json({
      success: true,
      resetUrl: buildPasswordResetUrl(
        {
          headers: {
            host: request.headers.get("host") ?? "",
            "x-forwarded-proto": request.headers.get("x-forwarded-proto") ?? undefined,
          },
        } as any,
        token,
      ),
    });
  } catch (error) {
    return handleRouteError(error);
  }
}
