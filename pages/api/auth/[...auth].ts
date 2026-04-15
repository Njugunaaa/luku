import crypto from "crypto";
import type { NextApiResponse } from "next";
import { BadRequestError, NotFoundError, UnauthorizedError } from "../../../shared/_core/errors";
import {
  buildPasswordResetUrl,
  createPasswordResetToken,
  verifyPasswordResetToken,
} from "../../../server/_core/passwordReset";
import {
  createApiHandler,
  getRouteSegments,
  methodNotAllowed,
  parseInput,
  toPublicUser,
} from "../../../server/_core/api";
import {
  authCredentialsSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  signupSchema,
} from "../../../server/_core/schemas";
import { clearSessionCookie, setSessionCookie } from "../../../server/_core/cookies";
import { sdk } from "../../../server/_core/sdk";
import * as db from "../../../server/db";

export const config = {
  api: {
    bodyParser: {
      sizeLimit: "50mb",
    },
  },
};

async function loadBcrypt() {
  const mod = await import("bcrypt");
  return mod.default ?? mod;
}

export default createApiHandler(async (req, res: NextApiResponse) => {
  const [action] = getRouteSegments(req.query.auth);

  if (!action) {
    res.status(404).json({ message: "Not found" });
    return;
  }

  if ((action === "me" || action === "current") && req.method === "GET") {
    res.json(toPublicUser(req.user));
    return;
  }

  if (action === "signup") {
    if (req.method !== "POST") {
      methodNotAllowed(res, ["POST"]);
      return;
    }

    const input = parseInput(signupSchema, req.body);
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
    setSessionCookie(req, res, token);
    res.status(201).json(toPublicUser(user));
    return;
  }

  if (action === "login") {
    if (req.method !== "POST") {
      methodNotAllowed(res, ["POST"]);
      return;
    }

    const input = parseInput(authCredentialsSchema, req.body);
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
    setSessionCookie(req, res, token);
    res.json(toPublicUser(user));
    return;
  }

  if (action === "logout") {
    if (req.method !== "POST") {
      methodNotAllowed(res, ["POST"]);
      return;
    }

    clearSessionCookie(req, res);
    res.json({ success: true });
    return;
  }

  if (action === "forgot-password") {
    if (req.method !== "POST") {
      methodNotAllowed(res, ["POST"]);
      return;
    }

    const input = parseInput(forgotPasswordSchema, req.body);
    const user = await db.getUserByEmail(input.email);

    if (!user?.email) {
      res.json({ success: true });
      return;
    }

    const token = await createPasswordResetToken(user.email);
    res.json({
      success: true,
      resetUrl: buildPasswordResetUrl(req, token),
    });
    return;
  }

  if (action === "reset-password") {
    if (req.method !== "POST") {
      methodNotAllowed(res, ["POST"]);
      return;
    }

    const input = parseInput(resetPasswordSchema, req.body);
    const email = await verifyPasswordResetToken(input.token);
    const user = await db.getUserByEmail(email);

    if (!user?.email) {
      throw NotFoundError("Account not found");
    }

    const bcrypt = await loadBcrypt();
    const passwordHash = await bcrypt.hash(input.password, 10);
    await db.updateUserPasswordByEmail(user.email, passwordHash);

    res.json({ success: true });
    return;
  }

  res.status(404).json({ message: "Not found" });
});
