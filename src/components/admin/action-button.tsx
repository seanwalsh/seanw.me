"use client";

import { useTransition } from "react";

export function ActionButton({
  action,
  children,
  className = "btn-secondary",
}: {
  action: () => Promise<void>;
  children: React.ReactNode;
  className?: string;
}) {
  const [pending, start] = useTransition();
  return (
    <button type="button" className={className} disabled={pending} onClick={() => start(action)}>
      {children}
    </button>
  );
}
