import type { NextApiHandler, NextApiRequest, NextApiResponse } from "next";
import { ZodError, type ZodType } from "zod";
import type { User } from "../../drizzle/schema";
import { ForbiddenError, HttpError, UnauthorizedError } from "../../shared/_core/errors";
import { NOT_ADMIN_ERR_MSG, UNAUTHED_ERR_MSG } from "../../shared/const";
import { sdk } from "./sdk";

export type ApiRequest = NextApiRequest & {
  user: User | null;
};

export const LARGE_JSON_API_CONFIG = {
  api: {
    bodyParser: {
      sizeLimit: "50mb",
    },
  },
};

type ApiRouteHandler = (
  req: ApiRequest,
  res: NextApiResponse,
) => Promise<void> | void;

export function createApiHandler(handler: ApiRouteHandler): NextApiHandler {
  return async (req, res) => {
    try {
      if (req.method === "OPTIONS") {
        res.status(204).end();
        return;
      }

      const apiReq = req as ApiRequest;
      apiReq.user = await getOptionalUser(req);
      await handler(apiReq, res);
    } catch (error) {
      handleApiError(res, error);
    }
  };
}

async function getOptionalUser(req: NextApiRequest) {
  try {
    return await sdk.authenticateRequest(req);
  } catch {
    return null;
  }
}

export function parseInput<TSchema extends ZodType>(schema: TSchema, input: unknown) {
  try {
    return schema.parse(input);
  } catch (error) {
    if (error instanceof ZodError) {
      const issue = error.issues[0];
      throw new HttpError(400, issue?.message ?? "Invalid request.");
    }

    throw error;
  }
}

export function handleApiError(res: NextApiResponse, error: unknown) {
  if (res.headersSent) {
    return;
  }

  if (error instanceof HttpError) {
    res.status(error.statusCode).json({ message: error.message });
    return;
  }

  if (error instanceof Error) {
    console.error("[api] unhandled error", error);
    res.status(500).json({ message: error.message || "Internal server error" });
    return;
  }

  console.error("[api] unknown error", error);
  res.status(500).json({ message: "Internal server error" });
}

export function requireUser(req: ApiRequest) {
  if (!req.user) {
    throw UnauthorizedError(UNAUTHED_ERR_MSG);
  }

  return req.user;
}

export function requireAdmin(req: ApiRequest) {
  const user = requireUser(req);
  if (user.role !== "admin") {
    throw ForbiddenError(NOT_ADMIN_ERR_MSG);
  }

  return user;
}

export function toPublicUser(user: User | null) {
  if (!user) return null;
  const { passwordHash: _passwordHash, ...safeUser } = user;
  return safeUser;
}

export function methodNotAllowed(
  res: NextApiResponse,
  allowedMethods: ReadonlyArray<string>,
) {
  res.setHeader("Allow", allowedMethods.join(", "));
  res.status(405).json({ message: "Method not allowed" });
}

export function firstValue(value: unknown) {
  return Array.isArray(value) ? value[0] : value;
}

export function getRouteSegments(value: string | string[] | undefined) {
  if (!value) return [] as string[];
  return Array.isArray(value) ? value : [value];
}

export function toOptionalNumber(value: unknown) {
  const raw = firstValue(value);
  if (raw === undefined || raw === null || raw === "") return undefined;
  return Number(raw);
}

export function toOptionalBoolean(value: unknown) {
  const raw = firstValue(value);
  if (raw === undefined || raw === null || raw === "") return undefined;
  if (raw === true || raw === "true") return true;
  if (raw === false || raw === "false") return false;
  return raw;
}

export function sanitizeText(value: string | undefined) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

export function parseIdParam(value: unknown, label: string) {
  const parsed = Number.parseInt(String(firstValue(value) ?? ""), 10);
  if (!Number.isFinite(parsed)) {
    throw new HttpError(400, `Invalid ${label}`);
  }

  return parsed;
}

