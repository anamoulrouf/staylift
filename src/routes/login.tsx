import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Mark } from "@/components/mark";
import { Button } from "@/components/ui/button";
import { authClient, GROK_PROVIDERS, signIn } from "@/lib/auth/client";
import { useCurrentUserState } from "@/lib/auth/use-current-user";

type LoginSearch = { next?: string; mode?: "signin" | "signup" };

/** Only same-site paths, so a crafted ?next= can't bounce a fresh session elsewhere. */
function safeNext(next: string | undefined) {
  if (!next || !next.startsWith("/") || next.startsWith("//") || next.includes("\\")) return "/hotel";
  try {
    const url = new URL(next, "http://same.origin");
    return url.origin === "http://same.origin" ? `${url.pathname}${url.search}${url.hash}` : "/hotel";
  } catch {
    return "/hotel";
  }
}

export const Route = createFileRoute("/login")({
  validateSearch: (search: Record<string, unknown>): LoginSearch => ({
    next: typeof search.next === "string" ? search.next : undefined,
    mode: search.mode === "signup" ? "signup" : undefined,
  }),
  component: Login,
});

function Login() {
  const search = Route.useSearch();
  const navigate = useNavigate();
  const { user, isPending } = useCurrentUserState();
  const [mode, setMode] = useState<"signin" | "signup">(search.mode ?? "signin");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [localHost, setLocalHost] = useState(true);
  const next = safeNext(search.next);

  useEffect(() => {
    setLocalHost(["localhost", "127.0.0.1", "[::1]"].includes(window.location.hostname));
  }, []);

  // Already signed in (e.g. back button): go straight on.
  useEffect(() => {
    if (!isPending && user) void navigate({ to: next as "/hotel" });
  }, [isPending, user, next, navigate]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const result =
        mode === "signup"
          ? await authClient.signUp.email({ name: name.trim(), email: email.trim(), password })
          : await authClient.signIn.email({ email: email.trim(), password });
      if (result.error) {
        setError(
          result.error.status === 401 || result.error.code === "INVALID_EMAIL_OR_PASSWORD"
            ? "That email and password don't match."
            : (result.error.message ?? "Could not sign in."),
        );
        return;
      }
      window.location.href = next;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not sign in.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="grid min-h-dvh place-items-center bg-linen px-4 py-10">
      <div className="w-full max-w-sm">
        <Link to="/" className="inline-block">
          <Mark />
        </Link>
        <h1 className="mt-8 font-display text-3xl font-medium tracking-tight">
          {mode === "signup" ? "Create your account" : "Sign in to your hotel"}
        </h1>
        <p className="mt-2 text-sm text-stone">
          {mode === "signup"
            ? "For hotel staff. Guests never need an account."
            : "Owners, managers and front desk sign in here."}
        </p>

        <form onSubmit={(e) => void submit(e)} className="mt-6 space-y-3 rounded-xl bg-paper p-5 shadow-[var(--shadow-border)]">
          {mode === "signup" ? (
            <Field label="Your name">
              <input required minLength={2} value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" className={input} />
            </Field>
          ) : null}
          <Field label="Work email">
            <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" className={input} />
          </Field>
          <Field label="Password" hint={mode === "signup" ? "At least 8 characters." : undefined}>
            <input
              required
              type="password"
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete={mode === "signup" ? "new-password" : "current-password"}
              className={input}
            />
          </Field>
          {error ? (
            <p role="alert" className="rounded-md bg-rose-soft px-3 py-2 text-sm text-rose">
              {error}
            </p>
          ) : null}
          <Button type="submit" className="w-full" disabled={busy}>
            {busy ? "Working…" : mode === "signup" ? "Create account" : "Sign in"}
          </Button>
        </form>

        {!localHost ? (
          <div className="mt-4 space-y-2">
            {GROK_PROVIDERS.map((p) => (
              <Button
                key={p.providerId}
                variant="secondary"
                className="w-full"
                onClick={() => void signIn(p.providerId, { callbackURL: next })}
              >
                Continue with {p.label}
              </Button>
            ))}
          </div>
        ) : null}

        <p className="mt-6 text-center text-sm text-stone">
          {mode === "signup" ? "Already have an account? " : "New to Staylift? "}
          <button
            type="button"
            className="font-medium text-pine underline-offset-4 hover:underline"
            onClick={() => {
              setMode(mode === "signup" ? "signin" : "signup");
              setError(null);
            }}
          >
            {mode === "signup" ? "Sign in" : "Create an account"}
          </button>
        </p>
      </div>
    </main>
  );
}

const input =
  "mt-1 h-11 w-full rounded-md border border-line bg-cream px-3 text-sm outline-none focus:border-pine";

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="block text-sm text-stone">
      {label}
      {children}
      {hint ? <span className="mt-1 block text-xs text-mist">{hint}</span> : null}
    </label>
  );
}
