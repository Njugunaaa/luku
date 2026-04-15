import type { NextRequest } from "next/server";
import { NotFoundError } from "@shared/_core/errors";
import * as db from "@server/db";
import { parseInput } from "@server/_core/api";
import { resetPasswordSchema } from "@server/_core/schemas";
import { verifyPasswordResetToken } from "@server/_core/passwordReset";
import { handleRouteError, json } from "@server/_core/next-route";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function loadBcrypt() {
  const mod = await import("bcrypt");
  return mod.default ?? mod;
}

export async function POST(request: NextRequest) {
  try {
    const input = parseInput(resetPasswordSchema, await request.json());
    const email = await verifyPasswordResetToken(input.token);
    const user = await db.getUserByEmail(email);

    if (!user?.email) {
      throw NotFoundError("Account not found");
    }

    const bcrypt = await loadBcrypt();
    const passwordHash = await bcrypt.hash(input.password, 10);
    await db.updateUserPasswordByEmail(user.email, passwordHash);

    return json({ success: true });
  } catch (error) {
    return handleRouteError(error);
  }
}
