import type { EmailOtpType, User as SupabaseUser } from "@supabase/supabase-js";
import { BadRequestError, NotFoundError } from "@shared/_core/errors";
import { getSupabaseAuthClient } from "./supabase";

type SupabaseAuthLinkInput = {
  accessToken?: string | null;
  tokenHash?: string | null;
  type?: string | null;
  code?: string | null;
};

const SUPABASE_EMAIL_OTP_TYPES = new Set<EmailOtpType>([
  "signup",
  "recovery",
  "invite",
  "magiclink",
  "email_change",
  "email",
]);

export async function resolveSupabaseUserFromAuthLink(
  input: SupabaseAuthLinkInput,
): Promise<SupabaseUser> {
  const supabase = getSupabaseAuthClient();
  const accessToken = input.accessToken?.trim();

  if (accessToken) {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser(accessToken);

    if (error) {
      throw new Error(error.message);
    }

    if (!user) {
      throw NotFoundError("Account not found");
    }

    return user;
  }

  const authCode = input.code?.trim();
  if (authCode) {
    const { data, error } = await supabase.auth.exchangeCodeForSession(authCode);

    if (error) {
      throw new Error(error.message);
    }

    if (!data.user) {
      throw NotFoundError("Account not found");
    }

    return data.user;
  }

  const tokenHash = input.tokenHash?.trim();
  const tokenType = input.type?.trim() as EmailOtpType | undefined;

  if (tokenHash && tokenType && SUPABASE_EMAIL_OTP_TYPES.has(tokenType)) {
    const { data, error } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type: tokenType,
    });

    if (error) {
      throw new Error(error.message);
    }

    if (!data.user) {
      throw NotFoundError("Account not found");
    }

    return data.user;
  }

  throw BadRequestError("This link is missing, invalid, or not allowed by Supabase.");
}
