import type { NextRequest } from "next/server";

type RequestLike = Pick<NextRequest, "headers" | "url">;

function firstHeaderValue(value: string | null | undefined) {
  return value?.trim() || "";
}

export function getConfiguredAppUrl() {
  const configuredUrl =
    process.env.APP_URL?.trim() ||
    process.env.NEXT_PUBLIC_APP_URL?.trim() ||
    process.env.NEXT_PUBLIC_SITE_URL?.trim() ||
    process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim() ||
    "";

  if (!configuredUrl) {
    return "";
  }

  const normalizedUrl = configuredUrl.startsWith("http")
    ? configuredUrl
    : `https://${configuredUrl}`;

  return normalizedUrl.replace(/\/+$/, "");
}

export function getRequestOrigin(request?: RequestLike | null) {
  if (!request) {
    return "";
  }

  const forwardedProto = firstHeaderValue(request.headers.get("x-forwarded-proto"));
  const forwardedHost = firstHeaderValue(request.headers.get("x-forwarded-host"));
  const host = forwardedHost || firstHeaderValue(request.headers.get("host"));

  if (!host) {
    try {
      return new URL(request.url).origin;
    } catch {
      return "";
    }
  }

  return `${forwardedProto || "http"}://${host}`;
}

export function buildAppUrl(pathname: string, request?: RequestLike | null) {
  const baseUrl = getConfiguredAppUrl() || getRequestOrigin(request);
  if (!baseUrl) {
    return pathname;
  }

  const normalizedPath = pathname.startsWith("/") ? pathname : `/${pathname}`;
  return `${baseUrl}${normalizedPath}`;
}
