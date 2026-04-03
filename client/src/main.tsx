import { trpc } from "@/lib/trpc";
import { UNAUTHED_ERR_MSG } from '@shared/const';
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { httpBatchLink, TRPCClientError } from "@trpc/client";
import { createRoot } from "react-dom/client";
import superjson from "superjson";
import App from "./App";
import { getLoginUrl } from "./const";
import "./index.css";

const queryClient = new QueryClient();
const API_TIMEOUT_MS = 15_000;

const redirectToLoginIfUnauthorized = (error: unknown) => {
  if (!(error instanceof TRPCClientError)) return;
  if (typeof window === "undefined") return;

  const isUnauthorized = error.message === UNAUTHED_ERR_MSG;

  if (!isUnauthorized) return;

  window.location.href = getLoginUrl();
};

queryClient.getQueryCache().subscribe(event => {
  if (event.type === "updated" && event.action.type === "error") {
    const error = event.query.state.error;
    redirectToLoginIfUnauthorized(error);
    console.error("[API Query Error]", error);
  }
});

queryClient.getMutationCache().subscribe(event => {
  if (event.type === "updated" && event.action.type === "error") {
    const error = event.mutation.state.error;
    redirectToLoginIfUnauthorized(error);
    console.error("[API Mutation Error]", error);
  }
});

const trpcClient = trpc.createClient({
  links: [
    httpBatchLink({
      url: "/api/trpc",
      transformer: superjson,
      async fetch(input, init) {
        const controller = new AbortController();
        const timeoutId = window.setTimeout(() => controller.abort(), API_TIMEOUT_MS);

        try {
          const response = await globalThis.fetch(input, {
            ...(init ?? {}),
            credentials: "include",
            signal: init?.signal ?? controller.signal,
          });

          const requestUrl = typeof input === "string" ? input : input.toString();
          const contentType = response.headers.get("content-type") ?? "";

          if (
            requestUrl.includes("/api/") &&
            response.status !== 204 &&
            !contentType.toLowerCase().includes("application/json")
          ) {
            throw new Error("The API returned an invalid response. Please refresh and try again.");
          }

          return response;
        } catch (error) {
          if (error instanceof DOMException && error.name === "AbortError") {
            throw new Error("The request took too long. Please try again.");
          }

          throw error;
        } finally {
          window.clearTimeout(timeoutId);
        }
      },
    }),
  ],
});

createRoot(document.getElementById("root")!).render(
  <trpc.Provider client={trpcClient} queryClient={queryClient}>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </trpc.Provider>
);
