"use client";

import { useActionState, useState } from "react";
import { signIn, type SignInState } from "./actions";

export function SignInForm({ next }: { next?: string }) {
  const [state, action, pending] = useActionState<SignInState, FormData>(signIn, {});
  const [show, setShow] = useState(false);

  return (
    <form action={action} className="space-y-5" noValidate>
      {state.error && (
        <div role="alert" className="rounded-lg border border-danger/40 bg-danger/10 px-3 py-2 text-sm text-danger">
          {state.error}
        </div>
      )}
      <input type="hidden" name="next" value={next ?? ""} />
      <div>
        <label htmlFor="email" className="label">
          Email address
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="username"
          spellCheck={false}
          defaultValue={state.email}
          required
          className="input"
        />
      </div>
      <div>
        <div className="flex items-baseline justify-between">
          <label htmlFor="password" className="label">
            Password
          </label>
          <button type="button" onClick={() => setShow((s) => !s)} className="text-xs text-muted hover:text-fg">
            {show ? "Hide password" : "Show password"}
          </button>
        </div>
        <input
          id="password"
          name="password"
          type={show ? "text" : "password"}
          autoComplete="current-password"
          required
          className="input"
        />
      </div>
      <button type="submit" className="btn-primary w-full" disabled={pending}>
        {pending ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
