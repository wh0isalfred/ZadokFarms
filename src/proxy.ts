import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { privateHeaders, STAFF_COOKIE, staffCookieOptions } from "@/lib/staff/security";

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (url && key) {
    const client = createServerClient(url, key, {
      cookieOptions: { name: STAFF_COOKIE, ...staffCookieOptions() },
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll(changes, headers) {
          changes.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          changes.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
          Object.entries(headers).forEach(([name, value]) => response.headers.set(name, value));
        },
      },
    });
    // Refresh cookies only. Each data read separately verifies user + active profile.
    try { await client.auth.getUser(); } catch { /* The data guard fails closed. */ }
  }
  Object.entries(privateHeaders).forEach(([name, value]) => response.headers.set(name, value));
  return response;
}

export const config = { matcher: ["/staff/:path*"] };
