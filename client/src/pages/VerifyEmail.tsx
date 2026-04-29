"use client";

import { useEffect, useRef, useState } from "react";
import { AlertCircle, CheckCircle2, Loader2, MailCheck, ShieldCheck } from "lucide-react";
import { Link } from "@/lib/navigation";
import { api } from "@/lib/api";
import {
  readSupabaseAuthLink,
  stripSupabaseAuthParamsFromUrl,
  type SupabaseAuthLinkPayload,
} from "@/lib/supabase-auth-link";
import { Button } from "@/components/ui/button";

type VerificationState = "pending" | "success" | "error";

export default function VerifyEmail() {
  const [status, setStatus] = useState<VerificationState>("pending");
  const [error, setError] = useState<string | null>(null);
  const [payload, setPayload] = useState<SupabaseAuthLinkPayload | null>(null);
  const [tokenReady, setTokenReady] = useState(false);
  const verificationStartedRef = useRef(false);

  const verifyEmailMutation = api.auth.verifyEmail.useMutation({
    onSuccess: () => {
      setStatus("success");
      setError(null);
    },
    onError: (err) => {
      setStatus("error");
      setError(err.message || "Unable to verify your email.");
    },
  });

  useEffect(() => {
    const result = readSupabaseAuthLink();
    stripSupabaseAuthParamsFromUrl();

    if (result.errorDescription) {
      setStatus("error");
      setError(result.errorDescription);
      setTokenReady(true);
      return;
    }

    setPayload(result.payload);
    setTokenReady(true);
  }, []);

  useEffect(() => {
    if (!tokenReady) {
      return;
    }

    if (verificationStartedRef.current) {
      return;
    }

    if (!payload) {
      verificationStartedRef.current = true;
      setStatus("error");
      setError("This verification link is missing, invalid, or not allowed in your Supabase redirect URL settings.");
      return;
    }

    verificationStartedRef.current = true;
    setStatus("pending");
    verifyEmailMutation.mutate(payload);
  }, [payload, tokenReady, verifyEmailMutation.mutate]);

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_right,rgba(185,28,28,0.12),transparent_28%),linear-gradient(180deg,#fffaf8_0%,#f5f5f4_100%)] px-4 py-8 text-slate-900 dark:bg-[radial-gradient(circle_at_top_right,rgba(185,28,28,0.16),transparent_28%),linear-gradient(180deg,#030712_0%,#111827_100%)] dark:text-slate-50 sm:px-6">
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-3xl items-center justify-center">
        <section className="w-full rounded-[2rem] border border-slate-200/80 bg-white/96 p-8 shadow-[0_30px_120px_rgba(15,23,42,0.12)] dark:border-slate-800/80 dark:bg-[#07111f]/96 sm:p-10">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-red-100 p-3 text-red-600 dark:bg-red-950/50 dark:text-red-300">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-red-500 dark:text-red-300">
                Email verification
              </p>
              <h1 className="mt-2 text-3xl font-semibold text-slate-950 dark:text-white">
                Confirming your account
              </h1>
            </div>
          </div>

          <div className="mt-8 rounded-[1.75rem] border border-slate-200/80 bg-slate-50/80 p-6 dark:border-slate-800 dark:bg-slate-950/70">
            {status === "pending" ? (
              <div className="space-y-4">
                <div className="flex items-center gap-3 text-slate-900 dark:text-slate-50">
                  <Loader2 className="h-5 w-5 animate-spin text-red-500" />
                  <p className="font-semibold">Verifying your email now...</p>
                </div>
                <p className="text-sm leading-7 text-slate-600 dark:text-slate-300">
                  Hold on for a moment while we activate your account.
                </p>
              </div>
            ) : null}

            {status === "success" ? (
              <div className="space-y-4">
                <div className="flex items-center gap-3 text-slate-900 dark:text-slate-50">
                  <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                  <p className="font-semibold">Your email has been verified.</p>
                </div>
                <p className="text-sm leading-7 text-slate-600 dark:text-slate-300">
                  Your account is now active and your session is ready to use.
                </p>
              </div>
            ) : null}

            {status === "error" ? (
              <div className="space-y-4">
                <div className="flex items-center gap-3 text-slate-900 dark:text-slate-50">
                  <AlertCircle className="h-5 w-5 text-red-500" />
                  <p className="font-semibold">We could not verify this email.</p>
                </div>
                <p className="text-sm leading-7 text-slate-600 dark:text-slate-300">
                  {error ?? "This verification link is invalid or has expired."}
                </p>
              </div>
            ) : null}
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <Link href={status === "success" ? "/dashboard" : "/login"}>
              <Button className="rounded-2xl bg-red-600 text-white hover:bg-red-700">
                <MailCheck className="h-4 w-4" />
                {status === "success" ? "Open dashboard" : "Go to sign in"}
              </Button>
            </Link>
            <Link href="/signup">
              <Button variant="outline" className="rounded-2xl">
                Back to signup
              </Button>
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
