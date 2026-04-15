import type { NextApiRequest } from "next";
import { SignJWT, jwtVerify } from "jose";
import { HttpError } from "../../shared/_core/errors";
import { ENV } from "./env";

const RESET_TOKEN_TTL_MS = 1000 * 60 * 30;

function getResetSecret() {
  if (!ENV.cookieSecret) {
    throw new Error("JWT secret is not configured");
  }

  return new TextEncoder().encode(ENV.cookieSecret);
}

function firstHeaderValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export async function createPasswordResetToken(email: string) {
  const issuedAt = Date.now();
  const expirationSeconds = Math.floor((issuedAt + RESET_TOKEN_TTL_MS) / 1000);

  return new SignJWT({ email })
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setSubject(email)
    .setExpirationTime(expirationSeconds)
    .sign(getResetSecret());
}

export async function verifyPasswordResetToken(token: string) {
  try {
    const { payload } = await jwtVerify(token, getResetSecret(), {
      algorithms: ["HS256"],
    });
    const email =
      typeof payload.email === "string"
        ? payload.email
        : typeof payload.sub === "string"
          ? payload.sub
          : null;

    if (!email) {
      throw new Error("Reset token missing email");
    }

    return email;
  } catch {
    throw new HttpError(400, "Reset link is invalid or has expired.");
  }
}

export function buildPasswordResetUrl(req: NextApiRequest, token: string) {
  const proto = firstHeaderValue(req.headers["x-forwarded-proto"]) ?? "http";
  const host =
    firstHeaderValue(req.headers["x-forwarded-host"]) ??
    firstHeaderValue(req.headers.host);
  const pathname = `/reset-password?token=${encodeURIComponent(token)}`;

  if (!host) {
    return pathname;
  }

  return `${proto}://${host}${pathname}`;
}

