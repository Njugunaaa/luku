import { COOKIE_NAME } from "@shared/const";
import { parse as parseCookieHeader } from "cookie";
import { SignJWT, jwtVerify } from "jose";
import type { User } from "../../drizzle/schema";
import * as db from "../db";
import { ENV } from "./env";

// one year default expiration for session tokens
const ONE_YEAR_MS = 1000 * 60 * 60 * 24 * 365;
export type SessionPayload = {
  userId: number;
};

type RequestLike = {
  headers?: {
    cookie?: string | undefined;
  };
};

class SDKServer {
  constructor() {}



  private parseCookies(cookieHeader: string | undefined) {
    if (!cookieHeader) {
      return new Map<string, string>();
    }

    const parsed = parseCookieHeader(cookieHeader);
    return new Map(Object.entries(parsed));
  }

  private getSessionSecret() {
    const secret = ENV.cookieSecret;
    return new TextEncoder().encode(secret);
  }

  /**
   * Create a session token containing the user ID.
   */
  async createSessionToken(
    userId: number,
    options: { expiresInMs?: number } = {}
  ): Promise<string> {
    return this.signSession({ userId }, options);
  }

  async signSession(
    payload: SessionPayload,
    options: { expiresInMs?: number } = {}
  ): Promise<string> {
    const issuedAt = Date.now();
    const expiresInMs = options.expiresInMs ?? ONE_YEAR_MS;
    const expirationSeconds = Math.floor((issuedAt + expiresInMs) / 1000);
    const secretKey = this.getSessionSecret();

    return new SignJWT({ userId: payload.userId as number })
      .setProtectedHeader({ alg: "HS256", typ: "JWT" })
      .setExpirationTime(expirationSeconds)
      .sign(secretKey);
  }

  async verifySession(
    cookieValue: string | undefined | null
  ): Promise<{ userId: number } | null> {
    if (!cookieValue) {
      // no cookie stored
      return null;
    }

    try {
      const secretKey = this.getSessionSecret();
      const { payload } = await jwtVerify(cookieValue, secretKey, {
        algorithms: ["HS256"],
      });
      const { userId } = payload as Record<string, unknown>;

      if (typeof userId !== "number") {
        console.warn("[Auth] Session payload missing userId");
        return null;
      }

      return { userId };
    } catch (error) {
      console.warn("[Auth] Session verification failed", String(error));
      return null;
    }
  }


  async authenticateRequest(req: RequestLike): Promise<User> {
    const cookies = this.parseCookies(req.headers?.cookie);
    const sessionCookie = cookies.get(COOKIE_NAME);
    const session = await this.verifySession(sessionCookie);

    if (!session) {
      throw new Error("Invalid session cookie");
    }

    const user = await db.getUserById(session.userId);
    if (!user) {
      throw new Error("User not found");
    }

    return user;
  }
}

export const sdk = new SDKServer();
