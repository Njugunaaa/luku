"use client";

import { useState } from "react";
import { Link } from "@/lib/navigation";
import { AlertCircle, ArrowLeft, Mail, ShieldCheck } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api } from "@/lib/api";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const forgotPasswordMutation = api.auth.forgotPassword.useMutation({
    onSuccess: () => {
      setSubmitted(true);
      setError(null);
    },
    onError: (err) => {
      setError(err.message || "Unable to prepare password reset instructions.");
    },
  });

  const handleSubmit: React.FormEventHandler = async (event) => {
    event.preventDefault();
    setError(null);

    if (!email.trim()) {
      setError("Email is required.");
      return;
    }

    try {
      await forgotPasswordMutation.mutateAsync({ email });
    } catch {
      // handled in mutation callbacks
    }
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(37,99,235,0.16),transparent_28%),linear-gradient(180deg,#fcfeff_0%,#eef3fb_100%)] px-4 py-8 text-slate-900 dark:bg-[radial-gradient(circle_at_top_left,rgba(37,99,235,0.24),transparent_28%),linear-gradient(180deg,#030712_0%,#091120_100%)] dark:text-slate-50 sm:px-6">
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-3xl items-center justify-center">
        <section className="w-full rounded-[2rem] border border-slate-200/80 bg-white/96 p-8 shadow-[0_30px_120px_rgba(15,23,42,0.12)] dark:border-slate-800/80 dark:bg-[#07111f]/96 sm:p-10">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-blue-100 p-3 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-blue-600 dark:text-blue-300">
                Password reset
              </p>
              <h1 className="mt-2 text-3xl font-semibold text-slate-950 dark:text-white">
                Reset your password
              </h1>
            </div>
          </div>

          <p className="mt-4 text-sm leading-7 text-slate-600 dark:text-slate-300">
            Enter the email address on your account and we&apos;ll prepare a password reset link for you.
          </p>

          {submitted ? (
            <div className="mt-8 space-y-4 rounded-[1.5rem] border border-blue-100 bg-blue-50/80 p-6 dark:border-blue-900/60 dark:bg-blue-950/30">
              <p className="text-sm font-semibold text-slate-900 dark:text-slate-50">
                If an account exists for that email, reset instructions are on the way.
              </p>
              <p className="text-sm leading-6 text-slate-600 dark:text-slate-300">
                If email delivery is not configured in this environment yet, the reset link will still be prepared on the server side for setup and testing.
              </p>
              <div className="flex flex-wrap gap-3">
                <Link href="/login">
                  <Button className="rounded-2xl bg-blue-600 text-white hover:bg-blue-700">
                    Back to sign in
                  </Button>
                </Link>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setSubmitted(false);
                    setEmail("");
                  }}
                  className="rounded-2xl"
                >
                  Try another email
                </Button>
              </div>
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
                <Label htmlFor="email">Email address</Label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    autoComplete="email"
                    className="h-12 rounded-2xl border-slate-200 bg-white pl-11 dark:border-slate-800 dark:bg-slate-950"
                  />
                </div>
              </div>

              <Button
                type="submit"
                disabled={forgotPasswordMutation.isPending}
                className="h-12 w-full rounded-2xl bg-blue-600 text-base font-semibold text-white hover:bg-blue-700"
              >
                {forgotPasswordMutation.isPending ? "Preparing reset..." : "Send reset instructions"}
              </Button>
            </form>
          )}

          <Link
            href="/login"
            className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-slate-600 transition-colors hover:text-blue-600 dark:text-slate-300 dark:hover:text-blue-300"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to sign in
          </Link>
        </section>
      </div>
    </div>
  );
}
