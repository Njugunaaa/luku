import type { NextRequest } from "next/server";
import { BadRequestError } from "@shared/_core/errors";
import * as db from "@server/db";
import { parseInput, toPublicUser } from "@server/_core/api";
import { buildAppUrl } from "@server/_core/app-url";
import { handleRouteError, json } from "@server/_core/next-route";
import { signupSchema } from "@server/_core/schemas";
import { getSupabaseAuthClient } from "@server/_core/supabase";
import { syncAppUserFromSupabaseUser } from "@server/_core/supabase-user";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const input = parseInput(signupSchema, await request.json());
    const existing = await db.getUserByEmail(input.email);

    if (existing) {
      throw BadRequestError("Email already in use");
    }

    const supabase = getSupabaseAuthClient();
    const emailRedirectTo = buildAppUrl("/verify-email", request);
    const { data, error } = await supabase.auth.signUp({
      email: input.email,
      password: input.password,
      options: {
        emailRedirectTo,
        data: {
          name: input.name ?? "",
        },
      },
    });

    if (error) {
      throw BadRequestError(error.message);
    }

    if (!data.user) {
      throw new Error("Supabase signup did not return a user.");
    }

    const appUser = await syncAppUserFromSupabaseUser(data.user);

    return json(
      {
        success: true,
        user: toPublicUser(appUser ?? null),
        delivery: "email",
      },
      { status: 201 },
    );
  } catch (error) {
    return handleRouteError(error);
  }
}
