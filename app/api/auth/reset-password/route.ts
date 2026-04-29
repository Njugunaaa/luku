import type { NextRequest } from "next/server";
import { NotFoundError } from "@shared/_core/errors";
import { parseInput, toPublicUser } from "@server/_core/api";
import { handleRouteError, json, withSessionCookie } from "@server/_core/next-route";
import { resetPasswordSchema } from "@server/_core/schemas";
import { resolveSupabaseUserFromAuthLink } from "@server/_core/supabase-auth-link";
import { sdk } from "@server/_core/sdk";
import { getSupabaseAdminClient } from "@server/_core/supabase";
import { syncAppUserFromSupabaseUser } from "@server/_core/supabase-user";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const input = parseInput(resetPasswordSchema, await request.json());
    const user = await resolveSupabaseUserFromAuthLink(input);

    const adminSupabase = getSupabaseAdminClient();
    const { data, error } = await adminSupabase.auth.admin.updateUserById(user.id, {
      password: input.password,
      email_confirm: true,
    });

    if (error) {
      throw new Error(error.message);
    }

    if (!data.user) {
      throw NotFoundError("Account not found");
    }

    const appUser = await syncAppUserFromSupabaseUser(data.user);
    if (!appUser) {
      throw NotFoundError("Account not found");
    }

    const token = await sdk.createSessionToken(appUser.id);
    return withSessionCookie(
      request,
      json({ success: true, user: toPublicUser(appUser) }),
      token,
    );
  } catch (error) {
    return handleRouteError(error);
  }
}
