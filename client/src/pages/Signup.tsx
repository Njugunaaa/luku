import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { ImageSlider } from "@/components/ui/image-slider";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { redirectStore } from "@/lib/redirectStore";
import { trpc } from "@/lib/trpc";
import { motion } from "framer-motion";
import { AlertCircle, ArrowRight, Eye, EyeOff, Lock, Mail, User } from "lucide-react";
import { useState } from "react";
import { Link, useLocation } from "wouter";

const SIGNUP_IMAGES = [
  "https://images.unsplash.com/photo-1523398002811-999ca8dec234?w=1400&q=80",
  "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=1400&q=80",
  "https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?w=1400&q=80",
  "https://images.unsplash.com/photo-1594938298603-c8148c4b4a0e?w=1400&q=80",
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.12,
      delayChildren: 0.12,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 18 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: "spring",
      stiffness: 110,
      damping: 14,
    },
  },
};

export default function Signup() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [, setLocation] = useLocation();

  const utils = trpc.useContext();

  const signupMutation = trpc.auth.signup.useMutation({
    onSuccess: () => {
      loginMutation.mutate({ email, password });
    },
    onError: (err) => {
      if (err.data?.code === "INTERNAL_SERVER_ERROR") {
        setError("Authentication is temporarily unavailable - please try again later.");
      } else if (err.data?.code === "CONFLICT") {
        setError("This email is already registered. Please sign in instead.");
      } else {
        setError(err.message || "Signup failed");
      }
      setLoading(false);
    },
  });

  const loginMutation = trpc.auth.login.useMutation({
    onSuccess: async (user) => {
      utils.auth.me.setData(undefined, user);
      await utils.auth.me.invalidate();
      const redirectUrl = redirectStore.consumeForSignedInUser("/dashboard");
      setLocation(redirectUrl);
    },
    onError: () => {
      setError("Signup succeeded, but auto-login failed. Please sign in manually.");
      setLoading(false);
    },
  });

  const validateForm = () => {
    if (!name.trim()) {
      setError("Name is required");
      return false;
    }

    if (!email.trim()) {
      setError("Email is required");
      return false;
    }

    if (!password.trim()) {
      setError("Password is required");
      return false;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters long");
      return false;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return false;
    }

    return true;
  };

  const handleSubmit: React.FormEventHandler = async (e) => {
    e.preventDefault();
    setError(null);

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      await signupMutation.mutateAsync({ email, password, name });
    } catch {
      // handled in mutation callbacks
    }
  };

  const passwordStrength = password ? Math.min(password.length / 12, 1) : 0;
  const passwordStrengthLabel =
    passwordStrength < 0.4 ? "Weak" : passwordStrength < 0.7 ? "Fair" : "Strong";
  const passwordStrengthClass =
    passwordStrength < 0.4
      ? "bg-red-500"
      : passwordStrength < 0.7
        ? "bg-red-400"
        : "bg-red-600";

  return (
    <div className="relative isolate flex min-h-screen items-center justify-center overflow-hidden bg-[radial-gradient(circle_at_top,rgba(185,28,28,0.14),transparent_28%),linear-gradient(180deg,var(--background)_0%,var(--secondary)_100%)] px-4 py-10 sm:px-6">
      <motion.div
        className="grid w-full max-w-6xl overflow-hidden rounded-[2rem] border border-border/70 bg-card shadow-[0_24px_90px_rgba(15,23,42,0.24)] lg:grid-cols-[1.05fr_0.95fr]"
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.45, ease: "easeOut" }}
      >
        <div className="relative hidden min-h-[760px] lg:block">
          <ImageSlider images={SIGNUP_IMAGES} interval={4200} />
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent px-10 pb-12 pt-24">
            <p className="text-xs font-semibold uppercase tracking-[0.34em] text-white/72">
              New account
            </p>
            <h2 className="mt-3 max-w-sm font-display text-4xl font-semibold leading-tight text-white">
              Join the next drop before it disappears.
            </h2>
            <p className="mt-4 max-w-md text-sm leading-7 text-white/72">
              Create your account to save favorites, manage orders, and move through checkout faster.
            </p>
          </div>
        </div>

        <div className="flex items-center justify-center bg-card px-6 py-10 sm:px-8 lg:px-12">
          <motion.div
            className="w-full max-w-md"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            <motion.p
              variants={itemVariants}
              className="text-xs font-semibold uppercase tracking-[0.34em] text-muted-foreground"
            >
              Create account
            </motion.p>

            <motion.h1
              variants={itemVariants}
              className="mt-3 text-3xl font-bold tracking-tight text-foreground sm:text-4xl"
            >
              Start shopping with an account built for faster checkout.
            </motion.h1>

            <motion.p
              variants={itemVariants}
              className="mt-4 text-sm leading-7 text-muted-foreground"
            >
              Save your details, track orders, and keep your favorite finds one step away.
            </motion.p>

            <motion.form variants={itemVariants} onSubmit={handleSubmit} className="mt-8 space-y-5">
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="name">Full name</Label>
                <div className="relative">
                  <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="name"
                    type="text"
                    placeholder="Your full name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="pl-10"
                    disabled={loading}
                    autoComplete="name"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10"
                    disabled={loading}
                    autoComplete="email"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Password</Label>
                  <span className="text-xs font-medium text-muted-foreground">At least 6 characters</span>
                </div>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Create a password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 pr-10"
                    disabled={loading}
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={loading}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {password && (
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-medium">
                      <span className="text-muted-foreground">Strength</span>
                      <span className="text-foreground">{passwordStrengthLabel}</span>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-secondary">
                      <div
                        className={`h-full ${passwordStrengthClass} transition-all duration-300`}
                        style={{ width: `${passwordStrength * 100}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm password</Label>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Repeat your password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="pl-10 pr-10"
                    disabled={loading}
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    disabled={loading}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
                    aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <Button type="submit" disabled={loading} className="h-11 w-full text-base font-semibold">
                {loading ? "Creating account..." : "Create account"}
              </Button>
            </motion.form>

            <motion.div
              variants={itemVariants}
              className="mt-8 flex items-center justify-between gap-3 rounded-2xl border border-border bg-secondary/40 px-4 py-3 text-sm text-muted-foreground"
            >
              <span>Already have an account?</span>
              <Link href="/login" className="inline-flex items-center gap-1 font-semibold text-foreground hover:text-red-500">
                Sign in <ArrowRight className="h-4 w-4" />
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}
