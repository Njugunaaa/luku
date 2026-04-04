import { COOKIE_NAME, ONE_YEAR_MS } from "../../shared/const";
import * as cookie from "cookie";

export type SessionCookieOptions = {
  httpOnly: true;
  path: "/";
  sameSite: "none" | "lax";
  secure: boolean;
};

const serializeCookie = (cookie as typeof cookie & {
  serialize: (name: string, value: string, options?: Record<string, unknown>) => string;
}).serialize;

type RequestLike = {
  protocol?: string;
  headers?: Record<string, string | string[] | undefined>;
};

type ResponseLike = {
  getHeader?: (name: string) => number | string | string[] | undefined;
  setHeader: (name: string, value: string | string[]) => unknown;
};

function isSecureRequest(req: RequestLike) {
  if (req.protocol === "https") return true;

  const forwardedProto = req.headers?.["x-forwarded-proto"];
  if (!forwardedProto) return false;

  const protoList = Array.isArray(forwardedProto)
    ? forwardedProto
    : forwardedProto.split(",");

  return protoList.some((proto: string) => proto.trim().toLowerCase() === "https");
}

export function getSessionCookieOptions(req: RequestLike): SessionCookieOptions {
  const secure = isSecureRequest(req);

  return {
    httpOnly: true,
    path: "/",
    sameSite: secure ? "none" : "lax",
    secure,
  };
}

function appendSetCookieHeader(res: ResponseLike, cookieValue: string) {
  const existing = res.getHeader?.("Set-Cookie");

  if (!existing) {
    res.setHeader("Set-Cookie", cookieValue);
    return;
  }

  const nextValues = Array.isArray(existing)
    ? [...existing.map(String), cookieValue]
    : [String(existing), cookieValue];

  res.setHeader("Set-Cookie", nextValues);
}

export function setSessionCookie(
  req: RequestLike,
  res: ResponseLike,
  token: string
) {
  const cookieValue = serializeCookie(COOKIE_NAME, token, {
    ...getSessionCookieOptions(req),
    maxAge: Math.floor(ONE_YEAR_MS / 1000),
  });

  appendSetCookieHeader(res, cookieValue);
}

export function clearSessionCookie(req: RequestLike, res: ResponseLike) {
  const cookieValue = serializeCookie(COOKIE_NAME, "", {
    ...getSessionCookieOptions(req),
    expires: new Date(0),
    maxAge: 0,
  });

  appendSetCookieHeader(res, cookieValue);
}
