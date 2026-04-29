"use client";

import { useEffect, useState } from "react";
import { Link, useLocation } from "@/lib/navigation";
import { AlertCircle, ArrowLeft, Eye, EyeOff, Lock, ShieldCheck } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api } from "@/lib/api";
import {
  readSupabaseAuthLink,
  stripSupabaseAuthParamsFromUrl,
  type SupabaseAuthLinkPayload,
} from "@/lib/supabase-auth-link";

export default function ResetPassword() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [payload, setPayload] = useState<SupabaseAuthLinkPayload | null>(null);
  const [tokenReady, setTokenReady] = useState(false);
  const [, setLocation] = useLocation();

  useEffect(() => {
    const result = readSupabaseAuthLink();
    stripSupabaseAuthParamsFromUrl();

    if (result.errorDescription) {
      setError(result.errorDescription);
    }

    setPayload(result.payload);
    setTokenReady(true);
  }, []);

  const resetPasswordMutation = api.auth.resetPassword.useMutation({
    onSuccess: () => {
      setSuccess(true);
      setError(null);
      window.setTimeout(() => {
        setLocation("/dashboard");
      }, 1500);
    },
    onError: (err) => {
      setError(err.message || "Unable to reset password.");
    },
  });

  const handleSubmit: React.FormEventHandler = async (event) => {
    event.preventDefault();
    setError(null);

    if (!payload) {
      setError("This reset link is missing or invalid.");
      return;
    }

    if (!password.trim()) {
      setError("New password is required.");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    try {
      await resetPasswordMutation.mutateAsync({ ...payload, password });
    } catch {
      // handled in mutation callbacks
    }
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_right,rgba(120,53,15,0.1),transparent_26%),linear-gradient(180deg,#fcfaf7_0%,#f1f4f6_100%)] px-4 py-8 text-slate-900 dark:bg-[radial-gradient(circle_at_top_right,rgba(245,158,11,0.12),transparent_24%),linear-gradient(180deg,#111315_0%,#171a1f_100%)] dark:text-slate-50 sm:px-6">
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-3xl items-center justify-center">
        <section className="w-full rounded-[2rem] border border-slate-200/80 bg-white/96 p-8 shadow-[0_30px_120px_rgba(15,23,42,0.12)] dark:border-white/8 dark:bg-[#111315]/96 sm:p-10">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-[#f7efe6] p-3 text-[#8c6239] dark:bg-[#231c16] dark:text-[#e6c6a4]">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-[#8c6239] dark:text-[#ddb68c]">
                Secure reset
              </p>
              <h1 className="mt-2 text-3xl font-semibold text-slate-950 dark:text-white">
                Choose a new password
              </h1>
            </div>
          </div>

          <p className="mt-4 text-sm leading-7 text-slate-600 dark:text-slate-300">
            Set a new password for your account, then sign in again with the updated details.
          </p>

          {!tokenReady ? (
            <div className="mt-8 rounded-[1.5rem] border border-slate-200 bg-slate-50/80 p-6 dark:border-slate-800 dark:bg-slate-950/30">
              <p className="text-sm font-semibold text-slate-900 dark:text-slate-50">
                Preparing your reset link...
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                One moment while we load the reset form.
              </p>
            </div>
          ) : !payload ? (
            <div className="mt-8 rounded-[1.5rem] border border-red-200 bg-red-50/80 p-6 dark:border-red-900/60 dark:bg-red-950/20">
              <p className="text-sm font-semibold text-slate-900 dark:text-slate-50">
                This reset link is missing or invalid.
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                Request a fresh reset email and try again.
              </p>
            </div>
          ) : success ? (
            <div className="mt-8 rounded-[1.5rem] border border-[#e8d7c4] bg-[#fbf4eb] p-6 dark:border-[#3b3025] dark:bg-[#171411]">
              <p className="text-sm font-semibold text-slate-900 dark:text-slate-50">
                Password updated successfully.
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                Redirecting you to your dashboard now.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="mt-8 space-y-5">
              {error ? (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              ) : null}

              <div className="space-y-2">
                <Label htmlFor="password">New password</Label>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your new password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    autoComplete="new-password"
                    className="h-12 rounded-2xl border-slate-200 bg-white pl-11 pr-11 dark:border-white/8 dark:bg-[#16191d]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((current) => !current)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 transition-colors hover:text-slate-700 dark:hover:text-slate-200"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm new password</Label>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Repeat your new password"
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    autoComplete="new-password"
                    className="h-12 rounded-2xl border-slate-200 bg-white pl-11 pr-11 dark:border-white/8 dark:bg-[#16191d]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword((current) => !current)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 transition-colors hover:text-slate-700 dark:hover:text-slate-200"
                    aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                disabled={resetPasswordMutation.isPending}
                className="h-12 w-full rounded-2xl bg-slate-950 text-base font-semibold text-white hover:bg-slate-800 dark:bg-[#f4efe7] dark:text-slate-950 dark:hover:bg-[#ece4d9]"
              >
                {resetPasswordMutation.isPending ? "Updating password..." : "Update password"}
              </Button>
            </form>
          )}

          <Link
            href="/login"
            className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-slate-600 transition-colors hover:text-slate-950 dark:text-slate-300 dark:hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to sign in
          </Link>
        </section>
      </div>
    </div>
  );
}
