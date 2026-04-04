import { createHTTPHandler } from "@trpc/server/adapters/standalone";
import { appRouter } from "../server/routers";
import { createContext } from "../server/_core/context";

const trpcHandler = createHTTPHandler({
  router: appRouter,
  createContext,
});

function serializeError(error: unknown) {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack,
    };
  }

  return { message: String(error) };
}

export default async function handler(req: any, res: any) {
  try {
    return await trpcHandler(req, res);
  } catch (error) {
    const detail = serializeError(error);
    console.error("[api/[...route]] trpc handler failed", detail);
    res.statusCode = 500;
    res.setHeader("content-type", "application/json");
    res.end(JSON.stringify({ error: "API request failed", stage: "trpc_handler", detail }));
  }
}
