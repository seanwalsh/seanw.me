"use client";

import { useState, useTransition } from "react";

/** Two-step button: first click arms it, second click runs the action. No browser dialogs. */
export function ConfirmAction({
  action,
  label,
  confirmLabel,
  className = "btn-danger",
}: {
  action: () => Promise<void>;
  label: string;
  confirmLabel: string;
  className?: string;
}) {
  const [armed, setArmed] = useState(false);
  const [pending, start] = useTransition();

  if (!armed) {
    return (
      <button type="button" className={className} onClick={() => setArmed(true)}>
        {label}
      </button>
    );
  }
  return (
    <span className="inline-flex items-center gap-2">
      <button type="button" className="btn-danger" disabled={pending} onClick={() => start(action)}>
        {pending ? "Working…" : confirmLabel}
      </button>
      <button type="button" className="btn-ghost" onClick={() => setArmed(false)}>
        Cancel
      </button>
    </span>
  );
}
