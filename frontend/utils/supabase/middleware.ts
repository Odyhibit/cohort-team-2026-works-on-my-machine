import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

export function enforceAuthentication(request: NextRequest, authenticated: boolean, sessionResponse: NextResponse) {
  const path = request.nextUrl.pathname;
  if (authenticated || path === "/login" || path === "/reset-password") return sessionResponse;

  let response: NextResponse;
  if (path === "/api" || path.startsWith("/api/")) {
    response = NextResponse.json({ error: "Sign in to continue." }, { status: 401 });
  } else {
    const login = request.nextUrl.clone();
    login.pathname = "/login";
    login.search = "";
    login.searchParams.set("next", path + request.nextUrl.search);
    response = NextResponse.redirect(login, request.method === "GET" || request.method === "HEAD" ? 307 : 303);
  }
  // Keep refreshed/cleared auth cookies when replacing the response.
  for (const cookie of sessionResponse.cookies.getAll()) response.cookies.set(cookie);
  response.headers.set("Cache-Control", "private, no-store");
  return response;
}

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(
    supabaseUrl!,
    supabaseKey!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    },
  );

  // Refreshes an expired session; must run before returning the response.
  // getClaims() verifies the JWT locally (no Auth server round-trip per request).
  const { data } = await supabase.auth.getClaims();

  return enforceAuthentication(request, Boolean(data?.claims), supabaseResponse);
}
