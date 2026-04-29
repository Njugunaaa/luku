export type SupabaseEmailOtpType =
  | "signup"
  | "recovery"
  | "invite"
  | "magiclink"
  | "email_change"
  | "email";

export type SupabaseAuthLinkPayload = {
  accessToken?: string;
  tokenHash?: string;
  type?: SupabaseEmailOtpType;
  code?: string;
};

type SupabaseLinkReadResult = {
  errorDescription: string | null;
  payload: SupabaseAuthLinkPayload | null;
};

type StoredSupabaseLinkReadResult = SupabaseLinkReadResult & {
  pathname: string;
  storedAt: number;
};

const AUTH_QUERY_KEYS = [
  "access_token",
  "refresh_token",
  "expires_in",
  "expires_at",
  "token_type",
  "token_hash",
  "type",
  "code",
  "error",
  "error_code",
  "error_description",
] as const;

const AUTH_LINK_STORAGE_KEY = "supabase-auth-link:last";
const AUTH_LINK_STORAGE_TTL_MS = 10 * 60 * 1000;

function readParam(searchParams: URLSearchParams, hashParams: URLSearchParams, key: string) {
  return hashParams.get(key) ?? searchParams.get(key) ?? "";
}

function storeSupabaseAuthLink(pathname: string, result: SupabaseLinkReadResult) {
  try {
    const value: StoredSupabaseLinkReadResult = {
      ...result,
      pathname,
      storedAt: Date.now(),
    };

    sessionStorage.setItem(AUTH_LINK_STORAGE_KEY, JSON.stringify(value));
  } catch {
    // Ignore storage failures and fall back to the URL only.
  }
}

function readStoredSupabaseAuthLink(pathname: string): SupabaseLinkReadResult | null {
  try {
    const raw = sessionStorage.getItem(AUTH_LINK_STORAGE_KEY);
    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw) as Partial<StoredSupabaseLinkReadResult>;
    sessionStorage.removeItem(AUTH_LINK_STORAGE_KEY);

    if (
      parsed.pathname !== pathname ||
      typeof parsed.storedAt !== "number" ||
      Date.now() - parsed.storedAt > AUTH_LINK_STORAGE_TTL_MS
    ) {
      return null;
    }

    return {
      errorDescription:
        typeof parsed.errorDescription === "string" ? parsed.errorDescription : null,
      payload: parsed.payload && typeof parsed.payload === "object" ? parsed.payload : null,
    };
  } catch {
    try {
      sessionStorage.removeItem(AUTH_LINK_STORAGE_KEY);
    } catch {
      // Ignore cleanup failures.
    }

    return null;
  }
}

export function readSupabaseAuthLink(href: string = window.location.href): SupabaseLinkReadResult {
  const url = new URL(href);
  const searchParams = url.searchParams;
  const hashParams = new URLSearchParams(url.hash.replace(/^#/, ""));
  const errorDescription = readParam(searchParams, hashParams, "error_description") || null;
  const accessToken = readParam(searchParams, hashParams, "access_token");
  const tokenHash = readParam(searchParams, hashParams, "token_hash");
  const type = readParam(searchParams, hashParams, "type") as SupabaseEmailOtpType | "";
  const code = readParam(searchParams, hashParams, "code");

  const payload =
    (accessToken && { accessToken }) ||
    (code && { code }) ||
    (tokenHash && type && { tokenHash, type }) ||
    null;

  const result = {
    errorDescription,
    payload,
  };

  if (errorDescription || payload) {
    storeSupabaseAuthLink(url.pathname, result);
    return result;
  }

  return readStoredSupabaseAuthLink(url.pathname) ?? result;
}

export function stripSupabaseAuthParamsFromUrl() {
  const url = new URL(window.location.href);
  let changed = false;

  for (const key of AUTH_QUERY_KEYS) {
    if (url.searchParams.has(key)) {
      url.searchParams.delete(key);
      changed = true;
    }
  }

  const hashParams = new URLSearchParams(url.hash.replace(/^#/, ""));
  for (const key of AUTH_QUERY_KEYS) {
    if (hashParams.has(key)) {
      hashParams.delete(key);
      changed = true;
    }
  }

  if (!changed) {
    return;
  }

  const query = url.searchParams.toString();
  const nextUrl = `${url.pathname}${query ? `?${query}` : ""}`;
  window.history.replaceState(null, "", nextUrl);
}
