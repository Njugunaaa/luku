import * as db from "../db";
import { clearSessionCookie, setSessionCookie } from "./cookies";
import { sdk } from "./sdk";
import crypto from "crypto";

async function loadBcrypt() {
  const mod = await import("bcrypt");
  return mod.default ?? mod;
}

// basic REST endpoints for auth – primarily we use API versions but these
// are provided for any non-API clients or quick testing.
export function registerOAuthRoutes(app: {
  post: (
    path: string,
    handler: (req: any, res: any) => void | Promise<void>
  ) => unknown;
}) {
  app.post("/api/auth/signup", async (req, res) => {
    const { email, password, name } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "email and password required" });
    }
    try {
      const bcrypt = await loadBcrypt();
      const existing = await db.getUserByEmail(email);
      if (existing) return res.status(409).json({ error: "Email already in use" });
      const hash = await bcrypt.hash(password, 10);
      const openId = crypto.randomUUID();
      let role: "user" | "admin" = "user";
      const users = await db.getAllUsers();
      if (users.length === 0) role = "admin";
      if (process.env.ADMIN_EMAIL === email) role = "admin";
      await db.upsertUser({ openId, email, name: name ?? null, passwordHash: hash, role } as any);
      const user = await db.getUserByEmail(email);
      const token = await sdk.createSessionToken(user!.id);
      setSessionCookie(req, res, token);
      return res.json({ success: true, user });
    } catch (err) {
      console.error("/api/auth/signup error", err);
      res.status(500).json({ error: "signup failed" });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "email and password required" });
    }
    try {
      const bcrypt = await loadBcrypt();
      const user = await db.getUserByEmail(email);
      if (!user || !user.passwordHash) {
        return res.status(401).json({ error: "invalid credentials" });
      }
      const ok = await bcrypt.compare(password, user.passwordHash as string);
      if (!ok) {
        return res.status(401).json({ error: "invalid credentials" });
      }
      const token = await sdk.createSessionToken(user.id);
      setSessionCookie(req, res, token);
      return res.json({ success: true, user });
    } catch (err) {
      console.error("/api/auth/login error", err);
      res.status(500).json({ error: "login failed" });
    }
  });

  app.post("/api/auth/logout", (req, res) => {
    clearSessionCookie(req, res);
    res.json({ success: true });
  });
}
