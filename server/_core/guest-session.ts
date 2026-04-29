import crypto from "crypto";
import type { NextRequest, NextResponse } from "next/server";
import { GUEST_COOKIE_NAME, ONE_YEAR_MS } from "../../shared/const";
import { getSessionCookieOptions } from "./cookies";
import { getOptionalUser } from "./next-route";

export type ShopperIdentity =
  | { kind: "user"; userId: number }
  | { kind: "guest"; guestId: string };

function generateGuestId() {
  return `guest_${crypto.randomUUID().replace(/-/g, "")}`;
}

export function readGuestId(request: NextRequest) {
  const guestId = request.cookies.get(GUEST_COOKIE_NAME)?.value?.trim();
  if (!guestId) return null;
  return /^[a-zA-Z0-9_-]{12,}$/.test(guestId) ? guestId : null;
}

export async function resolveShopperIdentity(request: NextRequest): Promise<ShopperIdentity> {
  const user = await getOptionalUser(request);
  if (user) {
    return { kind: "user", userId: user.id };
  }

  const guestId = readGuestId(request) ?? generateGuestId();
  return { kind: "guest", guestId };
}

export function attachGuestCookie(
  request: NextRequest,
  response: NextResponse,
  shopper: ShopperIdentity,
) {
  if (shopper.kind !== "guest") {
    return response;
  }

  const options = getSessionCookieOptions({
    protocol: new URL(request.url).protocol.replace(":", ""),
    headers: {
      "x-forwarded-proto": request.headers.get("x-forwarded-proto") ?? undefined,
    },
  });

  response.cookies.set(GUEST_COOKIE_NAME, shopper.guestId, {
    httpOnly: true,
    path: options.path,
    sameSite: options.sameSite,
    secure: options.secure,
    maxAge: Math.floor(ONE_YEAR_MS / 1000),
  });

  return response;
}
