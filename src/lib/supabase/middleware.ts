import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { isAllowedAdmin } from "@/lib/env";

const SIGN_IN = "/tycho/sign-in";

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (toSet) => {
          toSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          toSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        },
      },
    },
  );

  // Do not put code between createServerClient and getUser: it refreshes the session.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname, search } = request.nextUrl;
  const onSignIn = pathname === SIGN_IN;
  const signedIn = !!user && isAllowedAdmin(user.email);

  const withCookies = (res: NextResponse) => {
    response.cookies.getAll().forEach((c) => res.cookies.set(c));
    return res;
  };

  if (!signedIn && !onSignIn) {
    const url = request.nextUrl.clone();
    url.pathname = SIGN_IN;
    url.search = "";
    if (pathname !== "/tycho") url.searchParams.set("next", pathname + search);
    return withCookies(NextResponse.redirect(url));
  }

  if (signedIn && onSignIn) {
    const url = request.nextUrl.clone();
    url.pathname = "/tycho";
    url.search = "";
    return withCookies(NextResponse.redirect(url));
  }

  return response;
}
