import type { User as SupabaseUser } from "@supabase/supabase-js";
import * as db from "@server/db";

export async function syncAppUserFromSupabaseUser(user: SupabaseUser) {
  return db.syncSupabaseUserIdentity({
    openId: user.id,
    email: user.email ?? null,
    name: readSupabaseUserName(user),
    loginMethod: user.email_confirmed_at
      ? "supabase_password"
      : "supabase_password_pending_verification",
    lastSignedIn: new Date(),
  });
}

function readSupabaseUserName(user: SupabaseUser) {
  const meta = user.user_metadata;
  const candidate =
    (typeof meta?.name === "string" && meta.name) ||
    (typeof meta?.full_name === "string" && meta.full_name) ||
    "";

  return candidate.trim() || null;
}
