import { createClient } from "@supabase/supabase-js";

let _supabaseAuthClient: ReturnType<typeof createClient> | null = null;
let _supabaseAdminClient: ReturnType<typeof createClient> | null = null;

function getSupabaseUrl() {
  const value = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ?? "";
  if (!value) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL is not configured.");
  }
  return value;
}

function getSupabasePublishableKey() {
  const value =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim() ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() ||
    "";

  if (!value) {
    throw new Error(
      "A Supabase publishable key is required. Set NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY or NEXT_PUBLIC_SUPABASE_ANON_KEY.",
    );
  }

  return value;
}

function getSupabaseServiceRoleKey() {
  const value = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() ?? "";
  if (!value) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is not configured.");
  }
  return value;
}

export function getSupabaseAuthClient() {
  if (_supabaseAuthClient) {
    return _supabaseAuthClient;
  }

  _supabaseAuthClient = createClient(getSupabaseUrl(), getSupabasePublishableKey(), {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });

  return _supabaseAuthClient;
}

export function getSupabaseAdminClient() {
  if (_supabaseAdminClient) {
    return _supabaseAdminClient;
  }

  _supabaseAdminClient = createClient(getSupabaseUrl(), getSupabaseServiceRoleKey(), {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });

  return _supabaseAdminClient;
}
