"use client";

import { useActionState } from "react";
import { unlock, type UnlockState } from "./actions";

export function UnlockForm({ slug, qr, fwd }: { slug: string; qr: boolean; fwd: string }) {
  const [state, action, pending] = useActionState<UnlockState, FormData>(unlock, {});
  return (
    <form action={action} className="mt-6 space-y-4">
      <input type="hidden" name="slug" value={slug} />
      {qr && <input type="hidden" name="qr" value="1" />}
      <input type="hidden" name="fwd" value={fwd} />
      <div>
        <label htmlFor="password" className="label">
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          autoFocus
          autoComplete="off"
          aria-invalid={!!state.error}
          aria-describedby={state.error ? "password-error" : undefined}
          className="input"
        />
        {state.error && (
          <p id="password-error" className="mt-1.5 text-sm text-danger">
            {state.error}
          </p>
        )}
      </div>
      <button type="submit" className="btn-primary w-full" disabled={pending}>
        {pending ? "Checking…" : "Continue"}
      </button>
    </form>
  );
}
