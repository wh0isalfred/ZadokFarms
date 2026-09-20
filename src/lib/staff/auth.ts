import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { RETURN_COOKIE, STAFF_COOKIE, privateHeaders, safeReturnPath, sameOrigin, siteOrigin, staffCookieOptions } from "./security";

function redirectTo(path: string) {
  return new NextResponse(null, { status: 303, headers: { ...privateHeaders, Location: path } });
}

export async function requestSignIn(request: Request) {
  if (!sameOrigin(request)) return new Response("Access unavailable", { status: 403, headers: privateHeaders });
  try {
    // This native form has only two small fields. Never echo or log its email.
    const reader = request.body?.getReader();
    if (!reader) return redirectTo("/staff/sign-in?notice=sent");
    const chunks: Uint8Array[] = [];
    let size = 0;
    while (true) {
      const chunk = await reader.read();
      if (chunk.done) break;
      size += chunk.value.byteLength;
      if (size > 2048) { await reader.cancel(); return redirectTo("/staff/sign-in?notice=sent"); }
      chunks.push(chunk.value);
    }
    const text = Buffer.concat(chunks).toString("utf8");
    if (text.length > 2048 || !request.headers.get("content-type")?.startsWith("application/x-www-form-urlencoded")) return redirectTo("/staff/sign-in?notice=sent");
    const form = new URLSearchParams(text);
    const email = form.get("email")?.trim() ?? "";
    if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && email.length <= 254) {
      const client = await createClient();
      (await cookies()).set(RETURN_COOKIE, safeReturnPath(form.get("next")), { ...staffCookieOptions(), maxAge: 3600 });
      await client.auth.signInWithOtp({ email, options: { shouldCreateUser: false, emailRedirectTo: `${siteOrigin()}/staff/auth/callback` } });
    }
  } catch { /* Identical response for unknown accounts, provider failures and throttling. */ }
  return redirectTo("/staff/sign-in?notice=sent");
}

export async function exchangeSignIn(request: Request) {
  const code = new URL(request.url).searchParams.get("code");
  const store = await cookies();
  const next = safeReturnPath(store.get(RETURN_COOKIE)?.value);
  store.set(RETURN_COOKIE, "", { ...staffCookieOptions(), maxAge: 0 });
  if (code && code.length <= 2048 && siteOrigin()) {
    try {
      const client = await createClient();
      const { error } = await client.auth.exchangeCodeForSession(code);
      if (!error) return redirectTo(next);
    } catch { /* No provider error or token enters the response. */ }
  }
  return redirectTo("/staff/sign-in?notice=unavailable");
}

export async function signOut(request: Request) {
  if (!sameOrigin(request)) return new Response("Access unavailable", { status: 403, headers: privateHeaders });
  try { await (await createClient()).auth.signOut({ scope: "local" }); }
  catch { /* Local cookies still need clearing when the provider is unavailable. */ }
  const store = await cookies();
  for (const { name } of store.getAll()) {
    if (name === RETURN_COOKIE || name === STAFF_COOKIE || name.startsWith(`${STAFF_COOKIE}.`) || name.startsWith(`${STAFF_COOKIE}-`)) {
      store.set(name, "", { ...staffCookieOptions(), maxAge: 0 });
    }
  }
  return redirectTo("/staff/sign-in?notice=signed-out");
}
