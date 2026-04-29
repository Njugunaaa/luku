import crypto from "crypto";
import type { NextRequest } from "next/server";
import * as db from "@server/db";
import { parseInput } from "@server/_core/api";
import { buildAppUrl } from "@server/_core/app-url";
import { handleRouteError, json } from "@server/_core/next-route";
import { forgotPasswordSchema } from "@server/_core/schemas";
import { getSupabaseAdminClient, getSupabaseAuthClient } from "@server/_core/supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const input = parseInput(forgotPasswordSchema, await request.json());
    const user = await db.getUserByEmail(input.email);

    if (user?.email) {
      await ensureSupabasePasswordUser(user.email, user.name ?? undefined);
    }

    const redirectTo = buildAppUrl("/reset-password", request);
    const supabase = getSupabaseAuthClient();
    const { error } = await supabase.auth.resetPasswordForEmail(input.email, {
      redirectTo,
    });

    if (error) {
      throw new Error(error.message);
    }

    return json({ success: true, delivery: "email" });
  } catch (error) {
    return handleRouteError(error);
  }
}

async function ensureSupabasePasswordUser(email: string, name?: string) {
  const adminSupabase = getSupabaseAdminClient();
  const result = await adminSupabase.auth.admin.createUser({
    email,
    password: crypto.randomUUID(),
    email_confirm: true,
    user_metadata: {
      name: name ?? "",
    },
  });

  if (
    result.error &&
    !result.error.message.toLowerCase().includes("already") &&
    !result.error.message.toLowerCase().includes("exists")
  ) {
    throw result.error;
  }

  if (result.data.user) {
    await db.syncSupabaseUserIdentity({
      openId: result.data.user.id,
      email: result.data.user.email ?? email,
      name: name ?? null,
      loginMethod: "supabase_password",
      lastSignedIn: new Date(),
    });
  }
}
