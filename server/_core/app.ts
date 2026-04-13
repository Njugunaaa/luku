import express from "express";
import { apiRouter } from "../apiRouter";
import { errorMiddleware } from "./http";

function isAllowedOrigin(origin: string) {
  try {
    const url = new URL(origin);
    const host = url.hostname.toLowerCase();

    if (host === "localhost" || host === "127.0.0.1") {
      return true;
    }

    if (host.endsWith(".vercel.app")) {
      return true;
    }

    const configuredOrigins = [
      process.env.APP_URL,
      process.env.FRONTEND_URL,
      process.env.CORS_ORIGIN,
      process.env.VITE_APP_URL,
    ]
      .flatMap((value) => (value ?? "").split(","))
      .map((value) => value.trim())
      .filter(Boolean);

    return configuredOrigins.includes(origin);
  } catch {
    return false;
  }
}

export function createApp() {
  const app = express();
  app.set("trust proxy", 1);

  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  app.use((req, res, next) => {
    const origin = req.headers.origin;

    if (origin && isAllowedOrigin(origin)) {
      res.header("Access-Control-Allow-Origin", origin);
      res.header("Vary", "Origin");
      res.header("Access-Control-Allow-Credentials", "true");
      res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
      res.header("Access-Control-Allow-Methods", "GET,POST,PATCH,PUT,DELETE,OPTIONS");
    }

    if (req.method === "OPTIONS") {
      res.status(204).end();
      return;
    }

    next();
  });

  app.use("/api", apiRouter);
  app.use(errorMiddleware);

  return app;
}
