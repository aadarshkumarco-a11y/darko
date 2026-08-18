"use client";

import { useState, Suspense } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Logo } from "@/components/shared/Logo";
import { Button } from "@/components/shared/Button";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/dashboard";
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState<"google" | "guest" | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleGuest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (displayName.trim().length < 2) {
      setError("Display name must be at least 2 characters");
      return;
    }
    setLoading("guest");
    setError(null);

    const res = await signIn("guest", {
      displayName: displayName.trim(),
      redirect: false,
      callbackUrl,
    });

    if (res?.error) {
      setError("Could not sign in as guest. Please try again.");
      setLoading(null);
    } else if (res?.ok) {
      router.push(callbackUrl);
      router.refresh();
    }
  };

  const handleGoogle = async () => {
    setLoading("google");
    await signIn("google", { callbackUrl });
  };

  return (
    <div className="w-full max-w-sm">
      <div className="text-center mb-8">
        <h1 className="font-display text-3xl font-bold text-white mb-2">
          Welcome to <span className="text-gradient-accent">DARKO</span>
        </h1>
        <p className="text-sm text-secondary">
          Sign in to create rooms, save preferences, and own your hangouts.
        </p>
      </div>

      <div className="surface-card p-6 space-y-5">
        {/* Google */}
        <Button
          variant="outline"
          size="lg"
          className="w-full"
          onClick={handleGoogle}
          isLoading={loading === "google"}
          leftIcon={!loading ? <GoogleIcon /> : undefined}
        >
          Continue with Google
        </Button>

        {/* Divider */}
        <div className="relative py-2">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full divider-gradient" />
          </div>
          <div className="relative flex justify-center">
            <span className="bg-elevated px-3 text-xs text-muted uppercase tracking-widest">
              or be anonymous
            </span>
          </div>
        </div>

        {/* Guest */}
        <form onSubmit={handleGuest} className="space-y-3">
          <div>
            <label htmlFor="displayName" className="block text-xs font-medium text-secondary mb-1.5">
              Display name
            </label>
            <input
              id="displayName"
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              maxLength={24}
              placeholder="e.g. midnight_coder"
              className="w-full h-10 px-3 rounded-md bg-input border border-border-subtle text-sm text-white placeholder:text-muted focus:outline-none focus:border-primary transition-colors"
              autoComplete="off"
            />
          </div>
          <Button
            type="submit"
            variant="primary"
            size="lg"
            className="w-full"
            isLoading={loading === "guest"}
            rightIcon={!loading ? <ArrowRight className="h-4 w-4" /> : undefined}
          >
            Continue as guest
          </Button>
        </form>

        {error && (
          <motion.p
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-xs text-red-400 text-center"
          >
            {error}
          </motion.p>
        )}
      </div>

      <p className="mt-6 text-center text-xs text-muted leading-relaxed">
        Guests can create and join rooms, but can&apos;t save preferences or own persistent rooms across devices.
        <br />
        <button
          onClick={() => router.push("/")}
          className="mt-2 text-secondary hover:text-white transition-colors underline-offset-2 hover:underline"
        >
          ← Back to home
        </button>
      </p>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-16 relative">
      {/* Ambient glow */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div
          className="ambient-glow"
          style={{
            top: "10%",
            left: "20%",
            width: "500px",
            height: "500px",
            background: "rgba(99, 102, 241, 0.2)",
          }}
        />
      </div>

      <div className="relative mb-10">
        <Logo size="lg" href={null} />
      </div>

      <Suspense fallback={<div className="text-muted">Loading...</div>}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
