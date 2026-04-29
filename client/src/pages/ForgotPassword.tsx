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
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(120,53,15,0.1),transparent_26%),linear-gradient(180deg,#fcfaf7_0%,#f1f4f6_100%)] px-4 py-8 text-slate-900 dark:bg-[radial-gradient(circle_at_top_left,rgba(245,158,11,0.12),transparent_24%),linear-gradient(180deg,#111315_0%,#171a1f_100%)] dark:text-slate-50 sm:px-6">
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-3xl items-center justify-center">
        <section className="w-full rounded-[2rem] border border-slate-200/80 bg-white/96 p-8 shadow-[0_30px_120px_rgba(15,23,42,0.12)] dark:border-white/8 dark:bg-[#111315]/96 sm:p-10">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-[#f7efe6] p-3 text-[#8c6239] dark:bg-[#231c16] dark:text-[#e6c6a4]">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-[#8c6239] dark:text-[#ddb68c]">
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
            <div className="mt-8 space-y-4 rounded-[1.5rem] border border-[#e8d7c4] bg-[#fbf4eb] p-6 dark:border-[#3b3025] dark:bg-[#171411]">
              <p className="text-sm font-semibold text-slate-900 dark:text-slate-50">
                If an account exists for that email, reset instructions are ready.
              </p>
              <p className="text-sm leading-6 text-slate-600 dark:text-slate-300">
                Supabase will send the password reset email directly to that inbox. Open the link there to choose a new password.
              </p>
              <div className="flex flex-wrap gap-3">
                <Link href="/login">
                  <Button className="rounded-2xl bg-slate-950 text-white hover:bg-slate-800 dark:bg-[#f4efe7] dark:text-slate-950 dark:hover:bg-[#ece4d9]">
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
                    className="h-12 rounded-2xl border-slate-200 bg-white pl-11 dark:border-white/8 dark:bg-[#16191d]"
                  />
                </div>
              </div>

              <Button
                type="submit"
                disabled={forgotPasswordMutation.isPending}
                className="h-12 w-full rounded-2xl bg-slate-950 text-base font-semibold text-white hover:bg-slate-800 dark:bg-[#f4efe7] dark:text-slate-950 dark:hover:bg-[#ece4d9]"
              >
                {forgotPasswordMutation.isPending ? "Preparing reset..." : "Send reset instructions"}
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
