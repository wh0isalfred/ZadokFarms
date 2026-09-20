export const STAFF_HOME = "/staff/orders";
export const STAFF_COOKIE = "zadok-staff-session";
export const RETURN_COOKIE = "zadok-staff-return";
export const privateHeaders = {
  "Cache-Control": "private, no-store, max-age=0, must-revalidate",
  "Pragma": "no-cache",
  "Referrer-Policy": "strict-origin",
  "X-Robots-Tag": "noindex, nofollow, noarchive",
  "X-Frame-Options": "DENY",
};

// A closed allow-list: no queries, fragments, encoded paths or external origins.
export function safeReturnPath(value: unknown) {
  return typeof value === "string" && /^\/staff\/orders(?:\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})?$/.test(value)
    ? value : STAFF_HOME;
}

export function siteOrigin() {
  try {
    const url = new URL(process.env.ZADOK_SITE_URL ?? "");
    if (url.username || url.password || url.search || url.hash || url.pathname !== "/") return null;
    return url.protocol === "https:" || (url.protocol === "http:" && ["localhost", "127.0.0.1"].includes(url.hostname)) ? url.origin : null;
  } catch { return null; }
}

export function staffCookieOptions() {
  return { path: "/staff", httpOnly: true, sameSite: "lax" as const, secure: siteOrigin()?.startsWith("https:") ?? true };
}

export function sameOrigin(request: Request) {
  const origin = siteOrigin();
  return !!origin && request.headers.get("origin") === origin;
}
