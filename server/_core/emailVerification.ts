import type { NextApiRequest } from "next";
import { SignJWT, jwtVerify } from "jose";
import { HttpError } from "../../shared/_core/errors";
import { ENV } from "./env";

const VERIFY_TOKEN_TTL_MS = 1000 * 60 * 60 * 24;

function getVerificationSecret() {
  if (!ENV.cookieSecret) {
    throw new Error("JWT secret is not configured");
  }

  return new TextEncoder().encode(ENV.cookieSecret);
}

function firstHeaderValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export async function createEmailVerificationToken(email: string) {
  const issuedAt = Date.now();
  const expirationSeconds = Math.floor((issuedAt + VERIFY_TOKEN_TTL_MS) / 1000);

  return new SignJWT({ email, purpose: "verify-email" })
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setSubject(email)
    .setExpirationTime(expirationSeconds)
    .sign(getVerificationSecret());
}

export async function verifyEmailVerificationToken(token: string) {
  try {
    const { payload } = await jwtVerify(token, getVerificationSecret(), {
      algorithms: ["HS256"],
    });
    const email =
      typeof payload.email === "string"
        ? payload.email
        : typeof payload.sub === "string"
          ? payload.sub
          : null;

    if (!email || payload.purpose !== "verify-email") {
      throw new Error("Verification token missing email");
    }

    return email;
  } catch {
    throw new HttpError(400, "Verification link is invalid or has expired.");
  }
}

export function buildEmailVerificationUrl(req: NextApiRequest, token: string) {
  const proto = firstHeaderValue(req.headers["x-forwarded-proto"]) ?? "http";
  const host =
    firstHeaderValue(req.headers["x-forwarded-host"]) ??
    firstHeaderValue(req.headers.host);
  const pathname = `/verify-email?token=${encodeURIComponent(token)}`;

  if (!host) {
    return pathname;
  }

  return `${proto}://${host}${pathname}`;
}
