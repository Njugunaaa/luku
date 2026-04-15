import crypto from "crypto";
import type { NextRequest } from "next/server";
import { UnauthorizedError } from "@shared/_core/errors";
import * as db from "@server/db";
import { authCredentialsSchema } from "@server/_core/schemas";
import { parseInput, toPublicUser } from "@server/_core/api";
import {
  getOptionalUser,
  handleRouteError,
  json,
  withSessionCookie,
} from "@server/_core/next-route";
import { sdk } from "@server/_core/sdk";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function loadBcrypt() {
  const mod = await import("bcrypt");
  return mod.default ?? mod;
}

export async function POST(request: NextRequest) {
  try {
    await getOptionalUser(request);
    const input = parseInput(authCredentialsSchema, await request.json());
    const bcrypt = await loadBcrypt();
    const adminEmail = process.env.ADMIN_EMAIL ?? "admin@alivellaboutique.com";
    const adminPassword = process.env.ADMIN_PASSWORD ?? "Password123!";
    const adminName = process.env.ADMIN_NAME ?? "Joshua";

    let user = await db.getUserByEmail(input.email);

    if (input.email === adminEmail && input.password === adminPassword) {
      if (!user) {
        const openId = crypto.randomUUID();
        const hash = await bcrypt.hash(crypto.randomUUID(), 10);
        await db.upsertUser({
          openId,
          email: input.email,
          name: adminName,
          passwordHash: hash,
          role: "admin",
        } as any);
        user = await db.getUserByEmail(input.email);
      } else if (user.role !== "admin") {
        await db.upsertUser({
          ...user,
          role: "admin",
        } as any);
        user = await db.getUserByEmail(input.email);
      }
    } else {
      if (!user || !user.passwordHash) {
        throw UnauthorizedError("Invalid credentials");
      }

      const matches = await bcrypt.compare(input.password, user.passwordHash as string);
      if (!matches) {
        throw UnauthorizedError("Invalid credentials");
      }
    }

    if (!user) {
      throw UnauthorizedError("Invalid credentials");
    }

    const token = await sdk.createSessionToken(user.id);
    return withSessionCookie(request, json(toPublicUser(user)), token);
  } catch (error) {
    return handleRouteError(error);
  }
}
