import type { NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  return updateSession(request);
}

// Only the admin portal needs a session. Short-link redirects stay as fast as possible.
export const config = {
  matcher: ["/tycho", "/tycho/:path*"],
};
