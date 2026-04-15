"use client";

import { useAuthContext } from "@/contexts/AuthContext";
import { useLocation } from "@/lib/navigation";
import { useEffect } from "react";
import { redirectStore } from "@/lib/redirectStore";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

/**
 * Wraps a page/component to require authentication.
 * If not authenticated, saves the intended URL and redirects to login.
 */
export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated, loading } = useAuthContext();
  const [location, setLocation] = useLocation();

  useEffect(() => {
    if (loading) return; // Still checking auth status

    if (!isAuthenticated) {
      // Save where they were trying to go
      redirectStore.setRedirect(location);
      // Redirect to login
      setLocation("/login");
    }
  }, [isAuthenticated, loading, location, setLocation]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]"></div>
          <p className="mt-2 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null; // Will redirect in useEffect above
  }

  return <>{children}</>;
}
