import { createTRPCReact } from "@trpc/react-query";
// use a path alias so the client bundle doesn’t try to travel outside the Vite root
import type { AppRouter } from "@server/routers";

export const trpc = createTRPCReact<AppRouter>();
