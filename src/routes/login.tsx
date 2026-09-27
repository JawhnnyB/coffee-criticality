import { createFileRoute, Link } from "@tanstack/react-router";
import { GROK_PROVIDERS, authEnabled, signIn } from "@/lib/auth/client";

export const Route = createFileRoute("/login")({ component: Login });

function Login() {
  return (
    <main className="grid min-h-svh place-items-center bg-bg px-5 py-10 text-fg">
      <div className="w-full max-w-sm rounded-xl border border-border bg-bg-elevated p-6 shadow-none">
        <p className="font-display text-xs uppercase tracking-[0.18em] text-muted">Master's Power Station</p>
        <h1 className="font-display mt-2 text-3xl leading-tight text-fg">Sign in</h1>
        <p className="mt-2 text-sm leading-relaxed text-muted">
          Optional. Guests can still walk Day 1. A signed-in shift keeps your name on the board.
        </p>
        <div className="mt-6 space-y-2">
          {authEnabled ? (
            GROK_PROVIDERS.map((p) => (
              <button
                key={p.providerId}
                type="button"
                onClick={() => signIn(p.providerId, { callbackURL: "/" })}
                className="w-full rounded-md border border-border-strong bg-surface px-4 py-2.5 text-sm font-medium text-fg transition-colors hover:bg-surface-hot"
              >
                Continue with {p.label}
              </button>
            ))
          ) : (
            <p className="text-sm text-subtle">Sign-in is disabled.</p>
          )}
        </div>
        <Link
          to="/"
          className="mt-5 inline-flex text-sm text-muted underline-offset-4 hover:text-fg hover:underline"
        >
          Back to the plant
        </Link>
      </div>
    </main>
  );
}
