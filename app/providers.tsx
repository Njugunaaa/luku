"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { UNAUTHED_ERR_MSG } from "@shared/const";
import ErrorBoundary from "@/components/ErrorBoundary";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import { CartProvider } from "@/contexts/CartContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { ApiError } from "@/lib/api";

function ProvidersContent({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [queryClient] = useState(() => {
    const client = new QueryClient();

    const redirectToLoginIfUnauthorized = (error: unknown) => {
      if (!(error instanceof ApiError)) return;

      const isUnauthorized = error.status === 401 || error.message === UNAUTHED_ERR_MSG;
      if (!isUnauthorized) return;

      router.push("/login");
    };

    client.getQueryCache().subscribe((event) => {
      if (event.type === "updated" && event.action.type === "error") {
        const error = event.query.state.error;
        redirectToLoginIfUnauthorized(error);
        console.error("[API Query Error]", error);
      }
    });

    client.getMutationCache().subscribe((event) => {
      if (event.type === "updated" && event.action.type === "error") {
        const error = event.mutation.state.error;
        redirectToLoginIfUnauthorized(error);
        console.error("[API Mutation Error]", error);
      }
    });

    return client;
  });

  return (
    <QueryClientProvider client={queryClient}>
      <ErrorBoundary>
        <ThemeProvider defaultTheme="dark" switchable>
          <AuthProvider>
            <CartProvider>
              <TooltipProvider>
                <Toaster richColors position="top-right" />
                {children}
              </TooltipProvider>
            </CartProvider>
          </AuthProvider>
        </ThemeProvider>
      </ErrorBoundary>
    </QueryClientProvider>
  );
}

export function AppProviders({ children }: { children: React.ReactNode }) {
  return <ProvidersContent>{children}</ProvidersContent>;
}
