import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Mode = "signin" | "signup" | "forgot";

const GoogleMark = () => (
  <svg viewBox="0 0 24 24" className="size-4" aria-hidden>
    <path
      fill="#4285F4"
      d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5a5.6 5.6 0 0 1-2.4 3.7v3h3.9c2.3-2.1 3.5-5.2 3.5-8.9Z"
    />
    <path
      fill="#34A853"
      d="M12 24c3.2 0 5.9-1.1 7.9-2.9l-3.9-3c-1.1.7-2.4 1.1-4 1.1-3.1 0-5.7-2.1-6.6-4.9H1.4v3.1A12 12 0 0 0 12 24Z"
    />
    <path fill="#FBBC05" d="M5.4 14.3a7.2 7.2 0 0 1 0-4.6V6.6H1.4a12 12 0 0 0 0 10.8l4-3.1Z" />
    <path
      fill="#EA4335"
      d="M12 4.8c1.8 0 3.3.6 4.6 1.8l3.4-3.4A12 12 0 0 0 1.4 6.6l4 3.1C6.3 6.9 8.9 4.8 12 4.8Z"
    />
  </svg>
);

export function AuthForm({
  defaultMode = "signin",
  onSuccess,
  redirectPath,
}: {
  defaultMode?: Mode;
  onSuccess?: () => void;
  /** Same-origin path to return to after an email confirmation or OAuth round-trip. */
  redirectPath?: string;
}) {
  const [mode, setMode] = useState<Mode>(defaultMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [accountType, setAccountType] = useState<"advertiser" | "owner">("advertiser");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState<null | "confirm" | "reset">(null);

  const safePath = redirectPath && redirectPath.startsWith("/") ? redirectPath : "/";

  async function handleGoogle() {
    setBusy(true);

    try {
      if (typeof window !== "undefined") {
        sessionStorage.setItem("panorama:return-to", safePath);
      }

      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}${safePath}`,
        },
      });

      if (error) {
        toast.error("Google sign-in failed. Please try again.");
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Google sign-in failed.";
      toast.error(message);
    } finally {
      setBusy(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "forgot") {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/reset-password`,
        });
        if (error) throw error;
        setSent("reset");
        return;
      }

      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}${safePath}`,
            data: { display_name: displayName || email.split("@")[0], company_name: companyName, role: accountType },
          },
        });
        if (error) throw error;
        if (!data.session) {
          setSent("confirm");
          return;
        }
        toast.success("Welcome to BoardSpot");
        onSuccess?.();
        return;
      }

      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      toast.success("Signed in");
      onSuccess?.();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Something went wrong";
      toast.error(message);
    } finally {
      setBusy(false);
    }
  }

  if (sent) {
    return (
      <div className="rounded-xl border border-border bg-muted/60 p-5 text-sm">
        <p className="font-display text-base font-semibold">Check your inbox</p>
        <p className="mt-2 text-muted-foreground">
          {sent === "confirm"
            ? `We sent a confirmation link to ${email}. Click it to activate your account, and you'll come straight back here.`
            : `We sent a password reset link to ${email}.`}
        </p>
        <button
          type="button"
          onClick={() => {
            setSent(null);
            setMode("signin");
          }}
          className="mt-4 text-sm font-semibold text-brand hover:text-brand-dark"
        >
          Back to sign in
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Button
        type="button"
        variant="outline"
        className="h-11 w-full gap-2 border-border bg-card font-semibold"
        disabled={busy}
        onClick={handleGoogle}
      >
        <GoogleMark /> Continue with Google
      </Button>

      <div className="flex items-center gap-3 text-xs text-muted-foreground">
        <span className="h-px flex-1 bg-border" />
        or continue with email
        <span className="h-px flex-1 bg-border" />
      </div>

      <form className="space-y-3" onSubmit={handleSubmit}>
        {mode === "signup" && (
          <>
            <div className="grid grid-cols-2 gap-2">
              {(
                [
                  { value: "advertiser", label: "I'm advertising", hint: "Find & book space" },
                  { value: "owner", label: "I own billboards", hint: "List & earn" },
                ] as const
              ).map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setAccountType(option.value)}
                  className={`rounded-lg border p-3 text-left transition-colors ${
                    accountType === option.value
                      ? "border-brand bg-brand/5"
                      : "border-border bg-card hover:border-brand/40"
                  }`}
                >
                  <span className="block text-sm font-semibold">{option.label}</span>
                  <span className="mt-0.5 block text-xs text-muted-foreground">{option.hint}</span>
                </button>
              ))}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="auth-name">Full name</Label>
              <Input
                id="auth-name"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Aarav Mehta"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="auth-company">Company (optional)</Label>
              <Input
                id="auth-company"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="Northline Media"
              />
            </div>
          </>
        )}

        <div className="space-y-1.5">
          <Label htmlFor="auth-email">Work email</Label>
          <Input
            id="auth-email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@company.com"
            required
          />
        </div>

        {mode !== "forgot" && (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="auth-password">Password</Label>
              {mode === "signin" && (
                <button
                  type="button"
                  className="text-xs font-medium text-brand hover:text-brand-dark"
                  onClick={() => setMode("forgot")}
                >
                  Forgot password?
                </button>
              )}
            </div>
            <Input
              id="auth-password"
              type="password"
              autoComplete={mode === "signup" ? "new-password" : "current-password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength={8}
              placeholder="At least 8 characters"
              required
            />
          </div>
        )}

        <Button type="submit" disabled={busy} className="h-11 w-full bg-brand font-semibold hover:bg-brand-dark">
          {mode === "signup" ? "Create account" : mode === "forgot" ? "Send reset link" : "Sign in"}
        </Button>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        {mode === "signup" ? (
          <>
            Already have an account?{" "}
            <button type="button" className="font-semibold text-brand" onClick={() => setMode("signin")}>
              Sign in
            </button>
          </>
        ) : (
          <>
            New to Panorama?{" "}
            <button type="button" className="font-semibold text-brand" onClick={() => setMode("signup")}>
              Create an account
            </button>
          </>
        )}
      </p>
    </div>
  );
}
