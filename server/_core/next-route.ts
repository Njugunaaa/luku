import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import type { User } from "../../drizzle/schema";
import { HttpError, UnauthorizedError, ForbiddenError } from "../../shared/_core/errors";
import { COOKIE_NAME, NOT_ADMIN_ERR_MSG, UNAUTHED_ERR_MSG } from "../../shared/const";
import { getSessionCookieOptions } from "./cookies";
import { sdk } from "./sdk";

export async function getOptionalUser(request: NextRequest) {
  try {
    const cookies = Object.fromEntries(
      request.cookies.getAll().map((entry) => [entry.name, entry.value]),
    );

    return await sdk.authenticateRequest({
      headers: {
        cookie: request.headers.get("cookie") ?? undefined,
      },
      cookies,
    });
  } catch {
    return null;
  }
}

export function requireUser(user: User | null) {
  if (!user) {
    throw UnauthorizedError(UNAUTHED_ERR_MSG);
  }

  return user;
}

export function requireAdmin(user: User | null) {
  const currentUser = requireUser(user);

  if (currentUser.role !== "admin") {
    throw ForbiddenError(NOT_ADMIN_ERR_MSG);
  }

  return currentUser;
}

export function json(data: unknown, init?: ResponseInit) {
  return NextResponse.json(data, init);
}

export function withSessionCookie(request: NextRequest, response: NextResponse, token: string) {
  const options = getSessionCookieOptions({
    protocol: new URL(request.url).protocol.replace(":", ""),
    headers: {
      "x-forwarded-proto": request.headers.get("x-forwarded-proto") ?? undefined,
    },
  });

  response.cookies.set(COOKIE_NAME, token, {
    httpOnly: options.httpOnly,
    path: options.path,
    sameSite: options.sameSite,
    secure: options.secure,
    maxAge: 60 * 60 * 24 * 365,
  });

  return response;
}

export function withoutSessionCookie(request: NextRequest, response: NextResponse) {
  const options = getSessionCookieOptions({
    protocol: new URL(request.url).protocol.replace(":", ""),
    headers: {
      "x-forwarded-proto": request.headers.get("x-forwarded-proto") ?? undefined,
    },
  });

  response.cookies.set(COOKIE_NAME, "", {
    httpOnly: options.httpOnly,
    path: options.path,
    sameSite: options.sameSite,
    secure: options.secure,
    expires: new Date(0),
    maxAge: 0,
  });

  return response;
}

export function handleRouteError(error: unknown) {
  if (error instanceof HttpError) {
    return NextResponse.json({ message: error.message }, { status: error.statusCode });
  }

  if (error instanceof Error) {
    console.error("[api] unhandled error", error);
    return NextResponse.json(
      { message: error.message || "Internal server error" },
      { status: 500 },
    );
  }

  console.error("[api] unknown error", error);
  return NextResponse.json({ message: "Internal server error" }, { status: 500 });
}
