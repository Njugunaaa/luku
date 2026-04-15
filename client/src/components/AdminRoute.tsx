"use client";

import { useAuthContext } from "@/contexts/AuthContext";
import { useState } from "react";
import { ApiError, api } from "@/lib/api";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Lock, Mail, ShieldCheck, AlertTriangle } from "lucide-react";

interface AdminRouteProps {
  children: React.ReactNode;
}

/**
 * Wraps a page/component to require admin access.
 * If unauthenticated, renders an Admin login form on the same /admin URL.
 * If authenticated but not admin, shows a friendly access denied message.
 */
export function AdminRoute({ children }: AdminRouteProps) {
  const { isAuthenticated, loading, user } = useAuthContext();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loadingLogin, setLoadingLogin] = useState(false);
  const utils = api.useContext();

  const loginMutation = api.auth.login.useMutation({
    onSuccess: () => {
      utils.auth.me.invalidate();
    },
    onError: (err) => {
      if (err instanceof ApiError && err.status === 401) {
        setError("Invalid credentials. Please try again.");
      } else {
        setError("Unable to log in right now. Please try again later.");
      }
      setLoadingLogin(false);
    },
  });

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email.trim() || !password.trim()) {
      setError("Please provide both email and password.");
      return;
    }

    setLoadingLogin(true);
    try {
      await loginMutation.mutateAsync({ email, password });
    } catch {
      // error handled in onError
    } finally {
      setLoadingLogin(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]"></div>
          <p className="mt-2 text-muted-foreground">Checking session…</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 px-4 py-8">
        <Card className="w-full max-w-md shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5" />
              Admin Login
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Enter the admin credentials to access the admin panel.
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAdminLogin} className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="admin-email" className="text-sm font-medium">
                  Email
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="admin-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10"
                    disabled={loadingLogin}
                    autoComplete="username"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="admin-password" className="text-sm font-medium">
                  Password
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="admin-password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10"
                    disabled={loadingLogin}
                    autoComplete="current-password"
                  />
                </div>
              </div>

              <Button type="submit" disabled={loadingLogin} className="w-full">
                {loadingLogin ? "Signing in…" : "Sign in"}
              </Button>

              <p className="text-xs text-muted-foreground">
                If you don’t have admin access, you’ll need an account with admin role.
              </p>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isAdmin = user?.role === "admin";
  if (!isAdmin) {
    return (
      <div className="container max-w-2xl mx-auto py-12">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription className="ml-2">
            <h2 className="font-bold mb-2">Access Denied</h2>
            <p>You do not have permission to access this page. Admin access is required.</p>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return <>{children}</>;
}
