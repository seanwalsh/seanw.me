function required(name: string, value: string | undefined): string {
  if (!value) throw new Error(`Missing environment variable ${name}`);
  return value;
}

// NEXT_PUBLIC_* must be referenced literally so Next can inline them at build time.
export const SUPABASE_URL = () => required("NEXT_PUBLIC_SUPABASE_URL", process.env.NEXT_PUBLIC_SUPABASE_URL);
export const SUPABASE_ANON_KEY = () =>
  required("NEXT_PUBLIC_SUPABASE_ANON_KEY", process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
export const SUPABASE_SERVICE_ROLE_KEY = () =>
  required("SUPABASE_SERVICE_ROLE_KEY", process.env.SUPABASE_SERVICE_ROLE_KEY);

export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://seanw.me").replace(/\/$/, "");
export const SITE_HOST = new URL(SITE_URL).host;
export const APP_TIMEZONE = process.env.NEXT_PUBLIC_APP_TIMEZONE || "UTC";

/** Optional comma-separated allow-list. When set, any other signed-in account is rejected. */
export const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? "")
  .split(",")
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

export function isAllowedAdmin(email: string | undefined | null): boolean {
  if (ADMIN_EMAILS.length === 0) return true;
  return !!email && ADMIN_EMAILS.includes(email.toLowerCase());
}
