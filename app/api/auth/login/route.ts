import type { NextRequest } from "next/server";
import { UnauthorizedError } from "@shared/_core/errors";
import * as db from "@server/db";
import { authCredentialsSchema } from "@server/_core/schemas";
import { parseInput, toPublicUser } from "@server/_core/api";
import {
  getOptionalUser,
  handleRouteError,
  json,
  withSessionCookie,
} from "@server/_core/next-route";
import { readGuestId } from "@server/_core/guest-session";
import { sdk } from "@server/_core/sdk";
import { getSupabaseAdminClient, getSupabaseAuthClient } from "@server/_core/supabase";
import { syncAppUserFromSupabaseUser } from "@server/_core/supabase-user";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function loadBcrypt() {
  const mod = await import("bcrypt");
  return mod.default ?? mod;
}

export async function POST(request: NextRequest) {
  try {
    await getOptionalUser(request);
    const input = parseInput(authCredentialsSchema, await request.json());
    const supabase = getSupabaseAuthClient();

    let signInResult = await supabase.auth.signInWithPassword({
      email: input.email,
      password: input.password,
    });

    if (signInResult.error) {
      const migratedSignInResult = await tryMigrateLegacyPasswordUser(
        input.email,
        input.password,
        supabase,
      );

      if (migratedSignInResult) {
        signInResult = migratedSignInResult;
      }
    }

    if (signInResult.error || !signInResult.data.user) {
      throw UnauthorizedError("Invalid credentials");
    }

    const appUser = await syncAppUserFromSupabaseUser(signInResult.data.user);
    if (!appUser) {
      throw UnauthorizedError("Unable to load account");
    }

    const guestId = readGuestId(request);
    if (guestId) {
      await db.claimGuestData(guestId, appUser.id);
    }

    const token = await sdk.createSessionToken(appUser.id);
    return withSessionCookie(request, json(toPublicUser(appUser)), token);
  } catch (error) {
    return handleRouteError(error);
  }
}

async function tryMigrateLegacyPasswordUser(
  email: string,
  password: string,
  supabase: ReturnType<typeof getSupabaseAuthClient>,
) {
  const existingUser = await db.getUserByEmail(email);
  if (!existingUser?.passwordHash) {
    return null;
  }

  const bcrypt = await loadBcrypt();
  const matches = await bcrypt.compare(password, existingUser.passwordHash);
  if (!matches) {
    return null;
  }

  const adminSupabase = getSupabaseAdminClient();
  const createUserResult = await adminSupabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      name: existingUser.name ?? "",
    },
  });

  if (
    createUserResult.error &&
    !createUserResult.error.message.toLowerCase().includes("already") &&
    !createUserResult.error.message.toLowerCase().includes("exists")
  ) {
    throw createUserResult.error;
  }

  return supabase.auth.signInWithPassword({
    email,
    password,
  });
}
