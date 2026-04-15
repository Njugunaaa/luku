import crypto from "crypto";
import type { NextRequest } from "next/server";
import { BadRequestError } from "@shared/_core/errors";
import * as db from "@server/db";
import { parseInput, toPublicUser } from "@server/_core/api";
import { signupSchema } from "@server/_core/schemas";
import { sdk } from "@server/_core/sdk";
import { handleRouteError, json, withSessionCookie } from "@server/_core/next-route";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function loadBcrypt() {
  const mod = await import("bcrypt");
  return mod.default ?? mod;
}

export async function POST(request: NextRequest) {
  try {
    const input = parseInput(signupSchema, await request.json());
    const bcrypt = await loadBcrypt();
    const existing = await db.getUserByEmail(input.email);

    if (existing) {
      throw BadRequestError("Email already in use");
    }

    const hash = await bcrypt.hash(input.password, 10);
    const openId = crypto.randomUUID();
    const users = await db.getAllUsers();
    const role =
      users.length === 0 || process.env.ADMIN_EMAIL === input.email ? "admin" : "user";

    await db.upsertUser({
      openId,
      email: input.email,
      name: input.name ?? null,
      passwordHash: hash,
      role,
    } as any);

    const user = await db.getUserByEmail(input.email);
    if (!user) {
      throw BadRequestError("Signup failed");
    }

    const token = await sdk.createSessionToken(user.id);
    return withSessionCookie(request, json(toPublicUser(user), { status: 201 }), token);
  } catch (error) {
    return handleRouteError(error);
  }
}
