import "dotenv/config";
import { createServer } from "http";
import net from "net";
import { serveStatic, setupVite } from "./vite";
import { users } from "../../drizzle/schema";
import { createApp } from "./app";

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

async function startServer() {
  const app = createApp();
  const server = createServer(app);

  // sanity check: database connection and tables should be available
  try {
    const db = await import("../db");
    const connection = await db.getDb();
    if (!connection) {
      throw new Error("database not available (check DATABASE_URL)");
    }
    // simple query - users table must exist
    await connection.select().from(users).limit(1).execute();
  } catch (err: any) {
    console.error("[startup] database check failed:", err.message || err);
    console.error("Did you run the migrations (pnpm db:push) and set DATABASE_URL?");
    process.exit(1);
  }

  // development mode uses Vite, production mode uses static files
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });
}

startServer().catch(console.error);
